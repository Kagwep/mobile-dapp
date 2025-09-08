import { useAppContext } from "@/providers/AppProvider";
import { CONTRACT_ADDRESS } from "@/providers/abi";
import { weiToEth } from "@/utils/AppUtils";
import { provider } from "@/utils/constants";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import ConfirmPostModal from "./PostConfirmationModal";

const RedemptionModal = ({
  showRedeemModal,
  setShowRedeemModal,
  totalPoints,
  fetchReferralPoints,
}) => {
  const [formData, setFormData] = useState({
    amount: "",
    modeOfPayment: "",
    paymentAddress: "",
    contactType: "",
    contact: "",
  });

  const { account, isReady, contract } = useAppContext();
  const [estimateFee, setEstimateFee] = useState("0");
  const [platformFee, setPlatformFee] = useState("0");
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);

  const paymentModes = [
    { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
    { id: "mobile_money", label: "Mobile Money", icon: "📱" },
    { id: "crypto", label: "Cryptocurrency", icon: "₿" },
    { id: "paypal", label: "PayPal", icon: "💳" },
  ];

  const contactTypes = [
    { id: "email", label: "Email", icon: "📧" },
    { id: "phone", label: "Phone", icon: "📞" },
    { id: "telegram", label: "Telegram", icon: "💬" },
    { id: "whatsapp", label: "WhatsApp", icon: "📲" },
  ];

  const estimateRedemptionFees = useCallback(async () => {
    if (!account || !isReady || !contract) return;
    setRedeemModalVisible(true);
    // if (formData.amount && )

    try {
      const myCall = contract.populate("create_redemption", [
        formData.amount,
        formData.modeOfPayment,
        formData.paymentAddress,
        formData.contactType,
        formData.contact,
      ]);
      console.log(myCall);
      console.log(formData);
      const { suggestedMaxFee } = await account.estimateInvokeFee({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: "create_redemption",
        calldata: myCall.calldata,
      });

      setEstimateFee(weiToEth(suggestedMaxFee, 8));
      setPlatformFee("0.00");

      // setSelectedPostId(postId);
    } catch (err) {
      console.error("Claim fee estimation failed:", err);

      // console.log(typeof err);
      Toast.show({
        type: "error",
        text1: "Fee Estimation Failed",
        text2: "Please try again",
      });
    }
  }, [account, isReady, contract]);

  const redeemReferralPoints = async () => {
    if (!account || !isReady || !contract) return;
    Toast.show({
      type: "info",
      text1: "Processing Transaction...",
      position: "top",
      autoHide: false,
    });

    try {
      const myCall = contract.populate("create_redemption", [
        formData.amount,
        formData.modeOfPayment,
        formData.paymentAddress,
        formData.contactType,
        formData.contact,
      ]);

      const res = await account.execute(myCall);
      console.log("Points claimed", res.transaction_hash);
      Toast.hide();
      Toast.show({
        type: "success",
        text1: "withdrawal successful",
        text2: "wait for confirmation 🎉",
      });
      setRedeemModalVisible(false);
      // Reset form
      setFormData({
        amount: "",
        modeOfPayment: "",
        paymentAddress: "",
        contactType: "",
        contact: "",
      });
      await provider.waitForTransaction(res.transaction_hash);

      fetchReferralPoints();
      setShowRedeemModal(false);

      // setSelectedPostId(postId);
    } catch (err) {
      console.error("Claim fee estimation failed:", err);
      console.log(err);
      Toast.show({
        type: "error",
        text1: "Fee Estimation Failed",
        text2: "Please try again",
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.amount ||
      !formData.modeOfPayment ||
      !formData.paymentAddress ||
      !formData.contactType ||
      !formData.contact
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0 || amount > totalPoints) {
      Alert.alert(
        "Error",
        "Please enter a valid amount within your available points"
      );
      return;
    }

    try {
      // Call your contract function here
      // await create_redemption(
      //   BigInt(amount), // Convert to u256
      //   formData.modeOfPayment, // felt252
      //   formData.paymentAddress, // felt252
      //   formData.contactType, // felt252
      //   formData.contact // felt252
      // );

      console.log(formData);
      await estimateRedemptionFees();

      // Alert.alert("Success", "Redemption request submitted successfully!");
      // setShowRedeemModal(false);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to submit redemption request. Please try again."
      );
      console.error("Redemption error:", error);
    }
  };

  const isFormValid =
    formData.amount &&
    formData.modeOfPayment &&
    formData.paymentAddress &&
    formData.contactType &&
    formData.contact;

  return (
    <Modal visible={showRedeemModal} transparent={true} animationType="fade">
      <BlurView style={styles.modalOverlay} blurType="dark" blurAmount={15}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowRedeemModal(false)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.giftIconContainer}>
                <Text style={styles.giftIcon}>🎁</Text>
              </View>
              <Text style={styles.modalTitle}>Redeem Points</Text>
              <Text style={styles.modalSubtitle}>
                Available: {totalPoints} points
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount to Redeem</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Enter amount (max ${totalPoints})`}
                  placeholderTextColor="#666"
                  value={formData.amount}
                  onChangeText={(text) =>
                    setFormData({ ...formData, amount: text })
                  }
                  keyboardType="numeric"
                />
              </View>

              {/* Payment Mode Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.optionsGrid}>
                  {paymentModes.map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.optionCard,
                        formData.modeOfPayment === mode.id &&
                          styles.selectedOption,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, modeOfPayment: mode.id })
                      }
                    >
                      <Text style={styles.optionIcon}>{mode.icon}</Text>
                      <Text
                        style={[
                          styles.optionLabel,
                          formData.modeOfPayment === mode.id &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter payment address/account"
                  placeholderTextColor="#666"
                  value={formData.paymentAddress}
                  onChangeText={(text) =>
                    setFormData({ ...formData, paymentAddress: text })
                  }
                />
              </View>

              {/* Contact Type Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Contact Method</Text>
                <View style={styles.optionsGrid}>
                  {contactTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.optionCard,
                        formData.contactType === type.id &&
                          styles.selectedOption,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, contactType: type.id })
                      }
                    >
                      <Text style={styles.optionIcon}>{type.icon}</Text>
                      <Text
                        style={[
                          styles.optionLabel,
                          formData.contactType === type.id &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Information</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your contact details"
                  placeholderTextColor="#666"
                  value={formData.contact}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contact: text })
                  }
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRedeemModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.redeemButton,
                  !isFormValid && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid}
              >
                <LinearGradient
                  colors={
                    isFormValid ? ["#1f78fc", "#4c9cff"] : ["#444", "#333"]
                  }
                  style={styles.redeemButtonGradient}
                >
                  <Text style={styles.redeemButtonText}>Submit Redemption</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <ConfirmPostModal
              gasFee={estimateFee}
              platformFee={platformFee}
              message=""
              onCancel={() => setRedeemModalVisible(false)}
              onConfirm={redeemReferralPoints}
              visible={redeemModalVisible}
            />
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.8)",
  },

  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    margin: 20,
    maxHeight: "90%",
    width: "90%",
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },

  modalHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    position: "relative",
  },

  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1,
  },

  backButtonText: {
    color: "#1f78fc",
    fontSize: 16,
    fontWeight: "600",
  },

  giftIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#1f78fc",
  },

  giftIcon: {
    fontSize: 28,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },

  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  inputGroup: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },

  textInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#404040",
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  optionCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: "45%",
    flex: 1,
    borderWidth: 1,
    borderColor: "#404040",
  },

  selectedOption: {
    backgroundColor: "rgba(31, 120, 252, 0.1)",
    borderColor: "#1f78fc",
    borderWidth: 2,
  },

  optionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },

  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ccc",
    textAlign: "center",
  },

  selectedOptionText: {
    color: "#1f78fc",
    fontWeight: "600",
  },

  modalActions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 10,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#404040",
  },

  cancelButtonText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "600",
  },

  redeemButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },

  redeemButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
  },

  redeemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.5,
  },
});

export default RedemptionModal;
