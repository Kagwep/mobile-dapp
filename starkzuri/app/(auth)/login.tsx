import { useAppContext } from "@/providers/AppProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { reInit } = useAppContext();

  const storeWalletInfo = async (privateKey, accountAddress) => {
    try {
      await AsyncStorage.setItem("privateKey", privateKey);
      await AsyncStorage.setItem("accountAddress", accountAddress);
    } catch (e) {
      console.log("failed to store wallet ", e);
    }
  };

  async function login() {
    const encryptedKey = await AsyncStorage.getItem("user");
    if (!encryptedKey) {
      alert("no account found");
      return;
    }

    setIsLoading(true);

    const user = JSON.parse(encryptedKey);
    console.log(user);

    const response = await fetch("https://relayer-xsew.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user,
        email,
        password,
      }),
    });

    const data = await response.json();
    // console.log(data);
    if (data.message == "invalid_pass") {
      setPasswordError("invalid password");
      setIsLoading(false);
    } else if (data.message == "account_not_found") {
      setEmailError("email not found, recover?");
      setIsLoading(false);
    } else {
      await storeWalletInfo(
        data?.loggedInUser?.privateKey,
        data?.loggedInUser?.accountAddress
      );
      setIsLoading(false);
      await reInit();
      router.push("/");
    }
    if (!response.ok) throw new Error(data.error || "something happened");
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    let valid = true;
    setEmailError("");
    setPasswordError("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email.");
      valid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }

    if (valid) {
      // Replace with real API call
      login();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />

      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/ST4.png")}
          style={{ width: 100, height: 100 }}
        />

        <Text style={styles.appName}>starkzuri</Text>
        <Text style={styles.tagline}>Join the Creator Economy</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="#6b7280"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#6b7280"
            placeholder="Enter your password"
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        {
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            {/* <Text style={styles.loginButtonText}>Login</Text> */}
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        }

        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.signupText}>
            Don't have an account?{" "}
            <Text style={styles.signupTextHighlight}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: "#1f87fc",
    fontWeight: "500",
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 13,
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f0f6fc",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8b949e",
    textAlign: "center",
    marginBottom: 48,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f0f6fc",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#21262d",
    borderWidth: 1,
    borderColor: "#30363d",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#f0f6fc",
  },
  loginButton: {
    backgroundColor: "#1f87fc",
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: "#1f87fc",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  signupLink: {
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "#8b949e",
  },
  signupTextHighlight: {
    color: "#1f87fc",
    fontWeight: "600",
  },
});
