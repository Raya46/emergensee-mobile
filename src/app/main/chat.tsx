import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  analyzeSymptom,
  AnalyzeSymptomN8NResult,
  UserDetailsForN8N,
} from "@/src/actions/analyze-symptom";
import { createSymptomReport } from "@/src/actions/create-symptom";
import AIAnalysisResultCard from "@/src/components/ai-analysis-card";
import { useAuth } from "@/src/context/AuthContext";
import { CreateSymptomReportToDBSchemaType } from "@/src/lib/type-zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";

import CustomText from "@/src/components/custom-text";
import { ChatSession, Message } from "@/src/lib/type";
import { Feather } from "@expo/vector-icons";
import { Image } from "react-native";

const getChatHistoryKey = (userId: string) => `@chatHistorySessions_${userId}`;

const Chat = () => {
  const params = useLocalSearchParams<{
    reportId?: string;
    aiAnalysisData?: string;
    reportDataFallback?: string;
    sessionId?: string;
    testData?: string;
  }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const startNewChat = useCallback(
    (initialMessages?: Message[]) => {
      if (!user?.id) {
        setMessages([]);
        setCurrentSessionId(null);
        return;
      }
      setMessages([]);
      setInputText("");
      const newId = Crypto.randomUUID();
      setCurrentSessionId(newId);

      if (initialMessages && initialMessages.length > 0) {
        setMessages(initialMessages);
      } else {
        const initialBotMessage: Message = {
          id: `bot-init-${Date.now()}`,
          text: "Hai! Aku GenSee. Apa yang bisa kubantu hari ini? Ketik 'analisis' jika ingin melakukan analisis gejala.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages([initialBotMessage]);
      }
    },
    [user?.id]
  );

  const loadMessagesForSession = useCallback(
    async (sessionId: string) => {
      if (!user?.id) {
        console.log("[Chat] loadMessagesForSession dipanggil tanpa user.id.");
        setMessages([]);
        setCurrentSessionId(null);
        return;
      }
      const userChatHistoryKey = getChatHistoryKey(user.id);
      console.log(
        `[Chat] Attempting to load session ${sessionId} for user ${user.id} from key ${userChatHistoryKey}`
      );
      try {
        const storedHistories = await AsyncStorage.getItem(userChatHistoryKey);
        if (storedHistories) {
          const histories: ChatSession[] = JSON.parse(storedHistories);
          const sessionToLoad = histories.find((s) => s.id === sessionId);
          if (sessionToLoad) {
            const messagesWithDateObjects = sessionToLoad.messages.map(
              (msg) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })
            );
            setMessages(messagesWithDateObjects);
            setCurrentSessionId(sessionId);
            console.log(
              `[Chat] Session ${sessionId} loaded for user ${user.id}`
            );
          } else {
            console.log(
              `[Chat] Session ${sessionId} not found for user ${user.id}. Starting new chat.`
            );
            startNewChat();
          }
        } else {
          console.log(
            `[Chat] No chat history found for user ${user.id}. Starting new chat.`
          );
          startNewChat();
        }
      } catch (e) {
        console.log(
          `[Chat] Failed to load session messages for user ${user.id}.`,
          e
        );
        startNewChat();
      }
    },
    [user?.id, startNewChat]
  );

  const saveCurrentChatSession = useCallback(
    async (messagesToSave: Message[]) => {
      if (!user?.id || messagesToSave.length === 0 || !currentSessionId) {
        if (
          messagesToSave.length === 1 &&
          messagesToSave[0].sender === "bot" &&
          messagesToSave[0].id.startsWith("bot-init-")
        ) {
          return;
        }
        return;
      }

      const userChatHistoryKey = getChatHistoryKey(user.id);
      const sessionTitle =
        messagesToSave
          .find((m) => m.sender === "user")
          ?.text.substring(0, 30) ||
        messagesToSave
          .filter((m) => !m.id.startsWith("bot-init-"))[0]
          ?.text.substring(0, 30) ||
        `Sesi ${new Date().toLocaleTimeString()}`;

      const newSession: ChatSession = {
        id: currentSessionId,
        title: sessionTitle,
        timestamp: new Date().toISOString(),
        messages: messagesToSave.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        messageCount: messagesToSave.length,
      };

      try {
        const storedHistories = await AsyncStorage.getItem(userChatHistoryKey);
        let histories: ChatSession[] = storedHistories
          ? JSON.parse(storedHistories)
          : [];
        const existingSessionIndex = histories.findIndex(
          (s) => s.id === currentSessionId
        );

        if (existingSessionIndex > -1) {
          histories[existingSessionIndex] = newSession;
        } else {
          histories.push(newSession);
        }

        await AsyncStorage.setItem(
          userChatHistoryKey,
          JSON.stringify(histories)
        );
        console.log(
          `[Chat] Chat session ${currentSessionId} saved/updated for user ${user.id}.`
        );
      } catch (e) {
        console.log(
          `[Chat] Failed to save chat session for user ${user.id}.`,
          e
        );
      }
    },
    [user?.id, currentSessionId]
  );

  useEffect(() => {
    async function loadLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg(
          "Izin akses lokasi ditolak. Beberapa fitur mungkin terbatas."
        );
      } else {
        try {
          let newLocation = await Location.getCurrentPositionAsync({});
          setLocation(newLocation);
        } catch (locError) {
          console.log("Error getting location:", locError);
          setErrorMsg("Gagal mendapatkan lokasi saat ini.");
        }
      }
    }
    loadLocation();
  }, []);

  useEffect(() => {
    console.log(
      "[Chat] User/SessionId Effect: User:",
      user?.id,
      "Session Param:",
      params.sessionId,
      "Report ID Param:",
      params.reportId,
      "testData Param:",
      params.testData,
      "Current Messages Length:",
      messages.length
    );

    if (user?.id) {
      if (params.testData && typeof params.testData === "string") {
        console.log(
          `[Chat] Ada testData string dari params: ${params.testData}`
        );
        try {
          const parsedTestData = JSON.parse(params.testData);
          console.log(
            "[Chat] Berhasil parse testData dari params:",
            parsedTestData
          );

          const messagesWithTestData: Message[] = [];
          const initialBotMessage: Message = {
            id: `bot-init-testdata-${Date.now()}`,
            text: "Berikut adalah detail dari data riwayat yang Anda pilih:",
            sender: "bot",
            timestamp: new Date(),
          };
          messagesWithTestData.push(initialBotMessage);

          if (parsedTestData && typeof parsedTestData.aiSummary === "string") {
            const analysisMessage: Message = {
              id: `bot-testdata-analysis-${Date.now()}`,
              text: "Hasil Analisis AI:",
              sender: "bot",
              timestamp: new Date(),
              analysis: parsedTestData,
              analysisPatientName: user.name || "Pengguna",
            };
            messagesWithTestData.push(analysisMessage);

            const followupBotMessage: Message = {
              id: `bot-testdata-followup-${Date.now()}`,
              text: "Apakah ada hal lain yang ingin Anda diskusikan atau tanyakan terkait analisis ini?",
              sender: "bot",
              timestamp: new Date(),
            };
            messagesWithTestData.push(followupBotMessage);
          } else {
            console.log(
              "[Chat] parsedTestData tidak memiliki struktur yang diharapkan."
            );
            const invalidDataMessage: Message = {
              id: `bot-invalid-testdata-${Date.now()}`,
              text: "Data riwayat yang diterima tidak lengkap atau tidak valid. Anda bisa memulai percakapan baru.",
              sender: "bot",
              timestamp: new Date(),
            };
            messagesWithTestData.push(invalidDataMessage);
          }

          startNewChat(messagesWithTestData);
          router.setParams({
            testData: undefined,
            reportId: undefined,
            aiAnalysisData: undefined,
            reportDataFallback: undefined,
          });
        } catch (e) {
          console.log(
            "[Chat] Gagal parse testData dari params atau data tidak valid:",
            e
          );
          const errorMessage: Message = {
            id: `bot-error-testdata-${Date.now()}`,
            text: "Gagal memproses data riwayat yang dipilih. Silakan coba lagi atau mulai percakapan baru.",
            sender: "bot",
            timestamp: new Date(),
          };
          startNewChat([errorMessage]);
          router.setParams({
            testData: undefined,
            reportId: undefined,
            aiAnalysisData: undefined,
            reportDataFallback: undefined,
          });
        }
      } else if (params.reportId) {
        console.log(`[Chat] Ada reportId dari params: ${params.reportId}`);
        let analysisDataFromHistory = null;
        let patientNameFromHistory = user.name || "Pengguna";

        if (params.aiAnalysisData) {
          try {
            analysisDataFromHistory = JSON.parse(params.aiAnalysisData);
            console.log(
              "[Chat] Berhasil parse aiAnalysisData dari params:",
              analysisDataFromHistory
            );
          } catch (e) {
            console.log("[Chat] Gagal parse aiAnalysisData dari params:", e);
          }
        } else if (params.reportDataFallback) {
          try {
            const fallbackData = JSON.parse(params.reportDataFallback);
            analysisDataFromHistory = fallbackData.aiAnalysis;
            patientNameFromHistory =
              fallbackData.reporterName || patientNameFromHistory;
            console.log(
              "[Chat] Berhasil parse reportDataFallback, aiAnalysis dari fallback:",
              analysisDataFromHistory
            );
            if (!analysisDataFromHistory) {
              console.log(
                "[Chat] Tidak ada aiAnalysis dalam reportDataFallback."
              );
            }
          } catch (e) {
            console.log(
              "[Chat] Gagal parse reportDataFallback dari params:",
              e
            );
          }
        }

        const messagesWithHistory: Message[] = [];
        const initialBotMessage: Message = {
          id: `bot-init-hist-${Date.now()}`,
          text: "Berikut adalah detail dari riwayat analisis yang Anda pilih:",
          sender: "bot",
          timestamp: new Date(),
        };
        messagesWithHistory.push(initialBotMessage);

        if (analysisDataFromHistory) {
          const analysisMessage: Message = {
            id: `bot-hist-analysis-${Date.now()}`,
            text: "Hasil Analisis AI:",
            sender: "bot",
            timestamp: new Date(),
            analysis: analysisDataFromHistory,
            analysisPatientName: patientNameFromHistory,
          };
          messagesWithHistory.push(analysisMessage);
          const followupBotMessage: Message = {
            id: `bot-hist-followup-${Date.now()}`,
            text: "Apakah ada hal lain yang ingin Anda diskusikan atau tanyakan terkait analisis ini?",
            sender: "bot",
            timestamp: new Date(),
          };
          messagesWithHistory.push(followupBotMessage);
        } else {
          const noAnalysisMessage: Message = {
            id: `bot-hist-no-analysis-${Date.now()}`,
            text: "Data analisis AI tidak ditemukan untuk riwayat ini. Anda bisa memulai percakapan baru.",
            sender: "bot",
            timestamp: new Date(),
          };
          messagesWithHistory.push(noAnalysisMessage);
        }
        startNewChat(messagesWithHistory);
        router.setParams({
          reportId: undefined,
          aiAnalysisData: undefined,
          reportDataFallback: undefined,
          testData: undefined,
        });
      } else if (params.sessionId) {
        if (params.sessionId !== currentSessionId || messages.length === 0) {
          console.log(
            `[Chat] Loading session from params: ${params.sessionId} for user: ${user.id}`
          );
          loadMessagesForSession(params.sessionId as string);
        }
      } else {
        if (messages.length === 0 && !currentSessionId) {
          console.log(
            `[Chat] No session ID in params or current session for user: ${user.id}. Starting new chat.`
          );
          startNewChat();
        } else if (messages.length > 0 && !currentSessionId) {
          console.log(
            `[Chat] User ${user.id} has messages but no currentSessionId. Starting new chat.`
          );
          startNewChat();
        }
      }
    } else {
      console.log(
        "[Chat] No user detected in effect. Clearing messages and session ID."
      );
      setMessages([]);
      setCurrentSessionId(null);
      setInputText("");
    }
  }, [
    user?.id,
    params.sessionId,
    loadMessagesForSession,
    startNewChat,
    currentSessionId,
  ]);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
      if (
        currentSessionId &&
        user?.id &&
        (messages.length > 1 ||
          (messages.length === 1 && messages[0].sender === "user"))
      ) {
        saveCurrentChatSession(messages);
      }
    }
  }, [messages, currentSessionId, user?.id, saveCurrentChatSession]);

  const handleSend = async () => {
    if (inputText.trim().length === 0 || !user?.id) {
      if (!user?.id) {
        console.log("User ID tidak tersedia. Pesan tidak dikirim.");
        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          text: "Error: Anda harus login untuk mengirim pesan.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, systemMessage]);
      }
      return;
    }
    if (!currentSessionId) {
      console.log(
        "[Chat] currentSessionId is null in handleSend, attempting to start new chat."
      );
      const newId = Crypto.randomUUID();
      setCurrentSessionId(newId);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    const currentMessageText = inputText;
    setInputText("");
    setIsLoading(true);

    try {
      const userDetails: UserDetailsForN8N = {
        userId: user.id,
        name: user.name,
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      };

      const result: AnalyzeSymptomN8NResult = await analyzeSymptom(
        currentMessageText,
        userDetails
      );

      if (result.success) {
        let botMessageText = result.botResponse || "";

        if (result.aiAnalysisResult) {
          if (!botMessageText) botMessageText = "Berikut hasil analisis Anda:";
        }

        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: botMessageText,
          sender: "bot",
          timestamp: new Date(),
          analysis: result.aiAnalysisResult,
          analysisPatientName: user.name || undefined,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);

        if (result.aiAnalysisResult && result.dbSavePayload && user) {
          const { dbSavePayload, aiAnalysisResult: validatedAiAnalysis } =
            result;
          const dataToSave: CreateSymptomReportToDBSchemaType = {
            userId: user.id,
            complaint: dbSavePayload.complaint || currentMessageText,
            symptoms: dbSavePayload.symptoms || [],
            temperature: dbSavePayload.temperature ?? undefined,
            oxygenSaturation: dbSavePayload.oxygenSaturation ?? undefined,
            heartRate: dbSavePayload.heartRate ?? undefined,
            bloodPressure: dbSavePayload.bloodPressure ?? undefined,
            respiratoryRate: dbSavePayload.respiratoryRate ?? undefined,
            isEmergency: dbSavePayload.isEmergency ?? undefined,
            latitude:
              dbSavePayload.latitude ?? Number(location?.coords.latitude ?? 0),
            longitude:
              dbSavePayload.longitude ??
              Number(location?.coords.longitude ?? 0),
            aiAnalysis: validatedAiAnalysis,
          };
          await createSymptomReport(dataToSave);
        }
      } else {
        const botMessageText =
          result.botResponse ||
          result.error ||
          "Maaf, terjadi kesalahan saat memproses permintaan Anda.";
        const botMessage: Message = {
          id: `bot-error-${Date.now()}`,
          text: botMessageText,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (error: any) {
      console.log("Failed to send message or get bot response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    if (item.sender === "bot" && item.analysis) {
      return (
        <AIAnalysisResultCard
          analysisResult={item.analysis}
          patientName={item.analysisPatientName}
        />
      );
    }
    return (
      <View
        className={`py-2.5 px-3.5 rounded-2xl my-1 max-w-[80%] ${
          item.sender === "user"
            ? "bg-[#D6F1EB] self-end"
            : "bg-white self-start"
        }`}
      >
        <CustomText
          className={`text-base ${
            item.sender === "user" ? "text-gray-700" : "text-black"
          }`}
        >
          {item.text}
        </CustomText>
        <CustomText
          className={`text-xs self-end mt-1 ${
            item.sender === "user" ? "text-gray-700" : "text-gray-600"
          }`}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </CustomText>
      </View>
    );
  };

  if (isLoading && messages.length === 0 && !user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
        <CustomText className="mt-2 text-gray-600">
          Memuat data pengguna...
        </CustomText>
      </View>
    );
  }

  if (errorMsg && !location && !user) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <CustomText className="text-red-500 text-center">{errorMsg}</CustomText>
        <CustomText className="text-center mt-2">
          Pastikan layanan lokasi aktif dan izin telah diberikan.
        </CustomText>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F3FAF9]">
      <View className="flex flex-row items-center justify-between px-3 pt-2">
        <TouchableOpacity
          className="p-2 bg-white rounded-xl"
          onPress={() =>
            user?.id ? router.push(`/main/history`) : router.push("/sign-in")
          }
        >
          <Feather name="rotate-ccw" size={24} color={"#30887C"} />
        </TouchableOpacity>
        <Image
          source={require("@/assets/images/mascott.png")}
          className="h-16 w-32"
          resizeMode="contain"
        />
        <TouchableOpacity
          className="p-2 bg-white rounded-xl"
          onPress={() => router.push("/main/profile")}
        >
          <Feather name="user" size={24} color={"#30887C"} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 64 : Platform.OS === "android" ? 30 : 0
        }
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          className="flex-1 px-2.5"
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
          ListEmptyComponent={() =>
            !isLoading && user?.id ? (
              <View className="flex-1 justify-center items-center p-4">
                <CustomText className="text-gray-500 text-center">
                  Mulai percakapan dengan GenSee!
                </CustomText>
              </View>
            ) : null
          }
        />
        <View className="flex-row items-center px-2.5 py-2 border-t border-gray-300 bg-white mb-10">
          <TextInput
            className="flex-1 min-h-[44px] max-h-[120px] bg-gray-100 rounded-2xl px-4 text-base mr-2 ios:py-3"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ketik pesan Anda..."
            placeholderTextColor="#888"
            multiline
            editable={!isLoading && !!user?.id}
          />
          <TouchableOpacity
            className={`rounded-2xl h-11 w-11 justify-center items-center ${
              !user?.id || isLoading || inputText.trim().length === 0
                ? "bg-gray-400"
                : "bg-blue-500"
            }`}
            onPress={handleSend}
            disabled={!user?.id || isLoading || inputText.trim().length === 0}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather
                name="send"
                size={24}
                color={
                  !user?.id || isLoading || inputText.trim().length === 0
                    ? "#A0A0A0"
                    : "white"
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
