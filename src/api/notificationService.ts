import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string; // 'friend_request', 'friend_accept', 'message', 'like', etc.
  content: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export const notificationService = {
  /**
   * Fetch user notifications
   */
  async fetchNotifications(userId: string): Promise<AppNotification[]> {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(id, full_name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    // Handle aliased profiles (could be array or object depending on relation)
    return data.map(n => ({
      ...n,
      actor: Array.isArray(n.actor) ? n.actor[0] : n.actor
    })) as AppNotification[];
  },

  /**
   * Create a notification
   */
  async createNotification(userId: string, actorId: string, type: string, content: string, referenceId?: string) {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      actor_id: actorId,
      type,
      content,
      reference_id: referenceId
    });
    
    if (error) {
      console.error("Error creating notification:", error);
    }
  },

  /**
   * Mark as read
   */
  async markAsRead(notificationId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  },

  /**
   * Subscribe to new notifications
   */
  subscribeToNotifications(userId: string, onNotification: (payload: any) => void) {
    if (!userId) return null;

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          onNotification(payload);
        }
      )
      .subscribe();

    return channel;
  }
};
