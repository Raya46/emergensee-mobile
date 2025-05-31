import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
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
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="main" />
      {/* Jika 'main' adalah grup, idealnya ditulis sebagai <Stack.Screen name="(main)" /> */}
      {/* Namun, kita ikuti setup yang ada di file Anda */}
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
