import { authClient } from "@/src/auth-client";
import CustomText from "@/src/components/custom-text";
import { useAuth } from "@/src/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

const Dashboard = () => {
  const { signOut } = useAuth();
  const params = useLocalSearchParams();
  const handleLogout = async () => {
    try {
      await authClient.signOut();
      console.log("Successfully signed out from backend.");

      await AsyncStorage.multiRemove(["userSession", "userId"]);
      console.log("User session and userId removed from AsyncStorage.");

      if (signOut) {
        signOut();
        console.log("AuthContext signOut executed.");
      } else {
        console.warn("signOut function from AuthContext is not available.");
      }

      router.replace("/sign-in");
    } catch (error) {
      console.error("Error during sign out:", error);

      try {
        await AsyncStorage.multiRemove(["userSession", "userId"]);
        if (signOut) {
          signOut();
        }
        console.log("Local session cleanup attempted after error.");
      } catch (cleanupError) {
        console.error(
          "Error during sign out cleanup after initial error:",
          cleanupError
        );
      }

      router.replace("/sign-in");
    }
  };
  return (
    <LinearGradient
      colors={["#D1FAE5", "#FFFFFF"]}
      className="flex-1 justify-center items-center px-6"
    >
      <View className="flex flex-row items-center gap-4">
        <Image
          source={require("@/assets/images/emergensee.png")}
          className="w-12 h-12"
        />
        <CustomText className="text-[#30887C] text-[29px] font-bold">
          Emergensee
        </CustomText>
      </View>
      <Image
        source={require("@/assets/images/mascott.png")}
        className="w-full h-[400px]"
        resizeMode="contain"
      />
      <CustomText className="text-black font-bold text-[32px] text-center mb-8">
        Ditanggung BPJS nggak ya? Coba cek!
      </CustomText>
      <CustomText className="text-black text-[16px] text-center mb-8">
        Hai, aku GenSee, AI Chatbot yang bisa bantu prediksi apakah kondisimu
        bisa dijamin BPJS atau tidak.
      </CustomText>
      <TouchableOpacity
        className="bg-emerald-600 px-8 py-3 rounded-xl w-full"
        onPress={() =>
          router.push({
            pathname: "/main/chat",
            params: { userId: params.userId },
          })
        }
      >
        <CustomText className="text-white text-lg font-semibold text-center">
          Mulai Simulasi Klaim
        </CustomText>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default Dashboard;
