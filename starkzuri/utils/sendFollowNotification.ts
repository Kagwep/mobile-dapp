import Constants from "expo-constants";
import { User } from "./MiniFunctions";
import { bigintToLongAddress, bigintToShortStr, truncateAddress } from "./AppUtils";

const { PUBLIC_SUPABASE_URL_FOLLOW_NOTIFICATION_URL, SUPABASE_ANON_KEY } =
    Constants.expoConfig?.extra || {};

export const sendFollowNotification = async (
  targetUser: User | undefined,
  follower: User
) => {
    if (!targetUser || !follower) return;
    
    const targetAddress = bigintToLongAddress(targetUser.userId);
    const followerAddress = bigintToLongAddress(follower.userId);
    const followerName = bigintToShortStr(follower.username) || truncateAddress(followerAddress);
    
    // Fire and forget notification - NO AWAIT
    fetch(`${PUBLIC_SUPABASE_URL_FOLLOW_NOTIFICATION_URL}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        targetWalletAddress: targetAddress,
        followerWalletAddress: followerAddress,
        followerName: followerName,
        action: 'followed'
      })
    }).catch(() => {
      // Silent fail - notification failure shouldn't affect user experience
    });
}