import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigation, createNavigationContainerRef } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';

// Components
import { GlobalHeader } from '../components/GlobalHeader';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { FeedScreen } from '../screens/home/FeedScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';

// Diary Screens
import { DiaryDetailScreen } from '../screens/diary/DiaryDetailScreen';
import { CreateDiaryScreen } from '../screens/diary/CreateDiaryScreen';
import { CommentScreen } from '../screens/diary/CommentScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { FollowsScreen } from '../screens/profile/FollowsScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { PartnerScreen } from '../screens/profile/PartnerScreen';
import { GroupDetailScreen } from '../screens/profile/GroupDetailScreen';
import { DiaryBookScreen } from '../screens/diary/DiaryBookScreen';
import { DiaryBookDetailScreen } from '../screens/diary/DiaryBookDetailScreen';
import { CreateDiaryBookScreen } from '../screens/diary/CreateDiaryBookScreen';
import { EditDiaryScreen } from '../screens/diary/EditDiaryScreen';

// Community Screens
import { CreateGroupScreen } from '../screens/community/CreateGroupScreen';
import { JoinGroupScreen } from '../screens/community/JoinGroupScreen';

// Message Screens
import { MessageListScreen } from '../screens/messages/MessageListScreen';
import { ChatScreen } from '../screens/messages/ChatScreen';
import { CallScreen } from '../screens/messages/CallScreen';

// Notification Screen
import { NotificationScreen } from '../screens/notifications/NotificationScreen';

// Phase 3 Screens (AI & Payment)
import { CreateItineraryScreen } from '../screens/itinerary/CreateItineraryScreen';
import { AIAssistantScreen } from '../screens/ai/AIAssistantScreen';
import { SubscriptionScreen as SubscriptionScreenV2 } from '../screens/subscription/SubscriptionScreen';
import { CheckoutScreen } from '../screens/subscription/CheckoutScreen';

// Auth store
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { colors as staticColors, gradients } from '../theme';
import { webrtcService, SignalPayload } from '../api/webrtcService';

export const navigationRef = createNavigationContainerRef<any>();

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function FloatingActionMenu() {
  const navigation = useNavigation<any>();
  const pan = useRef(new Animated.ValueXY()).current;
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;

  const toggleMenu = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(animation, {
      toValue,
      friction: 6,
      useNativeDriver: false,
    }).start();
  };

  const handleNavigate = (route: string) => {
    toggleMenu();
    navigation.navigate(route);
  };

  const bubble1Y = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const bubble2Y = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -140] });
  const bubble3Y = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -210] });
  const rotation = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Option 3: Create Itinerary (Diamond/Triangle shape) */}
      <Animated.View style={[styles.subBubbleWrapper, { transform: [{ translateY: bubble3Y }, { scale: animation }] }]}>
        <TouchableOpacity style={styles.subBubble} activeOpacity={0.8} onPress={() => handleNavigate('CreateItinerary')}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={[styles.subBubbleGradient, { borderRadius: 12, transform: [{ rotate: '45deg' }] }]}>
            <View style={{ transform: [{ rotate: '-45deg' }] }}>
              <Ionicons name="map-outline" size={22} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Option 2: Create Diary (Square shape) */}
      <Animated.View style={[styles.subBubbleWrapper, { transform: [{ translateY: bubble2Y }, { scale: animation }] }]}>
        <TouchableOpacity style={styles.subBubble} activeOpacity={0.8} onPress={() => handleNavigate('CreateDiary')}>
          <LinearGradient colors={['#10b981', '#059669']} style={[styles.subBubbleGradient, { borderRadius: 12 }]}>
            <Ionicons name="book-outline" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Option 1: AI Assistant (Teardrop/Circle shape) */}
      <Animated.View style={[styles.subBubbleWrapper, { transform: [{ translateY: bubble1Y }, { scale: animation }] }]}>
        <TouchableOpacity style={styles.subBubble} activeOpacity={0.8} onPress={() => handleNavigate('AIAssistant')}>
          <LinearGradient colors={gradients.primary} style={[styles.subBubbleGradient, { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomRightRadius: 24, borderBottomLeftRadius: 6 }]}>
            <Ionicons name="color-wand" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Button */}
      <TouchableOpacity style={styles.mainBubble} activeOpacity={0.8} onPress={toggleMenu}>
        <Animated.View style={{ transform: [{ rotate: rotation }], width: '100%', height: '100%' }}>
          <LinearGradient colors={gradients.primary} style={styles.mainBubbleGradient}>
            <Ionicons name="add" size={32} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    width: 56,
    height: 56,
    zIndex: 999,
  },
  mainBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  mainBubbleGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBubbleWrapper: {
    position: 'absolute',
    bottom: 4, // Center aligned with the main button
    right: 4,
    width: 48,
    height: 48,
  },
  subBubble: {
    flex: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  subBubbleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function AppShellNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        header: (props) => <GlobalHeader {...props} />,
        tabBarStyle: { display: 'none' }, // Hides the bottom tab bar
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="ExploreMain" component={ExploreScreen} />
      <Tab.Screen name="ProfileMain" component={ProfileScreen} />
      <Tab.Screen name="Follows" component={FollowsScreen} />
      <Tab.Screen name="MessageList" component={MessageListScreen} />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        {/* App Shell handles the global header and main tab screens */}
        <MainStack.Screen name="AppShell" component={AppShellNavigator} />
        
        {/* Screens outside AppShell will not have the GlobalHeader */}
        <MainStack.Screen name="Chat" component={ChatScreen} />
        <MainStack.Screen name="Call" component={CallScreen} options={{ presentation: 'fullScreenModal' }} />
        <MainStack.Screen name="DiaryDetail" component={DiaryDetailScreen} />
        <MainStack.Screen name="CreateDiary" component={CreateDiaryScreen} options={{ presentation: 'fullScreenModal' }} />
        <MainStack.Screen name="EditDiary" component={EditDiaryScreen} options={{ presentation: 'fullScreenModal' }} />
        <MainStack.Screen name="Comment" component={CommentScreen} options={{ presentation: 'modal' }} />
        <MainStack.Screen name="GroupDetail" component={GroupDetailScreen} />
        <MainStack.Screen name="Partner" component={PartnerScreen} />
        <MainStack.Screen name="Subscription" component={SubscriptionScreenV2} />
        <MainStack.Screen name="DiaryBook" component={DiaryBookScreen} />
        <MainStack.Screen name="DiaryBookDetail" component={DiaryBookDetailScreen} />
        <MainStack.Screen name="CreateDiaryBook" component={CreateDiaryBookScreen} options={{ presentation: 'fullScreenModal' }} />
        
        {/* Community */}
        <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <MainStack.Screen name="JoinGroup" component={JoinGroupScreen} />
        
        {/* Phase 3 Screens */}
        <MainStack.Screen name="CreateItinerary" component={CreateItineraryScreen} />
        <MainStack.Screen name="AIAssistant" component={AIAssistantScreen} options={{ presentation: 'modal' }} />
        <MainStack.Screen name="SubscriptionV2" component={SubscriptionScreenV2} options={{ presentation: 'fullScreenModal' }} />
        <MainStack.Screen name="Checkout" component={CheckoutScreen} />
        <MainStack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ presentation: 'modal' }} />
      </MainStack.Navigator>
      <FloatingActionMenu />
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, user, subscribeToProfileUpdates, unsubscribeFromProfileUpdates, refreshSession } = useAuthStore();
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      refreshSession();
      subscribeToProfileUpdates();

      if (user?.id) {
        webrtcService.init(user.id, (payload: SignalPayload) => {
          if (payload.type === 'offer') {
            if (navigationRef.isReady()) {
              navigationRef.navigate('Call', {
                contactId: payload.callerId,
                contactName: payload.callerName,
                contactAvatar: payload.callerAvatar,
                isVideo: payload.isVideo,
                isIncoming: true,
                incomingOffer: payload.sdp
              });
            }
          }
        });
      }

    } else {
      unsubscribeFromProfileUpdates();
      webrtcService.cleanup();
    }
    return () => {
      unsubscribeFromProfileUpdates();
      webrtcService.cleanup();
    };
  }, [isAuthenticated, subscribeToProfileUpdates, unsubscribeFromProfileUpdates, refreshSession, user?.id]);

  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  const customTheme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  const linking = {
    prefixes: [Linking.createURL('/'), 'wanderlab://'],
    config: {
      screens: {
        ResetPassword: 'reset-password',
      },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={customTheme} linking={linking}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
