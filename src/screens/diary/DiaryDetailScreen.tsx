import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { diaryService } from '../../api/diaryService';
import { interactionService } from '../../api/interactionService';
import { useAuthStore } from '../../stores/authStore';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface DiaryDetailScreenProps {
  route: any;
  navigation: any;
}

export function DiaryDetailScreen({ route, navigation }: DiaryDetailScreenProps) {
  const { id } = route.params;
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: diary, isLoading } = useQuery({
    queryKey: ['diary', id],
    queryFn: () => diaryService.fetchDiaryById(id),
  });

  const handleLike = async () => {
    if (!user) return;
    setIsLiked(!isLiked);
    try {
      await interactionService.toggleLikeDiary(id, user.id);
    } catch (e) {
      setIsLiked(isLiked);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    setIsBookmarked(!isBookmarked);
    try {
      await interactionService.toggleBookmarkDiary(id, user.id);
    } catch (e) {
      setIsBookmarked(isBookmarked);
    }
  };

  if (isLoading || !diary) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: diary.image }} style={styles.heroImage} contentFit="cover" transition={300} />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroBottom}>
          <Text style={styles.heroTitle}>{diary.title || diary.location}</Text>
          <View style={styles.heroMeta}>
            <Ionicons name="location" size={14} color="#fff" />
            <Text style={styles.heroLocation}>{diary.location}, {diary.country}</Text>
          </View>
        </View>
      </View>

      {/* Author Bar */}
      <View style={styles.authorBar}>
        <View style={styles.authorLeft}>
          <Image source={{ uri: diary.author.avatar }} style={styles.authorAvatar} contentFit="cover" />
          <View>
            <Text style={styles.authorName}>{diary.author.name}</Text>
            <Text style={styles.authorStats}>
              {diary.author.diariesCount} nhật ký · {diary.author.followersCount} người theo dõi
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.followBtn}>
          <LinearGradient colors={gradients.primary} style={styles.followGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.followText}>Theo dõi</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Trust Score & Info */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <View style={[styles.infoBadge, { backgroundColor: colors.trustHigh + '20' }]}>
            <Ionicons name="shield-checkmark" size={16} color={colors.trustHigh} />
          </View>
          <Text style={styles.infoValue}>{diary.trustScore}%</Text>
          <Text style={styles.infoLabel}>Tin cậy</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoBadge, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="time" size={16} color={colors.info} />
          </View>
          <Text style={styles.infoValue}>{diary.duration}</Text>
          <Text style={styles.infoLabel}>Thời gian</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoBadge, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="wallet" size={16} color={colors.warning} />
          </View>
          <Text style={styles.infoValue}>{diary.totalBudget}</Text>
          <Text style={styles.infoLabel}>Ngân sách</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="people" size={16} color={colors.primary} />
          </View>
          <Text style={styles.infoValue}>{diary.groupSize}</Text>
          <Text style={styles.infoLabel}>Nhóm</Text>
        </View>
      </View>

      {/* Description */}
      {diary.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô Tả</Text>
          <Text style={styles.description}>{diary.description}</Text>
        </View>
      ) : null}

      {/* Timeline */}
      {diary.timeline.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch Trình Theo Ngày</Text>
          {diary.timeline.map((day) => (
            <View key={day.day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <LinearGradient colors={gradients.primary} style={styles.dayBadge}>
                  <Text style={styles.dayNumber}>Ngày {day.day}</Text>
                </LinearGradient>
                <Text style={styles.dayTitle}>{day.title}</Text>
              </View>
              {day.activities.map((act, idx) => (
                <View key={idx} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <Text style={styles.activityText}>{act}</Text>
                </View>
              ))}
              {day.budget && (
                <View style={styles.dayBudgetRow}>
                  <Ionicons name="wallet-outline" size={12} color={colors.textTertiary} />
                  <Text style={styles.dayBudget}>{day.budget}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Budget Breakdown */}
      {diary.budgetBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi Tiết Ngân Sách</Text>
          {diary.budgetBreakdown.map((item, idx) => (
            <View key={idx} style={styles.budgetRow}>
              <Text style={styles.budgetCategory}>{item.category}</Text>
              <View style={styles.budgetBarContainer}>
                <View style={[styles.budgetBar, { width: `${item.percentage}%` }]} />
              </View>
              <Text style={styles.budgetAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tips */}
      {diary.tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Mẹo Du Lịch</Text>
          {diary.tips.map((tip, idx) => (
            <View key={idx} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? colors.primary : colors.text} />
          <Text style={[styles.actionLabel, isLiked && { color: colors.primary }]}>
            {diary.likesCount + (isLiked ? 1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          <Text style={styles.actionLabel}>{diary.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={isBookmarked ? colors.primary : colors.text} />
          <Text style={[styles.actionLabel, isBookmarked && { color: colors.primary }]}>Lưu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
          <Text style={styles.actionLabel}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: spacing['3xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  heroContainer: { width, height: width * 0.75, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute', top: 50, left: spacing.base,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  heroBottom: { position: 'absolute', bottom: spacing.lg, left: spacing.base, right: spacing.base },
  heroTitle: { fontSize: typography['2xl'], fontWeight: typography.bold, color: '#fff', marginBottom: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation: { fontSize: typography.base, color: 'rgba(255,255,255,0.9)' },
  // Author
  authorBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  authorLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.primary },
  authorName: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  authorStats: { fontSize: typography.xs, color: colors.textSecondary },
  followBtn: { borderRadius: borderRadius.full, overflow: 'hidden' },
  followGradient: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  followText: { fontSize: typography.sm, fontWeight: typography.semibold, color: '#fff' },
  // Info Grid
  infoGrid: {
    flexDirection: 'row', padding: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoBadge: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoValue: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.text },
  infoLabel: { fontSize: 10, color: colors.textTertiary },
  // Sections
  section: { padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.md },
  description: { fontSize: typography.base, color: colors.textSecondary, lineHeight: 22 },
  // Timeline
  dayCard: {
    backgroundColor: '#f9fafb', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  dayBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  dayNumber: { fontSize: typography.xs, fontWeight: typography.bold, color: '#fff' },
  dayTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text, flex: 1 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginLeft: spacing.lg, marginBottom: 6 },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  activityText: { fontSize: typography.sm, color: colors.textSecondary, flex: 1 },
  dayBudgetRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: spacing.lg, marginTop: 4 },
  dayBudget: { fontSize: typography.xs, color: colors.textTertiary },
  // Budget
  budgetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  budgetCategory: { width: 80, fontSize: typography.sm, color: colors.textSecondary },
  budgetBarContainer: { flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4 },
  budgetBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  budgetAmount: { width: 70, fontSize: typography.sm, fontWeight: typography.medium, color: colors.text, textAlign: 'right' },
  // Tips
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  tipText: { fontSize: typography.base, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: spacing.base, paddingHorizontal: spacing.base,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: '#fff',
  },
  actionButton: { alignItems: 'center', gap: 2 },
  actionLabel: { fontSize: typography.xs, color: colors.textSecondary, fontWeight: typography.medium },
});
