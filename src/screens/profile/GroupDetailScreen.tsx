import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, gradients } from '../../theme';

const { width } = Dimensions.get('window');

// Mock Data
const group = {
  id: '1',
  name: 'Phượt Miền Bắc',
  coverImage: 'https://images.unsplash.com/photo-1694152362587-99d77d21793b?w=1200',
  members: 248,
  posts: 1234,
  isPrivate: false,
  description: 'Chia sẻ kinh nghiệm du lịch các tỉnh miền Bắc Việt Nam.',
  createdDate: '15/01/2024',
};

const mockPosts = [
  {
    id: '1',
    author: { name: 'Nguyễn Văn A', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
    timestamp: '2 giờ trước',
    content: 'Vừa mới về từ chuyến phượt Hà Giang 4 ngày 3 đêm...',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    likes: 124, comments: 18, location: 'Hà Giang',
  }
];

export function GroupDetailScreen({ navigation, route }: any) {
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members'>('posts');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: group.coverImage }} style={styles.coverImage} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name={group.isPrivate ? 'lock-closed' : 'globe'} size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{group.isPrivate ? 'Riêng tư' : 'Công khai'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{group.members} thành viên</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>Đã tham gia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inviteBtn}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.inviteBtnText}>Mời</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['posts', 'about', 'members'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'posts' ? 'Bài viết' : tab === 'about' ? 'Giới thiệu' : 'Thành viên'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'posts' && (
            mockPosts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image source={{ uri: post.author.avatar }} style={styles.postAvatar} />
                  <View>
                    <Text style={styles.postAuthor}>{post.author.name}</Text>
                    <Text style={styles.postTime}>{post.timestamp} · {post.location}</Text>
                  </View>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                {post.image && <Image source={{ uri: post.image }} style={styles.postImage} contentFit="cover" />}
                <View style={styles.postActions}>
                  <Text style={styles.actionText}><Ionicons name="heart-outline" size={16} /> {post.likes}</Text>
                  <Text style={styles.actionText}><Ionicons name="chatbubble-outline" size={16} /> {post.comments}</Text>
                </View>
              </View>
            ))
          )}
          {activeTab === 'about' && (
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>{group.description}</Text>
              <Text style={styles.aboutMeta}>Ngày tạo: {group.createdDate}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  coverContainer: { width, height: 200, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: spacing.md, left: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  infoContainer: { backgroundColor: '#fff', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  groupName: { fontSize: typography['2xl'], fontWeight: typography.bold, color: colors.text, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  metaText: { fontSize: typography.sm, color: colors.textSecondary, marginLeft: 4 },
  metaDot: { marginHorizontal: spacing.sm, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  joinBtn: { flex: 1, paddingVertical: spacing.sm, backgroundColor: '#f3f4f6', borderRadius: borderRadius.md, alignItems: 'center' },
  joinBtnText: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  inviteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.md },
  inviteBtnText: { fontSize: typography.base, fontWeight: typography.semibold, color: '#fff' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },
  activeTabText: { color: colors.primary, fontWeight: typography.bold },
  contentContainer: { padding: spacing.md },
  postCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postAuthor: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  postTime: { fontSize: typography.xs, color: colors.textSecondary },
  postContent: { fontSize: typography.base, color: colors.text, marginBottom: spacing.sm },
  postImage: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  postActions: { flexDirection: 'row', gap: spacing.lg },
  actionText: { fontSize: typography.sm, color: colors.textSecondary },
  aboutCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: borderRadius.lg },
  aboutText: { fontSize: typography.base, color: colors.text, marginBottom: spacing.md },
  aboutMeta: { fontSize: typography.sm, color: colors.textSecondary },
});
