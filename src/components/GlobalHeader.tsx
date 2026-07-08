import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DropdownMenu } from './DropdownMenu';
import { useTheme } from '../hooks/useTheme';
import { gradients, spacing, typography, borderRadius } from '../theme';

interface GlobalHeaderProps {
  navigation: any;
}

export function GlobalHeader({ navigation }: GlobalHeaderProps) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        paddingTop: insets.top + spacing.xs,
        borderBottomColor: colors.border
      }
    ]}>
      <View style={styles.headerLeft}>
        <LinearGradient colors={gradients.primary} style={styles.headerLogo}>
          <Ionicons name="compass" size={20} color="#fff" />
        </LinearGradient>
        <Text style={[styles.headerTitle, { color: colors.text }]}>WanderLab</Text>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <DropdownMenu navigation={navigation} iconColor={colors.text} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
