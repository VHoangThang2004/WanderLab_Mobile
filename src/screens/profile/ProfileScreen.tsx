import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert, RefreshControl, Modal, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiaryPostCard } from '../../components/DiaryPostCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { UserAvatar } from '../../components/UserAvatar';
import { DropdownMenu } from '../../components/DropdownMenu';
import { VietnamMap } from '../../components/VietnamMap';
import { ItineraryDetailModal } from '../../components/ItineraryDetailModal';
import { diaryService } from '../../api/diaryService';
import { interactionService } from '../../api/interactionService';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useThemeStore } from '../../stores/themeStore';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { colors as staticColors, gradients, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
  route: any;
}

export function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  const { user, logout, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<'diaries' | 'itineraries' | 'stats'>('diaries');
  const [isUploading, setIsUploading] = React.useState(false);
  const [savedItineraries, setSavedItineraries] = React.useState<any[]>([]);
  const [selectedItinerary, setSelectedItinerary] = React.useState<any>(null);
  const [engagementRate, setEngagementRate] = React.useState(0);
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  
  const styles = getStyles(colors, isDarkMode);

  // Calculate engagement rate based on interactions vs followers
  const totalInteractions = (user?.likes_received || 0) + (user?.comments_received || 0) + (user?.saves_received || 0);
  const calculatedEngagementRate = user?.followers_count ? (totalInteractions / user.followers_count * 100).toFixed(1) : '0.0';

  const { data: myDiaries, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myDiaries'],
    queryFn: diaryService.fetchMyDiaries,
    enabled: !!user,
  });

  const visitedLocations = React.useMemo(() => {
    if (!myDiaries) return [];
    return myDiaries.map((d: any) => d.location).filter(Boolean);
  }, [myDiaries]);

  React.useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab]);

  React.useEffect(() => {
    if (activeTab === 'itineraries') {
      loadSavedItineraries();
    }
  }, [activeTab]);

  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'itineraries') {
        loadSavedItineraries();
      }
    }, [activeTab])
  );

  const loadSavedItineraries = async () => {
    try {
      const data = await AsyncStorage.getItem('@saved_itineraries');
      if (data) {
        setSavedItineraries(JSON.parse(data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItinerary = (id: string) => {
    Alert.alert('Xóa lịch trình', 'Bạn có chắc muốn xóa lịch trình này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: async () => {
          const filtered = savedItineraries.filter(i => i.id !== id);
          setSavedItineraries(filtered);
          await AsyncStorage.setItem('@saved_itineraries', JSON.stringify(filtered));
          if (selectedItinerary?.id === id) {
            setSelectedItinerary(null);
          }
        }
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        { text: t('settings.logout'), style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const [viewImage, setViewImage] = React.useState<string | null>(null);

  const handleImagePress = (type: 'avatars' | 'covers', field: 'avatar_url' | 'cover_image_url', url: string | null) => {
    Alert.alert(
      type === 'avatars' ? 'Ảnh đại diện' : 'Ảnh bìa',
      'Bạn muốn làm gì?',
      [
        {
          text: 'Xem ảnh',
          onPress: () => {
            if (url) {
              setViewImage(url);
            } else {
              Alert.alert('Thông báo', 'Chưa có ảnh.');
            }
          }
        },
        {
          text: 'Đổi ảnh mới',
          onPress: () => pickAndUploadImage(type, field)
        },
        {
          text: 'Hủy',
          style: 'cancel'
        }
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
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setIsUploading(true);
      const asset = result.assets[0];
      const uri = asset.uri;
      const base64Str = asset.base64;
      
      if (!base64Str) {
        throw new Error('No base64 data returned from image picker');
      }

      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, decode(base64Str), {
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
      {/* Cover Image */}
      <TouchableOpacity 
        style={styles.coverContainer}
        onPress={() => handleImagePress('covers', 'cover_image_url', user?.cover_image_url || null)}
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
      </TouchableOpacity>

      {/* Avatar + Name */}
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => handleImagePress('avatars', 'avatar_url', user?.avatar_url || null)}
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

      {/* Modern Stats Grid */}
      <View style={styles.modernStatsGrid}>
        <View style={styles.modernStatItem}>
          <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.modernStatIconBg}>
            <Ionicons name="camera" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.modernStatValue}>{user.diaries_count || 0}</Text>
            <Text style={styles.modernStatLabel}>{t('profile.diaries')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.modernStatItem} onPress={() => navigation.navigate('Follows', { initialTab: 'followers' })}>
          <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.modernStatIconBg}>
            <Ionicons name="heart" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.modernStatValue}>{user.followers_count || 0}</Text>
            <Text style={styles.modernStatLabel}>{t('profile.followers')}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.modernStatItem}>
          <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.modernStatIconBg}>
            <Ionicons name="globe" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.modernStatValue}>{user.countries_visited || 0}</Text>
            <Text style={styles.modernStatLabel}>Quốc gia</Text>
          </View>
        </View>
        <View style={styles.modernStatItem}>
          <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.modernStatIconBg}>
            <Ionicons name="map" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.modernStatValue}>{user.cities_visited || 0}</Text>
            <Text style={styles.modernStatLabel}>Thành phố</Text>
          </View>
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('diaries')} style={[styles.tabBtn, activeTab === 'diaries' && styles.activeTabBtn]}>
          <Text style={[styles.tabText, activeTab === 'diaries' && styles.activeTabText]}>{t('profile.diaries')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('itineraries')} style={[styles.tabBtn, activeTab === 'itineraries' && styles.activeTabBtn]}>
          <Text style={[styles.tabText, activeTab === 'itineraries' && styles.activeTabText]}>Đã lưu</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('stats')} style={[styles.tabBtn, activeTab === 'stats' && styles.activeTabBtn]}>
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>{t('profile.stats')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContentContainer}>
        {activeTab === 'diaries' && (
          <>
            {/* Quick Actions (Horizontal) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: isDarkMode ? '#4a1118' : '#ffe4e6' }]} onPress={() => navigation.navigate('CreateDiary')}>
                <Ionicons name="book" size={20} color="#e11d48" />
                <Text style={[styles.actionCardText, { color: '#e11d48' }]}>{t('profile.createDiary')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: isDarkMode ? '#1a1d40' : '#e0e7ff' }]} onPress={() => navigation.navigate('AIAssistant')}>
                <Ionicons name="color-wand" size={20} color="#4f46e5" />
                <Text style={[styles.actionCardText, { color: '#4f46e5' }]}>{t('profile.aiPlanner')}</Text>
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
          <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.base }}>
            {savedItineraries.length > 0 ? (
              savedItineraries.map((it) => (
                <TouchableOpacity 
                  key={it.id} 
                  style={styles.itineraryCardModern} 
                  activeOpacity={0.9}
                  onPress={() => setSelectedItinerary(it)}
                >
                  <View style={styles.itineraryHero}>
                    <Image 
                      source={{ uri: it.destinationImage || 'https://images.unsplash.com/photo-1599514605917-76b91c95973e' }} 
                      style={styles.itineraryImage} 
                      contentFit="cover" 
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.itineraryGradient}
                    />
                    
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>{it.duration}</Text>
                    </View>

                    <View style={styles.itineraryHeroContent}>
                      <Text style={styles.itineraryHeroTitle} numberOfLines={1}>
                        {it.destination}
                      </Text>
                      <View style={styles.itineraryHeroMeta}>
                        <View style={styles.heroMetaItem}>
                          <Ionicons name="people" size={12} color="#fff" />
                          <Text style={styles.heroMetaText}>{it.groupSize}</Text>
                        </View>
                        <View style={styles.heroMetaItem}>
                          <Ionicons name="wallet" size={12} color="#fff" />
                          <Text style={styles.heroMetaText}>{it.budget}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.itineraryFooter}>
                    <Text style={styles.itineraryDateText}>
                      Đã lưu {it.savedAt || new Date(it.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                    <TouchableOpacity 
                      style={styles.itineraryDeleteBtn}
                      onPress={() => handleDeleteItinerary(it.id)}
                    >
                      <Ionicons name="trash" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                icon="map-outline"
                title="Chưa có lịch trình đã lưu"
                message="Những lịch trình bạn lưu sẽ hiển thị ở đây."
              />
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.statsTabContainer}>
            {/* Travel Stats */}
            <View style={styles.statsCard2}>
              <View style={styles.statsCardHeader}>
                <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.statsCardIconBg}>
                  <Ionicons name="map" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statsCardTitle2}>Thống kê du lịch</Text>
              </View>
              <View style={styles.statsList}>
                <View style={styles.statsListItem}>
                  <Text style={styles.statsListLabel}>Tổng số nhật ký</Text>
                  <Text style={styles.statsListValue}>{user.diaries_count || 0}</Text>
                </View>
                <View style={styles.statsListItem}>
                  <Text style={styles.statsListLabel}>Quốc gia đã đến</Text>
                  <Text style={styles.statsListValue}>{user.countries_visited || 0}</Text>
                </View>
                <View style={styles.statsListItem}>
                  <Text style={styles.statsListLabel}>Thành phố đã đến</Text>
                  <Text style={styles.statsListValue}>{user.cities_visited || 0}</Text>
                </View>
              </View>
            </View>

            {/* Social Stats */}
            <View style={styles.statsCard2}>
              <View style={styles.statsCardHeader}>
                <LinearGradient colors={['#ff3131', '#ff914d']} style={styles.statsCardIconBg}>
                  <Ionicons name="trophy" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.statsCardTitle2}>Thống kê cộng đồng</Text>
              </View>
              <View style={styles.statsList}>
                <View style={styles.statsListItem}>
                  <Text style={styles.statsListLabel}>Người theo dõi</Text>
                  <Text style={styles.statsListValue}>{user.followers_count || 0}</Text>
                </View>
                <View style={styles.statsListItem}>
                  <Text style={styles.statsListLabel}>Đang theo dõi</Text>
                  <Text style={styles.statsListValue}>{user.following_count || 0}</Text>
                </View>
                <View style={styles.statsListItem}>
                  <Text style={styles.statsListLabel}>Tỷ lệ tương tác</Text>
                  <Text style={styles.statsListValue}>{calculatedEngagementRate}%</Text>
                </View>
              </View>
            </View>

            {/* Vietnam Map */}
            <VietnamMap visitedProvinces={visitedLocations} />
          </View>
        )}
      </View>
      </ScrollView>

      {/* Itinerary Detail Modal */}
      <ItineraryDetailModal 
        itinerary={selectedItinerary}
        visible={!!selectedItinerary}
        onClose={() => setSelectedItinerary(null)}
        onDelete={(id) => handleDeleteItinerary(id)}
      />

      {/* Fullscreen Image Viewer */}
      <Modal visible={!!viewImage} transparent={true} animationType="fade" onRequestClose={() => setViewImage(null)}>
        <View style={styles.fullscreenImageContainer}>
          <TouchableOpacity style={styles.closeImageBtn} onPress={() => setViewImage(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {viewImage && (
            <Image 
              source={{ uri: viewImage }} 
              style={styles.fullscreenImage} 
              contentFit="contain" 
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // Cover
  coverContainer: { width, height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  editCoverIndicator: {
    position: 'absolute', bottom: spacing.md, right: spacing.md,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },

  menuBtn: {
    position: 'absolute', top: 50, right: spacing.base,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  // Profile
  profileHeader: { alignItems: 'center', marginTop: -44, paddingHorizontal: spacing.base },
  avatarContainer: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.background },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background
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
    backgroundColor: colors.card, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border
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
    backgroundColor: colors.background,
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
  },
  actionCardText: { fontSize: typography.sm, fontWeight: typography.bold },
  // Quick Share
  quickShareContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.border
  },
  quickShareInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.inputBg,
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
    backgroundColor: isDarkMode ? colors.primary + '30' : colors.primary + '15',
    borderRadius: borderRadius.md,
  },
  bookBtnText: {
    fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary,
  },
  // Stats Card
  statsCard: {
    backgroundColor: colors.card,
    margin: spacing.base,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border
  },
  statsCardTitle: { fontSize: typography.base, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  statRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statRowLabel: { fontSize: typography.base, color: colors.textSecondary },
  statRowValue: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  fullscreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeImageBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  // Modern Stats Grid
  modernStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    justifyContent: 'space-between',
  },
  modernStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '46%',
  },
  modernStatIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernStatValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  modernStatLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  // Modern Stats Tab
  statsTabContainer: {
    padding: spacing.base,
    gap: spacing.lg,
  },
  statsCard2: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statsCardIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCardTitle2: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  statsList: {
    gap: spacing.base,
  },
  statsListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDarkMode ? colors.border : '#f9fafb',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  statsListLabel: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  statsListValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: '#ff3131',
  },
  itineraryCardModern: {
    backgroundColor: colors.card,
    borderRadius: 24,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  itineraryHero: {
    height: 160,
    position: 'relative',
  },
  itineraryImage: {
    width: '100%',
    height: '100%',
  },
  itineraryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  durationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff3131',
  },
  itineraryHeroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  itineraryHeroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itineraryHeroMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  itineraryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  itineraryDateText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  itineraryDeleteBtn: {
    padding: 8,
    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
    borderRadius: 12,
  },
});
