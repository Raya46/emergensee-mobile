import { db } from "@/src/db";

import { symptomReports } from "@/src/db/schema";
import { AIStructuredOutputSchemaType } from "@/src/lib/type-zod";
import { desc, eq } from "drizzle-orm";

export interface SymptomReportWithAI {
  id: string;
  userId: string;
  latitude: string;
  longitude: string;
  complaint: string;
  symptoms: string[];
  temperature?: string | null;
  oxygenSaturation?: string | null;
  heartRate?: string | null;
  bloodPressure?: string | null;
  respiratoryRate?: string | null;
  isEmergency?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  aiAnalysis: AIStructuredOutputSchemaType | null;
}

export async function fetchSymptomReportsForUser(
  userId: string
): Promise<SymptomReportWithAI[]> {
  if (!userId) {
    console.log("[fetchSymptomReportsForUser] User ID tidak diberikan.");
    return [];
  }
  try {
    console.log(
      `[fetchSymptomReportsForUser] Mencoba mengambil laporan untuk userId: ${userId}`
    );
    const reportsFromDB = await db
      .select()
      .from(symptomReports)
      .where(eq(symptomReports.userId, userId))
      .orderBy(desc(symptomReports.createdAt))
      .execute();

    console.log(
      `[fetchSymptomReportsForUser] Laporan dari DB mentah: ${JSON.stringify(reportsFromDB, null, 2)}`
    );

    const reportsWithParsedAI = reportsFromDB.map((report) => {
      let parsedAIAnalysis: AIStructuredOutputSchemaType | null = null;
      if (report.aiAnalysis) {
        try {
          if (typeof report.aiAnalysis === "string") {
            parsedAIAnalysis = JSON.parse(
              report.aiAnalysis
            ) as AIStructuredOutputSchemaType;
          } else if (
            typeof report.aiAnalysis === "object" &&
            report.aiAnalysis !== null
          ) {
            parsedAIAnalysis =
              report.aiAnalysis as AIStructuredOutputSchemaType;
          }
        } catch (parseError) {
          console.log(
            `[fetchSymptomReportsForUser] Gagal mem-parsing aiAnalysis untuk laporan ID: ${report.id}`,
            parseError
          );
        }
      }
      return {
        ...report,
        aiAnalysis: parsedAIAnalysis,
      };
    });

    return reportsWithParsedAI as SymptomReportWithAI[];
  } catch (error) {
    console.log(
      `[fetchSymptomReportsForUser] Error mengambil laporan gejala untuk user ${userId}:`,
      error
    );
    return [];
  }
}

export async function deleteSymptomReportById(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  if (!reportId) {
    console.log("[deleteSymptomReportById] Report ID tidak diberikan.");
    return { success: false, error: "Report ID is undefined" };
  }
  try {
    await db
      .delete(symptomReports)
      .where(eq(symptomReports.id, reportId))
      .execute();
    console.log(
      `[deleteSymptomReportById] Laporan ${reportId} berhasil dihapus.`
    );
    return { success: true };
  } catch (error: any) {
    console.log(
      `[deleteSymptomReportById] Error menghapus laporan ${reportId}:`,
      error
    );
    return {
      success: false,
      error: error.message || "Unknown error during deletion",
    };
  }
}
