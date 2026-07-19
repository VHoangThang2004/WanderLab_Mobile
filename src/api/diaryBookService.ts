import { supabase } from '../lib/supabase';
import type { DiaryBook, CreateDiaryBookPayload } from '../types/diaryBook';
import { usageLimitService } from './usageLimitService';
import { useAuthStore } from '../stores/authStore';

export const diaryBookService = {
  /**
   * Lấy danh sách các cuốn nhật ký của một user
   */
  async fetchUserBooks(userId: string): Promise<DiaryBook[]> {
    try {
      const { data, error } = await supabase
        .from('diary_books')
        .select(`
          id,
          user_id,
          title,
          description,
          cover_image_url,
          created_at,
          diary_book_entries(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch user books error:', error);
      } else if (data) {
        return data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title,
          description: item.description,
          cover_image_url: item.cover_image_url || 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5',
          created_at: item.created_at,
          diaries_count: item.diary_book_entries[0]?.count || 0
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch user books", err);
    }
    return [];
  },

  /**
   * Lấy chi tiết cuốn nhật ký và các bài viết bên trong
   */
  async fetchBookById(bookId: string): Promise<{ book: DiaryBook | null, diaries: any[] }> {
    try {
      // 1. Get the book
      const { data: bookData, error: bookError } = await supabase
        .from('diary_books')
        .select('*')
        .eq('id', bookId)
        .single();
      
      if (bookError) throw bookError;

      // 2. Get the entries (diaries)
      const { data: entriesData, error: entriesError } = await supabase
        .from('diary_book_entries')
        .select(`
          sort_order,
          diary:diaries(
            id,
            title,
            location,
            country,
            cover_image_url,
            duration,
            dates,
            total_budget,
            group_size,
            description,
            created_at,
            author:profiles!diaries_user_id_fkey(id, full_name, avatar_url),
            timeline:diary_days(*),
            budget_breakdown:diary_budget_breakdown(*)
          )
        `)
        .eq('book_id', bookId)
        .order('sort_order', { ascending: true });

      if (entriesError) throw entriesError;

      const diaries = entriesData
        .map((entry: any) => entry.diary)
        .filter(Boolean)
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          location: item.location,
          country: item.country,
          image: item.cover_image_url || 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5',
          duration: item.duration,
          dates: item.dates,
          totalBudget: item.total_budget,
          groupSize: item.group_size,
          description: item.description,
          author: {
            id: item.author?.id || 'unknown',
            name: item.author?.full_name || 'Unknown User',
            avatar: item.author?.avatar_url || '',
          },
          date: new Date(item.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }),
          timeline: item.timeline?.map((day: any) => ({
            day: day.day_number,
            title: day.title,
            activities: day.activities || [],
            budget: day.budget
          })) || [],
          budgetBreakdown: item.budget_breakdown?.map((b: any) => ({
            category: b.category,
            amount: b.amount,
            percentage: b.percentage
          })) || [],
        }));

      return { book: bookData as DiaryBook, diaries };
    } catch (err) {
      console.warn("Failed to fetch book details", err);
      return { book: null, diaries: [] };
    }
  },

  /**
   * Tạo cuốn nhật ký mới
   */
  async createBook(payload: CreateDiaryBookPayload, diaryIds: string[]): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      const canCreate = await usageLimitService.canCreateSchedule(user.id, currentUser.plan);
      if (!canCreate) {
        throw new Error(`LIMIT_EXCEEDED: Bạn đã đạt giới hạn tạo lịch trình trong ngày của gói ${currentUser.plan.toUpperCase()}. Vui lòng nâng cấp gói để tiếp tục.`);
      }
    }

    // 1. Create book
    const { data: book, error: bookError } = await supabase
      .from('diary_books')
      .insert({
        user_id: user.id,
        title: payload.title,
        description: payload.description,
        cover_image_url: payload.cover_image_url || null,
      })
      .select('id')
      .single();

    if (bookError) throw bookError;

    // 2. Add entries
    if (diaryIds.length > 0) {
      const entries = diaryIds.map((diaryId, index) => ({
        book_id: book.id,
        diary_id: diaryId,
        sort_order: index
      }));

      const { error: entriesError } = await supabase
        .from('diary_book_entries')
        .insert(entries);

      if (entriesError) throw entriesError;
    }

    return book.id;
  },

  /**
   * Cập nhật cuốn nhật ký
   */
  async updateBook(id: string, payload: Partial<CreateDiaryBookPayload>, diaryIds: string[]): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    // 1. Update book details
    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.cover_image_url !== undefined) updateData.cover_image_url = payload.cover_image_url;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('diary_books')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userData.user.id);
      
      if (error) throw error;
    }

    // 2. Update entries (delete all and recreate)
    // First verify user owns the book (handled by RLS mostly, but good to be safe)
    
    await supabase.from('diary_book_entries').delete().eq('book_id', id);

    if (diaryIds.length > 0) {
      const entries = diaryIds.map((diaryId, index) => ({
        book_id: id,
        diary_id: diaryId,
        sort_order: index
      }));

      await supabase.from('diary_book_entries').insert(entries);
    }
  },

  /**
   * Xóa cuốn nhật ký
   */
  async deleteBook(id: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('diary_books')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) throw error;
  }
};
