import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { DiaryExploreItem } from '../types/diary';

const CARD_WIDTH = (Dimensions.get('window').width - spacing.base * 3) / 2;

interface DiaryExploreCardProps extends DiaryExploreItem {
  onPress?: () => void;
}

export function DiaryExploreCard({
  title,
  location,
  image,
  budget,
  duration,
  trustScore,
  author,
  onPress,
}: DiaryExploreCardProps) {
  const trustColor = trustScore >= 80 ? colors.trustHigh : trustScore >= 60 ? colors.trustMedium : colors.trustLow;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.overlay}
        />
        {/* Trust Badge */}
        <View style={[styles.trustBadge, { backgroundColor: trustColor }]}>
          <Ionicons name="shield-checkmark" size={10} color="#fff" />
          <Text style={styles.trustText}>{trustScore}%</Text>
        </View>
        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.titleText} numberOfLines={2}>{title || location}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={10} color="#fff" />
              <Text style={styles.metaText}>{duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="wallet-outline" size={10} color="#fff" />
              <Text style={styles.metaText}>{budget}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Ionicons name="location" size={12} color={colors.primary} />
        <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  trustBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  trustText: {
    fontSize: 9,
    fontWeight: typography.bold,
    color: '#fff',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
  },
  titleText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: '#fff',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: typography.medium,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  locationText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    flex: 1,
  },
});
