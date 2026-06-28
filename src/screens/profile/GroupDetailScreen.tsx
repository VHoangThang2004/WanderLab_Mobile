import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAvatar } from '../../components/UserAvatar';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { GradientButton } from '../../components/GradientButton';

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

const mockMembers = [
  { id: '1', name: 'Nguyễn Văn A', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
  { id: '2', name: 'Trần Thị B', role: 'Thành viên', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
];

export function GroupDetailScreen({ navigation, route }: any) {
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members'>('posts');
  const [isJoined, setIsJoined] = useState(true);
  const [showPostInput, setShowPostInput] = useState(false);
  const [newPost, setNewPost] = useState('');

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
            <TouchableOpacity 
              style={[styles.joinBtn, !isJoined && { backgroundColor: colors.primary }]}
              onPress={() => setIsJoined(!isJoined)}
            >
              <Text style={[styles.joinBtnText, !isJoined && { color: '#fff' }]}>{isJoined ? 'Rời nhóm' : 'Tham gia nhóm'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inviteBtn}>
              <Ionicons name="person-add" size={18} color={colors.text} />
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
            <View>
              {/* Create Post */}
              <View style={styles.createPostCard}>
                {!showPostInput ? (
                  <TouchableOpacity style={styles.createPostBtn} onPress={() => setShowPostInput(true)}>
                    <Text style={styles.createPostPlaceholder}>Bạn muốn chia sẻ điều gì?</Text>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <TextInput 
                      style={styles.createPostInput}
                      placeholder="Chia sẻ trải nghiệm của bạn..."
                      multiline
                      value={newPost}
                      onChangeText={setNewPost}
                    />
                    <View style={styles.createPostActions}>
                      <View style={styles.createPostIcons}>
                        <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                        <Ionicons name="location-outline" size={24} color={colors.textSecondary} />
                        <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.cancelPostBtn} onPress={() => { setShowPostInput(false); setNewPost(''); }}>
                          <Text style={{ fontWeight: '600', color: colors.text }}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitPostBtn}>
                          <Text style={{ fontWeight: '600', color: '#fff' }}>Đăng</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Posts */}
              {mockPosts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <UserAvatar src={post.author.avatar} name={post.author.name} />
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
                    <Text style={styles.actionText}><Ionicons name="share-social-outline" size={16} /> Chia sẻ</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'about' && (
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>Giới thiệu</Text>
              <Text style={styles.aboutText}>{group.description}</Text>
              <View style={styles.aboutDivider} />
              <Text style={styles.aboutTitle}>Thông tin</Text>
              <View style={styles.aboutInfoRow}>
                <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.aboutInfoText}>{group.members} thành viên</Text>
              </View>
              <View style={styles.aboutInfoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.aboutInfoText}>Được tạo ngày {group.createdDate}</Text>
              </View>
              <View style={styles.aboutInfoRow}>
                <Ionicons name={group.isPrivate ? 'lock-closed-outline' : 'globe-outline'} size={20} color={colors.textSecondary} />
                <Text style={styles.aboutInfoText}>{group.isPrivate ? 'Nhóm riêng tư' : 'Nhóm công khai'}</Text>
              </View>
            </View>
          )}

          {activeTab === 'members' && (
            <View style={styles.membersCard}>
              <Text style={styles.aboutTitle}>Thành viên · {group.members}</Text>
              {mockMembers.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <UserAvatar src={member.avatar} name={member.name} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                  <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('MessageList')}>
                    <Text style={styles.chatBtnText}>Nhắn tin</Text>
                  </TouchableOpacity>
                </View>
              ))}
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
  inviteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm, backgroundColor: '#f3f4f6', borderRadius: borderRadius.md },
  inviteBtnText: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },
  activeTabText: { color: colors.primary, fontWeight: typography.bold },
  
  contentContainer: { padding: spacing.md },
  
  // Post Input
  createPostCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  createPostBtn: { backgroundColor: '#f1f5f9', padding: spacing.md, borderRadius: borderRadius.full },
  createPostPlaceholder: { color: colors.textSecondary },
  createPostInput: { backgroundColor: '#f1f5f9', padding: spacing.md, borderRadius: borderRadius.md, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.md },
  createPostActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createPostIcons: { flexDirection: 'row', gap: spacing.md },
  cancelPostBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 20 },
  submitPostBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 20 },
  
  // Post List
  postCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  postAvatar: { width: 40, height: 40, borderRadius: 20 },
  postAuthor: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  postTime: { fontSize: typography.xs, color: colors.textSecondary },
  postContent: { fontSize: typography.base, color: colors.text, marginBottom: spacing.sm },
  postImage: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  postActions: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  actionText: { fontSize: typography.sm, color: colors.textSecondary },
  
  // About
  aboutCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  aboutTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.sm },
  aboutText: { fontSize: typography.base, color: colors.text, marginBottom: spacing.md },
  aboutDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  aboutInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  aboutInfoText: { fontSize: typography.base, color: colors.text },
  
  // Members
  membersCard: { backgroundColor: '#fff', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text },
  memberRole: { fontSize: typography.sm, color: colors.textSecondary },
  chatBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: borderRadius.full },
  chatBtnText: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.text },
});
