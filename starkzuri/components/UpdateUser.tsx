import { CONTRACT_ADDRESS } from "@/providers/abi";
import { useAppContext } from "@/providers/AppProvider";
import { weiToEth } from "@/utils/AppUtils";
import { uploadFile } from "@/utils/Infura";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ConfirmPostModal from "./PostConfirmationModal";

const { width } = Dimensions.get("window");

type SelectedFile = {
  uri: string;
  name: string;
  type: string;
};

const ProfileUpdateComponent = ({ onClose }) => {
  const { account, isReady, contract } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState("0.00");
  const [platformFee, setPlatformFee] = useState("0.00");
  const [isModalVisible, setIsModalVisible] = useState(false);

  // const router = useRouter();

  // console.log(account);

  const [profileData, setProfileData] = useState({
    profilePicture: "",
    coverPhoto: "",
    name: "",
    username: "",
    about: "",
    referred_by: "",
  });

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagePicker = (type) => {
    // Mock Image picker in real app
    Alert.alert("Select Image", "choose an option", [
      { text: "Camera", onPress: () => selectImage("camera", type) },
      { text: "gallery", onPress: () => selectImage("gallery", type) },
    ]);
  };

  const selectImage = async (source: "camera" | "gallery", type) => {
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "you need to allow access");
      return;
    }

    const uploadedUrls: string[] = [];

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });

    if (!result.canceled && result.assets.length > 0) {
      const files = result.assets.map((asset) => {
        const extension = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;

        return {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.${extension}`,
          type: mimeType,
        };
      });

      for (const file of files) {
        const url: any = await uploadFile(file);
        console.log(url); // expects IPFS URL returned
        uploadedUrls.push(url);
      }

      setProfileData((prev) => ({
        ...prev,
        [type === "profile" ? "profilePicture" : "coverPhoto"]: uploadedUrls[0],
      }));
    }
  };

  const handleImageUpload = (type) => {
    // In a real app, this would open ImagePicker
    // const mockImage =
    //   type === "profile"
    //     ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=face"
    //     : "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=400&fit=crop";

    handleImagePicker(type);
  };

  const verifyHandleSave = async () => {
    if (!profileData.name || !profileData.username) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    await estimateSaveAccountFees();
    setIsModalVisible(true);
  };

  const estimateSaveAccountFees = async () => {
    if (!account || !isReady || !contract) return;

    try {
      const myCall = contract.populate("add_user", [
        profileData.name,
        profileData.username,
        profileData.about,
        profileData.profilePicture,
        profileData.coverPhoto,
        profileData.referred_by || 0,
      ]);

      const { suggestedMaxFee, unit } = await account.estimateInvokeFee({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: "add_user",
        calldata: myCall.calldata,
      });

      const feeToEth = weiToEth(suggestedMaxFee, 8);
      setEstimatedFee(feeToEth);
      setPlatformFee("0.00");
    } catch (err) {
      console.error("Estimation Failed: ", err);
      setIsModalVisible(false);

      Toast.show({
        type: "error",
        text1: "Failure Predicted",
        text2: "Please try again later 😢",
      });
    }
  };

  const handleSave = async () => {
    if (!profileData.name || !profileData.username) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!isReady || !account) return;
    // console.log(account);
    // console.log(profileData);

    Toast.show({
      type: "info",
      text1: "Creating Account...",
      position: "top",
      autoHide: false,
    });

    const myCall = contract.populate("add_user", [
      profileData.name,
      profileData.username,
      profileData.about,
      profileData.profilePicture,
      profileData.coverPhoto,
      profileData.referred_by || 0,
    ]);

    try {
      const res = await account.execute(myCall);
      console.log("account added", res.transaction_hash);
      // Alert.alert("Success", "Profile updated successfully! 🎉");
      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Account Created!",
        text2: "Your Profile is now visible 🎉",
      });
    } catch (err) {
      console.error("TX failed: ", err);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "Account Creation Failed",
        text2: "Please try again later 😢",
      });
    } finally {
      setIsLoading(false);
      setIsModalVisible(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Update Profile</Text>
        <Pressable onPress={onClose}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>X</Text>
          </View>
        </Pressable>
      </View>

      {/* Cover Photo Section */}
      <View style={styles.coverSection}>
        <TouchableOpacity
          style={[
            styles.coverPhoto,
            !profileData.coverPhoto && styles.coverPhotoPlaceholder,
          ]}
          onPress={() => handleImageUpload("cover")}
          activeOpacity={0.8}
        >
          {profileData.coverPhoto ? (
            <Image
              source={{ uri: profileData.coverPhoto }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.placeholderText}>Add Cover Photo</Text>
            </View>
          )}
          <View style={styles.coverOverlay}>
            <Text style={styles.overlayText}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Picture */}
        <TouchableOpacity
          style={styles.profilePictureContainer}
          onPress={() => handleImageUpload("profile")}
          activeOpacity={0.8}
        >
          {profileData.profilePicture ? (
            <Image
              source={{ uri: profileData.profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profilePlaceholderIcon}>👤</Text>
            </View>
          )}
          <View style={styles.profileOverlay}>
            <Text style={styles.profileOverlayIcon}>📷</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Name Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputIcon}>👤</Text>
            <Text style={styles.labelText}>Full Name *</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={profileData.name}
            onChangeText={(text) => handleInputChange("name", text)}
            placeholder="Enter your full name"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Username Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputIcon}>@</Text>
            <Text style={styles.labelText}>Username *</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={profileData.username}
            onChangeText={(text) =>
              handleInputChange(
                "username",
                text.toLowerCase().replace(/[^a-z0-9_]/g, "")
              )
            }
            placeholder="Choose a unique username"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
          />
        </View>

        {/* About Field */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputIcon}>📝</Text>
            <Text style={styles.labelText}>About</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={profileData.about}
            onChangeText={(text) => handleInputChange("about", text)}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {profileData.about.length}/150
          </Text>
        </View>

        {/* referred by */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabel}>
            <Text style={styles.inputIcon}>&</Text>
            <Text style={styles.labelText}>Referred by</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={profileData.referred_by}
            onChangeText={(text) =>
              handleInputChange(
                "referred_by",
                text.toLowerCase().replace(/[^a-z0-9_]/g, "")
              )
            }
            placeholder="enter referral code"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={verifyHandleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Update Profile</Text>
          <Text style={styles.saveButtonIcon}>✨</Text>
        </TouchableOpacity>

        <Toast />
        <ConfirmPostModal
          visible={isModalVisible}
          onConfirm={handleSave}
          onCancel={() => setIsModalVisible(false)}
          message=""
          gasFee={estimatedFee}
          platformFee={platformFee}
        />

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewContent}>
            <View style={styles.previewAvatar}>
              {profileData.profilePicture ? (
                <Image
                  source={{ uri: profileData.profilePicture }}
                  style={styles.previewAvatarImage}
                />
              ) : (
                <Text style={styles.previewAvatarPlaceholder}>👤</Text>
              )}
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>
                {profileData.name || "Your Name"}
              </Text>
              <Text style={styles.previewUsername}>
                @{profileData.username || "username"}
              </Text>
              {profileData.about && (
                <Text style={styles.previewAbout}>{profileData.about}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1f87fc",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconText: {
    fontSize: 18,
    color: "white",
  },
  coverSection: {
    position: "relative",
    marginHorizontal: 20,
    marginBottom: 60,
  },
  coverPhoto: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  coverPhotoPlaceholder: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#374151",
    borderStyle: "dashed",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "500",
  },
  coverOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    fontSize: 16,
  },
  profilePictureContainer: {
    position: "absolute",
    bottom: -40,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#111827",
  },
  profilePicture: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },
  profilePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  profilePlaceholderIcon: {
    fontSize: 32,
  },
  profileOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1f87fc",
    justifyContent: "center",
    alignItems: "center",
  },
  profileOverlayIcon: {
    fontSize: 12,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  textInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#374151",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  characterCount: {
    textAlign: "right",
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#1f87fc",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  saveButtonIcon: {
    fontSize: 18,
  },
  previewCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#374151",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  previewAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  previewAvatarPlaceholder: {
    fontSize: 20,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  previewUsername: {
    fontSize: 14,
    color: "#1f87fc",
    marginBottom: 4,
  },
  previewAbout: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 16,
  },
});

export default ProfileUpdateComponent;
