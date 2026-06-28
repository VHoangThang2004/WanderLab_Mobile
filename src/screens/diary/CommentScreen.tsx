import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interactionService, Comment } from '../../api/interactionService';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from '../../components/UserAvatar';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { formatDistanceToNow } from '../../lib/utils'; // if exists, or I will write a small local helper

// Local helper just in case
const timeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
};

export function CommentScreen({ route, navigation }: any) {
  const { diaryId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', diaryId],
    queryFn: () => interactionService.fetchComments(diaryId),
  });

  const mutation = useMutation({
    mutationFn: (text: string) => interactionService.addComment(diaryId, user!.id, text),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['comments', diaryId] });
      queryClient.invalidateQueries({ queryKey: ['diary', diaryId] }); // Update count in detail
    },
  });

  const handleSend = () => {
    if (!content.trim() || !user) return;
    mutation.mutate(content.trim());
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentRow}>
      <UserAvatar 
        src={item.author.avatar_url} 
        name={item.author.full_name || 'User'}
        style={styles.avatar} 
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{item.author.full_name}</Text>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bình luận</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 24}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            renderItem={renderComment}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <UserAvatar 
            src={user?.avatar_url} 
            name={user?.full_name || 'User'}
            style={styles.myAvatar} 
          />
          <TextInput
            style={styles.input}
            placeholder="Thêm bình luận..."
            placeholderTextColor={colors.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !content.trim() && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!content.trim() || mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="send" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex1: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.text,
  },
  listContent: {
    padding: spacing.base,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    fontSize: typography.base,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: 2,
  },
  authorName: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.text,
  },
  timeText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: typography.base,
    color: colors.text,
    lineHeight: 20,
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
  myAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 6,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: typography.base,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
