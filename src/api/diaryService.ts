import { supabase } from '../lib/supabase';
import type { DiaryFeedItem, DiaryExploreItem, DiaryDetail, CreateDiaryPayload } from '../types/diary';

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

  /**
   * Upload ảnh bìa lên Supabase Storage bucket 'diaries'
   */
  async uploadDiaryImage(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('diaries')
        .upload(filePath, blob, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('diaries').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      console.warn("Error uploading image:", e);
      throw e;
    }
  },

  /**
   * Tạo nhật ký mới vào DB
   */
  async createDiary(payload: CreateDiaryPayload, coverImageUrl: string): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    // 1. Insert diary record
    const { data: diary, error: diaryError } = await supabase
      .from('diaries')
      .insert({
        user_id: userData.user.id,
        title: payload.title,
        location: payload.location,
        country: payload.country,
        cover_image_url: coverImageUrl,
        duration: payload.duration,
        dates: payload.dates,
        total_budget: payload.total_budget,
        group_size: payload.group_size,
        description: payload.description,
        status: payload.status,
        tips: payload.tips || [],
        budget_notes: payload.budget_notes || [],
      })
      .select('id')
      .single();

    if (diaryError) throw diaryError;
    const diaryId = diary.id;

    // 2. Insert diary_days
    if (payload.timeline && payload.timeline.length > 0) {
      const daysToInsert = payload.timeline.map((day) => ({
        diary_id: diaryId,
        day_number: day.day,
        title: day.title,
        activities: day.activities,
        budget: day.budget,
      }));
      await supabase.from('diary_days').insert(daysToInsert);
    }

    // 3. Insert budget_items
    if (payload.budget_breakdown && payload.budget_breakdown.length > 0) {
      const budgetToInsert = payload.budget_breakdown.map((item) => ({
        diary_id: diaryId,
        category: item.category,
        amount: item.amount,
        percentage: item.percentage,
      }));
      await supabase.from('diary_budget_breakdown').insert(budgetToInsert);
    }

    return diaryId;
  },

  /**
   * Lấy danh sách nhật ký đã lưu (bookmarked) của user
   */
  async fetchSavedDiaries(userId: string): Promise<DiaryFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('diary_bookmarks')
        .select(`
          diary:diaries(
            id,
            location,
            cover_image_url,
            created_at,
            description,
            group_size,
            likes_count,
            comments_count,
            author:profiles!diaries_user_id_fkey(id, full_name, avatar_url),
            diary_likes(user_id)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch saved diaries error:', error);
      } else if (data) {
        return data
          .map((item: any) => item.diary)
          .filter(Boolean)
          .map((item: any) => ({
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
            is_liked: item.diary_likes?.some((l: any) => l.user_id === userId) || false,
            is_saved: true,
            group_size: item.group_size || '',
          }));
      }
    } catch (err) {
      console.warn("Failed to fetch saved diaries from Supabase", err);
    }
    return [];
  },

  /**
   * Cập nhật nhật ký
   */
  async updateDiary(id: string, payload: Partial<CreateDiaryPayload>, coverImageUrl?: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const updateData: any = {
      title: payload.title,
      location: payload.location,
      country: payload.country,
      duration: payload.duration,
      dates: payload.dates,
      total_budget: payload.total_budget,
      group_size: payload.group_size,
      description: payload.description,
      status: payload.status,
      tips: payload.tips,
      budget_notes: payload.budget_notes,
    };
    
    if (coverImageUrl) {
      updateData.cover_image_url = coverImageUrl;
    }

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { error } = await supabase
      .from('diaries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) throw error;

    if (payload.timeline) {
      await supabase.from('diary_days').delete().eq('diary_id', id);
      if (payload.timeline.length > 0) {
        const daysToInsert = payload.timeline.map((day) => ({
          diary_id: id,
          day_number: day.day,
          title: day.title,
          activities: day.activities,
          budget: day.budget,
        }));
        await supabase.from('diary_days').insert(daysToInsert);
      }
    }

    if (payload.budget_breakdown) {
      await supabase.from('diary_budget_breakdown').delete().eq('diary_id', id);
      if (payload.budget_breakdown.length > 0) {
        const budgetToInsert = payload.budget_breakdown.map((item) => ({
          diary_id: id,
          category: item.category,
          amount: item.amount,
          percentage: item.percentage,
        }));
        await supabase.from('diary_budget_breakdown').insert(budgetToInsert);
      }
    }
  },

  /**
   * Xóa nhật ký
   */
  async deleteDiary(id: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) throw error;
  }
};
