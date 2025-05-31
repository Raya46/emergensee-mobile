import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import "expo-dev-client";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import "react-native-gesture-handler";
import "../../global.css";

function LayoutNavigationController() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const currentTopLevelGroup = segments[0];

    if (isAuthenticated) {
      if (
        currentTopLevelGroup === "(auth)" ||
        currentTopLevelGroup === "(onboarding)"
      ) {
        router.replace("/main/dashboard");
      }
    } else {
      if (currentTopLevelGroup === "main") {
        router.replace("/(auth)/sign-in");
      }
    }
  }, [isAuthenticated, isAuthLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <StatusBar backgroundColor="#30887C" barStyle="light-content" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="main" />
    </Stack>
  );
}

export default function RootLayout() {
  let [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <LayoutNavigationController />
    </AuthProvider>
  );
}
