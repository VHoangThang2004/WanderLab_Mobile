import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PLAN_LIMITS = {
  free: {
    diariesPerDay: 4,
    schedulesPerDay: 2,
    aiDiariesPerDay: 8,
    aiSchedulesPerDay: 4,
    maxImages: 5,
    maxVideos: 1,
  },
  plus: {
    diariesPerDay: 10,
    schedulesPerDay: 5,
    aiDiariesPerDay: 20,
    aiSchedulesPerDay: 10,
    maxImages: 12,
    maxVideos: 2,
  },
  premium: {
    diariesPerDay: 999999,
    schedulesPerDay: 999999,
    aiDiariesPerDay: 999999,
    aiSchedulesPerDay: 999999,
    maxImages: 50, // Reasonable max limit for picker
    maxVideos: 10,
  },
  pro: { // Fallback in case they use 'pro'
    diariesPerDay: 999999,
    schedulesPerDay: 999999,
    aiDiariesPerDay: 999999,
    aiSchedulesPerDay: 999999,
    maxImages: 50,
    maxVideos: 10,
  }
};

type PlanType = keyof typeof PLAN_LIMITS;

export const usageLimitService = {
  getLimits(plan: string): typeof PLAN_LIMITS.free {
    const p = (plan || 'free').toLowerCase() as PlanType;
    return PLAN_LIMITS[p] || PLAN_LIMITS.free;
  },

  async canCreateDiary(userId: string, plan: string): Promise<boolean> {
    const limits = this.getLimits(plan);
    if (limits.diariesPerDay >= 999999) return true;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('diaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString());

    if (error) {
      console.error("Error checking diary limits:", error);
      return false; // Fail safe
    }

    return (count || 0) < limits.diariesPerDay;
  },

  async canCreateSchedule(userId: string, plan: string): Promise<boolean> {
    const limits = this.getLimits(plan);
    if (limits.schedulesPerDay >= 999999) return true;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('diary_books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString());

    if (error) {
      console.error("Error checking schedule limits:", error);
      return false;
    }

    return (count || 0) < limits.schedulesPerDay;
  },

  // Track AI usage locally via AsyncStorage to save DB queries
  async canUseAI(userId: string, plan: string, type: 'diary' | 'schedule'): Promise<boolean> {
    const limits = this.getLimits(plan);
    const limit = type === 'diary' ? limits.aiDiariesPerDay : limits.aiSchedulesPerDay;
    if (limit >= 999999) return true;

    const today = new Date().toISOString().split('T')[0];
    const key = `ai_usage_${userId}_${type}_${today}`;
    
    try {
      const current = await AsyncStorage.getItem(key);
      const count = current ? parseInt(current) : 0;
      return count < limit;
    } catch (e) {
      return false;
    }
  },

  async incrementAIUsage(userId: string, type: 'diary' | 'schedule'): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai_usage_${userId}_${type}_${today}`;
    
    try {
      const current = await AsyncStorage.getItem(key);
      const count = current ? parseInt(current) : 0;
      await AsyncStorage.setItem(key, (count + 1).toString());
    } catch (e) {
      console.error("Failed to update AI usage", e);
    }
  }
};
