import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastActive?: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export const messageService = {
  /**
   * Fetch recent chats for a user
   */
  async fetchRecentChats(userId: string): Promise<ChatContact[]> {
    if (!userId) return [];

    // Query to get all unique users the current user has chatted with
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id, content, created_at, status, sender_id, receiver_id,
        sender:profiles!sender_id(id, full_name, avatar_url),
        receiver:profiles!receiver_id(id, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching recent chats:", error);
      return [];
    }

    const contactsMap = new Map<string, ChatContact>();

    messages?.forEach((msg: any) => {
      const isSender = msg.sender_id === userId;
      const otherUser = isSender ? msg.receiver : msg.sender;
      
      // Handle aliased query results
      const profile = Array.isArray(otherUser) ? otherUser[0] : otherUser;
      
      if (!profile) return;

      if (!contactsMap.has(profile.id)) {
        // Parse time nicely
        const date = new Date(msg.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        contactsMap.set(profile.id, {
          id: profile.id,
          name: profile.full_name || 'Người dùng',
          avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
          isOnline: true, // Mock online status
          lastMessage: isSender ? `Bạn: ${msg.content}` : msg.content,
          time: timeStr,
          unread: (!isSender && msg.status !== 'read') ? 1 : 0
        });
      } else {
        const contact = contactsMap.get(profile.id)!;
        if (!isSender && msg.status !== 'read') {
          contact.unread += 1;
        }
      }
    });

    return Array.from(contactsMap.values());
  },

  /**
   * Fetch messages between two users
   */
  async fetchMessages(userId: string, otherUserId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return data as ChatMessage[];
  },

  /**
   * Send a new message
   */
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        status: 'sent'
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    return data as ChatMessage;
  },

  /**
   * Mark messages as read
   */
  async markAsRead(receiverId: string, senderId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('receiver_id', receiverId)
      .eq('sender_id', senderId)
      .eq('status', 'delivered');

    if (error) {
      console.error("Error marking messages as read:", error);
    }
  }
};
