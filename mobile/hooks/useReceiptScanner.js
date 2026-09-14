import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = "gemini-2.5-flash";

const VALID_CATEGORIES = [
  "Food & Drinks",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills",
  "Income",
  "Other",
];

export const useReceiptScanner = () => {
  const [isScanning, setIsScanning] = useState(false);

  const pickImage = useCallback(async (useCamera = true) => {
    // Request permissions
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required to scan receipts.");
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Gallery permission is required to select receipt images.");
        return null;
      }
    }

    const options = {
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.[0]?.base64) {
      return null;
    }

    return result.assets[0].base64;
  }, []);

  const extractReceiptData = useCallback(async (base64Image) => {
    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `Analyze this receipt image and extract the transaction details. 
Return ONLY a valid JSON object with these exact fields (no markdown, no code blocks, just raw JSON):
{
  "title": "store or merchant name",
  "amount": total amount as a number (no currency symbol),
  "category": one of: "Food & Drinks", "Shopping", "Transportation", "Entertainment", "Bills", "Income", "Other",
  "isExpense": true if it's an expense, false if it's income
}

If you cannot read the receipt clearly, make your best guess from what you can see. 
Always return valid JSON.`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("Gemini Vision API error:", response.status, errorBody);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up potential markdown code blocks from the response
    const jsonStr = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate and sanitize the extracted data
      return {
        title: String(parsed.title || "").trim() || "Scanned Receipt",
        amount: Math.abs(parseFloat(parsed.amount)) || 0,
        category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "Other",
        isExpense: parsed.isExpense !== false,
      };
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", jsonStr);
      throw new Error("Could not read receipt details. Please enter them manually.");
    }
  }, []);

  const scanReceipt = useCallback(
    async (useCamera = true) => {
      if (!GEMINI_API_KEY) {
        Alert.alert(
          "Configuration Missing",
          "Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file"
        );
        return null;
      }

      try {
        setIsScanning(true);

        const base64Image = await pickImage(useCamera);
        if (!base64Image) {
          return null; // User cancelled
        }

        const receiptData = await extractReceiptData(base64Image);
        return receiptData;
      } catch (error) {
        console.error("Receipt scan error:", error);
        Alert.alert(
          "Scan Failed",
          error.message || "Could not process the receipt. Please try again or enter details manually."
        );
        return null;
      } finally {
        setIsScanning(false);
      }
    },
    [pickImage, extractReceiptData]
  );

  return { isScanning, scanReceipt };
};
