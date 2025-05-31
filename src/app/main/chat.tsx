import React, { useEffect, useRef, useState } from "react";
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

import { analyzeSymptom } from "@/src/actions/analyze-symptom";
import { useAuth } from "@/src/context/AuthContext";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";

import CustomText from "@/src/components/custom-text";
import { Image } from "react-native";
import urgentMetrics from "../../lib/urgent-metrics";
import urgentPolicy from "../../lib/urgent-policy";

interface MessageInState {
  sender: "user" | "bot";
  text: string;
  timestamp?: string | Date;
  id?: string;
}

interface Message extends MessageInState {
  id: string;
  timestamp: Date;
}

const Chat = () => {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          console.error("Error getting location:", locError);
          setErrorMsg("Gagal mendapatkan lokasi saat ini.");
        }
      }
    }

    loadLocation();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim().length === 0 || !user?.id) {
      if (!user?.id) {
        console.warn("User ID tidak tersedia. Pesan tidak dikirim.");
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
      const chatHistoryForAction = messages.map((msg) => ({
        sender: msg.sender,
        text: msg.text,
      }));

      const result = await analyzeSymptom(
        currentMessageText,
        chatHistoryForAction,
        user.id,
        urgentMetrics,
        urgentPolicy,
        location?.coords
      );

      if (result.success && result.botResponse) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: result.botResponse,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          text: result.error || "Maaf, terjadi kesalahan pada bot.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
        console.error("Error from analyzeSymptom:", result.error);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `error-catch-${Date.now()}`,
        text: "Tidak dapat terhubung ke server chatbot.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      console.error("Failed to send message or get bot response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <View
      className={`py-2.5 px-3.5 rounded-2xl my-1 max-w-[80%] ${
        item.sender === "user"
          ? "bg-blue-500 self-end"
          : "bg-gray-200 self-start"
      }`}
    >
      <CustomText
        className={`text-base ${
          item.sender === "user" ? "text-white" : "text-black"
        }`}
      >
        {item.text}
      </CustomText>
      <CustomText
        className={`text-xs self-end mt-1 ${
          item.sender === "user" ? "text-gray-200" : "text-gray-600"
        }`}
      >
        {item.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </CustomText>
    </View>
  );

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

  if (errorMsg && !location) {
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
    <SafeAreaView className="flex-1 bg-gray-100 my-10">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View className="flex flex-row justify-between items-center">
          <TouchableOpacity></TouchableOpacity>
          <Image
            source={require("@/assets/images/mascott.png")}
            className="w-full h-[100px]"
            resizeMode="contain"
          />
          <TouchableOpacity></TouchableOpacity>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          className="flex-1 px-2.5"
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
        />
        <View className="flex-row items-center px-2.5 py-2 border-t border-gray-300 bg-white">
          <TextInput
            className="flex-1 min-h-[44px] max-h-[120px] bg-gray-100 rounded-2xl px-4 text-base mr-2 ios:py-3 android:py-2.5"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ketik pesan Anda..."
            placeholderTextColor="#888"
            multiline
            editable={!isLoading && !!user?.id}
          />
          <TouchableOpacity
            className={`rounded-2xl h-11 w-11 justify-center items-center ${!user?.id || isLoading ? "bg-gray-400" : "bg-blue-500"}`}
            onPress={handleSend}
            disabled={!user?.id || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CustomText className="text-white text-base font-bold">
                Kirim
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
