import React from "react";
import { View } from "react-native";
import { AIStructuredOutputSchemaType } from "../lib/type-zod";
import { getIndicatorColor } from "../lib/utils";
import CircularProgress from "./circular-progress";
import CustomText from "./custom-text";

interface AIAnalysisResultCardProps {
  analysisResult: AIStructuredOutputSchemaType;
  patientName?: string;
}

const AIAnalysisResultCard: React.FC<AIAnalysisResultCardProps> = ({
  analysisResult,
  patientName,
}) => {
  const { bpjsApprovalRate, bpjsIndicator, aiSummary, doctorStatus } =
    analysisResult;
  const progressColor = getIndicatorColor(bpjsIndicator);

  return (
    <View className="flex flex-col">
      <View className="bg-white p-4 rounded-2xl shadow-md my-2">
        <CustomText className="text-lg font-bold text-center mb-1 text-gray-800">
          Hasil Simulasi Klaim BPJS {patientName ? `untuk ${patientName}` : ""}
        </CustomText>

        <View className="flex-row items-center justify-center my-2">
          <View
            style={{
              backgroundColor: progressColor,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <CustomText className="text-xs font-semibold text-white">
              {bpjsIndicator}
            </CustomText>
          </View>
        </View>

        <View className="items-center my-4">
          <CircularProgress
            size={180}
            strokeWidth={18}
            progressPercent={bpjsApprovalRate}
            bgColor="#E5E7EB"
            progressColor={progressColor}
            textColor={progressColor}
            textSize={40}
            label="Skor Diterima"
          />
        </View>
      </View>
      <View className="mt-3 bg-white rounded-xl p-4">
        <CustomText className="font-bold">Ringkasan</CustomText>
        <CustomText className="text-sm">{aiSummary}</CustomText>
        <CustomText className="font-bold mt-2">Rekomendasi Dokter</CustomText>
        <CustomText className="text-sm">{doctorStatus}</CustomText>
      </View>

      <View className="mt-4 bg-white rounded-xl p-4">
        <CustomText className="font-bold">Penting</CustomText>
        <CustomText className="text-sm">
          Hasil simulasi ini adalah prediksi berdasarkan informasi yang Anda
          berikan dan tidak menggantikan penilaian medis profesional. Keputusan
          akhir terkait klaim BPJS tetap ada pada dokter dan verifikator BPJS.
        </CustomText>
      </View>
    </View>
  );
};

export default AIAnalysisResultCard;
