import axios from "axios";
import {
  AIStructuredOutputSchema,
  AIStructuredOutputSchemaType,
} from "../lib/type-zod";

const N8N_WEBHOOK_URL =
  "https://web3-n8n.7b0fqh.easypanel.host/webhook/send-message";

export interface UserDetailsForN8N {
  userId: string;
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type SymptomReportDBInsertPayload = Partial<{
  latitude?: number | null;
  longitude?: number | null;
  complaint?: string | null;
  symptoms?: string[] | null;
  temperature?: number | null;
  oxygenSaturation?: number | null;
  heartRate?: number | null;
  bloodPressure?: number | null;
  respiratoryRate?: number | null;
  aiAnalysis?: AIStructuredOutputSchemaType | null;
  isEmergency?: boolean | null;
}>;

export interface AnalyzeSymptomN8NResult {
  success: boolean;
  botResponse?: string;
  aiAnalysisResult?: AIStructuredOutputSchemaType;
  dbSavePayload?: SymptomReportDBInsertPayload;
  error?: string;
}

const JSON_REGEX = /```json\s*([\s\S]*?)\s*```/;

function parseN8NJsonResponse(responseText: string): any | null {
  if (!responseText) return null;

  let potentialJsonString = responseText;
  try {
    const parsedOuter = JSON.parse(responseText);
    if (
      Array.isArray(parsedOuter) &&
      parsedOuter.length > 0 &&
      parsedOuter[0] &&
      typeof parsedOuter[0].output === "string"
    ) {
      potentialJsonString = parsedOuter[0].output;
    } else if (typeof parsedOuter === "object" && parsedOuter !== null) {
      return parsedOuter;
    }
  } catch (e) {
    console.log(e);
  }

  const match = potentialJsonString.match(JSON_REGEX);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (jsonError) {
      return null;
    }
  }

  try {
    const finalParsed = JSON.parse(potentialJsonString);

    if (typeof finalParsed === "object" && finalParsed !== null) {
      return finalParsed;
    }
  } catch (e) {}
  return null;
}

export async function analyzeSymptom(
  currentUserMessage: string,
  userDetails: UserDetailsForN8N
): Promise<AnalyzeSymptomN8NResult> {
  const lowerMessage = currentUserMessage.toLowerCase();
  const isAnalysisMode = lowerMessage.includes("analisis");

  let payload: any;

  if (isAnalysisMode) {
    console.log(
      `[analyzeSymptom] Mode Analisis untuk user: ${userDetails.userId}`
    );
    payload = {
      type: "analisis",
      userId: userDetails.userId,
      userName: userDetails.name || "Pengguna",
      message: currentUserMessage,
      latitude: userDetails.latitude,
      longitude: userDetails.longitude,
    };
  } else {
    payload = {
      type: "chat",
      userId: userDetails.userId,
      userName: userDetails.name || "Pengguna",
      message: currentUserMessage,
    };
  }

  try {
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 40000,
    });

    let dataToProcess: any;
    const rawN8NOutput = response.data;

    if (typeof rawN8NOutput === "string") {
      dataToProcess = rawN8NOutput;
    } else if (rawN8NOutput && typeof rawN8NOutput === "object") {
      if (
        Array.isArray(rawN8NOutput) &&
        rawN8NOutput.length > 0 &&
        typeof rawN8NOutput[0]?.text === "string"
      ) {
        dataToProcess = rawN8NOutput[0].text;
      } else if (typeof (rawN8NOutput as any).text === "string") {
        dataToProcess = (rawN8NOutput as any).text;
      } else {
        dataToProcess = rawN8NOutput;
      }
    } else {
      dataToProcess = rawN8NOutput;
    }

    if (!dataToProcess && typeof dataToProcess !== "object") {
      return {
        success: false,
        error: "N8N tidak memberikan respons yang bisa diproses.",
      };
    }

    console.log(
      "[analyzeSymptom] Data yang akan diproses dari N8N:",
      dataToProcess
    );

    if (isAnalysisMode) {
      let aiAnalysisCandidate: any = null;
      let sourceForDBFields: any = null;

      if (typeof dataToProcess === "string") {
        const parsedJson = parseN8NJsonResponse(dataToProcess);
        if (!parsedJson) {
          return {
            success: false,
            error:
              "Gagal mem-parse JSON dari respons N8N (mode analisis, data adalah string).",
            botResponse: dataToProcess,
          };
        }
        aiAnalysisCandidate = parsedJson;
        sourceForDBFields = parsedJson;
      } else if (typeof dataToProcess === "object" && dataToProcess !== null) {
        if (typeof dataToProcess.output === "string") {
          const jsonStringFromOutputField = dataToProcess.output;
          const parsedJson = parseN8NJsonResponse(jsonStringFromOutputField);
          if (!parsedJson) {
            return {
              success: false,
              error:
                "Gagal mem-parse JSON dari field 'output' di dalam objek respons N8N (mode analisis).",
              botResponse: jsonStringFromOutputField,
            };
          }
          aiAnalysisCandidate = parsedJson;
          sourceForDBFields = parsedJson;
        } else if (
          Array.isArray(dataToProcess) &&
          dataToProcess.length > 0 &&
          dataToProcess[0] &&
          typeof dataToProcess[0].output === "string"
        ) {
          const jsonStringInOutput = dataToProcess[0].output;
          const parsedJson = parseN8NJsonResponse(jsonStringInOutput);
          if (!parsedJson) {
            return {
              success: false,
              error:
                "Gagal mem-parse JSON dari field 'output' di dalam array respons N8N (mode analisis).",
              botResponse: jsonStringInOutput,
            };
          }
          aiAnalysisCandidate = parsedJson;
          sourceForDBFields = parsedJson;
        } else if (
          dataToProcess.aiAnalysis &&
          typeof dataToProcess.aiAnalysis === "object"
        ) {
          aiAnalysisCandidate = dataToProcess.aiAnalysis;
          sourceForDBFields = dataToProcess;
        } else {
          aiAnalysisCandidate = dataToProcess;
          sourceForDBFields = dataToProcess;
        }
      } else {
        return {
          success: false,
          error: "Format respons N8N tidak dikenali untuk analisis.",
        };
      }

      if (
        typeof aiAnalysisCandidate !== "object" ||
        aiAnalysisCandidate === null
      ) {
        return {
          success: false,
          error: "Data inti analisis tidak valid atau tidak ditemukan.",
        };
      }

      let convertedApprovalRate = aiAnalysisCandidate.bpjsApprovalRate;
      if (
        typeof aiAnalysisCandidate.bpjsApprovalRate === "number" &&
        aiAnalysisCandidate.bpjsApprovalRate <= 1 &&
        aiAnalysisCandidate.bpjsApprovalRate >= 0
      ) {
        convertedApprovalRate = Math.round(
          aiAnalysisCandidate.bpjsApprovalRate * 100
        );
      }

      const validatedAiAnalysisInput = {
        ...aiAnalysisCandidate,
        bpjsApprovalRate: convertedApprovalRate,
      };

      const validation = AIStructuredOutputSchema.safeParse(
        validatedAiAnalysisInput
      );

      if (validation.success) {
        const aiAnalysisResult = validation.data;

        const dbSavePayload: SymptomReportDBInsertPayload = {
          latitude:
            userDetails.latitude !== null && userDetails.latitude !== undefined
              ? Number(userDetails.latitude)
              : undefined,
          longitude:
            userDetails.longitude !== null &&
            userDetails.longitude !== undefined
              ? Number(userDetails.longitude)
              : undefined,
          complaint: sourceForDBFields.complaint || currentUserMessage,
          symptoms: sourceForDBFields.symptoms || [],
          temperature:
            sourceForDBFields.temperature !== undefined &&
            sourceForDBFields.temperature !== null
              ? Number(sourceForDBFields.temperature)
              : undefined,
          oxygenSaturation:
            sourceForDBFields.oxygenSaturation !== undefined &&
            sourceForDBFields.oxygenSaturation !== null
              ? Number(sourceForDBFields.oxygenSaturation)
              : undefined,
          heartRate:
            sourceForDBFields.heartRate !== undefined &&
            sourceForDBFields.heartRate !== null
              ? Number(sourceForDBFields.heartRate)
              : undefined,
          bloodPressure:
            sourceForDBFields.bloodPressure !== undefined &&
            sourceForDBFields.bloodPressure !== null
              ? Number(sourceForDBFields.bloodPressure)
              : undefined,
          respiratoryRate:
            sourceForDBFields.respiratoryRate !== undefined
              ? Number(sourceForDBFields.respiratoryRate)
              : undefined,
          isEmergency: sourceForDBFields.isEmergency,
          aiAnalysis: aiAnalysisResult,
        };

        return {
          success: true,
          botResponse: aiAnalysisResult.aiSummary || "Analisis selesai.",
          aiAnalysisResult,
          dbSavePayload,
        };
      } else {
        return {
          success: false,
          error:
            "Respons analisis dari N8N tidak sesuai format yang diharapkan (setelah validasi).",
          botResponse:
            typeof dataToProcess === "string"
              ? dataToProcess
              : JSON.stringify(dataToProcess),
        };
      }
    } else {
      if (typeof dataToProcess === "string") {
        return { success: true, botResponse: dataToProcess };
      } else if (typeof dataToProcess === "object" && dataToProcess !== null) {
        const chatText =
          (dataToProcess as any).text || JSON.stringify(dataToProcess);
        return { success: true, botResponse: chatText };
      } else {
        return {
          success: true,
          botResponse: "Tidak ada respons teks yang dapat ditampilkan.",
        };
      }
    }
  } catch (error) {
    let errorMessage = "Gagal terhubung ke layanan N8N.";
    if (axios.isAxiosError(error)) {
      errorMessage += ` Detail: ${error.message}`;
      if (error.response) {
        errorMessage += ` Server: ${JSON.stringify(error.response.data)}`;
      }
    }
    return { success: false, error: errorMessage };
  }
}
