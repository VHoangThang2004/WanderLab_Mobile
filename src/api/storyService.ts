import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';

export interface StoryItem {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  author: {
    name: string;
    avatar: string;
  };
}

export const storyService = {
  /**
   * Tải ảnh Story lên (Giả lập bằng cách dùng URI gốc)
   */
  async uploadStoryImage(uri: string): Promise<string> {
    return uri;
  },

  /**
   * Tạo story mới (Giả lập bằng AsyncStorage)
   */
  async createStory(imageUrl: string, caption?: string): Promise<any> {
    const user = useAuthStore.getState().user;
    
    const newStory: StoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: user?.id || 'mock-id',
      image_url: imageUrl,
      caption: caption || null,
      created_at: new Date().toISOString(),
      author: {
        name: user?.full_name || 'Người dùng',
        avatar: user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      }
    };

    const storedStr = await AsyncStorage.getItem('wanderlab_stories');
    const storedStories = storedStr ? JSON.parse(storedStr) : [];
    storedStories.push(newStory);
    await AsyncStorage.setItem('wanderlab_stories', JSON.stringify(storedStories));

    return newStory;
  },

  /**
   * Lấy toàn bộ các tin đang hoạt động (Giả lập)
   */
  async fetchActiveStories(): Promise<StoryItem[]> {
    try {
      const storedStr = await AsyncStorage.getItem('wanderlab_stories');
      const storedStories = storedStr ? JSON.parse(storedStr) : [];
      
      if (storedStories.length === 0) {
        return [];
      }

      // Sort by created_at desc
      return storedStories.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.warn("fetchActiveStories failed", err);
      return [];
    }
  },

  /**
   * Cập nhật nội dung mô tả của Story (Giả lập)
   */
  async updateStory(id: string, newCaption: string): Promise<any> {
    const storedStr = await AsyncStorage.getItem('wanderlab_stories');
    const storedStories = storedStr ? JSON.parse(storedStr) : [];
    const storyIndex = storedStories.findIndex((s: StoryItem) => s.id === id);
    
    if (storyIndex > -1) {
      storedStories[storyIndex].caption = newCaption;
      await AsyncStorage.setItem('wanderlab_stories', JSON.stringify(storedStories));
      return storedStories[storyIndex];
    }
    throw new Error('Story not found');
  },

  /**
   * Xoá Story (Giả lập)
   */
  async deleteStory(id: string): Promise<void> {
    const storedStr = await AsyncStorage.getItem('wanderlab_stories');
    const storedStories = storedStr ? JSON.parse(storedStr) : [];
    const filteredStories = storedStories.filter((s: StoryItem) => s.id !== id);
    await AsyncStorage.setItem('wanderlab_stories', JSON.stringify(filteredStories));
  }
};
