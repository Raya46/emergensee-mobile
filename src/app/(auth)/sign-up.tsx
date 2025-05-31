import { createDID } from "@/src/actions/create-did";
import { authClient } from "@/src/auth-client";
import CustomText from "@/src/components/custom-text";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/db";
import { user } from "@/src/db/schema";
import { Feather } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";
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

export default function SignUpScreen() {
  const didUUID = Crypto.randomUUID();
  const cheqdApiUrl = process.env.EXPO_PUBLIC_CHEQD_API_URL;
  const cheqdApiKey = process.env.EXPO_PUBLIC_CHEQD_API_KEY;
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert(
        "Input Tidak Lengkap",
        "Mohon isi semua field yang diperlukan."
      );
      return;
    }
    setIsLoading(true);
    try {
      console.log("[SignUp] Memulai proses sign up...");
      const authResponse = await authClient.signUp.email({
        email,
        password,
        name,
      });
      console.log("[SignUp] authClient.signUp response:", authResponse);

      if (!authResponse.data?.user?.id) {
        console.log(
          "[SignUp] Gagal mendapatkan user ID dari authClient.",
          authResponse
        );
        Alert.alert(
          "Registrasi Gagal",
          "Tidak bisa mendapatkan ID pengguna setelah registrasi awal."
        );
        setIsLoading(false);
        return;
      }
      const userId = authResponse.data.user.id;
      const userName = authResponse.data.user.name || name;
      const userEmail = authResponse.data.user.email || email;

      console.log(
        `[SignUp] User ID dari auth: ${userId}, Name: ${userName}, Email: ${userEmail}`
      );
      console.log("[SignUp] Membuat DID...");
      const didValue = await createDID(
        cheqdApiUrl as string,
        cheqdApiKey as string,
        didUUID
      );
      console.log("[SignUp] createDID response (didValue):", didValue);

      if (
        !didValue ||
        typeof didValue !== "string" ||
        !didValue.startsWith("did:cheqd:")
      ) {
        console.log(
          "[SignUp] Gagal membuat DID atau format DID tidak valid.",
          didValue
        );
        Alert.alert(
          "Registrasi Gagal",
          "Gagal membuat Decentralized Identifier (DID)."
        );
        setIsLoading(false);
        return;
      }

      console.log("[SignUp] Menyimpan user ke database lokal dengan data:", {
        id: userId,
        did: didValue,
        name: userName,
        email: userEmail,
      });

      await db.update(user).set({ did: didValue }).where(eq(user.id, userId));
      console.log("[SignUp] User berhasil disimpan ke database lokal.");

      const userDataForSignIn = {
        id: userId,
        name: userName,
        email: userEmail,
        did: didValue,
      };
      console.log(
        "[SignUp] Memanggil signIn dengan userData:",
        userDataForSignIn
      );
      await signIn(userDataForSignIn);
      console.log("[SignUp] signIn berhasil, navigasi ke dashboard...");
      router.replace({ pathname: "/main/dashboard" });
    } catch (error: any) {
      console.log("[SignUp] Terjadi error saat proses sign up:", error);
      let errorMessage = "Terjadi kesalahan saat registrasi.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      if (
        error.message &&
        (error.message.includes("Failed query") ||
          error.message.includes("constraint"))
      ) {
        errorMessage =
          "Gagal menyimpan data pengguna ke database. Kemungkinan email sudah terdaftar atau ada masalah lain.";
      } else if (error.message && error.message.includes("authClient")) {
        errorMessage = "Kesalahan pada layanan otentikasi.";
      }

      Alert.alert("Registrasi Gagal", errorMessage);
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
            Daftar Sekarang
          </CustomText>
          <CustomText className="text-gray-500 mt-1 text-center">
            Cukup beberapa langkah untuk mulai.
          </CustomText>
        </View>

        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-700"
          placeholder="Nam"
          keyboardType="default"
          value={name}
          onChangeText={setName}
          editable={!isLoading}
        />
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-700"
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          editable={!isLoading}
        />

        <View className="relative mb-4">
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700 pr-10"
            placeholder="Password"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
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

        <LinearGradient
          colors={["#4FB2A3", "#30887C"]}
          className="py-5 rounded-xl items-center mb-4 px-[7rem]"
          style={{ borderRadius: 11 }}
          locations={[0, 1]}
        >
          <TouchableOpacity
            className="w-full"
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <CustomText className="text-white font-bold">Daftar</CustomText>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <View className="flex-row justify-center">
          <CustomText className="text-gray-500">Sudah Punya Akun? </CustomText>
          <TouchableOpacity
            onPress={() => (isLoading ? null : router.replace("/sign-in"))}
            disabled={isLoading}
          >
            <CustomText
              className={`font-semibold ${isLoading ? "text-gray-400" : "text-green-600"}`}
            >
              Masuk
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
