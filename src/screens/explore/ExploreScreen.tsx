import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  RefreshControl, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { DiaryExploreCard } from '../../components/DiaryExploreCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { diaryService } from '../../api/diaryService';
import { colors, typography, spacing, borderRadius } from '../../theme';
import type { DiaryExploreItem } from '../../types/diary';

const filterChips = ['Tất cả', 'Phổ biến', 'Mới nhất', 'Ngân sách thấp', 'Dài ngày'];

interface ExploreScreenProps {
  navigation: any;
}

export function ExploreScreen({ navigation }: ExploreScreenProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

  const { data: diaries, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['exploreDiaries'],
    queryFn: diaryService.fetchExploreDiaries,
  });

  const filteredDiaries = useMemo(() => {
    let result = diaries || [];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.location?.toLowerCase().includes(q) ||
          d.author?.toLowerCase().includes(q)
      );
    }

    // Sort/filter by chip
    switch (activeFilter) {
      case 'Ngân sách thấp':
        result = [...result].sort((a, b) => a.budgetNum - b.budgetNum);
        break;
      case 'Dài ngày':
        result = [...result].sort((a, b) => b.durationDays - a.durationDays);
        break;
      case 'Mới nhất':
        // Already sorted by created_at desc
        break;
      case 'Phổ biến':
        result = [...result].sort((a, b) => b.trustScore - a.trustScore);
        break;
    }

    return result;
  }, [diaries, search, activeFilter]);

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhật ký, địa điểm..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {filterChips.map((chip) => (
          <TouchableOpacity
            key={chip}
            onPress={() => setActiveFilter(chip)}
            style={[
              styles.chip,
              activeFilter === chip && styles.chipActive,
            ]}
          >
            <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsCount}>{filteredDiaries.length} nhật ký</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDiaries}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Không tìm thấy"
            message="Thử từ khóa khác hoặc thay đổi bộ lọc"
          />
        }
        renderItem={({ item }) => (
          <DiaryExploreCard
            {...item}
            onPress={() => navigation.navigate('DiaryDetail', { id: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    height: 44,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.base,
    color: colors.text,
  },
  chipsScroll: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: '#fff',
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#f3f4f6',
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: typography.semibold,
  },
  resultsRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  gridRow: {
    paddingHorizontal: spacing.base,
    justifyContent: 'space-between',
  },
});
