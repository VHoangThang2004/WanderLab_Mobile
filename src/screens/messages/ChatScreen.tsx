import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { messageService, ChatMessage } from '../../api/messageService';
import { supabase } from '../../lib/supabase';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ChatScreenProps {
  route: any;
  navigation: any;
}

export function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { contactId, contactName, contactAvatar } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();

    // Subscribe to new messages using Supabase realtime
    const subscription = supabase
      .channel(`chat_${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user?.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user?.id}))`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          if (payload.new.receiver_id === user?.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [contactId, user]);

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await messageService.fetchMessages(user.id, contactId);
      setMessages(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user) return;
    try {
      await messageService.markAsRead(user.id, contactId);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    
    setSending(true);
    try {
      // Optimistic update
      const tempMsg: ChatMessage = {
        id: Date.now().toString(),
        sender_id: user.id,
        receiver_id: contactId,
        content: newMessage.trim(),
        status: 'sent',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMsg]);
      const contentToSend = newMessage.trim();
      setNewMessage('');
      
      const savedMsg = await messageService.sendMessage(user.id, contactId, contentToSend);
      if (savedMsg) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? savedMsg : m));
      }
    } catch (e) {
      console.warn('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && (
          <Image source={{ uri: contactAvatar }} style={styles.messageAvatar} contentFit="cover" />
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Image source={{ uri: contactAvatar }} style={styles.headerAvatar} contentFit="cover" />
          <View>
            <Text style={styles.headerName}>{contactName}</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="information-circle-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Nhắn tin..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  headerName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  headerStatus: {
    fontSize: typography.xs,
    color: '#4ade80', // Green
  },
  actionButton: {
    padding: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
  },
  messageWrapperOther: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.base,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  attachButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: typography.base,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
