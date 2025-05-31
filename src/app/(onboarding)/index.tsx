import CustomText from "@/src/components/custom-text";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-swiper";

interface OnboardingScreenProps {
  onNext?: () => void;
}

const OnboardingScreen1: React.FC<OnboardingScreenProps> = ({ onNext }) => (
  <View className="flex-1 justify-end items-center">
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={require("@/assets/images/people-2.png")}
        className="w-full h-[500px] mt-[5rem]"
        resizeMode="contain"
      />
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255, 255, 255, 1)",
          "rgba(255, 255, 255, 0)",
        ]}
        className="absolute bottom-0 left-0 right-0 h-[75%]"
      />
    </View>
    <View className="w-full items-center p-8 pb-[5rem]">
      <CustomText className="text-[32px] font-bold text-black text-center mb-2">
        Asisten Pintar
      </CustomText>
      <CustomText className="text-[32px] font-bold text-black text-center mb-6">
        Kesehatan Daruratmu
      </CustomText>
      <CustomText className="text-[16px] text-gray-700 text-center mx-4 mb-10">
        Bantu kamu mengenali gejala darurat dan memprediksi apakah kondisimu
        mungkin ditanggung oleh BPJS{" "}
      </CustomText>
      <TouchableOpacity
        onPress={onNext}
        className="bg-emerald-600 px-8 py-3 rounded-xl w-full "
      >
        <CustomText className="text-white text-lg font-semibold text-center">
          Selanjutnya
        </CustomText>
      </TouchableOpacity>
    </View>
  </View>
);

const OnboardingScreen2: React.FC<OnboardingScreenProps> = ({ onNext }) => (
  <View className="flex-1 justify-end items-center">
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={require("@/assets/images/people-1.png")}
        className="w-full h-[460px] mt-[5rem]"
        resizeMode="contain"
      />
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255, 255, 255, 1)",
          "rgba(255, 255, 255, 0)",
        ]}
        className="absolute bottom-0 left-0 right-0 h-[75%]"
      />
    </View>
    <View className="w-full items-center p-8 pb-[5rem]">
      <CustomText className="text-[32px] font-bold text-black text-center mb-2">
        Gawat atau bukan?
      </CustomText>
      <CustomText className="text-[32px] font-bold text-black text-center mb-6">
        Yuk, Cek Gejalamu!
      </CustomText>
      <CustomText className="text-[16px] text-gray-600 text-center mx-4 mb-10">
        Jawab pertanyaan singkat tentang gejala dan kondisi kamu. Kami akan
        bantu berikan hasil prediksi klaim BPJS
      </CustomText>
      <TouchableOpacity
        onPress={onNext}
        className="bg-emerald-600 w-full px-8 py-3 rounded-xl"
      >
        <CustomText className="text-center text-white text-lg font-semibold">
          Selanjutnya
        </CustomText>
      </TouchableOpacity>
    </View>
  </View>
);

const OnboardingScreen3 = () => (
  <View className="flex-1 justify-end items-center">
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={require("@/assets/images/people-3.png")}
        className="w-full h-[470px] mt-[5rem]"
        resizeMode="contain"
      />
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255, 255, 255, 1)",
          "rgba(255, 255, 255, 0)",
        ]}
        className="absolute bottom-0 left-0 right-0 h-[75%]"
      />
    </View>
    <View className="w-full items-center p-8 pb-[4rem]">
      <CustomText className="text-[32px] font-bold text-black text-center mb-2">
        Privasi Kamu
      </CustomText>
      <CustomText className="text-[32px] font-bold text-black text-center mb-6">
        Prioritas Kami
      </CustomText>
      <CustomText className="text-[16px] text-gray-600 text-center mx-4 mb-10">
        Informasi yang kamu isi bersifat pribadi dan aman. EmergenSee hanya
        memberi prediksi awal, keputusan akhir tetap pada BPJS
      </CustomText>
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/sign-in")}
        className="bg-emerald-600 w-full px-8 py-3 rounded-xl"
      >
        <CustomText className="text-white text-lg font-semibold text-center">
          Mulai Sekarang
        </CustomText>
      </TouchableOpacity>
    </View>
  </View>
);

const Onboarding = () => {
  const swiperRef = useRef<Swiper>(null);

  const handleScrollBy = (increment: number) => {
    if (swiperRef.current) {
      swiperRef.current.scrollBy(increment, true);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/bg-1.png")}
      resizeMode="contain"
      className="flex-1"
    >
      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={true}
        dot={<View className="bg-gray-300 w-2 h-2 rounded-full mx-1" />}
        activeDot={
          <View className="bg-emerald-500 w-3 h-3 rounded-full mx-1" />
        }
        scrollEnabled={false}
        paginationStyle={{
          top: 230,
          left: 0,
          right: 0,
        }}
      >
        <OnboardingScreen1 onNext={() => handleScrollBy(1)} />
        <OnboardingScreen2 onNext={() => handleScrollBy(1)} />
        <OnboardingScreen3 />
      </Swiper>
    </ImageBackground>
  );
};

export default Onboarding;
