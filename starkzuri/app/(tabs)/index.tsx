import PostItem from "@/components/PostItem";
import { useAppContext } from "@/providers/AppProvider";
import { weiToEth } from "@/utils/AppUtils";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CallData, uint256 } from "starknet";
import styles from "../../styles/index";

import CreatePostComponent from "@/components/PostComponent";
import ConfirmPostModal from "@/components/PostConfirmationModal";
import { CONTRACT_ADDRESS } from "@/providers/abi";
import MiniFunctions from "@/utils/MiniFunctions";
import Toast from "react-native-toast-message";

import { LIKE_FEE, STRK_ADDRESS } from "@/utils/constants";
import usePostActions from "../hooks/usePostActions";
import usePostSelectors from "../hooks/usePostSelectors";
import usePostStore from "@/stores/usePaginationStore";
import { sendNotification } from "@/utils/sendLikeNotification";
const StarkZuriHomepage = () => {
  const { contract, account, isReady, provider } = useAppContext();
  const router = useRouter();

  // UI State
  const [modalVisible, setModalVisible] = useState(false);
  const [likeModalVisible, setLikeModalVisible] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [estimateFee, setEstimateFee] = useState("0.00");
  const [platformFee, setPlatformFee] = useState("0.00");
  const [selectedPostId, setSelectedPostId] = useState<string>("0");
  const [isInitialized, setIsInitialized] = useState(false);
  // User data
  const user = MiniFunctions(account?.address?.toString() ?? "");

const getPostById = usePostStore(state => state.getPostById);

  // Enhanced Post Store
  const {
    posts,
    isLoading,
    isRefreshing,
    isInitializing,
    canLoadMore,
    hasError,
    errorMessage,
  } = usePostSelectors();

  const {
    initializePosts,
    loadMore,
    refresh,
    likePost,
    claimPoints,
    clearError,
  } = usePostActions();

  useEffect(() => {
    if (contract && !isInitialized) {
      initializePosts(contract);
      setIsInitialized(true);
    }
  }, [contract, initializePosts, isInitialized]);

  // Auto-load posts when pagination is ready
  useFocusEffect(
    useCallback(() => {
      // The store handles auto-loading after initialization
      // No need for manual fetchPosts here
    }, [])
  );

  // Error handling
  useEffect(() => {
    if (hasError && errorMessage) {
      Toast.show({
        type: "error",
        text1: "Error Loading Posts",
        text2: errorMessage,
      });
      // Auto-clear error after showing toast
      setTimeout(clearError, 3000);
    }
  }, [hasError, errorMessage, clearError]);

  // Fee estimation for likes
  const estimateLikeFees = useCallback(
    async (postId: string) => {
      if (!account || !isReady || !contract) return;

      try {
        const myCall = contract.populate("like_post", [postId]);

        const POST_CONTRACT = CONTRACT_ADDRESS;
        const FEE = LIKE_FEE;

        const calls = [
          {
            contractAddress: STRK_ADDRESS,
            entrypoint: "approve",
            calldata: CallData.compile({
              spender: POST_CONTRACT,
              amount: uint256.bnToUint256(FEE),
            }),
          },
          {
            contractAddress: POST_CONTRACT,
            entrypoint: "like_post",
            calldata: myCall.calldata,
          },
        ];

        const { suggestedMaxFee } = await account.estimateInvokeFee(calls);
        const likeFee = LIKE_FEE;

        setEstimateFee(weiToEth(suggestedMaxFee, 8));
        setPlatformFee(weiToEth(likeFee));
        setSelectedPostId(postId);
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

  // Fee estimation for claims
  const estimateClaimFees = useCallback(
    async (postId: string) => {
      if (!account || !isReady || !contract) return;

      try {
        const myCall = contract.populate("claim_post_points", [postId]);
        const { suggestedMaxFee } = await account.estimateInvokeFee({
          contractAddress: CONTRACT_ADDRESS,
          entrypoint: "claim_post_points",
          calldata: myCall.calldata,
        });

        setEstimateFee(weiToEth(suggestedMaxFee, 8));
        setPlatformFee("0.00");
        setSelectedPostId(postId);
      } catch (err) {
        console.error("Claim fee estimation failed:", err);
        Toast.show({
          type: "error",
          text1: "Fee Estimation Failed",
          text2: "Please try again",
        });
      }
    },
    [account, isReady, contract]
  );

  // Handle like verification and modal
  const verifyLike = useCallback(
    async (postId: string) => {
      await estimateLikeFees(postId);
      setLikeModalVisible(true);
    },
    [estimateLikeFees]
  );

  // Handle claim verification and modal
  const verifyHandleClaimPoints = useCallback(
    async (postId: string) => {
      await estimateClaimFees(postId);
      setClaimModalOpen(true);
    },
    [estimateClaimFees]
  );

  // Execute like transaction
  const handleLike = useCallback(async () => {
    if (!isReady || !account || !contract) return;

    setLikeModalVisible(false);

    try {
      await likePost(Number(selectedPostId), async (postId: number) => {
        Toast.show({
          type: "info",
          text1: "Processing Transaction...",
          position: "top",
          autoHide: false,
        });

        const POST_CONTRACT = CONTRACT_ADDRESS;
        const FEE = LIKE_FEE;

        const myCall = contract.populate("like_post", [postId]);
        const calls = [
          {
            contractAddress: STRK_ADDRESS,
            entrypoint: "approve",
            calldata: CallData.compile({
              spender: POST_CONTRACT,
              amount: uint256.bnToUint256(FEE),
            }),
          },
          {
            contractAddress: POST_CONTRACT,
            entrypoint: "like_post",
            calldata: myCall.calldata,
          },
        ];

        const res = await account.execute(calls);
        console.log("Transaction sent!", res.transaction_hash);
        //bigintToShortStr(user.username)
        const post = getPostById(postId);
        // console.log("likrf",user,post)
        sendNotification(post,user)

      });

      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Like successful!",
        text2: "Your like now counts 🎉",
      });
    } catch (err) {
      console.error("Like transaction failed:", err);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "Like Failed",
        text2: "Please try again later 😢",
      });
    }
  }, [isReady, account, contract, selectedPostId, likePost]);

  // Execute claim transaction
  const handleClaimPoints = useCallback(async () => {
    if (!isReady || !account || !contract) return;

    setClaimModalOpen(false);

    try {
      await claimPoints(Number(selectedPostId), async (postId: number) => {
        Toast.show({
          type: "info",
          text1: "Processing Transaction...",
          position: "top",
          autoHide: false,
        });

        const myCall = contract.populate("claim_post_points", [postId]);
        const res = await account.execute(myCall);
        console.log("Points claimed", res.transaction_hash);
      });

      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Zuri Claimed",
        text2: "You can now withdraw your points to wallet 🎉",
      });
    } catch (error) {
      console.error("Claim transaction failed:", error);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "Claim Failed",
        text2: "Please try again later 😢",
      });
    }
  }, [isReady, account, contract, selectedPostId, claimPoints]);

  // Handle infinite scroll
  const handleEndReached = useCallback(() => {
    if (canLoadMore) {
      loadMore();
    }
  }, [canLoadMore, loadMore]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Render loading state
  if (isInitializing) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading posts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>Stark Zuri</Text>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Search coming soon..."
              placeholderTextColor="#8e8e93"
              style={styles.searchInput}
            />
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Create Post Section */}
      <View style={styles.createPostContainer}>
        <Pressable onPress={() => router.push("/profile")}>
          <Image
            source={{
              uri:
                user.profile_pic ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
            }}
            style={styles.userAvatar}
          />
        </Pressable>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.createPostInput}
        >
          <Text style={styles.createPostText}>What's happening?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.createPostButton}
        >
          <Text style={styles.createPostButtonText}>+</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide">
          <CreatePostComponent
            onCreatePost={null}
            userAddress={null}
            onClose={() => setModalVisible(false)}
          />
        </Modal>
      </View>

      {/* Confirmation Modals */}
      <ConfirmPostModal
        gasFee={estimateFee}
        platformFee={platformFee}
        message=""
        onCancel={() => setLikeModalVisible(false)}
        onConfirm={handleLike}
        visible={likeModalVisible}
      />

      <ConfirmPostModal
        gasFee={estimateFee}
        platformFee={platformFee}
        message=""
        onCancel={() => setClaimModalOpen(false)}
        onConfirm={handleClaimPoints}
        visible={claimModalOpen}
      />

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId.toString()}
        renderItem={({ item }) => (
          <PostItem
            post={item}
            handleClaimPoints={() =>
              verifyHandleClaimPoints(item.postId.toString())
            }
            handleLike={() => verifyLike(item.postId.toString())}
          />
        )}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading && !isInitializing ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: "#8e8e93", fontSize: 16 }}>
                No posts yet. Be the first to share something!
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default StarkZuriHomepage;
