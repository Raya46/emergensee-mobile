import { db } from "../db";
import { symptomReports } from "../db/schema";
import { CreateSymptomReportToDBSchemaType } from "../lib/type-zod";

export async function createSymptomReport(
  dataToSave: CreateSymptomReportToDBSchemaType
) {
  try {
    const newSymptomReport = await db
      .insert(symptomReports)
      .values(dataToSave)
      .returning({ id: symptomReports.id });

    if (!newSymptomReport || newSymptomReport.length === 0) {
      console.error(
        "[createSymptomReport] Gagal menyimpan laporan gejala ke database, tidak ada ID yang dikembalikan."
      );
      return { error: "Gagal membuat laporan gejala di database." };
    }

    console.log(
      "[createSymptomReport] Laporan gejala berhasil disimpan dengan ID:",
      newSymptomReport[0].id
    );
    return { success: true, symptomReportId: newSymptomReport[0].id };
  } catch (error) {
    console.error("[createSymptomReport] Error saat insersi database:", error);
    return {
      error: "Gagal melakukan insersi ke database",
      details: (error as Error).message,
    };
  }
}
