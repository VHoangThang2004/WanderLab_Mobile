import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { diaryBookService } from '../../api/diaryBookService';
import { useAuthStore } from '../../stores/authStore';
import { colors, typography, spacing, borderRadius } from '../../theme';

export function DiaryBookScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  const { data: books, isLoading } = useQuery({
    queryKey: ['diaryBooks', user?.id],
    queryFn: () => diaryBookService.fetchUserBooks(user?.id as string),
    enabled: !!user?.id,
  });

  const renderBook = ({ item }: any) => {
    return (
      <TouchableOpacity 
        style={styles.bookCard} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DiaryBookDetail', { bookId: item.id })}
      >
        <Image source={{ uri: item.cover_image_url }} style={styles.bookCover} contentFit="cover" />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookCount}>{item.diaries_count || 0} bài viết</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kệ Sách Của Tôi</Text>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.navigate('CreateDiaryBook')}
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : books?.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={64} color={colors.textTertiary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyTitle}>Kệ sách đang trống</Text>
          <Text style={styles.emptyText}>Gom nhóm các bài nhật ký của bạn thành những cuốn sách tuyệt đẹp.</Text>
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateDiaryBook')}
          >
            <Text style={styles.createBtnText}>Tạo cuốn sách đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.base, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  createBtnText: { color: '#fff', fontSize: typography.base, fontWeight: typography.bold },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: spacing.md },
  bookCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCover: {
    width: '100%',
    height: 180,
    backgroundColor: colors.border,
  },
  bookInfo: {
    padding: spacing.sm,
  },
  bookTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: 4,
  },
  bookCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
});
