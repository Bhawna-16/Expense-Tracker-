import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Alert, Platform, TouchableOpacity } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk();
  const router = useRouter();

  const performSignOut = async () => {
    await signOut();

    if (Platform.OS === "web") {
      // Force a full page navigation so auth state is reflected immediately on web.
      globalThis.location.replace(`/sign-in?logout=${Date.now()}`);
      globalThis.location.reload();
      return;
    }

    router.replace("/sign-in");
  };

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      const confirmed = globalThis.confirm("Are you sure you want to logout?");
      if (!confirmed) return;

      try {
        await performSignOut();
      } catch (error) {
        Alert.alert("Error", "Failed to logout. Please try again.");
        console.error("Error signing out:", error);
      }
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await performSignOut();
          } catch (error) {
            Alert.alert("Error", "Failed to logout. Please try again.");
            console.error("Error signing out:", error);
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={handleSignOut}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="log-out-outline" size={22} color={COLORS.text} />
    </TouchableOpacity>
  );
};
