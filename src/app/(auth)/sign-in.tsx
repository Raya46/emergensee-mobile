import { authClient } from "@/src/auth-client";
import CustomText from "@/src/components/custom-text";
import { useAuth } from "@/src/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const handleSignIn = async () => {
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

      router.replace({
        pathname: "/main/dashboard",
      });
    }
  };
  return (
    <LinearGradient
      colors={["#D1FAE5", "#FFFFFF"]}
      className="flex-1 justify-center items-center px-6"
    >
      <View className="bg-white rounded-2xl w-full p-6 shadow-md max-w-md">
        <View className="items-center mb-6">
          {/* Icon atau logo */}
          <Image
            source={require("@/assets/images/emergensee.png")}
            className="w-12 h-12"
          />
          <CustomText className="text-[32px] font-bold text-gray-800 mt-4">
            Masuk Akun
          </CustomText>
          <CustomText className="text-gray-500 mt-1 text-center">
            Gunakan akun yang sudah kamu daftarkan.
          </CustomText>
        </View>

        {/* Email Input */}
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-700"
          placeholder="Email"
          keyboardType="email-address"
          defaultValue=""
          onChangeText={(e) => setEmail(e)}
        />

        {/* Password Input */}
        <View className="relative mb-4">
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700 pr-10"
            placeholder="Password"
            secureTextEntry={!isPasswordVisible}
            defaultValue=""
            onChangeText={(e) => setPassword(e)}
          />
          <Feather
            name="eye-off"
            size={20}
            color="#9CA3AF"
            className="absolute right-3 top-3.5"
          />
        </View>

        {/* Remember & Forgot */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-4 h-4 border border-gray-300 rounded mr-2" />
            <CustomText className="text-gray-600 text-sm">
              Remember me
            </CustomText>
          </View>
          <TouchableOpacity>
            <CustomText className="text-sm text-blue-500">
              Forgot Password ?
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Button Masuk */}
        <TouchableOpacity
          onPress={handleSignIn}
          className="bg-emerald-700 py-3 rounded-xl items-center mb-4"
        >
          <CustomText className="text-white font-semibold">Masuk</CustomText>
        </TouchableOpacity>

        {/* Google Sign-In */}
        <View className="flex-row items-center justify-center mb-4">
          <CustomText className="text-gray-500">Or login with</CustomText>
        </View>
        <TouchableOpacity className="border border-gray-300 py-3 rounded-xl items-center flex-row justify-center mb-4">
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
            }}
            className="w-5 h-5 mr-2"
          />
          <CustomText className="text-gray-700">
            Lanjutkan dengan Google
          </CustomText>
        </TouchableOpacity>

        {/* Daftar */}
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
