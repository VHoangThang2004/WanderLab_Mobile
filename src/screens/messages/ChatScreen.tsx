import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from '../../components/UserAvatar';
import { messageService, ChatMessage } from '../../api/messageService';
import { supabase } from '../../lib/supabase';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';

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
  const [isUploading, setIsUploading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();

    const channel = messageService.subscribeToMessages(user.id, (payload: any) => {
      const msg = payload.new as ChatMessage;
      if (!msg) return;
      if (msg.sender_id === contactId || msg.receiver_id === contactId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.receiver_id === user.id) {
          markMessagesAsRead();
        }
      }
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
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

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && user) {
        setIsUploading(true);
        const asset = result.assets[0];
        const media = await messageService.uploadChatMedia(asset.uri, asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
        if (media) {
          await messageService.sendMessage(user.id, contactId, 'Đã gửi một tệp đính kèm', media.url, media.type);
        }
        setIsUploading(false);
      }
    } catch (e) {
      console.warn(e);
      setIsUploading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0] && user) {
        setIsUploading(true);
        const asset = result.assets[0];
        const media = await messageService.uploadChatMedia(asset.uri, asset.mimeType || 'application/octet-stream');
        if (media) {
          await messageService.sendMessage(user.id, contactId, 'Đã gửi một tệp', media.url, media.type);
        }
        setIsUploading(false);
      }
    } catch (e) {
      console.warn(e);
      setIsUploading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && (
          <UserAvatar src={contactAvatar} name={contactName} style={styles.messageAvatar} />
        )}
        <View style={isMe ? styles.messageBubbleMeContainer : [styles.messageBubble, styles.messageBubbleOther]}>
          {isMe ? (
            <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.messageBubbleMe}>
              {item.media_url && item.media_type === 'image' && (
                <Image source={{ uri: item.media_url }} style={styles.messageMedia} contentFit="cover" />
              )}
              {item.media_url && item.media_type !== 'image' && (
                <View style={styles.fileAttachmentContainer}>
                  <Ionicons name="document-outline" size={24} color="#fff" />
                  <Text style={styles.fileAttachmentText}>Tệp đính kèm</Text>
                </View>
              )}
              <Text style={[styles.messageText, styles.messageTextMe]}>
                {item.content}
              </Text>
              <View style={styles.messageStatusRow}>
                <Text style={styles.messageTimeText}>
                  {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name={item.status === 'read' ? "checkmark-done" : "checkmark"} size={14} color="#rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          ) : (
            <View>
              {item.media_url && item.media_type === 'image' && (
                <Image source={{ uri: item.media_url }} style={styles.messageMedia} contentFit="cover" />
              )}
              {item.media_url && item.media_type !== 'image' && (
                <View style={[styles.fileAttachmentContainer, { backgroundColor: '#e5e7eb' }]}>
                  <Ionicons name="document-outline" size={24} color={colors.textSecondary} />
                  <Text style={[styles.fileAttachmentText, { color: colors.textSecondary }]}>Tệp đính kèm</Text>
                </View>
              )}
              <Text style={[styles.messageText, styles.messageTextOther]}>
                {item.content}
              </Text>
              <Text style={styles.messageTimeTextOther}>
                {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => setShowInfoModal(true)}>
          <UserAvatar src={contactAvatar} name={contactName} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{contactName}</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Call', { contactId, contactName, contactAvatar, isVideo: false })}
          >
            <Ionicons name="call-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Call', { contactId, contactName, contactAvatar, isVideo: true })}
          >
            <Ionicons name="videocam-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowInfoModal(true)}>
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} disabled={isUploading}>
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickDocument} disabled={isUploading}>
          <Ionicons name="attach-outline" size={24} color={colors.textSecondary} />
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

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết liên hệ</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <UserAvatar src={contactAvatar} name={contactName} style={styles.modalAvatar} />
              <Text style={styles.modalName}>{contactName}</Text>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalActionBtn}>
                  <Ionicons name="person-outline" size={24} color={colors.primary} />
                  <Text style={styles.modalActionText}>Xem hồ sơ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionBtn}>
                  <Ionicons name="search-outline" size={24} color={colors.primary} />
                  <Text style={styles.modalActionText}>Tìm kiếm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionBtn}>
                  <Ionicons name="notifications-off-outline" size={24} color={colors.textSecondary} />
                  <Text style={styles.modalActionText}>Tắt thông báo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  messageBubbleMeContainer: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  messageBubbleMe: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  messageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTimeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  messageTimeTextOther: {
    fontSize: 10,
    color: colors.textTertiary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  messageMedia: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  fileAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  fileAttachmentText: {
    color: '#fff',
    fontSize: typography.sm,
    fontWeight: typography.medium,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  modalBody: {
    alignItems: 'center',
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  modalName: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalActionBtn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalActionText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
});
