import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';
import { aiService } from '../../api/aiService';
import { useUsageLimits } from '../../hooks/useUsageLimits';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export function AIAssistantScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Chào bạn! Mình là WanderBot, trợ lý du lịch AI của bạn. Mình có thể giúp gì cho chuyến đi sắp tới của bạn?', isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { checkLimit, incrementUsage } = useUsageLimits();

  const handleSend = async () => {
    if (!input.trim()) return;

    const allowed = await checkLimit('ai_diary', true);
    if (!allowed) return;

    const userText = input.trim();
    const userMsg: Message = { id: Date.now().toString(), text: userText, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => m.text);
      const response = await aiService.chatWithWanderBot(userText, history);
      
      await incrementUsage('ai_diary');
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: response, 
        isUser: false 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isUser ? styles.messageRowUser : styles.messageRowBot]}>
      {!item.isUser && (
        <LinearGradient colors={gradients.primary} style={styles.botAvatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </LinearGradient>
      )}
      <View style={[styles.messageBubble, item.isUser ? styles.messageBubbleUser : styles.messageBubbleBot]}>
        <Text style={[styles.messageText, item.isUser ? styles.messageTextUser : styles.messageTextBot]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WanderBot AI</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>WanderBot đang trả lời...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Hỏi WanderBot điều gì đó..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color={input.trim() ? colors.primary : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.base,
    padding: spacing.xs,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messageList: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowBot: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  messageBubble: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  messageBubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleBot: {
    backgroundColor: colors.inputBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 1,
  },
  messageText: {
    fontSize: typography.base,
    lineHeight: typography.base * 1.5,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextBot: {
    color: colors.text,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.base,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: typography.base,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
