import { supabase } from '../lib/supabase';
import type { DiaryFeedItem, DiaryExploreItem, DiaryDetail } from '../types/diary';

export const diaryService = {
  async fetchFeedDiaries(): Promise<DiaryFeedItem[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('diaries')
        .select(`
          id,
          location,
          cover_image_url,
          created_at,
          description,
          group_size,
          likes_count,
          comments_count,
          author:profiles!diaries_user_id_fkey(id, full_name, avatar_url),
          diary_likes(user_id),
          diary_bookmarks(user_id)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Supabase fetch error:', error);
      } else if (data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          author: {
            id: item.author?.id || 'unknown',
            name: item.author?.full_name || 'Unknown User',
            avatar: item.author?.avatar_url || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
          },
          image: item.cover_image_url || 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=600',
          location: item.location,
          date: new Date(item.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }),
          caption: item.description,
          likes: item.likes_count || 0,
          comments: item.comments_count || 0,
          is_liked: currentUser ? item.diary_likes?.some((l: any) => l.user_id === currentUser.id) : false,
          is_saved: currentUser ? item.diary_bookmarks?.some((b: any) => b.user_id === currentUser.id) : false,
          group_size: item.group_size || '',
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase', err);
    }
    return [];
  },

  async fetchMyDiaries(): Promise<DiaryFeedItem[]> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('diaries')
        .select(`
          id,
          location,
          cover_image_url,
          created_at,
          description,
          group_size,
          likes_count,
          comments_count,
          author:profiles!diaries_user_id_fkey(id, full_name, avatar_url),
          diary_likes(user_id),
          diary_bookmarks(user_id)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error);
        return [];
      }

      if (data) {
        return data.map((item: any) => ({
          id: item.id,
          author: {
            id: item.author?.id || 'unknown',
            name: item.author?.full_name || 'Unknown User',
            avatar: item.author?.avatar_url || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
          },
          image: item.cover_image_url || 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=600',
          location: item.location,
          date: new Date(item.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }),
          caption: item.description,
          likes: item.likes_count || 0,
          comments: item.comments_count || 0,
          is_liked: item.diary_likes?.some((l: any) => l.user_id === currentUser.id) || false,
          is_saved: item.diary_bookmarks?.some((b: any) => b.user_id === currentUser.id) || false,
          group_size: item.group_size || '',
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch my diaries', err);
    }
    return [];
  },

  async fetchDiaryById(id: string): Promise<DiaryDetail | null> {
    try {
      const { data, error } = await supabase
        .from('diaries')
        .select(`
          *,
          author:profiles(id, full_name, avatar_url, diaries_count, followers_count),
          timeline:diary_days(*),
          budget_breakdown:budget_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          title: data.title,
          location: data.location,
          country: data.country,
          image: data.cover_image_url || 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=600',
          gallery: [],
          author: {
            id: data.author?.id,
            name: data.author?.full_name || 'Người dùng ẩn danh',
            avatar: data.author?.avatar_url || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
            diariesCount: data.author?.diaries_count || 0,
            followersCount: data.author?.followers_count || 0,
          },
          trustScore: data.trust_score || 90,
          duration: data.duration,
          dates: data.dates,
          totalBudget: data.total_budget,
          groupSize: data.group_size,
          description: data.description,
          likesCount: data.likes_count || 0,
          commentsCount: data.comments_count || 0,
          timeline: data.timeline?.map((day: any) => ({
            day: day.day_number,
            title: day.title,
            activities: day.activities || [],
            budget: day.budget,
          })) || [],
          budgetBreakdown: data.budget_breakdown?.map((item: any) => ({
            category: item.category,
            amount: item.amount,
            percentage: item.percentage,
          })) || [],
          budgetNotes: data.budget_notes || [],
          tips: data.tips || [],
        };
      }
    } catch (e) {
      console.warn('fetchDiaryById failed', e);
    }
    return null;
  },

  async fetchExploreDiaries(): Promise<DiaryExploreItem[]> {
    try {
      const { data, error } = await supabase
        .from('diaries')
        .select(`
          id, title, location, country, cover_image_url, duration, total_budget, trust_score,
          author:profiles!diaries_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((d: any) => {
          const budgetStr = d.total_budget || '0';
          const budgetVal = parseInt(budgetStr.replace(/\D/g, '')) || 0;
          const budgetNum = budgetVal / 1000000;
          const durationDays = parseInt(d.duration) || 0;

          return {
            id: d.id,
            title: d.title,
            location: d.location,
            country: d.country,
            image: d.cover_image_url || 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=600',
            budget: `${budgetNum.toFixed(1)} triệu ₫`,
            budgetNum,
            duration: d.duration,
            durationDays,
            trustScore: d.trust_score || 90,
            author: d.author?.full_name || 'Người dùng ẩn danh',
          };
        });
      }
    } catch (e) {
      console.warn('fetchExploreDiaries failed', e);
    }
    return [];
  },
};
