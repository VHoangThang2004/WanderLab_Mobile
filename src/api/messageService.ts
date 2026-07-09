import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  reactions?: Record<string, string[]>;
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

  async sendMessage(senderId: string, receiverId: string, content: string, mediaUrl?: string, mediaType?: string): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
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
   * Upload media to storage (React Native adaptation)
   */
  async uploadChatMedia(uri: string, type: string = 'image/jpeg'): Promise<{ url: string; type: string } | null> {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(filePath, arrayBuffer, {
          contentType: type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage.from('chat_media').getPublicUrl(filePath);
      return {
        url: data.publicUrl,
        type: type.startsWith('image/') ? 'image' : 'file'
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  },

  /**
   * React to a message
   */
  async reactToMessage(messageId: string, userId: string, reaction: string): Promise<void> {
    // First, get the current reactions
    const { data: msg } = await supabase.from('messages').select('reactions').eq('id', messageId).single();
    if (!msg) return;

    let reactions: Record<string, string[]> = msg.reactions || {};
    
    // Toggle reaction logic
    if (reactions[reaction]) {
      if (reactions[reaction].includes(userId)) {
        reactions[reaction] = reactions[reaction].filter(id => id !== userId);
        if (reactions[reaction].length === 0) {
          delete reactions[reaction];
        }
      } else {
        reactions[reaction].push(userId);
      }
    } else {
      reactions[reaction] = [userId];
    }

    const { error } = await supabase.from('messages').update({ reactions }).eq('id', messageId);
    if (error) {
      console.error("Error reacting to message:", error);
    }
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
      .neq('status', 'read');

    if (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  /**
   * Subscribe to messages in real-time
   */
  subscribeToMessages(userId: string, onNewMessage: (payload: any) => void) {
    if (!userId) return null;

    const channelName = `messages_sync_${userId}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const record = (payload.new && Object.keys(payload.new as object).length > 0) ? payload.new : payload.old;
          const typedRecord = record as Record<string, any>;
          // Ensure the message involves the current user
          if (typedRecord && (typedRecord.receiver_id === userId || typedRecord.sender_id === userId)) {
            onNewMessage(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime synced for user: ${userId}`);
        }
      });

    return channel;
  }
};
