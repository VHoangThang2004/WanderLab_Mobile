import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  user_name: string;
  avatar: string;
  content: string;
  time: string;
  is_read: boolean;
  diary_image?: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'like',
    user_name: 'Nguyễn Văn A',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    content: 'đã thích bài viết của bạn.',
    time: '5 phút trước',
    is_read: false,
    diary_image: 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=200',
  },
  {
    id: '2',
    type: 'comment',
    user_name: 'Trần Thị B',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    content: 'đã bình luận: "Cảnh đẹp quá bạn ơi!"',
    time: '1 giờ trước',
    is_read: false,
    diary_image: 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=200',
  },
  {
    id: '3',
    type: 'follow',
    user_name: 'Lê Hoàng C',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200',
    content: 'đã bắt đầu theo dõi bạn.',
    time: '2 ngày trước',
    is_read: true,
  },
  {
    id: '4',
    type: 'system',
    user_name: 'Hệ thống',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    content: 'Chào mừng bạn đến với WanderLab! Bắt đầu chia sẻ hành trình của bạn ngay.',
    time: '1 tuần trước',
    is_read: true,
  }
];

export function NotificationScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredData = filter === 'all' ? notifications : notifications.filter(n => !n.is_read);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'like': return <Ionicons name="heart" size={16} color="#ef4444" />;
      case 'comment': return <Ionicons name="chatbubble" size={16} color={colors.primary} />;
      case 'follow': return <Ionicons name="person-add" size={16} color="#3b82f6" />;
      default: return <Ionicons name="information-circle" size={16} color="#f59e0b" />;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity style={[styles.notificationRow, !item.is_read && styles.unreadRow]}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.iconBadge}>
          {getIconForType(item.type)}
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.contentText}>
          <Text style={styles.userName}>{item.user_name} </Text>
          {item.content}
        </Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>

      {item.diary_image && (
        <Image source={{ uri: item.diary_image }} style={styles.diaryImage} />
      )}
      {item.type === 'follow' && (
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followBtnText}>Theo dõi lại</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 40 }} />
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
  diaryImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
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
});
