import { supabase } from '../lib/supabase';

export const interactionService = {
  async getUserReaction(diaryId: string, userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('diary_likes')
      .select('reaction_type')
      .eq('diary_id', diaryId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Check reaction error:', error);
      return null;
    }
    return data ? data.reaction_type : null;
  },

  async toggleLikeDiary(diaryId: string, userId: string): Promise<{ isLiked: boolean }> {
    const existingReaction = await this.getUserReaction(diaryId, userId);

    if (existingReaction) {
      await supabase.from('diary_likes').delete().eq('diary_id', diaryId).eq('user_id', userId);
      try { await supabase.rpc('decrement_like', { row_id: diaryId }); } catch {}
      return { isLiked: false };
    } else {
      await supabase.from('diary_likes').insert({ diary_id: diaryId, user_id: userId, reaction_type: 'like' });
      try { await supabase.rpc('increment_like', { row_id: diaryId }); } catch {}
      return { isLiked: true };
    }
  },

  async toggleBookmarkDiary(diaryId: string, userId: string): Promise<{ isBookmarked: boolean }> {
    const { data, error } = await supabase
      .from('diary_bookmarks')
      .select('id')
      .eq('diary_id', diaryId)
      .eq('user_id', userId)
      .single();

    const isCurrentlyBookmarked = !error && !!data;

    if (isCurrentlyBookmarked) {
      await supabase
        .from('diary_bookmarks')
        .delete()
        .eq('diary_id', diaryId)
        .eq('user_id', userId);
      return { isBookmarked: false };
    } else {
      await supabase
        .from('diary_bookmarks')
        .insert({ diary_id: diaryId, user_id: userId });
      return { isBookmarked: true };
    }
  },

  // === COMMENTS ===
  async fetchComments(diaryId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        diary_id,
        user_id,
        content,
        likes_count,
        created_at,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('diary_id', diaryId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((c: any) => ({
      ...c,
      author: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
    }));
  },

  async addComment(diaryId: string, userId: string, content: string): Promise<any> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        diary_id: diaryId,
        user_id: userId,
        content: content,
      })
      .select(`
        id,
        diary_id,
        user_id,
        content,
        likes_count,
        created_at,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    const { error: rpcError } = await supabase.rpc('increment_comment', { row_id: diaryId });
    if (rpcError) {
      console.warn("RPC increment_comment failed:", rpcError);
    }

    return {
      ...data,
      author: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
    };
  },

  // === FOLLOWS ===
  async checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.warn("Check follow error:", error);
      return false;
    }
    return !!data;
  },

  async toggleFollowUser(followerId: string, followingId: string): Promise<{ isFollowing: boolean }> {
    if (followerId === followingId) throw new Error("Không thể tự follow chính mình");

    const isCurrentlyFollowing = await this.checkIsFollowing(followerId, followingId);
    
    if (isCurrentlyFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
        
      await supabase.rpc('decrement_follower', { target_user_id: followingId }).catch(()=>null);
      await supabase.rpc('decrement_following', { target_user_id: followerId }).catch(()=>null);

      return { isFollowing: false };
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });
        
      await supabase.rpc('increment_follower', { target_user_id: followingId }).catch(()=>null);
      await supabase.rpc('increment_following', { target_user_id: followerId }).catch(()=>null);

      return { isFollowing: true };
    }
  }
};
