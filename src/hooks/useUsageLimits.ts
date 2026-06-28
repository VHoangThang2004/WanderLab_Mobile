import { useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';

export type ActionType = 'create_diary' | 'create_itinerary' | 'ai_diary' | 'ai_itinerary';

// Define limits based on plan
const PLAN_LIMITS = {
  free: {
    create_diary: 4,
    create_itinerary: 2,
    ai_diary: 8,
    ai_itinerary: 4,
    max_images: 5,
    max_videos: 1,
    max_video_res: 720, // 720p
  },
  plus: {
    create_diary: 10,
    create_itinerary: 5,
    ai_diary: 20,
    ai_itinerary: 10,
    max_images: 12,
    max_videos: 2,
    max_video_res: 1080, // 1080p
  },
  pro: {
    create_diary: 25,
    create_itinerary: 12,
    ai_diary: 50,
    ai_itinerary: 25,
    max_images: 30,
    max_videos: 5,
    max_video_res: 2160, // 4k
  },
};

const ERROR_MESSAGES_VI: Record<ActionType, string> = {
  create_diary: 'Bạn đã đạt giới hạn đăng bài Nhật Ký hôm nay. Hãy nâng cấp gói để đăng thêm nhé!',
  create_itinerary: 'Bạn đã đạt giới hạn tạo Lịch Trình hôm nay. Hãy nâng cấp gói để tạo thêm nhé!',
  ai_diary: 'Bạn đã hết lượt dùng AI Trợ lý Nhật Ký hôm nay. Hãy nâng cấp gói!',
  ai_itinerary: 'Bạn đã hết lượt dùng AI Trợ lý Lịch Trình hôm nay. Hãy nâng cấp gói!',
};

const ERROR_MESSAGES_EN: Record<ActionType, string> = {
  create_diary: 'You have reached your daily Journal post limit. Upgrade to post more!',
  create_itinerary: 'You have reached your daily Itinerary creation limit. Upgrade to create more!',
  ai_diary: 'You have used all your AI Journal Assist tokens for today. Upgrade for more!',
  ai_itinerary: 'You have used all your AI Itinerary Assist tokens for today. Upgrade for more!',
};

// Key prefix for AsyncStorage
const USAGE_KEY_PREFIX = 'wanderlab_usage_';

export function useUsageLimits() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const plan = (user as any)?.plan || 'free';
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS['free'];

  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const getUsageKey = (action: ActionType) => {
    return `${USAGE_KEY_PREFIX}${user?.id || 'guest'}_${action}_${getTodayDateString()}`;
  };

  const getUsage = async (action: ActionType): Promise<number> => {
    try {
      const key = getUsageKey(action);
      const val = await AsyncStorage.getItem(key);
      return val ? parseInt(val, 10) : 0;
    } catch (e) {
      return 0;
    }
  };

  const checkLimit = async (action: ActionType, showToast: boolean = true): Promise<boolean> => {
    const currentUsage = await getUsage(action);
    const limit = limits[action as keyof typeof limits] as number;

    if (currentUsage >= limit) {
      if (showToast) {
        const msgs = language === 'vi' ? ERROR_MESSAGES_VI : ERROR_MESSAGES_EN;
        Alert.alert(language === 'vi' ? 'Thông báo' : 'Notice', msgs[action]);
      }
      return false; // Limit reached
    }
    return true; // Limit not reached
  };

  const incrementUsage = async (action: ActionType) => {
    try {
      const key = getUsageKey(action);
      const currentUsage = await getUsage(action);
      await AsyncStorage.setItem(key, (currentUsage + 1).toString());
    } catch (e) {
      console.error('Failed to update usage limit', e);
    }
  };

  const resetUsage = async () => {
    try {
      const actions: ActionType[] = ['create_diary', 'create_itinerary', 'ai_diary', 'ai_itinerary'];
      for (const action of actions) {
        const key = getUsageKey(action);
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Failed to reset usage limits', e);
    }
  };

  const checkMediaLimits = (currentImages: number, newImages: number, currentVideos: number, newVideos: number) => {
    if (currentImages + newImages > limits.max_images) {
      Alert.alert(
        language === 'vi' ? 'Thông báo' : 'Notice',
        language === 'vi' ? `Bạn chỉ được tải lên tối đa ${limits.max_images} ảnh theo gói ${plan.toUpperCase()}.` : `You can only upload up to ${limits.max_images} images with the ${plan.toUpperCase()} plan.`
      );
      return false;
    }
    if (currentVideos + newVideos > limits.max_videos) {
      Alert.alert(
        language === 'vi' ? 'Thông báo' : 'Notice',
        language === 'vi' ? `Bạn chỉ được tải lên tối đa ${limits.max_videos} video theo gói ${plan.toUpperCase()}.` : `You can only upload up to ${limits.max_videos} videos with the ${plan.toUpperCase()} plan.`
      );
      return false;
    }
    return true;
  };

  return {
    limits,
    getUsage,
    checkLimit,
    incrementUsage,
    resetUsage,
    checkMediaLimits,
  };
}
