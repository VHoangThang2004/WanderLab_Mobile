import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { messageService, ChatContact } from '../../api/messageService';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { EmptyState } from '../../components/EmptyState';

interface MessageListScreenProps {
  navigation: any;
}

export function MessageListScreen({ navigation }: MessageListScreenProps) {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await messageService.fetchRecentChats(user.id);
      setContacts(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContact = ({ item }: { item: ChatContact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => navigation.navigate('Chat', { contactId: item.id, contactName: item.name, contactAvatar: item.avatar })}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
        {item.isOnline && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.contactTime}>{item.time}</Text>
        </View>
        <View style={styles.contactFooter}>
          <Text 
            style={[styles.lastMessage, item.unread > 0 && styles.lastMessageUnread]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      {/* Contact List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="Chưa có tin nhắn nào"
              message="Hãy bắt đầu cuộc trò chuyện đầu tiên của bạn!"
            />
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  actionButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sm,
    color: colors.text,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  contactTime: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  contactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  lastMessageUnread: {
    fontWeight: typography.bold,
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: typography.bold,
  },
});
