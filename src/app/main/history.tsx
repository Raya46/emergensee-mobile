import {
  fetchSymptomReportsForUser,
  type SymptomReportWithAI,
} from "@/src/actions/get-symptom-reports";
import { useAuth } from "@/src/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomText from "../../components/custom-text";
import ReportHistoryCard from "../../components/ReportHistoryCard";

const SymptomHistoryScreen = () => {
  const { user } = useAuth();
  const [symptomReportsData, setSymptomReportsData] = useState<
    SymptomReportWithAI[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSymptomReports = useCallback(async () => {
    if (!user?.id) {
      console.log(
        "[SymptomHistory] Tidak ada user ID, tidak bisa memuat riwayat laporan."
      );
      setSymptomReportsData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    console.log(
      `[SymptomHistory] Memuat riwayat laporan untuk user: ${user.id}`
    );
    try {
      const reports = await fetchSymptomReportsForUser(user.id);
      console.log(
        "[SymptomHistory] Laporan yang diterima dari fetch:",
        JSON.stringify(reports, null, 2)
      );
      setSymptomReportsData(reports);
    } catch (e) {
      console.log(
        `[SymptomHistory] Gagal memuat riwayat laporan untuk user ${user.id}.`,
        e
      );
      setSymptomReportsData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadSymptomReports();
      } else {
        setSymptomReportsData([]);
        setIsLoading(false);
      }
    }, [user?.id, loadSymptomReports])
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.containerCenter} className="bg-gray-50 p-5">
        <Feather name="user-x" size={48} color="#6B7280" />
        <CustomText className="text-xl font-semibold text-gray-700 mt-4 text-center">
          Akses Riwayat Terbatas
        </CustomText>
        <CustomText className="text-gray-500 text-center mt-2">
          Anda harus login untuk melihat riwayat analisis gejala.
        </CustomText>
        <TouchableOpacity
          onPress={() => router.replace("/sign-in")}
          className="mt-6 bg-emerald-600 px-6 py-3 rounded-lg shadow-md"
        >
          <CustomText className="text-white font-semibold text-base">
            Login Sekarang
          </CustomText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.containerCenter} className="bg-gray-50">
        <ActivityIndicator size="large" color="#30887C" />
        <CustomText className="mt-2 text-gray-600">
          Memuat Riwayat Analisis...
        </CustomText>
      </SafeAreaView>
    );
  }

  const filteredReports = symptomReportsData.filter(
    (report) =>
      (report.complaint || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (report.aiAnalysis?.aiSummary &&
        report.aiAnalysis.aiSummary
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (Array.isArray(report.symptoms) &&
        report.symptoms.some((symptom: string) =>
          (symptom || "").toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F3FAF9]">
      <View className="p-4 flex-row items-center justify-between border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/main/chat")
          }
          className="p-2"
        >
          <Feather name="chevron-left" size={28} color="#30887C" />
        </TouchableOpacity>
        <CustomText className="text-xl font-bold text-gray-800">
          Riwayat
        </CustomText>
        <View style={{ width: 28 }} />
      </View>

      <TextInput
        className="border border-gray-300 rounded-xl py-3 px-4 text-gray-700 mx-4 my-3 bg-white text-base shadow-sm"
        placeholder="Cari keluhan, ringkasan AI, atau gejala..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {filteredReports.length === 0 ? (
        <View style={styles.containerCenter} className="p-5">
          <Feather name="file-text" size={48} color="#D1D5DB" />
          <CustomText className="text-gray-500 text-center mt-4 text-base">
            {searchQuery
              ? "Tidak ada analisis yang cocok."
              : "Belum ada riwayat analisis gejala."}
          </CustomText>
          {!searchQuery && (
            <CustomText className="text-gray-400 text-center mt-1 text-sm">
              Hasil analisis gejala Anda akan muncul di sini.
            </CustomText>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          renderItem={({ item }) => <ReportHistoryCard report={item} />}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  containerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SymptomHistoryScreen;
