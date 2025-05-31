import { db } from "../db";
import { symptomReports } from "../db/schema";
import { CreateSymptomReportToDBSchemaType } from "../lib/type-zod";

export async function createSymptomReport(
  dataToSave: CreateSymptomReportToDBSchemaType
) {
  console.log("[createSymptomReport] Data to save to DB:", dataToSave);
  try {
    const newSymptomReport = await db
      .insert(symptomReports)
      .values(dataToSave)
      .returning({ id: symptomReports.id });

    if (!newSymptomReport || newSymptomReport.length === 0) {
      return { error: "Gagal membuat laporan gejala di database." };
    }

    console.log(
      "[createSymptomReport] Laporan gejala berhasil disimpan dengan ID:",
      newSymptomReport[0].id
    );
    return { success: true, symptomReportId: newSymptomReport[0].id };
  } catch (error) {
    console.log("[createSymptomReport] Error saat insersi database:", error);
    let errorMessage = "Gagal melakukan insersi ke database";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    return {
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error),
    };
  }
}
