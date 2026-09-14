import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  if (!publishableKey) {
    return (
      <SafeScreen>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12, textAlign: "center" }}>
            Missing Clerk key
          </Text>
          <Text style={{ textAlign: "center", lineHeight: 22 }}>
            Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env and restart Expo.
          </Text>
        </View>
        <StatusBar style="dark" />
      </SafeScreen>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeScreen>
        <Slot />
      </SafeScreen>
      <StatusBar style="dark" />
    </ClerkProvider>
  );
}
