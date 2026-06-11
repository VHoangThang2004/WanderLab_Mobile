import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { friendService, FriendProfile } from '../../api/friendService';
import { useAuthStore } from '../../stores/authStore';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FollowsScreenProps {
  route: any;
  navigation: any;
}

export function FollowsScreen({ route, navigation }: FollowsScreenProps) {
  const { initialTab } = route.params || { initialTab: 'followers' };
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'friends'>(initialTab);
  
  const [data, setData] = useState({
    followers: [] as FriendProfile[],
    following: [] as FriendProfile[],
    friends: [] as FriendProfile[],
    requests: [] as FriendProfile[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await friendService.fetchFriendData(user.id);
      setData(result);
    } catch (e) {
      console.warn("Failed to fetch follows:", e);
    } finally {
      setLoading(false);
    }
  };

  const getActiveData = () => {
    switch(activeTab) {
      case 'followers': return data.followers;
      case 'following': return data.following;
      case 'friends': return data.friends;
      default: return [];
    }
  };

  const renderItem = ({ item }: { item: FriendProfile }) => (
    <View style={styles.userRow}>
      <Image 
        source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }} 
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{item.full_name}</Text>
        {item.location && <Text style={styles.userLocation}>{item.location}</Text>}
      </View>
      <TouchableOpacity style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>Xem</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.full_name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Người theo dõi ({data.followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Đang theo dõi ({data.following.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Bạn bè ({data.friends.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={getActiveData()}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Chưa có ai ở đây.</Text>
            </View>
          }
        />
      )}
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.base,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  userLocation: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#f3f4f6',
    borderRadius: borderRadius.md,
  },
  actionBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
});
