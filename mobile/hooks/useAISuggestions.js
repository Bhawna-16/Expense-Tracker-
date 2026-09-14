import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { getMonthlyAnalysis } from "../lib/utils";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Models to try in order — each has its own separate quota
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];

const MAX_RETRIES = 2;

/**
 * Calls the Gemini API with automatic model fallback and retry on 429.
 */
async function callGeminiAPI(prompt) {
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return (
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Could not generate a suggestion. Try again."
        );
      }

      // If rate-limited, extract retry delay and wait before retrying
      if (response.status === 429) {
        const errorBody = await response.json().catch(() => ({}));
        const retryInfo = errorBody?.error?.details?.find(
          (d) => d["@type"]?.includes("RetryInfo")
        );
        const delayStr = retryInfo?.retryDelay || "5s";
        const delaySec = Math.min(parseInt(delayStr) || 5, 30);

        console.warn(
          `Gemini ${model} rate-limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}). ` +
          `Retrying in ${delaySec}s...`
        );

        // On last attempt for this model, try the next model instead of waiting
        if (attempt === MAX_RETRIES) {
          console.warn(`Switching from ${model} to next fallback model...`);
          break;
        }

        // Wait for the suggested retry delay
        await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
        continue;
      }

      // Non-429 error — throw immediately
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Gemini API error ${response.status}: ${errorBody.slice(0, 200)}`);
    }
  }

  // All models exhausted
  throw new Error("QUOTA_EXHAUSTED");
}

export const useAISuggestions = () => {
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const fetchSuggestion = useCallback(async (transactions, referenceDate = new Date()) => {
    if (!GEMINI_API_KEY) {
      Alert.alert(
        "Configuration Missing",
        "Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file"
      );
      return;
    }

    try {
      setLoadingSuggestion(true);
      const analysis = getMonthlyAnalysis(transactions, referenceDate);

      const categoryBreakdownText = analysis.categoryBreakdown
        .slice(0, 5)
        .map((cat) => `${cat.category}: ₹${cat.amount.toFixed(2)}`)
        .join(", ");

      const prompt = `Based on the following monthly spending analysis, provide one concise, actionable financial suggestion (2-3 sentences max):

Month: ${analysis.monthLabel}
Total Spent: ₹${analysis.expenses.toFixed(2)}
Total Income: ₹${analysis.income.toFixed(2)}
Net: ₹${analysis.net.toFixed(2)}
Transactions: ${analysis.totalTransactions}
Top Categories: ${categoryBreakdownText || "No category data"}
Top Spending Day: ₹${analysis.topSpendingDay?.amount?.toFixed(2) || 0}

${
  analysis.spendingChangePercent !== null
    ? `Compared to last month, spending changed by ${analysis.spendingChangePercent > 0 ? "+" : ""}${analysis.spendingChangePercent.toFixed(1)}%.`
    : ""
}

Provide a specific, practical suggestion to help reduce expenses or manage money better.`;

      const aiSuggestion = await callGeminiAPI(prompt);
      setSuggestion(aiSuggestion);
    } catch (error) {
      console.error("Error fetching AI suggestion:", error);

      if (error.message === "QUOTA_EXHAUSTED") {
        Alert.alert(
          "API Quota Exceeded",
          "Your free Gemini API quota has been used up. Please wait a few minutes and try again, or generate a new API key at ai.google.dev."
        );
      } else {
        Alert.alert("Error", "Failed to get AI suggestion. Please try again.");
      }
    } finally {
      setLoadingSuggestion(false);
    }
  }, []);

  return { suggestion, loadingSuggestion, fetchSuggestion };
};
