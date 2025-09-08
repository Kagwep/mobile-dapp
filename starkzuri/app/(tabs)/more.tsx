import ConfirmPostModal from "@/components/PostConfirmationModal";
import { CONTRACT_ADDRESS } from "@/providers/abi";
import { useAppContext } from "@/providers/AppProvider";
import { getEthBalance, weiToEth } from "@/utils/AppUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Icon components (you can replace these with react-native-vector-icons)
const IconWrapper = ({ children, color, size = 24 }) => (
  <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
    <Text style={[styles.iconText, { color, fontSize: size }]}>{children}</Text>
  </View>
);

const StarkZuriMoreTab = () => {
  const [recentReward, setRecentReward] = useState(null);
  const { account, address, contract, isReady } = useAppContext();
  const router = useRouter();
  const [ethbalance, setEthBalance] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Wallet modal states
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("withdraw"); // 'withdraw' or 'transfer'
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // estimate and platform fee
  const [estimateFee, setEstimateFee] = useState("0.00");
  const [platformFee, setPlatformFee] = useState("0.00");

  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rewardAnimation = useRef(new Animated.Value(0)).current;
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    if (!contract || !address) return;
    try {
      const userAddress = address;
      const myCall = await contract.populate("view_user", [userAddress]);

      const res = await contract["view_user"](myCall.calldata, {
        parseResponse: false,
        parseRequest: false,
      });

      const val = res;

      setUser(val);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const getGasBalance = async () => {
    const gasbalance = await getEthBalance(address);
    setEthBalance(weiToEth(gasbalance));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await getGasBalance();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      getGasBalance();

      return () => {
        // Optional cleanup if needed
      };
    }, [contract, account])
  );

  // Animate glow effect
  useEffect(() => {
    const glowSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowSequence.start();

    return () => glowSequence.stop();
  }, []);

  const menuItems = [
    {
      icon: "※",
      title: "Referrals",
      subtitle: "Refer and earn",
      color: "#07f900",
    },
    {
      icon: "❓",
      title: "Join Telegram",
      subtitle: "Join our telegram",
      color: "#10b981",
    },
    {
      icon: "📄",
      title: "Explore",
      subtitle: "Explore Zuri",
      color: "#f59e0b",
    },
    {
      icon: "✖️",
      title: "Follow us on X",
      subtitle: "follow us on X",
      color: "#ef4444",
    },
    {
      icon: "👾",
      title: "Join Discord",
      subtitle: "Join our Discord Community",
      color: "#06b6d4",
    },
    {
      icon: "🚪↩️",
      title: "Log Out",
      subtitle: "Log out of stark zuri",
      color: "#ef4444",
    },
  ];

  const handleWithdraw = () => {
    setWalletModalVisible(true);
    setActiveTab("withdraw");
  };

  const estimateWithdrawFees = useCallback(async () => {
    console.log(withdrawAmount);
    if (!account || !isReady || !contract) return;
    Toast.show({
      type: "info",
      text1: "Processing Transaction...",
      position: "top",
      autoHide: false,
    });

    try {
      const myCall = contract.populate("withdraw_zuri_points", [
        withdrawAmount,
      ]);
      const POST_CONTRACT = CONTRACT_ADDRESS;

      const calls = {
        contractAddress: POST_CONTRACT,
        entrypoint: "withdraw_zuri_points",
        calldata: myCall.calldata,
      };
      const { suggestedMaxFee } = await account.estimateInvokeFee(calls);

      setEstimateFee(weiToEth(suggestedMaxFee, 8));

      setWithdrawModalOpen(true);
    } catch (error) {
      console.error("Fee estimation error:", error);
      Toast.show({
        type: "error",
        text1: "Fee Estimation Failed",
        text2: "Please try again",
      });
    }
  }, [account, isReady, contract]);

  const withdrawzuri = async () => {
    if (!account || !isReady || !contract) return;

    try {
      const myCall = contract.populate("withdraw_zuri_points", [
        withdrawAmount,
      ]);
      const POST_CONTRACT = CONTRACT_ADDRESS;

      const res = await account.execute(myCall);
      console.log("Points claimed", res.transaction_hash);
      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Withdrawal successful",
        text2: "zuri has been withdrawn successfuly to your wallet 🎉",
      });
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
      fetchUser();
    } catch (e) {
      console.error("Claim transaction failed:", e);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "withdrawal Failed",
        text2: "Please try again later 😢",
      });
    }
  };

  const handleWithdrawZuri = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid withdrawal amount");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > user?.zuri_points) {
      Alert.alert("Error", "Insufficient ZURI balance");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate withdrawal process
      // await new Promise((resolve) => setTimeout(resolve, 2000));

      estimateWithdrawFees();
    } catch (error) {
      Alert.alert("Error", "Withdrawal failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferEth = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid transfer amount");
      return;
    }

    if (!recipientAddress || recipientAddress.length < 10) {
      Alert.alert("Error", "Please enter a valid recipient address");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount > parseFloat(ethbalance)) {
      Alert.alert("Error", "Insufficient ETH balance");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate transfer process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "Success",
        `${amount} ETH will be sent to ${recipientAddress}`,
        [
          {
            text: "OK",
            onPress: () => {
              setTransferAmount("");
              setRecipientAddress("");
              setWalletModalVisible(false);
              // Refresh balance
              getGasBalance();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Transfer failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogOut = async () => {
    console.log("logging out");
    await AsyncStorage.multiRemove(["privateKey", "accountAddress"]);
    return router.replace("/login");
  };

  const handleReportBug = () => {};

  const handleFollowTwitter = () => {
    Linking.openURL("https://x.com/starkzuri01");
  };

  const handleJoinDiscord = () => {
    Linking.openURL("https://discord.gg/mcRse4T9x2");
  };

  const handleJoinTelegram = () => {
    Linking.openURL("https://t.me/starkzuri");
  };

  const handleVisitReferrals = () => {
    router.push({ pathname: "/modals/referral" });
  };

  const handleMenuItemPress = (title) => {
    console.log(title);
    switch (title) {
      case "Log Out":
        handleLogOut();
        break;
      case "Report Bug / Feedback":
        handleReportBug();
        break;
      case "Follow us on X":
        handleFollowTwitter();
        break;
      case "Join Discord":
        handleJoinDiscord();
        break;
      case "Join Telegram":
        handleJoinTelegram();
        break;
      case "Referrals":
        handleVisitReferrals();
        break;
    }
  };

  const glowColor = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(31, 135, 252, 0.1)", "rgba(31, 135, 252, 0.3)"],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1f87fc"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
          <Text style={styles.headerSubtitle}>
            Manage your Stark Zuri experience
          </Text>
        </View>

        {/* Wallet Balance Section */}
        <Animated.View
          style={[
            styles.walletContainer,
            { transform: [{ scale: pulseAnimation }] },
          ]}
        >
          <Animated.View
            style={[styles.walletCard, { shadowColor: glowColor }]}
          >
            {/* Recent Reward Popup */}
            {recentReward && (
              <Animated.View
                style={[
                  styles.rewardPopup,
                  {
                    opacity: rewardAnimation,
                    transform: [
                      {
                        translateY: rewardAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.rewardText}>+{recentReward} $ZURI</Text>
                <Text style={styles.rewardSubtext}>Content reward!</Text>
              </Animated.View>
            )}

            <View style={styles.walletHeader}>
              <IconWrapper color="#1f87fc" size={20}>
                💰
              </IconWrapper>
              <Text style={styles.walletTitle}>Wallet Balance</Text>
            </View>

            <Text style={styles.balanceAmount}>
              {user?.zuri_points?.toLocaleString()} ZURI
            </Text>
            <Text style={styles.balanceUsd}>
              ≈ ${(user?.zuri_points?.toString() * 0.01).toFixed(2)} USD
            </Text>

            <View style={styles.earningsContainer}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>STRK Balance</Text>
                <Text style={styles.earningsAmount}>
                  {ethbalance.toString()} STRK
                </Text>
              </View>
              {/* <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>This Week</Text>
                <Text style={styles.earningsAmount}>
                  {user?.zuri_points?.toLocaleString()} $ZURI
                </Text>
              </View> */}
            </View>

            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={handleWithdraw}
            >
              <Text style={styles.withdrawButtonText}>Manage Wallet</Text>
              <Text style={styles.withdrawIcon}>↗</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <ConfirmPostModal
          gasFee={estimateFee}
          platformFee={platformFee}
          message=""
          onCancel={() => setWithdrawModalOpen(false)}
          onConfirm={withdrawzuri}
          visible={withdrawModalOpen}
        />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item.title)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <IconWrapper color={item.color}>{item.icon}</IconWrapper>
                <View style={styles.menuItemText}>
                  <View style={styles.menuItemTitleRow}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Stark Zuri v1.2.0</Text>
          <Text style={styles.footerSubtext}>Built on Starknet</Text>
        </View>
      </ScrollView>

      {/* Wallet Management Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={walletModalVisible}
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Wallet Management</Text>
                <TouchableOpacity
                  onPress={() => setWalletModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Tab Navigation */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "withdraw" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("withdraw")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "withdraw" && styles.activeTabText,
                    ]}
                  >
                    Withdraw ZURI
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "transfer" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("transfer")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "transfer" && styles.activeTabText,
                    ]}
                  >
                    Transfer STRK
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              {activeTab === "withdraw" ? (
                <View style={styles.tabContent}>
                  <Text style={styles.balanceInfo}>
                    Available: {user?.zuri_points?.toLocaleString()} ZURI
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Withdrawal Amount</Text>
                    <TextInput
                      style={styles.input}
                      value={withdrawAmount}
                      onChangeText={setWithdrawAmount}
                      placeholder="Enter amount"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>

                  <Text style={styles.balanceInfo}>
                    You’ll receive{" "}
                    <Text style={styles.amount}>
                      {(Number(withdrawAmount) * 0.06408).toLocaleString()}
                    </Text>{" "}
                    STRK{" "}
                    <Text style={styles.deduction}>
                      (after 10% fee on Zuri points)
                    </Text>
                  </Text>

                  {/* <View style={styles.quickAmountContainer}>
                    <Text style={styles.quickAmountLabel}>Quick amounts:</Text>
                    <View style={styles.quickAmountButtons}>
                      {[25, 50, 75, 100].map((percentage) => (
                        <TouchableOpacity
                          key={percentage}
                          style={styles.quickAmountButton}
                          onPress={() =>
                            setWithdrawAmount(
                              (
                                ((user?.zuri_points || 0) * percentage) /
                                100
                              ).toString()
                            )
                          }
                        >
                          <Text style={styles.quickAmountButtonText}>
                            {percentage}%
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View> */}

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isProcessing && styles.disabledButton,
                    ]}
                    onPress={handleWithdrawZuri}
                    disabled={isProcessing}
                  >
                    <Text style={styles.actionButtonText}>
                      {isProcessing ? "Processing..." : "Withdraw ZURI"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.tabContent}>
                  <Text style={styles.balanceInfo}>
                    Available: {ethbalance} STRK
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      Transfer Amount (STRK)
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={transferAmount}
                      onChangeText={setTransferAmount}
                      placeholder="Enter STRK amount"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Recipient Address</Text>
                    <TextInput
                      style={[styles.input, styles.addressInput]}
                      value={recipientAddress}
                      onChangeText={setRecipientAddress}
                      placeholder="Enter recipient wallet address"
                      placeholderTextColor="#666"
                      multiline={true}
                      numberOfLines={2}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isProcessing && styles.disabledButton,
                    ]}
                    onPress={handleTransferEth}
                    disabled={isProcessing}
                  >
                    <Text style={styles.actionButtonText}>
                      {isProcessing ? "Processing..." : "Transfer ETH"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
  },
  walletContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  amount: {
    fontWeight: "bold",
    color: "#2ecc71", // green for positive vibes
  },

  deduction: {
    fontSize: 14,
    color: "#e74c3c", // red for emphasis
    fontStyle: "italic",
  },
  walletCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#333333",
    position: "relative",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rewardPopup: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#1f87fc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 10,
  },
  rewardText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  rewardSubtext: {
    color: "#ffffff",
    fontSize: 10,
    opacity: 0.8,
    textAlign: "center",
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
  },
  balanceUsd: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 24,
  },
  earningsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  earningsItem: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f87fc",
  },
  withdrawButton: {
    backgroundColor: "#1f87fc",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  withdrawIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  menuContainer: {
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  badge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000000",
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  chevron: {
    fontSize: 20,
    color: "#666666",
    fontWeight: "300",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#444444",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#333333",
    borderRadius: 12,
    marginBottom: 24,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#1f87fc",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  activeTabText: {
    color: "#ffffff",
  },
  tabContent: {
    flex: 1,
  },
  balanceInfo: {
    fontSize: 16,
    color: "#1f87fc",
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#333333",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#444444",
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  quickAmountContainer: {
    marginBottom: 24,
  },
  quickAmountLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  quickAmountButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAmountButton: {
    backgroundColor: "#333333",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#444444",
  },
  quickAmountButtonText: {
    color: "#1f87fc",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: "#1f87fc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#666666",
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StarkZuriMoreTab;
