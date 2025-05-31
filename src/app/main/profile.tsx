import { authClient } from "@/src/auth-client";
import CustomText from "@/src/components/custom-text";
import { useAuth } from "@/src/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const Profile = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      console.log("Semua data AsyncStorage telah dihapus.");

      await authClient.signOut();
      console.log("Successfully signed out from backend.");

      if (signOut) {
        signOut();
        console.log("AuthContext signOut executed.");
      } else {
        console.log("signOut function from AuthContext is not available.");
      }

      router.replace("/sign-in");
    } catch (error) {
      console.log("Error during sign out:", error);
      try {
        await AsyncStorage.clear();
        console.log("AsyncStorage cleared during error handling.");

        if (signOut) {
          signOut();
        }
        console.log("Local session cleanup attempted after error.");
      } catch (cleanupError) {
        console.log(
          "Error during sign out cleanup after initial error:",
          cleanupError
        );
      }
      router.replace("/sign-in");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card} className="p-6 bg-white rounded-lg mb-6">
        <CustomText className="text-2xl font-bold text-gray-800 mb-1 text-center">
          Profil Pengguna
        </CustomText>
        {user?.name && (
          <CustomText className="text-lg text-gray-600 mb-4 text-center">
            {user.name}
          </CustomText>
        )}

        <View className="mb-4">
          <CustomText className="text-sm font-semibold text-gray-500 mb-1">
            Email
          </CustomText>
          <CustomText className="text-base text-gray-700 bg-gray-100 p-3 rounded-md">
            {user?.email || "Tidak tersedia"}
          </CustomText>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutButton}
        className="bg-emerald-700 p-4 rounded-lg flex-row items-center justify-center active:bg-red-600"
      >
        <Feather name="log-out" size={20} color="white" />
        <CustomText className="text-white text-base font-semibold ml-2">
          Logout
        </CustomText>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3FAF9",
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButton: {},
});

export default Profile;
