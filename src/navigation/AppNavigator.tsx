import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';

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
import { EditDiaryScreen } from '../screens/diary/EditDiaryScreen';
import { SubscriptionScreen } from '../screens/profile/SubscriptionScreen';
import { MenuModalScreen } from '../screens/menu/MenuModalScreen';

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
import { useTranslation } from '../hooks/useTranslation';
import { colors as staticColors, gradients } from '../theme';

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Feed" component={FeedScreen} />
    </HomeStack.Navigator>
  );
}

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
    </ExploreStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Follows" component={FollowsScreen} />
    </ProfileStack.Navigator>
  );
}

const DummyComponent = () => null;

function MainTabs({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const pan = useRef(new Animated.ValueXY()).current;
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

  return (
    <View style={styles.mainTabsContainer}>
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          switch (route.name) {
            case 'HomeTab': iconName = focused ? 'home' : 'home-outline'; break;
            case 'ExploreTab': iconName = focused ? 'compass' : 'compass-outline'; break;
            case 'ProfileTab': iconName = focused ? 'person' : 'person-outline'; break;
            case 'MenuTab': iconName = focused ? 'grid' : 'grid-outline'; break;
          }

          if (focused) {
            return (
              <View style={{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                <LinearGradient
                  colors={gradients.primary}
                  style={{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Ionicons name={iconName} size={size} color="#fff" />
                </LinearGradient>
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ tabBarLabel: t('navigation.home') }} />
      <Tab.Screen name="ExploreTab" component={ExploreStackNavigator} options={{ tabBarLabel: t('navigation.explore') }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ tabBarLabel: t('navigation.profile') }} />
      <Tab.Screen 
        name="MenuTab" 
        component={DummyComponent}
        options={{ tabBarLabel: t('navigation.more') }}
        listeners={{
          tabPress: e => {
            e.preventDefault(); // Prevent default action
            navigation.navigate('MenuModal');
          },
        }}
      />
      </Tab.Navigator>

      <Animated.View
        style={[
          styles.floatingBubble,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AIAssistant')}
        >
          <LinearGradient
            colors={gradients.primary}
            style={styles.floatingBubbleGradient}
          >
            <Ionicons name="sparkles" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainTabsContainer: {
    flex: 1,
  },
  floatingBubble: {
    position: 'absolute',
    bottom: 105,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 999,
  },
  floatingBubbleGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="MessageList" component={MessageListScreen} />
      <MainStack.Screen name="Chat" component={ChatScreen} />
      <MainStack.Screen name="Call" component={CallScreen} options={{ presentation: 'fullScreenModal' }} />
      <MainStack.Screen name="Notifications" component={NotificationScreen} />
      <MainStack.Screen name="DiaryDetail" component={DiaryDetailScreen} />
      <MainStack.Screen name="CreateDiary" component={CreateDiaryScreen} options={{ presentation: 'fullScreenModal' }} />
      <MainStack.Screen name="EditDiary" component={EditDiaryScreen} options={{ presentation: 'fullScreenModal' }} />
      <MainStack.Screen name="Comment" component={CommentScreen} options={{ presentation: 'modal' }} />
      <MainStack.Screen name="MenuModal" component={MenuModalScreen} options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <MainStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <MainStack.Screen name="Partner" component={PartnerScreen} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="Follows" component={FollowsScreen} />
      <MainStack.Screen name="DiaryBook" component={DiaryBookScreen} />
      
      {/* Community */}
      <MainStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <MainStack.Screen name="JoinGroup" component={JoinGroupScreen} />
      
      {/* Phase 3 Screens */}
      <MainStack.Screen name="CreateItinerary" component={CreateItineraryScreen} />
      <MainStack.Screen name="AIAssistant" component={AIAssistantScreen} options={{ presentation: 'modal' }} />
      <MainStack.Screen name="SubscriptionV2" component={SubscriptionScreenV2} options={{ presentation: 'fullScreenModal' }} />
      <MainStack.Screen name="Checkout" component={CheckoutScreen} />
    </MainStack.Navigator>
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
  const { isAuthenticated, subscribeToProfileUpdates, unsubscribeFromProfileUpdates } = useAuthStore();
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      subscribeToProfileUpdates();
    } else {
      unsubscribeFromProfileUpdates();
    }
    return () => {
      unsubscribeFromProfileUpdates();
    };
  }, [isAuthenticated, subscribeToProfileUpdates, unsubscribeFromProfileUpdates]);

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

  return (
    <NavigationContainer theme={customTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
