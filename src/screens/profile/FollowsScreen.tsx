import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { friendService, FriendProfile } from '../../api/friendService';
import { useAuthStore } from '../../stores/authStore';
import { UserAvatar } from '../../components/UserAvatar';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { GradientButton } from '../../components/GradientButton';

interface FollowsScreenProps {
  route: any;
  navigation: any;
}

export function FollowsScreen({ route, navigation }: FollowsScreenProps) {
  const { initialTab } = route.params || { initialTab: 'friends' };
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'friends' | 'groups' | 'suggested'>(initialTab);
  
  const [data, setData] = useState({
    friends: [] as FriendProfile[],
    requests: [] as FriendProfile[],
  });
  
  const [suggested, setSuggested] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Mock Groups for now
  const [groups] = useState([
    {
      id: '1',
      full_name: 'Phượt Miền Bắc',
      avatar_url: 'https://images.unsplash.com/photo-1694152362587-99d77d21793b?w=200',
      location: '248 thành viên',
    },
    {
      id: '2',
      full_name: 'Du Lịch Bụi Việt Nam',
      avatar_url: 'https://images.unsplash.com/photo-1547024842-7c86b2226ef5?w=200',
      location: '1520 thành viên',
    }
  ]);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'suggested') {
      fetchSuggested();
    }
  }, [activeTab, searchQuery]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await friendService.fetchFriendData(user.id);
      setData({
        friends: result.friends,
        requests: result.requests,
      });
    } catch (e) {
      console.warn("Failed to fetch follows:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggested = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await friendService.fetchSuggestedFriends(user.id, searchQuery);
      setSuggested(result as FriendProfile[]);
    } catch (e) {
      console.warn("Failed to fetch suggested:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId: string) => {
    if (!user) return;
    setProcessingId(requesterId);
    try {
      await friendService.followUser(user.id, requesterId);
      Alert.alert('Thành công', 'Đã chấp nhận kết bạn');
      fetchData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requesterId: string) => {
    if (!user) return;
    setProcessingId(requesterId);
    try {
      await friendService.unfollowUser(requesterId, user.id);
      fetchData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddFriend = async (targetId: string) => {
    if (!user) return;
    setProcessingId(targetId);
    try {
      await friendService.followUser(user.id, targetId);
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
      fetchSuggested();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!user) return;
    Alert.alert('Hủy kết bạn', 'Bạn có chắc muốn hủy kết bạn?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Đồng ý', style: 'destructive', onPress: async () => {
        try {
          await friendService.removeFriend(user.id, friendId);
          fetchData();
        } catch (e: any) {
          Alert.alert('Lỗi', e.message);
        }
      }}
    ]);
  };

  const filteredFriends = data.friends.filter(f => 
    searchQuery === '' || f.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredRequests = data.requests.filter(f => 
    searchQuery === '' || f.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActiveData = () => {
    switch(activeTab) {
      case 'requests': return filteredRequests;
      case 'friends': return filteredFriends;
      case 'groups': return groups.filter(g => g.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
      case 'suggested': return suggested;
      default: return [];
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <UserAvatar 
          src={item.avatar_url} 
          name={item.full_name || 'User'}
          style={styles.avatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.full_name}</Text>
          {item.location && <Text style={styles.userLocation}>{item.location}</Text>}
          {(item.diaries_count !== undefined || item.followers_count !== undefined) && (
            <Text style={styles.userStats}>
              {item.diaries_count || 0} bài viết · {item.followers_count || 0} người theo dõi
            </Text>
          )}
        </View>
        {activeTab === 'friends' && (
          <TouchableOpacity onPress={() => handleUnfriend(item.id)} style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardActions}>
        {activeTab === 'requests' && (
          <>
            <TouchableOpacity 
              style={[styles.btn, styles.primaryBtn]} 
              onPress={() => handleAccept(item.id)}
              disabled={processingId === item.id}
            >
              {processingId === item.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryBtnText}>Chấp nhận</Text>}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.secondaryBtn]} 
              onPress={() => handleDecline(item.id)}
              disabled={processingId === item.id}
            >
              <Text style={styles.secondaryBtnText}>Từ chối</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'friends' && (
          <>
            <TouchableOpacity 
              style={[styles.btn, styles.secondaryBtn, { flex: 1 }]} 
              onPress={() => navigation.navigate('Chat', { contactId: item.id, contactName: item.full_name, contactAvatar: item.avatar_url })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Nhắn tin</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'suggested' && (
          <TouchableOpacity 
            style={[styles.btn, styles.primaryBtn, { flex: 1 }]} 
            onPress={() => handleAddFriend(item.id)}
            disabled={processingId === item.id}
          >
            {processingId === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>Thêm bạn bè</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {activeTab === 'groups' && (
          <TouchableOpacity 
            style={[styles.btn, styles.secondaryBtn, { flex: 1 }]} 
            onPress={() => navigation.navigate('GroupDetail', { id: item.id })}
          >
            <Text style={styles.secondaryBtnText}>Xem chi tiết</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.activeTab]} onPress={() => setActiveTab('requests')}>
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Lời mời {data.requests.length > 0 && `(${data.requests.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'friends' && styles.activeTab]} onPress={() => setActiveTab('friends')}>
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Bạn bè ({data.friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'groups' && styles.activeTab]} onPress={() => setActiveTab('groups')}>
            <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
              Nhóm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'suggested' && styles.activeTab]} onPress={() => setActiveTab('suggested')}>
            <Text style={[styles.tabText, activeTab === 'suggested' && styles.activeTabText]}>
              Gợi ý
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading && activeTab !== 'suggested' ? (
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
              <Text style={styles.emptyText}>Chưa có dữ liệu.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: typography.base, color: colors.text },
  
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: colors.primary },
  tabText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },
  activeTabText: { color: colors.primary, fontWeight: typography.bold },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.base },
  
  userCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: spacing.sm },
  userInfo: { flex: 1 },
  userName: { fontSize: typography.base, fontWeight: typography.bold, color: colors.text },
  userLocation: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  userStats: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  iconBtn: { padding: spacing.xs },
  
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  primaryBtn: { backgroundColor: colors.primary },
  secondaryBtn: { backgroundColor: '#f1f5f9' },
  primaryBtnText: { color: '#fff', fontWeight: typography.semibold, fontSize: typography.sm },
  secondaryBtnText: { color: colors.text, fontWeight: typography.semibold, fontSize: typography.sm },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: spacing.sm, fontSize: typography.base, color: colors.textSecondary },
});
