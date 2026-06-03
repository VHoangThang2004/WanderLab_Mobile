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
};
