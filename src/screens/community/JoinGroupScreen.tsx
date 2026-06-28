import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';

const suggestedGroups = [
  {
    id: "1",
    name: "Chinh phục núi non Việt Nam",
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    members: 3421,
    posts: 8567,
    isPrivate: false,
    category: "Núi non",
    description: "Cộng đồng yêu thích leo núi, trekking và khám phá thiên nhiên",
  },
  {
    id: "2",
    name: "Hội mê biển Việt Nam",
    coverImage: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    members: 5234,
    posts: 12456,
    isPrivate: false,
    category: "Biển đảo",
    description: "Khám phá các bãi biển đẹp nhất Việt Nam",
  },
  {
    id: "3",
    name: "Food Tour Việt Nam",
    coverImage: "https://images.unsplash.com/photo-1562563575-80774d31732b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    members: 2890,
    posts: 9845,
    isPrivate: false,
    category: "Ẩm thực",
    description: "Săn lùng món ngon khắp ba miền Tổ quốc",
  },
  {
    id: "4",
    name: "Du lịch Solo VN",
    coverImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    members: 1567,
    posts: 4321,
    isPrivate: true,
    category: "Solo Travel",
    description: "Cộng đồng những người thích đi du lịch một mình",
  },
];

const CATEGORIES = ["Tất cả", "Núi non", "Biển đảo", "Ẩm thực", "Solo Travel", "Phượt bụi"];

export function JoinGroupScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const filteredGroups = suggestedGroups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tất cả" || group.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tham Gia Nhóm</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhóm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat}
              style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
          >
            <View style={styles.coverContainer}>
              <Image source={{ uri: item.coverImage }} style={styles.coverImage} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFillObject} />
              
              <View style={styles.badgeRow}>
                <View style={styles.privacyBadge}>
                  <Ionicons name={item.isPrivate ? "lock-closed" : "globe"} size={12} color="#555" />
                  <Text style={styles.privacyText}>{item.isPrivate ? "Riêng tư" : "Công khai"}</Text>
                </View>
              </View>
              
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{item.members}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubbles" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{item.posts}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>{item.isPrivate ? "Gửi yêu cầu" : "Tham gia ngay"}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Không tìm thấy nhóm</Text>
            <Text style={styles.emptyDesc}>Thử tìm kiếm với từ khóa khác</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text },
  
  searchSection: { backgroundColor: '#fff', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 24, paddingHorizontal: spacing.md, height: 40, marginBottom: spacing.sm },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: typography.base },
  
  categoryScroll: { flexDirection: 'row' },
  categoryBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: spacing.sm },
  categoryBtnActive: { backgroundColor: colors.primary },
  categoryText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: '500' },
  categoryTextActive: { color: '#fff' },

  listContent: { padding: spacing.md, paddingBottom: spacing['4xl'] },
  
  groupCard: { backgroundColor: '#fff', borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  coverContainer: { height: 120, width: '100%' },
  coverImage: { width: '100%', height: '100%' },
  badgeRow: { position: 'absolute', top: 8, right: 8 },
  privacyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  privacyText: { fontSize: typography.xs, fontWeight: '600', color: '#555' },
  categoryBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  categoryBadgeText: { fontSize: typography.xs, fontWeight: 'bold', color: '#fff' },
  
  cardInfo: { padding: spacing.md },
  groupName: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, marginBottom: 4 },
  groupDesc: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: typography.sm, color: colors.textSecondary },
  
  joinBtn: { backgroundColor: colors.text, paddingVertical: 10, borderRadius: borderRadius.md, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: typography.sm, fontWeight: typography.bold },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.text, marginTop: spacing.md },
  emptyDesc: { fontSize: typography.base, color: colors.textSecondary, marginTop: 4 },
});
