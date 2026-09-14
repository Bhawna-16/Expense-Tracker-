import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTransactions } from "../../../hooks/useTransactions";
import { styles } from "../../../assets/styles/home.styles";
import { COLORS } from "../../../constants/colors";
import { MonthlyAnalysisCard } from "../../../components/MonthlyAnalysisCard";
import { useAISuggestions } from "../../../hooks/useAISuggestions";

export default function Monthly() {
  const { user } = useUser();
  const { transactions, isLoading, loadData } = useTransactions(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());
  const { suggestion, loadingSuggestion, fetchSuggestion } = useAISuggestions();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setDisplayDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (newDate <= new Date()) {
      setDisplayDate(newDate);
    }
  };

  const handleGetSuggestion = async () => {
    await fetchSuggestion(transactions, displayDate);
  };

  const monthLabel = displayDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isMaxMonth =
    displayDate.getMonth() === new Date().getMonth() &&
    displayDate.getFullYear() === new Date().getFullYear();

  return (
    <View style={styles.monthlyContainer}>
      <View style={styles.monthPickerHeader}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthPickerButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.monthPickerLabel}>{monthLabel}</Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          disabled={isMaxMonth}
          style={[styles.monthPickerButton, isMaxMonth && { opacity: 0.5 }]}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isMaxMonth ? COLORS.textLight : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.monthlyScroll}
        contentContainerStyle={styles.monthlyScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <MonthlyAnalysisCard transactions={transactions} referenceDate={displayDate} />

            <View style={styles.suggestionSection}>
              <View style={styles.suggestionHeader}>
                <View>
                  <Text style={styles.suggestionTitle}>Get AI Insights</Text>
                  <Text style={styles.suggestionSubtitle}>Smart suggestions for this month</Text>
                </View>
                <Ionicons name="sparkles" size={20} color={COLORS.primary} />
              </View>

              {suggestion ? (
                <View style={styles.suggestionBox}>
                  <View style={styles.suggestionContent}>
                    <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.suggestionPrompt}>
                  Tap the button below to get personalized spending insights
                </Text>
              )}

              <TouchableOpacity
                style={[styles.suggestionButton, loadingSuggestion && { opacity: 0.6 }]}
                onPress={handleGetSuggestion}
                disabled={loadingSuggestion}
              >
                {loadingSuggestion ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color={COLORS.white} />
                    <Text style={styles.suggestionButtonText}>Get Suggestions</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
