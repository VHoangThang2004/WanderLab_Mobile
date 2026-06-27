import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Share } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme';
import type { DiaryFeedItem } from '../types/diary';

const { width } = Dimensions.get('window');

interface DiaryPostCardProps extends DiaryFeedItem {
  onPress?: () => void;
  onLikePress?: () => void;
  onBookmarkPress?: () => void;
  onCommentPress?: () => void;
}

export function DiaryPostCard({
  author,
  image,
  location,
  date,
  caption,
  likes,
  comments,
  is_liked,
  is_saved,
  onPress,
  onLikePress,
  onBookmarkPress,
  onCommentPress,
}: DiaryPostCardProps) {
  const [liked, setLiked] = useState(is_liked);
  const [saved, setSaved] = useState(is_saved);
  const [likesCount, setLikesCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    onLikePress?.();
  };

  const handleBookmark = () => {
    setSaved(!saved);
    onBookmarkPress?.();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Khám phá nhật ký hành trình "${caption}" của ${author.name} trên WanderLab!`,
      });
    } catch (error: any) {
      console.warn('Lỗi chia sẻ:', error.message);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      {/* Author Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Image
            source={{ uri: author.avatar }}
            style={styles.avatar}
            contentFit="cover"
            placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{author.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text style={styles.locationText}>{location}</Text>
              <Text style={styles.dateText}>· {date}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Cover Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.coverImage}
          contentFit="cover"
          placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.imageOverlay}
        />
      </View>

      {/* Caption */}
      {caption ? (
        <Text style={styles.caption} numberOfLines={3}>{caption}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={24}
              color={liked ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.actionCount, liked && { color: colors.primary }]}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.actionCount}>{comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  authorInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  authorName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  locationText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.medium,
    marginLeft: 2,
  },
  dateText: {
    fontSize: typography.xs,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.65,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  caption: {
    fontSize: typography.base,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    lineHeight: typography.base * typography.relaxed,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
});
