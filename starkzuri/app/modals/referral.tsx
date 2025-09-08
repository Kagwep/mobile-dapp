import RedemptionModal from "@/components/RedemptionModal";
import { useAppContext } from "@/providers/AppProvider";
import { bigintToShortStr, timeAgo } from "@/utils/AppUtils";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const StarkzuriReferralPage = () => {
  const { account, address, contract, isReady } = useAppContext();
  const [animatedValue] = useState(new Animated.Value(0));
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [activeTab, setActiveTab] = useState("referrals"); // "referrals" or "history"
  const [userReferralData, setUserReferralData] = useState([]);
  const [accountReferralPoints, setAccountReferralPoints] = useState(0);
  const [redemptionData, setRedemptionData] = useState([]);
  const router = useRouter();

  // Mock referral data with user details
  const referralData = [
    {
      referrer:
        "1714583156901951877536800690053440129085407046313409721831484434974454885466",
      referree:
        "1614182622628886580864489871066182077247564153372875893406859302789139049021",
      referral_points: 50,
      verified: 1,
      rewarded: 0,
      timestamp: 1755646381,
      userData: {
        fullName: "Sarah Chen",
        username: "@sarahc_tech",
        profilePhoto:
          "https://images.unsplash.com/photo-1494790108755-2616b612b2c5?w=150&h=150&fit=crop&crop=face",
        about: "Tech enthusiast & content creator",
        coverPhoto:
          "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=400&h=200&fit=crop",
      },
    },
    {
      referrer:
        "1714583156901951877536800690053440129085407046313409721831484434974454885466",
      referree:
        "2631418649092572357217227996338990046271329234374217069355511565634386940898",
      referral_points: 50,
      verified: 1,
      rewarded: 0,
      timestamp: 1755689315,
      userData: {
        fullName: "Marcus Johnson",
        username: "@marcusj_dev",
        profilePhoto:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        about: "Full-stack developer & blockchain enthusiast",
        coverPhoto:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
      },
    },
    {
      referrer:
        "1714583156901951877536800690053440129085407046313409721831484434974454885466",
      referree:
        "3445344871243298760173083577732969999102731430359036182970404318939124306511",
      referral_points: 50,
      verified: 1,
      rewarded: 0,
      timestamp: 1755691915,
      userData: {
        fullName: "Elena Rodriguez",
        username: "@elena_creates",
        profilePhoto:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        about: "Digital artist & UI/UX designer",
        coverPhoto:
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=200&fit=crop",
      },
    },
    {
      referrer:
        "1714583156901951877536800690053440129085407046313409721831484434974454885466",
      referree:
        "287586836863494967405333659546808691630822445277985438537795412668225644716",
      referral_points: 50,
      verified: 0,
      rewarded: 0,
      timestamp: 1755723336,
      userData: {
        fullName: "Alex Kim",
        username: "@alexkim_crypto",
        profilePhoto:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        about: "Crypto trader & financial analyst",
        coverPhoto:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop",
      },
    },
  ];

  // Mock redemption history data
  const redemptionHistory = [
    {
      redemption_id: "123456789",
      account_id:
        "1714583156901951877536800690053440129085407046313409721831484434974454885466",
      redemption_status: 2, // paid
      redemption_amount: 100,
      mode_of_payment: "mpesa",
      payment_address: "+254712345678",
      contact_type: "whatsapp",
      contact_value: "+254712345678",
      timestamp: 1755646381,
    },
    {
      redemption_id: "987654321",
      account_id:
        "1714583156901951877536800690053440129085407046313409721831484434974454885466",
      redemption_status: 1, // approved
      redemption_amount: 50,
      mode_of_payment: "crypto",
      payment_address: "0x742d35Cc6634C0532925a3b8D19389C",
      contact_type: "email",
      contact_value: "user@example.com",
      timestamp: 1755689315,
    },
    {
      redemption_id: "456789123",
      account_id:
        "1714583156901951877536800690053440129085407046313409721831484434974454885466",
      redemption_status: 0, // pending
      redemption_amount: 75,
      mode_of_payment: "bank",
      payment_address: "1234567890",
      contact_type: "telegram",
      contact_value: "@username",
      timestamp: 1755691915,
    },
  ];

  const verifiedReferrals = referralData.filter(
    (ref) => ref.verified === 1
  ).length;

  // fetch redemptionHistory
  const fetchRedemptionHistory = async () => {
    if (!contract && !address) return;
    try {
      const userAddress = address;
      console.log(userAddress);
      const myCall = await contract.populate("view_redemptions_paginated", [
        userAddress,
        "0",
      ]);
      console.log(myCall);
      const res = await contract["view_redemptions_paginated"](
        myCall.calldata,
        {
          parseRequest: false,
          parseResponse: false,
        }
      );
      console.log(userAddress);
      const val = res.reverse();
      // setUserReferralData(val);
      setRedemptionData(val);
      console.log(val);
    } catch (err) {
      console.error("Error fetching user", err);
    }
  };

  // now were gonna create a function to fetch the referrals
  const fetchReferrals = async () => {
    if (!contract && !address) return;
    try {
      const userAddress = address;
      const myCall = await contract.populate("get_referees_paginated", [
        userAddress,
        "0",
      ]);
      const res = await contract["get_referees_paginated"](myCall.calldata, {
        parseRequest: false,
        parseResponse: false,
      });
      console.log(userAddress);
      const val = res.reverse();
      setUserReferralData(val);
      console.log(val);
    } catch (err) {
      console.error("Error fetching user", err);
    }
  };

  const fetchReferralPoints = async () => {
    if (!contract && !address) return;
    try {
      const userAddress = address;
      const myCall = await contract.populate("view_referrer_points", [
        userAddress,
      ]);
      const res = await contract["view_referrer_points"](myCall.calldata, {
        parseRequest: false,
        parseResponse: false,
      });
      console.log(userAddress);
      const val = res;
      setAccountReferralPoints(val);
      console.log(val);
    } catch (err) {
      console.error("Error fetching user", err);
    }
  };

  // useEffect(() => {
  //   // Animate entry
  //   Animated.timing(animatedValue, {
  //     toValue: 1,
  //     duration: 1000,
  //     useNativeDriver: true,
  //   }).start();

  //   // Animate points counter
  //   const animationDuration = 2000;
  //   const steps = 60;
  //   const totalPoints = parseInt(accountReferralPoints?.toString());
  //   const increment = totalPoints / steps;
  //   let current = 0;

  //   const timer = setInterval(() => {
  //     current += increment;
  //     if (current >= totalPoints) {
  //       setAnimatedPoints(totalPoints);
  //       clearInterval(timer);
  //     } else {
  //       setAnimatedPoints(Math.floor(current));
  //     }
  //   }, animationDuration / steps);

  //   return () => clearInterval(timer);
  // }, []);

  useEffect(() => {
    if (accountReferralPoints == null) return; // guard against undefined/null

    // Animate entry
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animate points counter
    const animationDuration = 500;
    const steps = 60;
    const totalPoints = parseInt(accountReferralPoints.toString(), 10);
    const increment = totalPoints / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= totalPoints) {
        setAnimatedPoints(totalPoints);
        clearInterval(timer);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, animationDuration / steps);

    return () => clearInterval(timer);
  }, [accountReferralPoints]);

  // console.log(accountReferralPoints.toString());

  useEffect(() => {
    fetchReferrals();
  }, [account, isReady, contract]);

  useEffect(() => {
    fetchReferralPoints();
  }, [account, isReady, contract]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "0":
        return { text: "Pending", color: "#f59e0b", icon: "⏳" };
      case "1":
        return { text: "Approved", color: "#3b82f6", icon: "✅" };
      case "2":
        return { text: "Paid", color: "#22c55e", icon: "💰" };
      default:
        return { text: "Unknown", color: "#6b7280", icon: "❓" };
    }
  };

  const getPaymentModeInfo = (mode) => {
    // console.log(mode);
    switch (mode) {
      case "mobile_money":
        return { text: "M-Pesa", icon: "📱" };
      case "crypto":
        return { text: "Crypto", icon: "₿" };
      case "bank_transfer":
        return { text: "Bank", icon: "🏦" };
      default:
        return { text: "Other", icon: "💳" };
    }
  };

  const getContactTypeInfo = (type) => {
    // console.log(type);
    switch (type) {
      case "whatsapp":
        return { text: "WhatsApp", icon: "📞" };
      case "email":
        return { text: "Email", icon: "📧" };
      case "telegram":
        return { text: "Telegram", icon: "✈️" };
      default:
        return { text: "Other", icon: "📞" };
    }
  };

  const ReferralCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.referralCard,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * (index + 1), 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri:
              item?.referree?.profile_pic ||
              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
          }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.fullName}>
            {bigintToShortStr(item?.referree?.name)}
          </Text>
          <Text style={styles.username}>
            {bigintToShortStr(item?.referree?.username)}
          </Text>
          <Text style={styles.about}>{item?.referree?.about}</Text>
        </View>
        <View style={styles.statusContainer}>
          {item.verified.toString() === "1" ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>⏳</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Points</Text>
          <Text style={styles.pointsValue}>
            +{item?.referral_points?.toString()}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {formatDate(item?.timestamp?.toString())}
        </Text>
      </View>
    </Animated.View>
  );

  const RedemptionCard = ({ item, index }) => {
    // console.log(bigintToShortStr(item.mode_of_payment));
    const statusInfo = getStatusInfo(
      bigintToShortStr(item.redemption_status.toString())
    );

    console.log(timeAgo(item.timestamp.toString() * 1000));

    const paymentInfo = getPaymentModeInfo(
      bigintToShortStr(item.mode_of_payment)
    );
    // console.log(bigintToShortStr(item.contact_type));
    const contactInfo = getContactTypeInfo(bigintToShortStr(item.contact_type));
    // console.log(bigintToShortStr(item.contact_value));

    return (
      <Animated.View
        style={[
          styles.referralCard,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50 * (index + 1), 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.redemptionCardHeader}>
          <View style={styles.redemptionInfo}>
            <Text style={styles.redemptionId}>#{item.redemption_id}</Text>
            <Text style={styles.redemptionAmount}>
              {item.redemption_amount} Points
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          </View>
        </View>

        <View style={styles.redemptionDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <View style={styles.detailValue}>
                <Text style={styles.detailIcon}>{paymentInfo.icon}</Text>
                <Text style={styles.detailText}>{paymentInfo.text}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Contact</Text>
              <View style={styles.detailValue}>
                <Text style={styles.detailIcon}>{contactInfo.icon}</Text>
                <Text style={styles.detailText} numberOfLines={1}>
                  {bigintToShortStr(item?.contact_value)}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailText}>
                {formatDate(item.timestamp.toString())}
              </Text>
            </View>
          </View>

          {item.payment_address && (
            <View style={styles.paymentAddressContainer}>
              <Text style={styles.detailLabel}>Payment Address</Text>
              <Text style={styles.paymentAddress} numberOfLines={1}>
                {bigintToShortStr(item.payment_address)}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const RedeemModal = () => (
    <RedemptionModal
      showRedeemModal={showRedeemModal}
      setShowRedeemModal={setShowRedeemModal}
      totalPoints={animatedPoints}
      fetchReferralPoints={fetchReferralPoints}
    />
  );

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text
        style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            /* Add your navigation logic here */
            router.back();
          }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Rewards</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: animatedValue,
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#1f87fc", "#4c9cff", "#7db3ff"]}
            style={styles.statsGradient}
          >
            <View style={styles.statsContent}>
              <View style={styles.mainStat}>
                <Text style={styles.pointsCounter}>{animatedPoints}</Text>
                <Text style={styles.pointsLabel}>Total Points</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {userReferralData?.length}
                  </Text>
                  <Text style={styles.statLabel}>Total Referrals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{redemptionData?.length}</Text>
                  <Text style={styles.statLabel}>redemptions</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.redeemButtonMain}
                onPress={() => setShowRedeemModal(true)}
              >
                <Text style={styles.redeemButtonMainText}>Redeem Points</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TabButton
            title="Referrals"
            isActive={activeTab === "referrals"}
            onPress={() => setActiveTab("referrals")}
          />
          <TabButton
            title="Redemption History"
            isActive={activeTab === "history"}
            onPress={() => {
              setActiveTab("history");
              fetchRedemptionHistory();
            }}
          />
        </View>

        {/* Content based on active tab */}
        {activeTab === "referrals" ? (
          <>
            {/* Referrals Section */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Your Referrals</Text>

              <FlatList
                data={userReferralData}
                renderItem={({ item, index }) => (
                  <ReferralCard item={item} index={index} />
                )}
                keyExtractor={(item) => item?.referree?.userId}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* Invite More Section */}
            <Animated.View
              style={[
                styles.inviteSection,
                {
                  opacity: animatedValue,
                },
              ]}
            >
              <View style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>Earn More Points!</Text>
                <Text style={styles.inviteSubtitle}>
                  Invite friends and earn 50 points for each verified referral
                </Text>
                <TouchableOpacity style={styles.inviteButton}>
                  <LinearGradient
                    colors={["#1f87fc", "#4c9cff"]}
                    style={styles.inviteButtonGradient}
                  >
                    <Text style={styles.inviteButtonText}>Invite Friends</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        ) : (
          /* Redemption History Section */
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Redemption History</Text>

            {redemptionData.length > 0 ? (
              <FlatList
                data={redemptionData}
                renderItem={({ item, index }) => (
                  <RedemptionCard item={item} index={index} />
                )}
                keyExtractor={(item) => item.redemption_id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>🎁</Text>
                <Text style={styles.emptyStateTitle}>No Redemptions Yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start redeeming your points to see your history here
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <RedeemModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333", // Adjust color as needed
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  shareIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    margin: 20,
    borderRadius: 24,
    overflow: "hidden",
  },
  statsGradient: {
    padding: 24,
  },
  statsContent: {
    alignItems: "center",
  },
  mainStat: {
    alignItems: "center",
    marginBottom: 24,
  },
  pointsCounter: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
  },
  pointsLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 20,
  },
  redeemButtonMain: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    backdropFilter: "blur(10px)",
  },
  redeemButtonMainText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#1f87fc",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
  },
  activeTabButtonText: {
    color: "white",
    fontWeight: "600",
  },
  contentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  referralCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  username: {
    fontSize: 14,
    color: "#1f87fc",
    marginTop: 2,
  },
  about: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  statusContainer: {
    alignItems: "center",
  },
  verifiedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  pendingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
  },
  pendingText: {
    color: "white",
    fontSize: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f87fc",
    marginLeft: 8,
  },
  dateText: {
    fontSize: 12,
    color: "#888",
  },
  // Redemption Card Styles
  redemptionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  redemptionInfo: {
    flex: 1,
  },
  redemptionId: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  redemptionAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f87fc",
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 16,
  },
  redemptionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  detailValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
    flex: 1,
  },
  paymentAddressContainer: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  paymentAddress: {
    fontSize: 12,
    color: "#1f87fc",
    fontFamily: "monospace",
  },
  // Empty state styles
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  inviteSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inviteCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  inviteTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  inviteSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inviteButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  inviteButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  giftIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  giftIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  redeemOptions: {
    marginBottom: 24,
  },
  redeemOption: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  optionIcon: {
    fontSize: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  redeemButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  redeemButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default StarkzuriReferralPage;
