import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export interface FriendProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  diaries_count: number;
  followers_count: number;
  following_count: number;
}

export const friendService = {
  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error) {
      throw error;
    }

    // Lấy thông tin user gửi để làm nội dung
    const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', followerId).single();
    const senderName = sender?.full_name || 'Ai đó';

    // Check if it's mutual (following back means accepting request)
    const isMutual = await this.checkIsFollowing(followingId, followerId);
    if (isMutual) {
      await notificationService.createNotification(
        followingId, 
        followerId, 
        'friend_accept', 
        `${senderName} đã chấp nhận lời mời kết bạn của bạn.`,
        followerId
      );
      // Gửi ngược lại cho người chấp nhận
      await notificationService.createNotification(
        followerId, 
        followingId, 
        'friend_accept', 
        `Bạn và ${senderName} đã trở thành bạn bè.`,
        followingId
      );
    } else {
      await notificationService.createNotification(
        followingId, 
        followerId, 
        'friend_request', 
        `${senderName} đã gửi cho bạn một lời mời kết bạn.`,
        followerId
      );
    }
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) {
      throw error;
    }
  },

  /**
   * Remove a mutual friend (delete both follow edges)
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const { error: err1 } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: userId, following_id: friendId });

    const { error: err2 } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: friendId, following_id: userId });

    if (err1) throw err1;
    if (err2) throw err2;
  },

  /**
   * Check if a user is following another
   */
  async checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .limit(1);

    if (error) {
      console.warn("Check following error:", error);
      return false;
    }

    return !!data && data.length > 0;
  },

  /**
   * Fetch followers, following, friends (mutual follow) and requests (follow you but not followed back)
   */
  async fetchFriendData(userId: string) {
    if (!userId) {
      return {
        requests: [],
        friends: [],
        following: [],
        followers: [],
      };
    }

    // 1. Fetch people who follow the current user
    const { data: followers, error: err1 } = await supabase
      .from('follows')
      .select(`
        follower_id,
        follower:profiles!follower_id (
          id,
          full_name,
          avatar_url,
          location,
          diaries_count,
          followers_count,
          following_count
        )
      `)
      .eq('following_id', userId);

    if (err1) {
      console.error("Error fetching followers:", err1);
      throw err1;
    }

    // 2. Fetch people whom the current user follows
    const { data: following, error: err2 } = await supabase
      .from('follows')
      .select(`
        following_id,
        following:profiles!following_id (
          id,
          full_name,
          avatar_url,
          location,
          diaries_count,
          followers_count,
          following_count
        )
      `)
      .eq('follower_id', userId);

    if (err2) {
      console.error("Error fetching following:", err2);
      throw err2;
    }

    // Safely extract profile objects supporting aliased names
    const followingProfiles: FriendProfile[] = (following || [])
      .map((f: any) => {
        const p = f.following || f.profiles;
        return Array.isArray(p) ? p[0] : p;
      })
      .filter(Boolean);

    const followerProfiles: FriendProfile[] = (followers || [])
      .map((f: any) => {
        const p = f.follower || f.profiles;
        return Array.isArray(p) ? p[0] : p;
      })
      .filter(Boolean);

    const followingIds = new Set(followingProfiles.map((p) => p.id));

    // Friend requests: followed us (followerProfiles) but we do not follow back (not in followingIds)
    const requests = followerProfiles.filter((p) => !followingIds.has(p.id));

    // Friends: mutual followers (in both lists)
    const friends = followerProfiles.filter((p) => followingIds.has(p.id));

    return {
      requests,
      friends,
      following: followingProfiles,
      followers: followerProfiles,
    };
  },

  /**
   * Fetch suggested friends (profiles that are not currently followed by the user)
   */
  async fetchSuggestedFriends(userId: string, searchQuery: string = '') {
    if (!userId) return [];

    // Fetch whom the user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
      
    // Fetch who follows the user
    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    const excludedIds = new Set([
      userId,
      ...(following || []).map(f => f.following_id),
      ...(followers || []).map(f => f.follower_id)
    ]);

    let query = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, location, diaries_count, followers_count, following_count');

    if (searchQuery.trim()) {
      // Search by name if query is provided
      query = query.ilike('full_name', `%${searchQuery.trim()}%`).limit(20);
    } else {
      // Otherwise just get random recent profiles
      query = query.limit(20);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.warn("Error fetching suggested friends:", error);
      return [];
    }

    return (profiles || []).filter(p => !excludedIds.has(p.id));
  }
};
