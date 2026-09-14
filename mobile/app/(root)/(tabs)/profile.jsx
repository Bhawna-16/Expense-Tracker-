import { useUser, useClerk } from "@clerk/clerk-expo";
import { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../../../constants/colors";
import { styles } from "../../../assets/styles/home.styles";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [personalInfo, setPersonalInfo] = useState("");
  const [editingInfo, setEditingInfo] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPersonalInfo();
    }, [])
  );

  const loadPersonalInfo = async () => {
    try {
      setIsLoading(true);
      const info = await AsyncStorage.getItem(`personalInfo_${user?.id}`);
      if (info) {
        setPersonalInfo(info);
        setEditingInfo(info);
      }
    } catch (error) {
      console.error("Error loading personal info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPersonalInfo();
    setRefreshing(false);
  };

  const handleSaveInfo = async () => {
    if (!editingInfo.trim()) {
      Alert.alert("Info cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      await AsyncStorage.setItem(`personalInfo_${user?.id}`, editingInfo.trim());
      setPersonalInfo(editingInfo.trim());
      setIsEditing(false);
      Alert.alert("Success", "Personal info saved successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to save personal info");
      console.error("Error saving personal info:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.profileContainer}
      contentContainerStyle={styles.profileScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatarContainer}>
          <Text style={styles.profileAvatar}>
            {user?.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.emailAddresses[0]?.emailAddress.split("@")[0]}
          </Text>
          <Text style={styles.profileEmail}>{user?.emailAddresses[0]?.emailAddress}</Text>
        </View>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileSectionHeader}>
          <Ionicons name="person-circle" size={20} color={COLORS.primary} />
          <Text style={styles.profileSectionTitle}>About You</Text>
        </View>
        <Text style={styles.profileSectionSubtitle}>
          Tell the AI about yourself so it can give better spending suggestions
        </Text>

        {isEditing ? (
          <>
            <TextInput
              style={styles.profileTextInput}
              placeholder="E.g., I'm a student, I spend mostly on food and transportation, I earn ₹5000/month"
              placeholderTextColor={COLORS.textLight}
              value={editingInfo}
              onChangeText={setEditingInfo}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.profileButtonGroup}>
              <TouchableOpacity
                style={[styles.profileButton, styles.profileButtonSecondary]}
                onPress={() => {
                  setEditingInfo(personalInfo);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.profileButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.profileButton,
                  styles.profileButtonPrimary,
                  isSaving && { opacity: 0.6 },
                ]}
                onPress={handleSaveInfo}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    <Text style={styles.profileButtonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {personalInfo ? (
              <View style={styles.profileInfoBox}>
                <Text style={styles.profileInfoText}>{personalInfo}</Text>
              </View>
            ) : (
              <View style={styles.profileEmptyBox}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.textLight} />
                <Text style={styles.profileEmptyText}>No personal info added yet</Text>
              </View>
            )}
            <TouchableOpacity style={styles.profileEditButton} onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
              <Text style={styles.profileEditButtonText}>Edit Personal Info</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileSectionHeader}>
          <Ionicons name="settings" size={20} color={COLORS.primary} />
          <Text style={styles.profileSectionTitle}>Account</Text>
        </View>

        <View style={styles.profileInfoBox}>
          <View style={styles.profileDetailRow}>
            <View>
              <Text style={styles.profileDetailLabel}>Email</Text>
              <Text style={styles.profileDetailValue}>{user?.emailAddresses[0]?.emailAddress}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.profileSignOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.expense} />
          <Text style={styles.profileSignOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>About Wallet App</Text>
        <View style={styles.profileInfoBox}>
          <Text style={styles.profileDetailValue}>Version 1.0.0</Text>
          <Text style={styles.profileInfoText}>
            Your personal finance companion for smart spending insights and monthly analysis.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
