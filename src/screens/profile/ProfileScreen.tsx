import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { DiaryPostCard } from '../../components/DiaryPostCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { diaryService } from '../../api/diaryService';
import { useAuthStore } from '../../stores/authStore';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout } = useAuthStore();

  const { data: myDiaries, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myDiaries'],
    queryFn: diaryService.fetchMyDiaries,
    enabled: !!user,
  });

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
      }
    >
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        {user.cover_image_url ? (
          <Image source={{ uri: user.cover_image_url }} style={styles.coverImage} contentFit="cover" />
        ) : (
          <LinearGradient colors={gradients.hero} style={styles.coverImage} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill} />

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Avatar + Name */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatar_url || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200' }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.avatarBorder} />
        </View>
        <Text style={styles.userName}>{user.full_name || 'Người dùng'}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.bio && <Text style={styles.userBio}>{user.bio}</Text>}
        {user.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locationText}>{user.location}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.diaries_count}</Text>
          <Text style={styles.statLabel}>Nhật ký</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.followers_count}</Text>
          <Text style={styles.statLabel}>Người theo dõi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.following_count}</Text>
          <Text style={styles.statLabel}>Đang theo dõi</Text>
        </View>
      </View>

      {/* Plan Badge */}
      <View style={styles.planContainer}>
        <LinearGradient
          colors={user.plan === 'free' ? ['#e5e7eb', '#d1d5db'] : gradients.primary}
          style={styles.planBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name={user.plan === 'free' ? 'star-outline' : 'star'} size={14} color={user.plan === 'free' ? '#6b7280' : '#fff'} />
          <Text style={[styles.planText, user.plan === 'free' && { color: '#6b7280' }]}>
            {user.plan === 'free' ? 'Free Plan' : user.plan === 'starter' ? 'Starter Plan' : 'Professional Plan'}
          </Text>
        </LinearGradient>
      </View>

      {/* My Diaries */}
      <View style={styles.diariesSection}>
        <Text style={styles.sectionTitle}>Nhật Ký Của Tôi</Text>
        {isLoading ? (
          <LoadingSpinner size="small" />
        ) : myDiaries && myDiaries.length > 0 ? (
          myDiaries.map((diary) => (
            <DiaryPostCard
              key={diary.id}
              {...diary}
              onPress={() => navigation.navigate('DiaryDetail', { id: diary.id })}
            />
          ))
        ) : (
          <EmptyState
            icon="book-outline"
            title="Chưa có nhật ký"
            message="Hãy tạo nhật ký đầu tiên của bạn!"
          />
        )}
      </View>

      <View style={{ height: spacing['3xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  // Cover
  coverContainer: { width, height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  settingsBtn: {
    position: 'absolute', top: 50, right: spacing.base,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  // Profile
  profileHeader: { alignItems: 'center', marginTop: -44, paddingHorizontal: spacing.base },
  avatarContainer: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarBorder: {
    position: 'absolute', inset: -3,
    width: 94, height: 94, borderRadius: 47,
    borderWidth: 3, borderColor: '#fff',
  },
  userName: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text, marginTop: spacing.sm },
  userEmail: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  userBio: { fontSize: typography.base, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  locationText: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.medium },
  // Stats
  statsBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.lg, marginHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    backgroundColor: '#f9fafb', borderRadius: borderRadius.xl,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.text },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  // Plan
  planContainer: { alignItems: 'center', marginTop: spacing.base },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  planText: { fontSize: typography.sm, fontWeight: typography.semibold, color: '#fff' },
  // Diaries
  diariesSection: { marginTop: spacing.lg },
  sectionTitle: {
    fontSize: typography.lg, fontWeight: typography.bold, color: colors.text,
    paddingHorizontal: spacing.base, marginBottom: spacing.md,
  },
});
