import { CONTRACT_ADDRESS } from "@/providers/abi";
import { useAppContext } from "@/providers/AppProvider";
import { multilineToSingleline, weiToEth } from "@/utils/AppUtils";
import { uploadFile } from "@/utils/Infura";
import MiniFunctions from "@/utils/MiniFunctions";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Send,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import ConfirmPostModal from "./PostConfirmationModal";

type SelectedFile = {
  uri: string;
  name: string;
  type: string;
};

const CreatePostComponent = ({ onCreatePost, userAddress, onClose }) => {
  const { account, isReady, contract } = useAppContext();
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const router = useRouter();

  const user = MiniFunctions(account?.address?.toString());

  const MAX_CONTENT_LENGTH = 280;

  const handleImagePicker = () => {
    // Mock image picker - in real app, use react-native-image-picker
    Alert.alert("Select Image", "Choose an option", [
      { text: "Camera", onPress: () => selectImage("camera") },
      { text: "Gallery", onPress: () => selectImage("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const estimateGasFees = async () => {
    console.log("estimating");
    if (!account || !isReady || !contract) return;
    const formattedContent = multilineToSingleline(postContent.trim());

    // const { suggestedMaxFee, unit } = await account.estimateInvokeFee({
    //   contractAddress: CONTRACT_ADDRESS,
    //   entrypoint: "create_post",
    //   calldata: CallData.compile([formattedContent, selectedImages.join(" ")]),
    // });
    // console.log("estimation done");
    // console.log("estimatedFee", suggestedMaxFee);
    // console.log("unit ", unit);
    // // setEstimatedFee(suggestedMaxFee.toString());

    try {
      const formattedContent = multilineToSingleline(postContent.trim());

      // console.log("Compiled calldata:", calldata);
      const myCall = contract.populate("create_post", [
        formattedContent,
        selectedImages.join(" "),
      ]);
      const { suggestedMaxFee, unit } = await account.estimateInvokeFee({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: "create_post",
        calldata: myCall.calldata,
      });

      const feeToEth = weiToEth(suggestedMaxFee, 8);

      console.log("estimation done");
      console.log("estimatedFee", suggestedMaxFee.toString());
      console.log("unit ", unit.toString());
      setEstimatedFee(feeToEth);
      setPlatformFee("0.00");
    } catch (err) {
      console.error("🔥 Estimation failed:", err);
      if (err.toString().includes("ASCII")) {
        Toast.hide();
        Toast.show({
          type: "error",
          text1: "Prediction Failure",
          text2: err?.toString(),
        });
      }
    }
  };

  const selectImage = async (source: "camera" | "gallery") => {
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "You need to allow access");
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
            allowsMultipleSelection: true,
          });

    if (!result.canceled && result.assets.length > 0) {
      const files = result.assets.map((asset) => {
        const extension = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;
        Toast.show({
          type: "info",
          text1: "uploading Media...",
          position: "top",
          autoHide: false,
        });
        setIsLoading(true);
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
      console.log("Uploaded IPFS URLs:", uploadedUrls);

      setSelectedImages(uploadedUrls);
      setIsLoading(false);
      Toast.hide(); // now state holds clean IPFS links
    }
  };

  // console.log(selectedImages);

  const removeImage = (uriToRemove: string) => {
    setSelectedImages((prev) => prev.filter((uri) => uri !== uriToRemove));
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert("Error", "Please enter some content for your post");
      return;
    }
    await estimateGasFees();
    setIsModalVisible(true);

    // setIsLoading(true);
  };

  // Toast.show({
  //   type: "info",
  //   text1: "Processing Transaction...",
  //   position: "top",
  //   autoHide: false,
  // });

  const confirmTransactionAndPost = async () => {
    if (!isReady || !account || !contract) return;
    Toast.show({
      type: "info",
      text1: "Processing Transaction...",
      position: "top",
      autoHide: false,
    });

    try {
      // const newPost = {
      //   content: postContent.trim(),
      //   image: selectedImage,
      //   timestamp: Date.now(),
      // };

      const formattedContent = multilineToSingleline(postContent.trim());

      // Call the parent component's create post function
      // await onCreatePost(newPost);

      const myCall = contract.populate("create_post", [
        formattedContent,
        selectedImages.join(" "),
      ]);

      const res = await account.execute(myCall);
      console.log("post made", res.transaction_hash);

      // Reset form
      setPostContent("");
      setSelectedImages([]);

      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Post Created!",
        text2: "Your content is now livre 🎉",
      });

      // Alert.alert("Success", "Your post has been created!");
    } catch (error) {
      console.log("TX failed ", error);
      if (error.toString().includes("ASCII")) {
        Toast.hide();
        Toast.show({
          type: "error",
          text1: "Post Failed",
          text2: error?.toString(),
        });
      }
    } finally {
      setIsLoading(false);
      setIsModalVisible(false);
    }
  };

  const getShortAddress = (address) => {
    if (!address) return "Anonymous";
    const addr = address.toString();
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const remainingChars = MAX_CONTENT_LENGTH - postContent.length;
  const isOverLimit = remainingChars < 0;
  const canPost = postContent.trim().length > 0 && !isOverLimit && !isLoading;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <ArrowLeft size={24} color="#d1d5db" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Post</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable onPress={() => router.push("/profile")}>
                <Image
                  source={{
                    uri:
                      user.profile_pic ||
                      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
                  }}
                  style={styles.avatar}
                />
              </Pressable>
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="What's happening on StarkZuri?"
              placeholderTextColor="#666666"
              multiline
              value={postContent}
              onChangeText={setPostContent}
              maxLength={MAX_CONTENT_LENGTH + 50} // Allow slight overflow for warning
            />

            {/* Character Counter */}
            <View style={styles.characterCounter}>
              <Text
                style={[
                  styles.counterText,
                  isOverLimit && styles.overLimitText,
                  remainingChars <= 20 &&
                    remainingChars >= 0 &&
                    styles.warningText,
                ]}
              >
                {remainingChars}
              </Text>
            </View>
          </View>

          {/* Selected Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageContainer}>
            {selectedImages &&
              selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(uri)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <View style={styles.mediaButtons}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleImagePicker}
              >
                <ImageIcon size={20} color="#1f87fc" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleImagePicker}
              >
                <Camera size={20} color="#1f87fc" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.postButton, canPost && styles.postButtonActive]}
              onPress={handleCreatePost}
              disabled={!canPost}
            >
              {isLoading ? (
                <Text style={styles.postButtonText}>Posting...</Text>
              ) : (
                <>
                  <Send size={16} color={canPost ? "#FFFFFF" : "#666666"} />
                  <Text
                    style={[
                      styles.postButtonText,
                      canPost && styles.postButtonTextActive,
                    ]}
                  >
                    Post
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {/* <Button title="Test Toast" onPress={handleToast} /> */}
          <Toast />

          <ConfirmPostModal
            visible={isModalVisible}
            onConfirm={confirmTransactionAndPost}
            onCancel={() => setIsModalVisible(false)}
            message=""
            gasFee={estimatedFee}
            platformFee={platformFee}
          />

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Maximize your Zuri Points:</Text>
            <Text style={styles.tipText}>
              • Post engaging content that sparks conversations
            </Text>
            <Text style={styles.tipText}>
              • Add images to increase visibility
            </Text>
            <Text style={styles.tipText}>
              • Engage with your audience in comments
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
  },
  imageWrapper: {
    position: "relative",
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "red",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1f87fc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(31, 135, 252, 0.3)",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  rewardInfoContainer: {
    marginBottom: 20,
  },
  rewardInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 135, 252, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31, 135, 252, 0.3)",
  },
  rewardText: {
    color: "#1f87fc",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333333",
    position: "relative",
  },
  textInput: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: "top",
  },
  characterCounter: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: "#8B8B8B",
    fontSize: 12,
    fontWeight: "500",
  },
  warningText: {
    color: "#ffa500",
  },
  overLimitText: {
    color: "#ff4757",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 15,
    padding: 6,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(31, 135, 252, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(31, 135, 252, 0.3)",
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  postButtonActive: {
    backgroundColor: "#1f87fc",
  },
  postButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "600",
  },
  postButtonTextActive: {
    color: "#FFFFFF",
  },
  tipsContainer: {
    backgroundColor: "#1A1A1A",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  tipsTitle: {
    color: "#1f87fc",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipText: {
    color: "#8B8B8B",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});

export default CreatePostComponent;
