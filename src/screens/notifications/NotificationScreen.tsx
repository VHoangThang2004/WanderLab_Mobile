import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { notificationService, AppNotification } from '../../api/notificationService';
import { UserAvatar } from '../../components/UserAvatar';
import { colors, typography, spacing, borderRadius } from '../../theme';

export function NotificationScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      const sub = notificationService.subscribeToNotifications(user.id, () => {
        loadNotifications();
      });
      
      return () => {
        if (sub) sub.unsubscribe();
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.fetchNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.warn("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async (item: AppNotification) => {
    if (!item.is_read) {
      await notificationService.markAsRead(item.id);
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
    }
    
    // Navigate based on type
    if (item.type === 'like' || item.type === 'comment') {
      navigation.navigate('DiaryDetail', { id: item.reference_id });
    } else if (item.type === 'friend_request' || item.type === 'friend_accept') {
      navigation.navigate('Follows', { initialTab: 'friends' });
    }
  };

  const filteredData = filter === 'all' ? notifications : notifications.filter(n => !n.is_read);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'like': return <Ionicons name="heart" size={16} color="#ef4444" />;
      case 'comment': return <Ionicons name="chatbubble" size={16} color={colors.primary} />;
      case 'friend_request':
      case 'friend_accept':
      case 'follow': return <Ionicons name="person-add" size={16} color="#3b82f6" />;
      default: return <Ionicons name="information-circle" size={16} color="#f59e0b" />;
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000); // minutes
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return `${Math.floor(diff / 1440)} ngày trước`;
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const actorAvatar = item.actor?.avatar_url;
    const actorName = item.actor?.full_name || 'Hệ thống';
    
    return (
      <TouchableOpacity 
        style={[styles.notificationRow, !item.is_read && styles.unreadRow]}
        onPress={() => handlePress(item)}
      >
        <View style={styles.avatarContainer}>
          <UserAvatar src={actorAvatar} name={actorName} style={styles.avatar} />
          <View style={styles.iconBadge}>
            {getIconForType(item.type)}
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>
            <Text style={styles.userName}>{actorName} </Text>
            {item.content}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>

        {item.type === 'friend_request' && (
          <TouchableOpacity style={styles.followBtn} onPress={() => navigation.navigate('Follows', { initialTab: 'requests' })}>
            <Text style={styles.followBtnText}>Xem</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>Chưa đọc</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Chưa có thông báo nào.</Text>
            </View>
          }
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
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
  filterContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  unreadRow: {
    backgroundColor: '#f0f9ff', // Light blue background for unread
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  contentText: {
    fontSize: typography.sm,
    color: colors.text,
    lineHeight: 20,
  },
  userName: {
    fontWeight: typography.bold,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: typography.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
