import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function RecoverAccount() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const text = await response.text();

      setFileContent(text);
      setFileName(result.assets[0].name);
      Alert.alert("Success", "Backup loaded successfully.");
    } catch (err) {
      console.error("Failed to load file", err);
      Alert.alert("Error", "Failed to load file.");
    }
  };

  const handleRecovery = async () => {
    if (!fileContent || !password) {
      Alert.alert(
        "Missing Information",
        "Please upload a backup and enter your password."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://relayer-xsew.onrender.com/recover",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encryptedBackup: fileContent,
            password: password,
            email: email,
          }),
        }
      );

      const data = await response.json();
      //   console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Recovery failed");
      }

      // Save recovered user session
      await AsyncStorage.setItem("user", JSON.stringify(data.userData));
      Alert.alert("Success", "Account recovery successful!");

      // TODO: Navigate to homepage
      router.push("/login");
    } catch (err: any) {
      console.error("Recovery error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔐</Text>
            </View>
            <Text style={styles.title}>Recover Your Account</Text>
            <Text style={styles.subtitle}>
              Upload your encrypted backup and enter your credentials to restore
              your StarkZuri account
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* File Upload */}
            <TouchableOpacity
              style={[
                styles.uploadButton,
                fileContent && styles.uploadButtonSuccess,
              ]}
              onPress={handleFileUpload}
              activeOpacity={0.8}
            >
              <View style={styles.uploadContent}>
                <Text style={styles.uploadIcon}>📁</Text>
                <View style={styles.uploadTextContainer}>
                  <Text style={styles.uploadButtonText}>
                    {fileName ? "✓ Backup Loaded" : "Upload Encrypted Backup"}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    {fileName || "Select your .json backup file"}
                  </Text>
                </View>
                {fileContent && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Recovery Button */}
            <TouchableOpacity
              style={[
                styles.recoveryButton,
                (!fileContent || !password) && styles.recoveryButtonDisabled,
              ]}
              onPress={handleRecovery}
              disabled={loading || !fileContent || !password}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.recoveryButtonText}>Recover Account</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.signupText}>
                Don't have an account backed?{" "}
                <Text style={styles.signupTextHighlight}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Make sure you have the correct backup file and password before
              proceeding
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#0a0a0a",
  },
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(31, 135, 252, 0.1)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(31, 135, 252, 0.2)",
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
  },
  uploadButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
  },
  uploadButtonSuccess: {
    backgroundColor: "rgba(31, 135, 252, 0.1)",
    borderColor: "#1f87fc",
    borderStyle: "solid",
  },
  uploadContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  uploadSubtext: {
    color: "#888",
    fontSize: 14,
  },
  checkmark: {
    color: "#1f87fc",
    fontSize: 20,
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    color: "#ffffff",
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  recoveryButton: {
    backgroundColor: "#1f87fc",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#1f87fc",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recoveryButtonDisabled: {
    backgroundColor: "#333",
    shadowOpacity: 0,
    elevation: 0,
  },
  recoveryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
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
