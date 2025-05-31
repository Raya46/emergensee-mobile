import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";
import {
  AIStructuredOutputSchema,
  AIStructuredOutputSchemaType,
  CreateSymptomReportToDBSchema,
  CreateSymptomReportToDBSchemaType,
  PatientDataForAIPromptSchema,
  PatientDataForAIPromptType,
} from "../lib/type-zod";
import { createSymptomReport } from "./create-symptom";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

interface AnalyzeSymptomActionResult {
  success: boolean;
  botResponse?: string;
  aiAnalysisResult?: AIStructuredOutputSchemaType;
  error?: string;
}

let collectedPatientDataForAI: Partial<PatientDataForAIPromptType> = {};
let lastProcessedUserId: string | null = null;

async function callGoogleAI(
  patientData: Required<PatientDataForAIPromptType>,
  metricsContent: string,
  policyContent: string
): Promise<{ object?: AIStructuredOutputSchemaType; error?: string }> {
  console.log(
    "callGoogleAI: Menerima data pasien dan konten kebijakan/metrik dengan @google/generative-ai."
  );

  try {
    const apiKey =
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      "AIzaSyAsFj7rkB2KyzarAdZ0zidJ1Rho2qICJoM";
    if (!apiKey) {
      console.error(
        "callGoogleAI: EXPO_PUBLIC_GEMINI_API_KEY tidak ditemukan di environment variables."
      );
      return { error: "Konfigurasi API key untuk layanan AI tidak ditemukan." };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const validation =
      PatientDataForAIPromptSchema.required().safeParse(patientData);
    if (!validation.success) {
      console.error(
        "callGoogleAI: Data pasien (input) tidak valid untuk AI prompt",
        validation.error.flatten()
      );
      return {
        error:
          "Data internal pasien (input) tidak lengkap atau tidak valid untuk analisis.",
      };
    }
    const validatedInputDataForPrompt = validation.data;
    let dataForPrompt = { ...validatedInputDataForPrompt };

    if (validatedInputDataForPrompt.userId) {
      const dbUserDataArray = await db
        .select({
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, validatedInputDataForPrompt.userId));

      if (dbUserDataArray.length > 0) {
        const dbUser = dbUserDataArray[0];
        dataForPrompt.name = dbUser.name || dataForPrompt.name;
        console.log(
          "callGoogleAI: Nama pengguna dari DB digabungkan:",
          dataForPrompt.name
        );
      }
    }

    const prompt = `
    Anda adalah seorang asisten medis AI yang bertugas untuk mengevaluasi kelayakan seorang pasien untuk mendapatkan layanan BPJS berdasarkan data yang diberikan dan kebijakan serta metrik kegawatdaruratan.
    Output HARUS berupa string JSON yang valid dan HANYA JSON tersebut, tanpa teks tambahan atau penjelasan di luar objek JSON. Objek JSON harus sesuai dengan skema yang berisi field berikut: "bpjsApprovalRate", "bpjsIndicator", "aiSummary", "doctorStatus".
    JANGAN menyertakan markdown (seperti \`\`\`json ... \`\`\`) atau teks lain di luar JSON.

    Berikut adalah data pasien:
    Nama: ${dataForPrompt.name || "Tidak disebutkan"}
    Keluhan Utama: ${dataForPrompt.complaints}
    Tekanan Darah: ${dataForPrompt.bloodPressure || "Tidak disebutkan"}
    Laju Pernapasan: ${dataForPrompt.respiratoryRate || "Tidak disebutkan"}
    Suhu Tubuh: ${dataForPrompt.temperature || "Tidak disebutkan"}
    Saturasi Oksigen: ${dataForPrompt.oxygenSaturation || "Tidak disebutkan"}
    Gejala Saat Ini: ${dataForPrompt.symptoms && dataForPrompt.symptoms.length > 0 ? dataForPrompt.symptoms.join(", ") : "Tidak disebutkan"}

    Berikut adalah METRIK KEGAWATDARURATAN yang harus Anda pertimbangkan:
    ${metricsContent}

    Berikut adalah KEBIJAKAN BPJS yang relevan:
    ${policyContent}

    Tugas Anda adalah memberikan output string JSON valid yang HANYA berisi field berikut:
    {
      "bpjsApprovalRate": <angka 0-100>,
      "bpjsIndicator": "<string, salah satu dari: 'Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah', 'Sangat Rendah', 'N/A'>",
      "aiSummary": "<string, penjelasan rinci mengapa skor tersebut diberikan, hubungkan dengan metrik dan kebijakan, rekomendasi tindakan medis yang paling sesuai, misal: 'Segera ke IGD', 'Konsultasi dokter umum dalam 24 jam', 'Perawatan mandiri di rumah dengan observasi', identifikasi gejala tambahan yang mungkin relevan berdasarkan deskripsi pasien atau tidak disebutkan secara eksplisit namun sering terkait>",
      "doctorStatus": "<string, status dokter yang paling sesuai berdasarkan analisis AI, misal: 'IGD', 'Konsultasi', 'Perawatan Mandiri'>"
    }
    Pastikan output HANYA berupa string JSON yang valid dan langsung dapat di-parse.
  `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    console.log("callGoogleAI: Mengirim permintaan ke Gemini...");
    const generationResult = await model.generateContent(prompt);
    const response = generationResult.response;
    const responseText = response.text();

    if (!responseText) {
      console.error("callGoogleAI: AI tidak mengembalikan teks.");
      return { error: "AI tidak memberikan respons yang valid (kosong)." };
    }

    console.log("callGoogleAI: Menerima teks dari AI:", responseText);

    let cleanedResponseText = responseText.trim();

    if (cleanedResponseText.startsWith("```json")) {
      cleanedResponseText = cleanedResponseText.substring(7);
      if (cleanedResponseText.endsWith("```")) {
        cleanedResponseText = cleanedResponseText.substring(
          0,
          cleanedResponseText.length - 3
        );
      }
    } else if (cleanedResponseText.startsWith("```")) {
      cleanedResponseText = cleanedResponseText.substring(3);
      if (cleanedResponseText.endsWith("```")) {
        cleanedResponseText = cleanedResponseText.substring(
          0,
          cleanedResponseText.length - 3
        );
      }
    }
    cleanedResponseText = cleanedResponseText.trim();

    let parsedObject;
    try {
      parsedObject = JSON.parse(cleanedResponseText);
    } catch (parseError) {
      console.error(
        "callGoogleAI: Gagal parse JSON dari respons AI setelah dibersihkan:",
        parseError,
        "\nRespons Setelah Dibersihkan:",
        cleanedResponseText,
        "\nRespons Asli:",
        responseText
      );
      return {
        error: `Gagal memproses format respons dari AI. Pastikan AI mengembalikan JSON murni. Detail: ${(parseError as Error).message}`,
      };
    }

    const zodValidation = AIStructuredOutputSchema.safeParse(parsedObject);
    if (!zodValidation.success) {
      console.error(
        "callGoogleAI: Validasi Zod gagal untuk objek dari AI:",
        zodValidation.error.flatten(),
        "\nObjek Parsed:",
        parsedObject
      );
      return {
        error: `Respons AI tidak sesuai dengan skema yang diharapkan. Detail: ${zodValidation.error.toString()}`,
      };
    }

    console.log(
      "callGoogleAI: Berhasil menerima dan memvalidasi objek dari AI:",
      zodValidation.data
    );
    return { object: zodValidation.data };
  } catch (error) {
    console.error(
      "callGoogleAI: Error saat pemanggilan API @google/generative-ai:",
      error
    );
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("API key not valid") ||
      errorMessage.includes("API_KEY_INVALID")
    ) {
      return {
        error: "Kunci API untuk layanan Google AI tidak valid atau salah.",
      };
    }
    if (errorMessage.toLowerCase().includes("quota")) {
      return {
        error:
          "Batas penggunaan (kuota) API Google AI tercapai. Silakan coba lagi nanti.",
      };
    }
    return { error: `Gagal mendapatkan respons AI: ${errorMessage}` };
  }
}

function parseVitalSign(
  value: string | number | undefined | null
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return isNaN(value) ? null : value;
  if (typeof value === "string") {
    const lowerVal = value.toLowerCase();
    if (
      lowerVal === "tidak diukur" ||
      lowerVal === "-" ||
      lowerVal === "" ||
      lowerVal === "tidak diketahui"
    ) {
      return null;
    }
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

export async function analyzeSymptom(
  currentUserMessage: string,
  chatHistory: ChatMessage[],
  userId: string,
  metricsContent: string,
  policyContent: string,
  coordinates?: { latitude: number; longitude: number } | null
): Promise<AnalyzeSymptomActionResult> {
  const lowerMessage = currentUserMessage.toLowerCase();

  if (
    userId &&
    (userId !== lastProcessedUserId || !collectedPatientDataForAI.name)
  ) {
    console.log(
      `[analyzeSymptom] Memuat/memperbarui data pengguna dari DB untuk userId: ${userId}`
    );
    if (userId !== lastProcessedUserId) {
      collectedPatientDataForAI = { userId };
    } else {
      if (!collectedPatientDataForAI.userId)
        collectedPatientDataForAI.userId = userId;
    }

    const dbUserDataArray = await db
      .select({
        name: user.name,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (dbUserDataArray.length > 0) {
      const dbUser = dbUserDataArray[0];
      console.log("[analyzeSymptom] Data pengguna dari DB ditemukan:", dbUser);
      collectedPatientDataForAI = {
        ...collectedPatientDataForAI,
        name: dbUser.name || collectedPatientDataForAI.name,
      };
    } else {
      console.log(
        "[analyzeSymptom] Tidak ada data pengguna ditemukan di DB untuk ID:",
        userId
      );
    }
    lastProcessedUserId = userId;
  } else if (userId && !collectedPatientDataForAI.userId) {
    collectedPatientDataForAI.userId = userId;
  }

  if (coordinates && !collectedPatientDataForAI.latitude)
    collectedPatientDataForAI.latitude = coordinates.latitude;
  if (coordinates && !collectedPatientDataForAI.longitude)
    collectedPatientDataForAI.longitude = coordinates.longitude;

  if (
    chatHistory.length === 0 &&
    (lowerMessage.includes("halo") || lowerMessage.includes("mulai"))
  ) {
    let greeting = "Halo!";
    if (collectedPatientDataForAI.name) {
      greeting = `Halo, ${collectedPatientDataForAI.name}!`;
    }
    return {
      success: true,
      botResponse: `${greeting} Saya EmergeSee Bot. Ada yang bisa saya bantu terkait keluhan kesehatan Anda? Anda bisa meminta saya untuk menganalisis gejala Anda.`,
    };
  }

  const triggerWords = [
    "analisis",
    "cek bpjs",
    "kelayakan",
    "sakit apa",
    "tolong periksa",
    "gawat darurat",
  ];
  const wantsAnalysis = triggerWords.some((word) =>
    lowerMessage.includes(word)
  );
  const forceAnalysis = lowerMessage.includes("analisis sekarang!");

  if (
    !collectedPatientDataForAI.complaints &&
    (wantsAnalysis || lowerMessage.length > 10)
  ) {
    collectedPatientDataForAI.complaints = currentUserMessage;
    let nextQuestion = "";
    if (collectedPatientDataForAI.name) {
      nextQuestion = `Baik, keluhan utama Anda "${currentUserMessage}" sudah saya catat. Apa saja gejala spesifik yang Anda rasakan saat ini?`;
    } else {
      nextQuestion = `Baik, keluhan utama Anda: "${currentUserMessage}". Bisa sebutkan nama Anda?`;
    }
    return {
      success: true,
      botResponse: nextQuestion,
    };
  }
  if (
    collectedPatientDataForAI.complaints &&
    !collectedPatientDataForAI.name &&
    chatHistory.length > 0
  ) {
    console.log(
      "[analyzeSymptom] Nama tidak diketahui dari DB, mengambil dari input pengguna sebagai nama."
    );
    collectedPatientDataForAI.name = currentUserMessage;
    return {
      success: true,
      botResponse: `Oke, ${currentUserMessage}. Apa saja gejala spesifik yang Anda rasakan saat ini?`,
    };
  }
  if (
    collectedPatientDataForAI.name &&
    (!collectedPatientDataForAI.symptoms ||
      collectedPatientDataForAI.symptoms.length === 0) &&
    chatHistory.length > 1
  ) {
    collectedPatientDataForAI.symptoms = [currentUserMessage];
    return {
      success: true,
      botResponse: `Gejala dicatat: "${currentUserMessage}". Apakah ada gejala lain? Jika tidak, Anda bisa bilang "tidak ada" atau "lanjut".`,
    };
  }
  if (
    collectedPatientDataForAI.symptoms &&
    collectedPatientDataForAI.symptoms.length > 0 &&
    lowerMessage !== "tidak ada" &&
    lowerMessage !== "lanjut" &&
    chatHistory.length > 2 &&
    !wantsAnalysis &&
    !forceAnalysis &&
    !chatHistory[chatHistory.length - 1]?.text.includes("gejala lain")
  ) {
    if (collectedPatientDataForAI.symptoms.indexOf(currentUserMessage) === -1) {
      collectedPatientDataForAI.symptoms.push(currentUserMessage);
      return {
        success: true,
        botResponse: `Gejala tambahan dicatat: "${currentUserMessage}". Ada lagi? Atau katakan "lanjut" jika sudah, atau "analisis sekarang!".`,
      };
    }
  }

  const canTryAnalysis =
    collectedPatientDataForAI.complaints &&
    collectedPatientDataForAI.name &&
    collectedPatientDataForAI.symptoms &&
    collectedPatientDataForAI.symptoms.length > 0;

  if (forceAnalysis || (wantsAnalysis && canTryAnalysis)) {
    console.log(
      "[analyzeSymptom] Memulai proses analisis AI dengan data:",
      collectedPatientDataForAI
    );

    const completePatientDataForAI: Required<PatientDataForAIPromptType> = {
      userId: collectedPatientDataForAI.userId || userId,
      name: collectedPatientDataForAI.name || "Tidak disebutkan",
      birthDate: collectedPatientDataForAI.birthDate || "Tidak diketahui",
      gender: collectedPatientDataForAI.gender || "Tidak diketahui",
      phone: collectedPatientDataForAI.phone || "Tidak diketahui",
      complaints: collectedPatientDataForAI.complaints!,
      symptoms: collectedPatientDataForAI.symptoms!,
      bloodPressure: collectedPatientDataForAI.bloodPressure || "Tidak diukur",
      respiratoryRate:
        collectedPatientDataForAI.respiratoryRate || "Tidak diukur",
      temperature: collectedPatientDataForAI.temperature || "Tidak diukur",
      oxygenSaturation:
        collectedPatientDataForAI.oxygenSaturation || "Tidak diukur",
      latitude: collectedPatientDataForAI.latitude as number,
      longitude: collectedPatientDataForAI.longitude as number,
      isEmergency: collectedPatientDataForAI.isEmergency || false,
    };

    const aiResult = await callGoogleAI(
      completePatientDataForAI,
      metricsContent,
      policyContent
    );

    if (aiResult.error || !aiResult.object) {
      return {
        success: false,
        error: aiResult.error || "Gagal mendapatkan analisis AI.",
        botResponse: `Maaf, terjadi kesalahan saat menganalisis: ${aiResult.error || "Tidak ada output dari AI."}`,
      };
    }

    const symptomDataForDB: CreateSymptomReportToDBSchemaType = {
      userId: completePatientDataForAI.userId!,
      complaint: completePatientDataForAI.complaints!,
      symptoms: completePatientDataForAI.symptoms || [],
      latitude: completePatientDataForAI.latitude,
      longitude: completePatientDataForAI.longitude,
      temperature: parseVitalSign(completePatientDataForAI.temperature),
      oxygenSaturation: parseVitalSign(
        completePatientDataForAI.oxygenSaturation
      ),
      heartRate: parseVitalSign(collectedPatientDataForAI.heartRate),
      bloodPressure: parseVitalSign(completePatientDataForAI.bloodPressure),
      respiratoryRate: parseVitalSign(completePatientDataForAI.respiratoryRate),
      aiAnalysis: aiResult.object,
      isEmergency: completePatientDataForAI.isEmergency || false,
    };

    const validationResult =
      CreateSymptomReportToDBSchema.safeParse(symptomDataForDB);

    if (!validationResult.success) {
      console.error(
        "[analyzeSymptom] Validasi data untuk DB gagal:",
        validationResult.error.flatten()
      );
    } else {
      console.log(
        "[analyzeSymptom] Data tervalidasi untuk DB, mencoba menyimpan..."
      );
      const saveResult = await createSymptomReport(validationResult.data);
      if (saveResult.success) {
        console.log(
          "[analyzeSymptom] Laporan gejala berhasil disimpan ke DB, ID:",
          saveResult.symptomReportId
        );
      } else {
        console.error(
          "[analyzeSymptom] Gagal menyimpan laporan gejala ke DB:",
          saveResult.error,
          saveResult.details
        );
      }
    }

    return {
      success: true,
      botResponse: `Berikut hasil analisis:
Skor BPJS: ${aiResult.object.bpjsApprovalRate}
Indikator: ${aiResult.object.bpjsIndicator}
Rekomendasi Dokter: ${aiResult.object.doctorStatus}
Ringkasan: ${aiResult.object.aiSummary}`,
      aiAnalysisResult: aiResult.object,
    };
  }

  let defaultResponse = "Saya memproses pesan Anda...";
  if (chatHistory.length === 0) {
    let greeting = "Halo!";
    if (collectedPatientDataForAI.name) {
      greeting = `Halo, ${collectedPatientDataForAI.name}!`;
    }
    defaultResponse = `${greeting} Saya EmergeSee Bot. Ada yang bisa saya bantu terkait keluhan kesehatan Anda?`;
  } else if (lowerMessage.includes("terima kasih"))
    defaultResponse = "Sama-sama! Ada lagi yang bisa saya bantu?";
  else if (lowerMessage.includes("tidak ada"))
    defaultResponse =
      'Baik. Jika Anda ingin saya menganalisis data yang sudah ada, katakan "analisis sekarang!".';
  else if (lowerMessage.includes("lanjut"))
    defaultResponse = `Baik, data sejauh ini: Keluhan: ${collectedPatientDataForAI.complaints || "-"}, Nama: ${collectedPatientDataForAI.name || "-"}, Gejala: ${(collectedPatientDataForAI.symptoms || []).join(", ") || "-"}. Apa ada informasi tanda vital (suhu, tensi) atau komorbid?`;
  else
    defaultResponse = `Saya mencatat "${currentUserMessage}". Apakah ada informasi lain yang ingin Anda tambahkan atau katakan "analisis sekarang!"?`;

  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, botResponse: defaultResponse };
}
