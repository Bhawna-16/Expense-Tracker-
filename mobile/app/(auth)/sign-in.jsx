import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, Image, ScrollView } from "react-native";
import { useState } from "react";
import { styles } from "../../assets/styles/auth.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

const getClerkErrorMessage = (err) => {
  return (
    err?.errors?.[0]?.longMessage ||
    err?.errors?.[0]?.message ||
    err?.message ||
    "An error occurred. Please try again."
  );
};

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [error, setError] = useState("");

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      setError("");
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else if (signInAttempt.status === "needs_second_factor") {
        if (typeof signInAttempt.prepareSecondFactor === "function") {
          await signInAttempt.prepareSecondFactor({ strategy: "email_code" });
        } else {
          await signIn.prepareSecondFactor({ strategy: "email_code" });
        }
        setNeedsSecondFactor(true);
      } else {
        setError(`Sign in requires additional step: ${signInAttempt.status}`);
      }
    } catch (err) {
      if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Password is incorrect. Please try again.");
      } else if (err?.errors?.[0]?.code === "session_exists") {
        router.replace("/");
      } else {
        setError(getClerkErrorMessage(err));
      }
    }
  };

  const onVerifySecondFactorPress = async () => {
    if (!isLoaded || !verificationCode.trim()) return;

    try {
      setError("");
      const secondFactorAttempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode.trim(),
      });

      if (secondFactorAttempt.status === "complete") {
        await setActive({ session: secondFactorAttempt.createdSessionId });
        router.replace("/");
      } else {
        setError("Verification is not complete yet. Please try again.");
      }
    } catch (err) {
      setError(getClerkErrorMessage(err));
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.container}>
        <Image source={require("../../assets/images/revenue-i4.png")} style={styles.illustration} />
        <Text style={styles.title}>Welcome Back</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        {!needsSecondFactor ? (
          <>
            <TextInput
              style={[styles.input, error && styles.errorInput]}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor="#9A8478"
              onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
            />

            <TextInput
              style={[styles.input, error && styles.errorInput]}
              value={password}
              placeholder="Enter password"
              placeholderTextColor="#9A8478"
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
            />

            <TouchableOpacity style={styles.button} onPress={onSignInPress}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.footerText, { marginBottom: 10 }]}>Enter the code sent to your email</Text>
            <TextInput
              style={[styles.input, error && styles.errorInput]}
              value={verificationCode}
              placeholder="6-digit verification code"
              placeholderTextColor="#9A8478"
              keyboardType="number-pad"
              onChangeText={(code) => setVerificationCode(code)}
            />

            <TouchableOpacity style={styles.button} onPress={onVerifySecondFactorPress}>
              <Text style={styles.buttonText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setNeedsSecondFactor(false)}>
              <Text style={styles.linkText}>Back to sign in</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>

          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
