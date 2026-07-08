import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '../stores/languageStore';
import { colors, typography, spacing, borderRadius } from '../theme';

interface DropdownMenuProps {
  navigation: any;
  iconColor?: string;
}

export function DropdownMenu({ navigation, iconColor = colors.text }: DropdownMenuProps) {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguageStore();

  const menuItems = [
    { id: 'home', icon: 'home-outline', label: language === 'vi' ? 'Trang chủ' : 'Home', route: 'Feed' },
    { id: 'profile', icon: 'person-outline', label: language === 'vi' ? 'Hồ sơ' : 'Profile', route: 'ProfileMain' },
    { id: 'friends', icon: 'people-outline', label: language === 'vi' ? 'Bạn Bè' : 'Friends', route: 'Follows' },
    { id: 'messages', icon: 'chatbubbles-outline', label: language === 'vi' ? 'Nhắn Tin' : 'Messages', route: 'MessageList' },
    { id: 'notifications', icon: 'notifications-outline', label: language === 'vi' ? 'Thông Báo' : 'Notifications', route: 'Notifications' },
    { id: 'create_diary', icon: 'book-outline', label: language === 'vi' ? 'Tạo Nhật Ký' : 'Create Diary', route: 'CreateDiary' },
    { id: 'create_itinerary', icon: 'map-outline', label: language === 'vi' ? 'Tạo Lịch Trình' : 'Create Plan', route: 'CreateItinerary' },
    { id: 'ai', icon: 'color-wand', label: language === 'vi' ? 'Tiện ích AI' : 'AI Assistant', route: 'AIAssistant' },
    { id: 'diary_book', icon: 'library-outline', label: language === 'vi' ? 'Kệ Sách' : 'Diary Books', route: 'DiaryBook' },
    { id: 'settings', icon: 'settings-outline', label: language === 'vi' ? 'Cài Đặt' : 'Settings', route: 'Settings' },
  ];

  const handleNavigate = (route: string) => {
    setVisible(false);
    navigation.navigate(route);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.iconButton}>
        <Ionicons name="menu-outline" size={28} color={iconColor} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.borderBottom
                ]}
                onPress={() => handleNavigate(item.route)}
              >
                <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} style={styles.menuIcon} />
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 55,
    right: 16,
    width: 210,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    marginRight: spacing.sm,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: typography.base,
    color: colors.text,
    fontWeight: '500',
  },
});
