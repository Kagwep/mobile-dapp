import { AppProvider } from "@/providers/AppProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Toast from "react-native-toast-message";
import { NotificationProvider } from "@/context/NotificationContext";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // Add this
    shouldShowList: true,    // Add this
  }),
});


export default function RootLayout() {
  const router = useRouter();
  const [checkingLogin, setCheckingLogin] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const privateKey = await AsyncStorage.getItem("privateKey");
        const accountAddress = await AsyncStorage.getItem("accountAddress");

        if (privateKey && accountAddress) {
          router.replace("/"); // User is logged in
        } else {
          router.replace("/login"); // Not logged in
        }
      } catch (e) {
        router.replace("/login");
      } finally {
        setCheckingLogin(false);
      }
    };

    checkLogin();
  }, []);

  if (checkingLogin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
   
    <AppProvider>
       <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modals/single_post"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="modals/users" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="modals/single_reel"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/referral"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="modals/PostComponent"
          options={{ presentation: "modal" }}
        />
      </Stack>
      <Toast />
      <StatusBar style="dark" />
      </NotificationProvider>
    </AppProvider>
  );
}
