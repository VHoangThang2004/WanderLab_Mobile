import React from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DiaryPostCard } from '../../components/DiaryPostCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { SuggestedUsers } from '../../components/SuggestedUsers';
import { diaryService } from '../../api/diaryService';
import { interactionService } from '../../api/interactionService';
import { useAuthStore } from '../../stores/authStore';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

const stories = [
  { name: 'Phan Minh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', bg: 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=300' },
  { name: 'Hương Trần', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', bg: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300' },
  { name: 'Nam Nguyễn', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', bg: 'https://images.unsplash.com/photo-1694152362587-99d77d21793b?w=300' },
  { name: 'Linh Phạm', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', bg: 'https://images.unsplash.com/photo-1643030080539-b411caf44c37?w=300' },
  { name: 'Tuấn Lê', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', bg: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=300' },
];

interface FeedScreenProps {
  navigation: any;
}

export function FeedScreen({ navigation }: FeedScreenProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: feedDiaries, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feedDiaries'],
    queryFn: diaryService.fetchFeedDiaries,
  });

  const handleLike = async (diaryId: string) => {
    if (!user) return;
    try {
      await interactionService.toggleLikeDiary(diaryId, user.id);
    } catch (e) {
      console.warn('Like failed', e);
    }
  };

  const handleBookmark = async (diaryId: string) => {
    if (!user) return;
    try {
      await interactionService.toggleBookmarkDiary(diaryId, user.id);
    } catch (e) {
      console.warn('Bookmark failed', e);
    }
  };

  const renderStory = ({ item, index }: { item: typeof stories[0]; index: number }) => (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.8}>
      <View style={styles.storyImageContainer}>
        <Image source={{ uri: item.bg }} style={styles.storyBg} contentFit="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
        <View style={styles.storyAvatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.storyAvatar} contentFit="cover" />
        </View>
        <Text style={styles.storyName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={gradients.primary} style={styles.headerLogo}>
            <Ionicons name="compass" size={20} color="#fff" />
          </LinearGradient>
          <Text style={styles.headerTitle}>WanderLab</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('MessageList')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories */}
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
          {/* Create Story */}
          <TouchableOpacity 
            style={styles.storyItem} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateDiary')}
          >
            <View style={[styles.storyImageContainer, styles.createStory]}>
              <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.createStoryBg}>
                <View style={styles.createStoryIcon}>
                  <Ionicons name="add" size={24} color="#fff" />
                </View>
                <Text style={styles.createStoryText}>Tạo mới</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
          {stories.map((story, idx) => (
            <View key={idx}>{renderStory({ item: story, index: idx })}</View>
          ))}
        </ScrollView>
      </View>

      <SuggestedUsers />

      {/* Feed Title */}
      <View style={styles.feedHeader}>
        <View style={styles.feedHeaderIcon}>
          <Ionicons name="compass" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.feedTitle}>Bảng Tin Du Lịch</Text>
          <Text style={styles.feedSubtitle}>Câu chuyện từ cộng đồng</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedDiaries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="Chưa có nhật ký nào"
            message="Hãy tạo nhật ký đầu tiên hoặc theo dõi ai đó!"
          />
        }
        renderItem={({ item }) => (
          <DiaryPostCard
            {...item}
            onPress={() => navigation.navigate('DiaryDetail', { id: item.id })}
            onLikePress={() => handleLike(item.id)}
            onBookmarkPress={() => handleBookmark(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.extrabold,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stories
  storiesContainer: {
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  storiesScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  storyItem: {
    marginRight: spacing.sm,
  },
  storyImageContainer: {
    width: 72,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  storyBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  storyAvatarContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
  },
  storyName: {
    fontSize: 9,
    fontWeight: typography.semibold,
    color: '#fff',
    padding: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  createStory: {
    backgroundColor: '#f3f4f6',
  },
  createStoryBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  createStoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createStoryText: {
    fontSize: 9,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  // Feed header
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  feedHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  feedTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  feedSubtitle: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
});
