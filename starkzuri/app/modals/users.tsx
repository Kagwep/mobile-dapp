import ConfirmPostModal from "@/components/PostConfirmationModal";
import { CONTRACT_ADDRESS } from "@/providers/abi";
import { useAppContext } from "@/providers/AppProvider";
import {
  bigintToLongAddress,
  bigintToShortStr,
  weiToEth,
} from "@/utils/AppUtils";
import { provider } from "@/utils/constants";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
const UserList = ({ onBack }) => {
  const router = useRouter();
  const { contract, account, address, isReady } = useAppContext();

  const [initialUsers, setInitialUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [followStates, setFollowStates] = useState({});

  const [estimateFee, setEstimateFee] = useState("0");
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [accountToFollow, setAccountToFollow] = useState("");

  const fetchUser = async () => {
    if (!contract || !address) return;
    try {
      const myCall = await contract.populate("view_all_users", []);
      const res = await contract["view_all_users"](myCall.calldata, {
        parseResponse: false,
        parseRequest: false,
      });
      setInitialUsers(res);
      return res;
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const showFollowing = async (userAddress) => {
    if (!contract || !address) return;
    try {
      const myCall = await contract.populate("follower_exist", [userAddress]);
      const res = await contract["follower_exist"](myCall.calldata, {
        parseResponse: false,
        parseRequest: false,
      });
      // setInitialUsers(res);
      // console.log(res);
      return res;
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [contract, account, isReady]);

  // Initialize follow states after users are fetched
  useEffect(() => {
    const fetchFollowStates = async () => {
      if (!initialUsers.length) return;

      const states = {};
      for (const user of initialUsers) {
        const status = await showFollowing(bigintToLongAddress(user.userId));
        // console.log(status);
        if (status === "false") states[user.userId] = "follows you";
        else if (status === "true") states[user.userId] = "follow";
        else states[user.userId] = "following";

        states[user.userId.toString()] = status;
      }
      // console.log(states);
      // store as string key
      setFollowStates(states);
    };
    fetchFollowStates();
  }, [initialUsers]);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return initialUsers;

    const query = searchQuery.toLowerCase();
    return initialUsers.filter((user) => {
      const name = bigintToShortStr(user.name).toLowerCase();
      const username = bigintToShortStr(user.username).toLowerCase();
      const about = (user.about ? user.about.toString() : "").toLowerCase();

      return (
        name.includes(query) ||
        username.includes(query) ||
        about.includes(query)
      );
    });
  }, [searchQuery, initialUsers]);

  const estimateFollowUser = useCallback(
    async (accountAddress) => {
      // console.log(withdrawAmount);
      // alert(accountAddress);
      if (!account || !isReady || !contract) return;
      // Toast.show({
      //   type: "info",
      //   text1: "Processing Transaction...",
      //   position: "top",
      //   autoHide: false,
      // });

      try {
        const myCall = contract.populate("follow_user", [accountAddress]);
        const POST_CONTRACT = CONTRACT_ADDRESS;

        const calls = {
          contractAddress: POST_CONTRACT,
          entrypoint: "follow_user",
          calldata: myCall.calldata,
        };
        const { suggestedMaxFee } = await account.estimateInvokeFee(calls);

        setEstimateFee(weiToEth(suggestedMaxFee, 8));

        setFollowModalOpen(true);
        setAccountToFollow(accountAddress);
      } catch (error) {
        console.error("Fee estimation error:", error);
        Toast.show({
          type: "error",
          text1: "Fee Estimation Failed",
          text2: "Please try again",
        });
      }
    },
    [account, isReady, contract]
  );

  const followUser = async () => {
    if (!account || !isReady || !contract) return;
    setFollowModalOpen(false);

    Toast.show({
      type: "info",
      text1: "Processing Transaction...",
      position: "top",
      autoHide: false,
    });

    console.log("account followed", accountToFollow);

    try {
      const myCall = contract.populate("follow_user", [accountToFollow]);

      const res = await account.execute(myCall);
      console.log("follow successful", res.transaction_hash);
      Toast.hide();
      Toast.show({
        type: "success",
        text1: "follow successful",
        text2: "wait for confirmation 🎉",
      });

      await provider.waitForTransaction(res.transaction_hash);

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

  const handleFollowPress = (userId) => {
    // alert(bigintToLongAddress(userId));
    const accountAddress = bigintToLongAddress(userId);
    estimateFollowUser(accountAddress);
    // setFollowStates((prev) => ({
    //   ...prev,
    //   [userId]:
    //     prev[userId] === "follow"
    //       ? "following"
    //       : prev[userId] === "following"
    //       ? "follow"
    //       : "follows_you",
    // }));
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getButtonStyle = (state) => {
    switch (state) {
      case "following":
        return { ...styles.button, ...styles.followingButton };
      case "follows_you":
        return { ...styles.button, ...styles.followsYouButton };
      default:
        return { ...styles.button, ...styles.followButton };
    }
  };

  const getButtonText = (state) => {
    switch (state) {
      case "following":
        return "Following";
      case "follows_you":
        return "Follows You";
      default:
        return "Follow";
    }
  };

  const getButtonTextStyle = (state) => {
    switch (state) {
      case "following":
        return { ...styles.buttonText, color: "#1f87fc" };
      case "follows_you":
        return { ...styles.buttonText, color: "#ffffff" };
      default:
        return { ...styles.buttonText, color: "#ffffff" };
    }
  };

  const renderProfileImage = (profilePic, name) => {
    if (profilePic && profilePic.startsWith("https://")) {
      return <Image source={{ uri: profilePic }} style={styles.profileImage} />;
    }

    // Fallback to initials
    const initial = name.toString().charAt(0).toUpperCase();
    return (
      <View style={styles.profileImagePlaceholder}>
        <Text style={styles.profileInitial}>{initial}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            router.back();
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Users</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results info */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {searchQuery
            ? `${filteredUsers.length} result${
                filteredUsers.length !== 1 ? "s" : ""
              } found`
            : `${initialUsers.length} users`}
        </Text>
      </View>

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.userId.toString()} // ensure string
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredUsers.length === 0 ? styles.noResultsContainer : {}
        }
        renderItem={({ item: user }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/modals/account_modal",
                    params: {
                      account_address: bigintToLongAddress(user?.userId),
                    },
                  });
                }}
              >
                {renderProfileImage(
                  user.profile_pic,
                  bigintToShortStr(user.name)
                )}
              </TouchableOpacity>

              <View style={styles.userDetails}>
                <TouchableOpacity>
                  <Text style={styles.userName}>
                    {bigintToShortStr(user.name)}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.userUsername}>
                  @{bigintToShortStr(user.username)}
                </Text>
                <Text style={styles.userAbout}>{user.about}</Text>
                <View style={styles.statsContainer}>
                  <Text style={styles.stats}>
                    {user.no_of_followers} followers • {user.number_following}{" "}
                    following
                  </Text>
                  {user.zuri_points !== "0" && (
                    <Text style={styles.points}>{user.zuri_points} points</Text>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={getButtonStyle(followStates[user.userId])}
              onPress={() => handleFollowPress(user.userId)}
            >
              <Text style={getButtonTextStyle(followStates[user.userId])}>
                {getButtonText(followStates[user.userId])}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No users found</Text>
            <Text style={styles.noResultsSubText}>
              Try adjusting your search terms
            </Text>
          </View>
        )}
      />
      <ConfirmPostModal
        gasFee={estimateFee}
        platformFee="0"
        message=""
        onCancel={() => setFollowModalOpen(false)}
        onConfirm={followUser}
        visible={followModalOpen}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingTop: 50,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    color: "#666666",
    fontSize: 14,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsText: {
    color: "#888888",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1f87fc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileInitial: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  userUsername: {
    color: "#888888",
    fontSize: 14,
    marginBottom: 4,
  },
  userAbout: {
    color: "#cccccc",
    fontSize: 14,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stats: {
    color: "#888888",
    fontSize: 12,
  },
  points: {
    color: "#1f87fc",
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  followButton: {
    backgroundColor: "#1f87fc",
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1f87fc",
  },
  followsYouButton: {
    backgroundColor: "#333333",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  noResultsSubText: {
    color: "#888888",
    fontSize: 14,
    textAlign: "center",
  },
});

export default UserList;
