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
import Constants from 'expo-constants';
import { Audio } from 'expo-av';

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
  
  // Recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // CRUD state
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);

  useEffect(() => {
    if (!user) return;
    
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
      if (recording) recording.stopAndUnloadAsync();
      if (recordingTimer.current) clearInterval(recordingTimer.current);
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
      
      let savedMsg: any;
      if (editingMessage) {
        await messageService.updateMessage(editingMessage.id, user.id, contentToSend);
        savedMsg = { ...editingMessage, content: contentToSend };
        setMessages(prev => prev.map(m => m.id === editingMessage.id ? savedMsg : m));
        setEditingMessage(null);
      } else {
        savedMsg = await messageService.sendMessage(user.id, contactId, contentToSend);
        if (savedMsg) {
          setMessages(prev => prev.map(m => m.id === tempMsg.id ? savedMsg : m));
        }
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

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording || !user) return;
    setIsRecording(false);
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        setIsUploading(true);
        const media = await messageService.uploadChatMedia(uri, 'audio/m4a');
        if (media) {
          await messageService.sendMessage(user.id, contactId, 'Tin nhắn thoại', media.url, media.type);
        }
        setIsUploading(false);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsUploading(false);
    }
    setRecording(null);
  };

  const handleLongPressMessage = (msg: ChatMessage) => {
    setSelectedMessage(msg);
    setShowContextMenu(true);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !user) return;
    try {
      await messageService.deleteMessage(selectedMessage.id, user.id);
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, content: 'Tin nhắn đã được thu hồi', media_url: undefined, media_type: undefined } : m));
    } catch (e) {
      console.warn('Delete failed', e);
    }
    setShowContextMenu(false);
    setSelectedMessage(null);
  };

  const handleEditMessage = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setNewMessage(selectedMessage.content);
    setShowContextMenu(false);
  };

  const handleReact = async (reaction: string) => {
    if (!selectedMessage || !user) return;
    try {
      await messageService.reactToMessage(selectedMessage.id, user.id, reaction);
      // Optimistic
      setMessages(prev => prev.map(m => {
        if (m.id === selectedMessage.id) {
          const reactions = m.reactions || {};
          let list = reactions[reaction] || [];
          if (list.includes(user.id)) list = list.filter(id => id !== user.id);
          else list = [...list, user.id];
          return { ...m, reactions: { ...reactions, [reaction]: list } };
        }
        return m;
      }));
    } catch (e) {
      console.warn(e);
    }
    setShowContextMenu(false);
    setSelectedMessage(null);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id === user?.id;
    const hasReactions = item.reactions && Object.keys(item.reactions).length > 0;
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && (
          <UserAvatar src={contactAvatar} name={contactName} style={styles.messageAvatar} />
        )}
        <TouchableOpacity 
          onLongPress={() => handleLongPressMessage(item)} 
          delayLongPress={300}
          activeOpacity={0.9}
          style={isMe ? styles.messageBubbleMeContainer : [styles.messageBubble, styles.messageBubbleOther]}
        >
          {isMe ? (
            <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.messageBubbleMe}>
              {item.media_url && item.media_type === 'image' && (
                <Image source={{ uri: item.media_url }} style={styles.messageMedia} contentFit="cover" />
              )}
              {item.media_url && item.media_type === 'audio' && (
                <View style={styles.fileAttachmentContainer}>
                  <Ionicons name="mic-circle-outline" size={32} color="#fff" />
                  <Text style={styles.fileAttachmentText}>Tin nhắn thoại</Text>
                </View>
              )}
              {item.media_url && item.media_type !== 'image' && item.media_type !== 'audio' && (
                <View style={styles.fileAttachmentContainer}>
                  <Ionicons name="document-outline" size={24} color="#fff" />
                  <Text style={styles.fileAttachmentText}>Tệp đính kèm</Text>
                </View>
              )}
              <Text style={[styles.messageText, styles.messageTextMe, item.content === 'Tin nhắn đã được thu hồi' && { fontStyle: 'italic', opacity: 0.8 }]}>
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
              {item.media_url && item.media_type === 'audio' && (
                <View style={[styles.fileAttachmentContainer, { backgroundColor: '#e5e7eb' }]}>
                  <Ionicons name="mic-circle-outline" size={32} color={colors.textSecondary} />
                  <Text style={[styles.fileAttachmentText, { color: colors.textSecondary }]}>Tin nhắn thoại</Text>
                </View>
              )}
              {item.media_url && item.media_type !== 'image' && item.media_type !== 'audio' && (
                <View style={[styles.fileAttachmentContainer, { backgroundColor: '#e5e7eb' }]}>
                  <Ionicons name="document-outline" size={24} color={colors.textSecondary} />
                  <Text style={[styles.fileAttachmentText, { color: colors.textSecondary }]}>Tệp đính kèm</Text>
                </View>
              )}
              <Text style={[styles.messageText, styles.messageTextOther, item.content === 'Tin nhắn đã được thu hồi' && { fontStyle: 'italic', opacity: 0.8 }]}>
                {item.content}
              </Text>
              <Text style={styles.messageTimeTextOther}>
                {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}

          {/* Reactions */}
          {hasReactions && (
            <View style={[styles.reactionsContainer, isMe ? styles.reactionsMe : styles.reactionsOther]}>
              {Object.entries(item.reactions!).map(([r, users]) => (
                <View key={r} style={styles.reactionBadge}>
                  <Text style={styles.reactionText}>{r} {users.length > 1 ? users.length : ''}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
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
            onPress={() => {
              if (Constants.appOwnership === 'expo') {
                import('react-native').then(({ Alert }) => {
                  Alert.alert('Không khả dụng', 'Tính năng Gọi Video/Audio Native không hỗ trợ trên ứng dụng Expo Go. Vui lòng build Dev Client để thử nghiệm.');
                });
                return;
              }
              navigation.navigate('Call', { contactId, contactName, contactAvatar, isVideo: false })
            }}
          >
            <Ionicons name="call-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              if (Constants.appOwnership === 'expo') {
                import('react-native').then(({ Alert }) => {
                  Alert.alert('Không khả dụng', 'Tính năng Gọi Video/Audio Native không hỗ trợ trên ứng dụng Expo Go. Vui lòng build Dev Client để thử nghiệm.');
                });
                return;
              }
              navigation.navigate('Call', { contactId, contactName, contactAvatar, isVideo: true })
            }}
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
      {editingMessage && (
        <View style={styles.editingBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.editingTitle}>Đang sửa tin nhắn</Text>
            <Text style={styles.editingDesc} numberOfLines={1}>{editingMessage.content}</Text>
          </View>
          <TouchableOpacity onPress={() => { setEditingMessage(null); setNewMessage(''); }}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {!isRecording ? (
          <>
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
            {newMessage.trim() || editingMessage ? (
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
            ) : (
              <TouchableOpacity 
                style={styles.micButton}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={isUploading}
              >
                <Ionicons name="mic" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.recordingText}>
              Đang ghi âm... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.recordingHint}>Thả ra để gửi</Text>
          </View>
        )}
      </View>
      </KeyboardAvoidingView>

      {/* Context Menu Modal */}
      <Modal visible={showContextMenu} animationType="fade" transparent={true} onRequestClose={() => setShowContextMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowContextMenu(false)}>
          <View style={styles.contextMenu}>
            <View style={styles.emojiRow}>
              {['❤️', '👍', '😆', '😮', '😢', '😡'].map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => handleReact(emoji)} style={styles.emojiBtn}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.contextDivider} />
            {selectedMessage?.sender_id === user?.id && selectedMessage?.content !== 'Tin nhắn đã được thu hồi' && (
              <>
                <TouchableOpacity style={styles.contextActionBtn} onPress={handleEditMessage}>
                  <Ionicons name="pencil-outline" size={20} color={colors.text} />
                  <Text style={styles.contextActionText}>Chỉnh sửa tin nhắn</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contextActionBtn} onPress={handleDeleteMessage}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.contextActionText, { color: colors.error }]}>Thu hồi tin nhắn</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.contextActionBtn} onPress={() => setShowContextMenu(false)}>
              <Ionicons name="close-outline" size={20} color={colors.text} />
              <Text style={styles.contextActionText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: spacing.sm,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editingTitle: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  editingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginBottom: 2,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  recordingText: {
    fontSize: typography.base,
    color: colors.error,
    fontWeight: typography.medium,
  },
  recordingHint: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  contextMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    width: '80%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  emojiBtn: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  emojiText: {
    fontSize: 24,
  },
  contextDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  contextActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  contextActionText: {
    fontSize: typography.base,
    color: colors.text,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -10,
    zIndex: 2,
    gap: 4,
  },
  reactionsMe: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  reactionsOther: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  reactionBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  reactionText: {
    fontSize: 10,
    color: colors.text,
  },
});
