import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SymptomReportWithAI } from "../actions/get-symptom-reports";
import { getIndicatorBackgroundColor, getIndicatorColor } from "../lib/utils";
import CircularProgress from "./circular-progress";
import CustomText from "./custom-text";

interface ReportHistoryCardProps {
  report: SymptomReportWithAI;
}

const ReportHistoryCard: React.FC<ReportHistoryCardProps> = ({ report }) => {
  const { aiAnalysis, complaint, createdAt } = report;
  const bpjsApprovalRate = aiAnalysis?.bpjsApprovalRate;
  const bpjsIndicator = aiAnalysis?.bpjsIndicator || "Belum ada analisis";

  const displayApprovalRate =
    bpjsApprovalRate !== undefined &&
    bpjsApprovalRate >= 0 &&
    bpjsApprovalRate <= 1
      ? Math.round(bpjsApprovalRate * 100)
      : bpjsApprovalRate;

  const progressColor = getIndicatorColor(bpjsIndicator);
  const backgroundColor = getIndicatorBackgroundColor(bpjsIndicator);

  const handlePress = () => {
    if (aiAnalysis) {
      router.push({
        pathname: "/main/chat",
        params: {
          aiAnalysisData: JSON.stringify(report.aiAnalysis),
        },
      });
    } else {
      router.push({
        pathname: "/main/chat",
        params: { reportData: JSON.stringify(report) },
      });
      console.log(
        "ReportHistoryCard: aiAnalysis is null, sending full report data instead."
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.cardItem}
      className="bg-white rounded-xl mb-3 mx-3 shadow-sm"
    >
      <View className="flex-row items-center p-4">
        {displayApprovalRate !== undefined && (
          <View className="mr-4">
            <CircularProgress
              size={70}
              strokeWidth={6}
              progressPercent={displayApprovalRate}
              bgColor="#E5E7EB"
              progressColor={progressColor}
              textColor={progressColor}
              textSize={displayApprovalRate > 100 ? 18 : 22}
              label={undefined}
            />
          </View>
        )}
        <View className="flex-1 justify-center">
          <View
            className={`px-2 py-0.5 self-start mb-1`}
            style={{ backgroundColor: backgroundColor, borderRadius: 6 }}
          >
            <CustomText
              style={{ color: progressColor }}
              className={`text-xs font-medium`}
            >
              {bpjsIndicator}
            </CustomText>
          </View>
          <CustomText
            className="text-base font-semibold text-gray-800 mb-1"
            numberOfLines={2}
          >
            Keluhan: {complaint}
          </CustomText>
          <CustomText className="text-xs text-gray-500 mt-1">
            {new Date(createdAt).toLocaleString([], {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </CustomText>
        </View>
        <View className="pl-2 justify-center">
          <Feather name="chevron-right" size={28} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardItem: {},
});

export default ReportHistoryCard;
