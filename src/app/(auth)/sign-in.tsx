import { authClient } from "@/src/auth-client";
import CustomText from "@/src/components/custom-text";
import { useAuth } from "@/src/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Input Tidak Lengkap", "Mohon isi email dan password.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });
      if (res.data?.user) {
        const userData = {
          id: res.data.user.id,
          name: res.data.user.name || "",
          email: res.data.user.email,
        };
        await signIn(userData);
        router.replace({ pathname: "/main/dashboard" });
      } else {
        Alert.alert(
          "Login Gagal",
          res.error?.message || "Email atau password salah. Silakan coba lagi."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Login Gagal",
        error.message || "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <LinearGradient
      colors={["#ACE3D7", "#FFFFFF"]}
      className="flex-1 justify-center items-center px-6"
    >
      <View className="bg-white rounded-2xl w-full p-6 h-full mt-[20rem] pt-[5rem] max-w-md">
        <View className="items-center mb-6">
          <Image
            source={require("@/assets/images/emergensee.png")}
            className="w-12 h-12"
          />
          <CustomText className="text-[32px] font-bold text-gray-800 mt-4">
            Masuk
          </CustomText>
          <CustomText className="text-gray-500 mt-1 text-center">
            Gunakan akun yang sudah kamu daftarkan.
          </CustomText>
        </View>

        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-700"
          placeholder="Email"
          keyboardType="email-address"
          defaultValue=""
          onChangeText={(e) => setEmail(e)}
        />

        <View className="relative mb-4">
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700 pr-10"
            placeholder="Password"
            secureTextEntry={!isPasswordVisible}
            defaultValue=""
            onChangeText={(e) => setPassword(e)}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-3 top-3.5 p-1"
          >
            <Feather
              name={isPasswordVisible ? "eye" : "eye-off"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-4 h-4 border border-gray-300 rounded mr-2" />
            <CustomText className="text-gray-600 text-sm">
              Remember me
            </CustomText>
          </View>
          <TouchableOpacity>
            <CustomText className="text-sm text-[#30887C]">
              Forgot Password ?
            </CustomText>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={["#4FB2A3", "#30887C"]}
          className="py-5 rounded-xl items-center mb-4"
          style={{ borderRadius: 11 }}
          locations={[0, 1]}
        >
          <TouchableOpacity
            className="w-full"
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <CustomText className="text-white font-bold text-center">
                Masuk
              </CustomText>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <View className="flex-row justify-center">
          <CustomText className="text-gray-500">
            Belum memiliki akun?{" "}
          </CustomText>
          <TouchableOpacity onPress={() => router.replace("/sign-up")}>
            <CustomText className="text-green-600 font-semibold">
              Daftar
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
