import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  style?: any;
}

export function UserAvatar({ src, name, style }: UserAvatarProps) {
  const isPlaceholder = !src || src.includes('unsplash.com');

  if (!isPlaceholder && src) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.avatar, style]}
        contentFit="cover"
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <LinearGradient
      colors={['#ff3131', '#ff914d']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.avatar, styles.gradientContainer, style]}
    >
      <Text style={styles.initialText}>{initial}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
  },
  gradientContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
