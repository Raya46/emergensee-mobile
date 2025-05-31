import { z } from "zod";

export const AIStructuredOutputSchema = z.object({
  bpjsApprovalRate: z.number().min(0).max(100),
  bpjsIndicator: z.string(),
  aiSummary: z.string(),
  doctorStatus: z.string(),
});
export type AIStructuredOutputSchemaType = z.infer<
  typeof AIStructuredOutputSchema
>;

export const SymptomReportDBSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  complaint: z.string(),
  symptoms: z.array(z.string()).default([]),
  temperature: z.coerce.number().optional(),
  oxygenSaturation: z.coerce.number().optional(),
  heartRate: z.coerce.number().optional(),
  bloodPressure: z.coerce.number().optional(),
  respiratoryRate: z.coerce.number().optional(),
  aiAnalysis: AIStructuredOutputSchema.optional(),
  isEmergency: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type SymptomReportDBSchemaType = z.infer<typeof SymptomReportDBSchema>;

export const CreateSymptomReportToDBSchema = SymptomReportDBSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateSymptomReportToDBSchemaType = z.infer<
  typeof CreateSymptomReportToDBSchema
>;

export const PatientDataForAIPromptSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  complaints: z.string(),
  bloodPressure: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperature: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  heartRate: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  userId: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isEmergency: z.boolean().default(false).optional(),
});
export type PatientDataForAIPromptType = z.infer<
  typeof PatientDataForAIPromptSchema
>;

/** @deprecated Gunakan AIStructuredOutputSchema */
export const AIAnalysisResultSchema = AIStructuredOutputSchema.extend({});
export type AIAnalysisResultSchemaType = AIStructuredOutputSchemaType;
