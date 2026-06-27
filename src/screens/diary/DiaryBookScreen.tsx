import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { diaryService } from '../../api/diaryService';
import { colors, typography, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');
const PAGE_WIDTH = width * 0.85;

export function DiaryBookScreen() {
  const navigation = useNavigation<any>();
  const { data: diaries, isLoading } = useQuery({
    queryKey: ['myDiaries'],
    queryFn: diaryService.fetchMyDiaries,
  });

  const renderPage = ({ item, index }: any) => {
    return (
      <TouchableOpacity 
        style={styles.pageContainer} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('DiaryDetail', { id: item.id })}
      >
        <Image source={{ uri: item.image }} style={styles.pageImage} contentFit="cover" />
        <View style={styles.pageContent}>
          <Text style={styles.pageDate}>{item.date}</Text>
          <Text style={styles.pageTitle} numberOfLines={2}>{item.location}</Text>
          <Text style={styles.pageDescription} numberOfLines={3}>{item.caption}</Text>
          
          <View style={styles.pageFooter}>
            <Text style={styles.pageNumber}>Trang {index + 1}</Text>
          </View>
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
        <Text style={styles.headerTitle}>Cuốn nhật ký của tôi</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : diaries?.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Bạn chưa có bài nhật ký nào.</Text>
        </View>
      ) : (
        <View style={styles.bookWrapper}>
          <FlatList
            data={diaries}
            keyExtractor={(item) => item.id}
            renderItem={renderPage}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={PAGE_WIDTH + spacing.md}
            decelerationRate="fast"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0dfc8' }, // Book cover background color
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: typography.base, color: colors.textSecondary },
  bookWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: (width - PAGE_WIDTH) / 2,
    alignItems: 'center',
  },
  pageContainer: {
    width: PAGE_WIDTH,
    height: width * 1.3,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md / 2,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  pageImage: {
    width: '100%',
    height: '50%',
  },
  pageContent: {
    flex: 1,
    padding: spacing.xl,
  },
  pageDate: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  pageTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  pageDescription: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  pageFooter: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    fontFamily: 'Courier',
  },
});
