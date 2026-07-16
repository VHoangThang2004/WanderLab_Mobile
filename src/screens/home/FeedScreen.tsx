import React from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DiaryPostCard } from '../../components/DiaryPostCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { UserAvatar } from '../../components/UserAvatar';
import { diaryService } from '../../api/diaryService';
import { interactionService } from '../../api/interactionService';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../stores/authStore';
import { colors as staticColors, gradients, typography, spacing, borderRadius } from '../../theme';


interface FeedScreenProps {
  navigation: any;
}

export function FeedScreen({ navigation }: FeedScreenProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  
  const styles = getStyles(colors, isDarkMode);

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


  const renderHeader = () => (
    <View>
      {/* Feed Title */}
      <View style={styles.feedHeader}>
        <View style={styles.feedHeaderIcon}>
          <Ionicons name="compass" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.feedTitle}>{t('feed.feedTitle')}</Text>
          <Text style={styles.feedSubtitle}>{t('feed.feedSubtitle')}</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <FlatList
        data={feedDiaries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          feedDiaries && feedDiaries.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title={t('feed.noDiaries')}
              message={t('feed.noDiariesMsg')}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <DiaryPostCard
            {...item}
            onPress={() => navigation.navigate('DiaryDetail', { id: item.id })}
            onLikePress={() => handleLike(item.id)}
            onBookmarkPress={() => handleBookmark(item.id)}
            onCommentPress={() => navigation.navigate('Comment', { diaryId: item.id })}
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
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },

  // Stories (Reels)
  storiesContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reelsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  reelsTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.text,
  },
  storiesScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  storyItem: {
    alignItems: 'center',
  },
  storyImageContainer: {
    width: 72,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  storyBg: {
    width: '100%',
    height: '100%',
  },
  storyAvatarContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
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
  reelPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -8,
    marginTop: -8,
  },
  createStory: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
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
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
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
