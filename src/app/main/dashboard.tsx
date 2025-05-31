import CustomText from "@/src/components/custom-text";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

const Dashboard = () => {
  const params = useLocalSearchParams();
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

      <LinearGradient
        colors={["#4FB2A3", "#30887C"]}
        className="py-5 rounded-xl items-center mb-4 px-[7rem]"
        style={{ borderRadius: 11 }}
        locations={[0, 1]}
      >
        <TouchableOpacity
          className="w-full"
          onPress={() =>
            router.push({
              pathname: "/main/chat",
              params: { userId: params.userId },
            })
          }
        >
          <CustomText className="text-white font-bold">
            Mulai Simulasi Klaim
          </CustomText>
        </TouchableOpacity>
      </LinearGradient>
    </LinearGradient>
  );
};

export default Dashboard;
