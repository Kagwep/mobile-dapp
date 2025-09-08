import CommentComponent from "@/components/CommentComponent";
import ConfirmPostModal from "@/components/PostConfirmationModal";
import PostFooter from "@/components/PostFooter";
import PostHeader from "@/components/PostHeader";
import { CONTRACT_ADDRESS } from "@/providers/abi";
import { useAppContext } from "@/providers/AppProvider";
import { htmlToMarkdown, weiToEth } from "@/utils/AppUtils";
import { LIKE_FEE, STRK_ADDRESS } from "@/utils/constants";
import { Ionicons } from "@expo/vector-icons"; // or react-native-vector-icons
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { CallData, uint256 } from "starknet";
import TurndownService from "turndown";

import MiniFunctions from "@/utils/MiniFunctions";
import usePostStore from "@/stores/usePaginationStore";
import { sendNotification } from "@/utils/sendLikeNotification";

const { width } = Dimensions.get("window");

const samplePost = {
  id: "0",
  caller: 0x1234567890abcdef1234567890abcdef12345678n,
  content:
    "Just launched my new NFT collection! 🎨 The intersection of art and technology never ceases to amaze me. Each piece tells a story about our digital future. What do you think about the role of AI in creative processes? #NFT #DigitalArt #Web3",
  images:
    "https://picsum.photos/400/300?random=1,https://picsum.photos/400/300?random=2",
  date_posted: BigInt(Math.floor(Date.now() / 1000) - 3600),
  zuri_points: 150,
  likes: 42,
  comments: 8,
  shares: 12,
  liked: false,
};

const sampleComments = [
  {
    id: "1",
    author: "0x9876543210fedcba9876543210fedcba98765432",
    authorName: "CryptoArtist",
    content:
      "Amazing work! The detail in each piece is incredible. How long did it take you to create the entire collection?",
    timestamp: "2 hours ago",
    likes: 5,
    liked: false,
  },
  {
    id: "2",
    author: "0x1111222233334444555566667777888899990000",
    authorName: "Web3Explorer",
    content:
      "This is exactly what the NFT space needs - meaningful art with purpose. The AI integration is fascinating!",
    timestamp: "1 hour ago",
    likes: 3,
    liked: true,
  },
  {
    id: "3",
    author: "0xaabbccddeeff00112233445566778899aabbccdd",
    authorName: "DigitalCollector",
    content:
      "Just purchased piece #47! The story behind it really resonates with my vision of the future.",
    timestamp: "45 minutes ago",
    likes: 8,
    liked: false,
  },
];

type Comment = {
  postId: number;
  commentId: number;
  caller: number;
  content: string;
  likes: number;
  replies: number;
  time_commented: number;
  zuri_points: number;
};

type Post = {
  postId: number;
  caller: number;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  images: string;
  zuri_points: string;
  date_posted: number;
};

const SinglePostPage = () => {
  const [comments, setComments] = useState(sampleComments);
  const [newComment, setNewComment] = useState("");
  const { single_post } = useLocalSearchParams();
  const [estimateFee, setEstimateFee] = useState("0");
  const [platformFee, setPlatformFee] = useState("0");
  const [likeModalVisible, setLikeModalVisible] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // console.log(single_post);
  const { contract, account, isReady } = useAppContext();
  // console.log(contract);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post>({
    postId: 0,
    caller: 0,
    content: "",
    likes: 0,
    comments: 0,
    shares: 0,
    images: "",
    zuri_points: "",
    date_posted: 0,
  });
  const [commentList, setCommentList] = useState<Comment[]>([]);

  const user = MiniFunctions(account?.address?.toString());

  // using the turndown service
 const getPostById = usePostStore(state => state.getPostById);
 

  function displayMarkdown(_html) {
    const turnDownService = new TurndownService();
    const html = _html;
    const markdown = turnDownService.turndown(html);
    // console.log(markdown)
    return markdown;
  }

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace("/"); // or wherever the safe fallback is
    }
  };

  const view_post = () => {
    // console.log(id);
    const myCall = contract.populate("view_post", [single_post]);
    setLoading(true);
    contract["view_post"](myCall.calldata, {
      parseResponse: false,
      parseRequest: false,
    })
      .then((res) => {
        let val = res;
        console.log("fvgf", val);
        setPosts(val);
        // console.log(val);
      })
      .catch((err) => {
        console.error("Error: ", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // viewing comments
  const view_comments = () => {
    // console.log(id);
    const myCall = contract.populate("view_comments", [single_post]);
    setLoading(true);
    contract["view_comments"](myCall.calldata, {
      parseResponse: false,
      parseRequest: false,
    })
      .then((res) => {
        let val = res;
        // console.log(val);
        setCommentList(val.reverse());
        // console.log(val);
      })
      .catch((err) => {
        console.error("Error: ", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleCommentLike = (commentId) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              liked: !comment.liked,
              likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: "0x" + Math.random().toString(16).substring(2, 42),
        authorName: "You",
        content: newComment,
        timestamp: "now",
        likes: 0,
        liked: false,
      };
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    }
  };

  const formatAddress = (address) => {
    const addr = address.toString(16);
    return `0x${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h ago`;
  };

  const verifyLike = async () => {
    setLikeModalVisible(true);
    await estimateLikeFees();
  };

  // console.log(single_post);

  const estimateLikeFees = async () => {
    console.log(single_post);
    if (!account || !isReady || !contract) return;
    try {
      const myCall = contract.populate("like_post", [single_post]);

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
      const { suggestedMaxFee, unit } = await account.estimateInvokeFee(calls);

      const likeFee = LIKE_FEE;
      const feeToEth = weiToEth(suggestedMaxFee, 8);
      const likeFeeToEth = weiToEth(likeFee);
      setEstimateFee(feeToEth);
      setPlatformFee(likeFeeToEth);
    } catch (error) {
      console.log("estimation error ", error);
    }
  };

  const handleLike = async () => {
    // setPosts(
    //   posts.map((post) =>
    //     post.postId === postId
    //       ? {
    //           ...post,
    //           // liked: !post.liked,
    //           likes: post.likes ? post.likes - 1 : post.likes + 1,
    //         }
    //       : post
    //   )
    // );

    if (!isReady || !account || !contract) return;

    Toast.show({
      type: "info",
      text1: "Processing Transaction...",
      position: "top",
      autoHide: false,
    });

    const POST_CONTRACT = CONTRACT_ADDRESS;
    const FEE = LIKE_FEE;

    const myCall = contract.populate("like_post", [single_post]);

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

    try {
      const res = await account.execute(calls);
      console.log("Transaction sent!", res.transaction_hash);
     // const post = getPostById(single_post as unknown as number);
       //console.log("..",user,posts)
      sendNotification(posts,user)
      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Like successful!",
        text2: "Your like now counts 🎉",
      });
     
    } catch (err) {
      console.error("TX failed:", err);
      Toast.show({
        type: "error",
        text1: "like Failed",
        text2: "Please try again later 😢",
      });
    } finally {
      setLikeModalVisible(false);
    }
  };

  const verifyHandleClaimPoints = async () => {
    await estimateClaimFees();
    setClaimModalOpen(true);
  };

  const estimateClaimFees = async () => {
    console.log("estimating");
    // console.log(post);

    if (!account || !isReady || !contract) return;

    try {
      const myCall = contract.populate("claim_post_points", [single_post]);

      const { suggestedMaxFee, unit } = await account.estimateInvokeFee({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: "claim_post_points",
        calldata: myCall.calldata,
      });

      const feeToEth = weiToEth(suggestedMaxFee, 8);

      console.log("estimation done");
      console.log("estimatedFee", suggestedMaxFee.toString());
      console.log("unit ", unit.toString());
      setEstimateFee(feeToEth);
      setPlatformFee("0.00");
    } catch (err) {
      console.error("🔥 Estimation failed:", err);
    }
  };

  const handleClaimPoints = async () => {
    if (!isReady || !account || !contract) return;
    Toast.show({
      type: "info",
      text1: "Processing Transaction...",
      position: "top",
      autoHide: false,
    });

    try {
      const myCall = contract.populate("claim_post_points", [single_post]);

      const res = await account.execute(myCall);
      // console.log("points claimed", res.transaction_hash);

      Toast.hide();
      Toast.show({
        type: "success",
        text1: "Zuri Claimed",
        text2: "You can now withdraw your points to wallet 🎉",
      });

      // Alert.alert("Success", "Your post has been created!");
    } catch (error) {
      console.error("TX failed ", error);
      Toast.hide();
      Toast.show({
        type: "error",
        text1: "claim Failed",
        text2: "Please try again later 😢",
      });
    } finally {
      setIsLoading(false);
      setClaimModalOpen(false);
    }
  };

  // console.log(posts?.images);

  useEffect(() => {
    if (contract) {
      view_post();
    }
  }, [contract, single_post]);

  useEffect(() => {
    if (contract) {
      view_comments();
    }
  }, [contract, single_post]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#d1d5db" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}

        <PostHeader post={posts} />

        {/* Post Content */}
        <View style={styles.postContent}>
          <Markdown
            style={{
              body: { color: "white" },
              heading1: { color: "white" },
              bullet_list_icon: { color: "white" },
              link: { color: "#1f87fc" },
            }}
          >
            {htmlToMarkdown(posts.content)}
          </Markdown>
        </View>

        {console.log(posts.images.split(" "))}

        {/* Images */}
        <View style={styles.imagesContainer}>
          <View style={styles.imageGrid}>
            {posts?.images
              .trim()
              .split(/\s+/)
              .map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image.trim() }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
          </View>
        </View>

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

        <PostFooter
          post={posts}
          handleClaimPoints={verifyHandleClaimPoints}
          handleLike={verifyLike}
        />

        {/* Engagement Stats */}

        {/* Comments Section */}
        {/* <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <FlatList
            data={commentList}
            renderItem={({ item }) => <CommentComponent comment={item} />}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View> */}
        <CommentComponent post={posts} />
      </ScrollView>

      {/* Comment Input */}
      {/* <View style={styles.commentInputContainer}>
        <View style={styles.commentInputAvatar}>
          <Text style={styles.commentInputAvatarText}>You</Text>
        </View>
        <View style={styles.commentInputWrapper}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write a comment..."
            placeholderTextColor="#9ca3af"
            multiline
            onSubmitEditing={handleSubmitComment}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSubmitComment}
          >
            <Ionicons name="send" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginRight: 8,
  },
  zuriPointsBadge: {
    backgroundColor: "#eab308",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  zuriPointsText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  postTime: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 2,
  },
  postContent: {
    marginBottom: 16,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#ffffff",
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  postImage: {
    width: (width - 40) / 2,
    height: 192,
    borderRadius: 8,
  },
  engagementStats: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: "#9ca3af",
    marginRight: 24,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: "#9ca3af",
    marginLeft: 8,
  },
  likedText: {
    color: "#ef4444",
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  commentContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  commentAvatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  commentText: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 8,
    marginLeft: 12,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 4,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    backgroundColor: "#111827",
  },
  commentInputAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  commentInputAvatarText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#ffffff",
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#1f87fc",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SinglePostPage;
