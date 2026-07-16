import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '../stores/languageStore';
import { useAuthStore } from '../stores/authStore';
import { colors, typography, spacing, borderRadius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

interface DropdownMenuProps {
  navigation: any;
  iconColor?: string;
}

export function DropdownMenu({ navigation, iconColor = colors.text }: DropdownMenuProps) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const { language } = useLanguageStore();
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const handleNavigate = (route: string) => {
    handleClose();
    setTimeout(() => {
      navigation.navigate(route);
    }, 250);
  };

  const handleLogout = () => {
    handleClose();
    setTimeout(() => {
      logout();
    }, 250);
  };

  const menuItems = [
    { id: 'home', icon: 'home-outline', label: language === 'vi' ? 'Trang Chủ' : 'Home', route: 'Feed' },
    { id: 'friends', icon: 'people-outline', label: language === 'vi' ? 'Bạn Bè' : 'Friends', route: 'Follows' },
    { id: 'create_diary', icon: 'add-circle-outline', label: language === 'vi' ? 'Tạo Nhật Ký' : 'Create Diary', route: 'CreateDiary' },
    { id: 'diary_book', icon: 'book-outline', label: language === 'vi' ? 'Cuốn Nhật Ký' : 'Diary Books', route: 'DiaryBook' },
    { id: 'create_itinerary', icon: 'git-network-outline', label: language === 'vi' ? 'Tạo Lịch Trình' : 'Create Plan', route: 'CreateItinerary' },
    { id: 'messages', icon: 'chatbubble-outline', label: language === 'vi' ? 'Nhắn Tin' : 'Messages', route: 'MessageList' },
  ];

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.iconButton}>
        <Ionicons name="menu-outline" size={28} color={iconColor} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={styles.overlayContainer}>
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={handleClose}
          />
          <Animated.View 
            style={[
              styles.drawer, 
              { 
                transform: [{ translateX: slideAnim }],
                paddingTop: insets.top,
                paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg
              }
            ]}
          >
            {/* Menu Items */}
            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.route)}
                >
                  <Ionicons name={item.icon as any} size={24} color={colors.textSecondary} style={styles.menuIcon} />
                  <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* Upgrade Plan Button */}
              <TouchableOpacity 
                style={styles.upgradeButtonWrapper}
                activeOpacity={0.8}
                onPress={() => handleNavigate('Subscription')}
              >
                <LinearGradient 
                  colors={['#ff512f', '#dd2476']} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeButton}
                >
                  <Ionicons name="card-outline" size={24} color="#fff" />
                  <Text style={styles.upgradeButtonText}>
                    {language === 'vi' ? 'Chọn Gói' : 'Choose Plan'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* User Profile Section */}
            <TouchableOpacity 
              style={styles.profileSection}
              onPress={() => handleNavigate('ProfileMain')}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{user?.full_name}</Text>
                <Text style={styles.profileEmail} numberOfLines={1}>{user?.email}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity 
                style={styles.actionIconButton}
                onPress={() => handleNavigate('Settings')}
              >
                <Ionicons name="settings-outline" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionIconButton}
                onPress={() => handleNavigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={28} color={colors.textSecondary} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>6</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionIconButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: spacing.xs,
  },
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    height: '100%',
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  menuList: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  menuIcon: {
    marginRight: spacing.md,
    width: 28,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },
  upgradeButtonWrapper: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: spacing.sm,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: spacing.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionIconButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
