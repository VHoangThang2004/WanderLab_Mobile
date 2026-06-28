import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { friendService, FriendProfile } from '../api/friendService';
import { useAuthStore } from '../stores/authStore';
import { UserAvatar } from './UserAvatar';
import { colors, typography, spacing, borderRadius } from '../theme';

export function SuggestedUsers() {
  const { user } = useAuthStore();
  const [suggested, setSuggested] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggested();
  }, [user]);

  const fetchSuggested = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await friendService.fetchSuggestedFriends(user.id);
      setSuggested(data);
    } catch (e) {
      console.warn("Failed to fetch suggested users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (profileId: string) => {
    if (!user) return;
    
    // Optimistic UI update
    setFollowingIds(prev => new Set(prev).add(profileId));
    
    try {
      await friendService.followUser(user.id, profileId);
    } catch (e) {
      console.warn("Follow error:", e);
      // Revert optimistic update
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (suggested.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gợi ý kết bạn</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggested.map((profile) => {
          const isFollowing = followingIds.has(profile.id);
          return (
            <View key={profile.id} style={styles.card}>
              <UserAvatar 
                src={profile.avatar_url} 
                name={profile.full_name || 'User'}
                style={styles.avatar} 
              />
              <Text style={styles.name} numberOfLines={1}>{profile.full_name}</Text>
              <Text style={styles.followers} numberOfLines={1}>
                {profile.followers_count || 0} người theo dõi
              </Text>

              <TouchableOpacity 
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={() => handleFollow(profile.id)}
                disabled={isFollowing}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.text,
  },
  seeAll: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
  },
  card: {
    width: 140,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  followers: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: '#f3f4f6',
  },
  followBtnText: {
    color: '#fff',
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  followingBtnText: {
    color: colors.text,
  },
});
