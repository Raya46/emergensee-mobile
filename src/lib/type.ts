import { AIStructuredOutputSchemaType } from "./type-zod";

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  analysis?: AIStructuredOutputSchemaType;
  analysisPatientName?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  messageCount: number;
}
