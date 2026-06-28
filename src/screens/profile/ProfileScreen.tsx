import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { DiaryPostCard } from '../../components/DiaryPostCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { UserAvatar } from '../../components/UserAvatar';
import { diaryService } from '../../api/diaryService';
import { interactionService } from '../../api/interactionService';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { colors, gradients, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<'diaries' | 'itineraries' | 'stats'>('diaries');
  const [isUploading, setIsUploading] = React.useState(false);

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

  const pickAndUploadImage = async (bucket: 'avatars' | 'covers', field: 'avatar_url' | 'cover_image_url') => {
    if (!user) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: bucket === 'avatars' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setIsUploading(true);
      const uri = result.assets[0].uri;
      
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      await updateProfile({ [field]: publicUrlData.publicUrl });
      
    } catch (e: any) {
      console.warn('Upload error:', e);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
      {/* Cover Image */}
      <TouchableOpacity 
        style={styles.coverContainer}
        onPress={() => pickAndUploadImage('covers', 'cover_image_url')}
        disabled={isUploading}
      >
        {user.cover_image_url ? (
          <Image source={{ uri: user.cover_image_url }} style={styles.coverImage} contentFit="cover" />
        ) : (
          <LinearGradient colors={gradients.hero} style={styles.coverImage} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill} />

        <View style={styles.editCoverIndicator}>
          <Ionicons name="camera" size={20} color="#fff" />
        </View>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Avatar + Name */}
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => pickAndUploadImage('avatars', 'avatar_url')}
          disabled={isUploading}
        >
          <UserAvatar
            src={user.avatar_url}
            name={user.full_name || 'User'}
            style={styles.avatar}
          />
          <View style={styles.editAvatarBtn}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
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
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Follows', { initialTab: 'followers' })}
        >
          <Text style={styles.statValue}>{user.followers_count}</Text>
          <Text style={styles.statLabel}>Người theo dõi</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Follows', { initialTab: 'following' })}
        >
          <Text style={styles.statValue}>{user.following_count}</Text>
          <Text style={styles.statLabel}>Đang theo dõi</Text>
        </TouchableOpacity>
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('diaries')} style={[styles.tabBtn, activeTab === 'diaries' && styles.activeTabBtn]}>
          <Text style={[styles.tabText, activeTab === 'diaries' && styles.activeTabText]}>Nhật Ký</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('itineraries')} style={[styles.tabBtn, activeTab === 'itineraries' && styles.activeTabBtn]}>
          <Text style={[styles.tabText, activeTab === 'itineraries' && styles.activeTabText]}>Lịch Trình</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('stats')} style={[styles.tabBtn, activeTab === 'stats' && styles.activeTabBtn]}>
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>Thống Kê</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContentContainer}>
        {activeTab === 'diaries' && (
          <>
            {/* Quick Actions (Horizontal) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#ffe4e6' }]} onPress={() => navigation.navigate('CreateDiary')}>
                <Ionicons name="book" size={20} color="#e11d48" />
                <Text style={[styles.actionCardText, { color: '#e11d48' }]}>Tạo Nhật Ký</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#e0e7ff' }]} onPress={() => navigation.navigate('AIAssistant')}>
                <Ionicons name="color-wand" size={20} color="#4f46e5" />
                <Text style={[styles.actionCardText, { color: '#4f46e5' }]}>Lập Kế Hoạch AI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#dcfce7' }]} onPress={() => navigation.navigate('ExploreTab')}>
                <Ionicons name="compass" size={20} color="#16a34a" />
                <Text style={[styles.actionCardText, { color: '#16a34a' }]}>Khám Phá</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Quick Share Box */}
            <View style={styles.quickShareContainer}>
              <TouchableOpacity style={styles.quickShareInput} onPress={() => navigation.navigate('CreateDiary')}>
                <Ionicons name="image-outline" size={20} color={colors.textTertiary} />
                <Text style={styles.quickShareText}>Chia sẻ kỷ niệm du lịch của bạn...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickShareBtn} onPress={() => navigation.navigate('CreateDiary')}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.quickShareBtnText}>Tạo</Text>
              </TouchableOpacity>
            </View>

            {/* My Diaries */}
            <View style={styles.diariesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nhật Ký Của Tôi</Text>
                <TouchableOpacity 
                  style={styles.bookBtn} 
                  onPress={() => navigation.navigate('DiaryBook')}
                >
                  <Ionicons name="book-outline" size={16} color={colors.primary} />
                  <Text style={styles.bookBtnText}>Cuốn nhật ký</Text>
                </TouchableOpacity>
              </View>
              {isLoading ? (
                <LoadingSpinner size="small" />
              ) : myDiaries && myDiaries.length > 0 ? (
                myDiaries.map((diary) => (
                  <DiaryPostCard
                    key={diary.id}
                    {...diary}
                    onPress={() => navigation.navigate('DiaryDetail', { id: diary.id })}
                    onLikePress={async () => {
                      if (user) await interactionService.toggleLikeDiary(diary.id, user.id);
                    }}
                    onBookmarkPress={async () => {
                      if (user) await interactionService.toggleBookmarkDiary(diary.id, user.id);
                    }}
                    onCommentPress={() => navigation.navigate('Comment', { diaryId: diary.id })}
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
          </>
        )}

        {activeTab === 'itineraries' && (
          <View style={{ marginTop: spacing.xl }}>
            <EmptyState
              icon="map-outline"
              title="Chưa có lịch trình đã lưu"
              message="Những lịch trình bạn lưu sẽ hiển thị ở đây."
            />
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>Hoạt Động Gần Đây</Text>
            
            <View style={styles.statRow}>
              <View style={styles.statRowLeft}>
                <View style={[styles.statIconBox, { backgroundColor: '#ffe4e6' }]}>
                  <Ionicons name="heart" size={18} color="#e11d48"/>
                </View>
                <Text style={styles.statRowLabel}>Tổng lượt thích</Text>
              </View>
              <Text style={styles.statRowValue}>{user.likes_received || 0}</Text>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statRowLeft}>
                <View style={[styles.statIconBox, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="chatbubble" size={18} color="#4f46e5"/>
                </View>
                <Text style={styles.statRowLabel}>Bình luận</Text>
              </View>
              <Text style={styles.statRowValue}>{user.comments_received || 0}</Text>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statRowLeft}>
                <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="bookmark" size={18} color="#16a34a"/>
                </View>
                <Text style={styles.statRowLabel}>Lượt lưu</Text>
              </View>
              <Text style={styles.statRowValue}>{user.saves_received || 0}</Text>
            </View>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  // Cover
  coverContainer: { width, height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  editCoverIndicator: {
    position: 'absolute', bottom: spacing.md, right: spacing.md,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  settingsBtn: {
    position: 'absolute', top: 50, right: spacing.base,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  // Profile
  profileHeader: { alignItems: 'center', marginTop: -44, paddingHorizontal: spacing.base },
  avatarContainer: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#fff' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff'
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
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
  },
  tabBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.md,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTabBtn: {
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
  tabContentContainer: {
    backgroundColor: '#f8f9fa',
    flex: 1,
    minHeight: 400,
  },
  // Quick Actions
  quickActionsScroll: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: borderRadius.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionCardText: { fontSize: typography.sm, fontWeight: typography.bold },
  // Quick Share
  quickShareContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickShareInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: borderRadius.lg,
  },
  quickShareText: { color: colors.textTertiary, fontSize: typography.sm },
  quickShareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: borderRadius.lg,
    marginLeft: spacing.sm,
  },
  quickShareBtnText: { color: '#fff', fontSize: typography.sm, fontWeight: typography.bold },
  // Diaries
  diariesSection: { marginTop: spacing.lg, paddingBottom: spacing['3xl'] },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.lg, fontWeight: typography.bold, color: colors.text,
  },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
  },
  bookBtnText: {
    fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary,
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#fff',
    margin: spacing.base,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statsCardTitle: { fontSize: typography.base, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  statRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statRowLabel: { fontSize: typography.base, color: colors.textSecondary },
  statRowValue: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
});
