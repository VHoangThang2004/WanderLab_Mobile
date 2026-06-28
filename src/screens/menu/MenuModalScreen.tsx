import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { useLanguageStore } from '../../stores/languageStore';

export function MenuModalScreen({ navigation }: any) {
  const { language } = useLanguageStore();

  const menuItems = [
    { id: 'diary', icon: 'create-outline', label: language === 'vi' ? 'Tạo Nhật Ký' : 'Create Diary', route: 'CreateDiary' },
    { id: 'itinerary', icon: 'map-outline', label: language === 'vi' ? 'Tạo Lịch Trình' : 'Create Itinerary', route: 'CreateItinerary' },
    { id: 'friends', icon: 'people-outline', label: language === 'vi' ? 'Bạn Bè' : 'Friends', route: 'Follows' },
    { id: 'messages', icon: 'chatbubbles-outline', label: language === 'vi' ? 'Nhắn Tin' : 'Messages', route: 'MessageList' },
    { id: 'notifications', icon: 'notifications-outline', label: language === 'vi' ? 'Thông Báo' : 'Notifications', route: 'Notifications' },
    { id: 'subscription', icon: 'card-outline', label: language === 'vi' ? 'Chọn Gói' : 'Subscription', route: 'Subscription' },
  ];

  const handleNavigate = (route: string) => {
    navigation.goBack();
    setTimeout(() => {
      navigation.navigate(route);
    }, 100);
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} />
      <View style={styles.bottomSheet}>
        <View style={styles.handleBar} />
        <Text style={styles.title}>{language === 'vi' ? 'Thêm' : 'More'}</Text>
        
        <View style={styles.grid}>
          {menuItems.map(item => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleNavigate(item.route)}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={28} color={colors.text} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.xl,
    marginLeft: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  menuLabel: {
    fontSize: typography.xs,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  }
});
