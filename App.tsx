import React, { useEffect, useRef } from 'react';
import { StatusBar, LogBox } from 'react-native';
import * as Linking from 'expo-linking';

LogBox.ignoreLogs([
  'AuthApiError: Invalid Refresh Token',
]);
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores/authStore';
import { supabase } from './src/lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    // 1. Check existing session
    useAuthStore.getState().refreshSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          useAuthStore.getState().setUser(null);
        } else if (event === 'TOKEN_REFRESHED') {
          useAuthStore.getState().refreshSession();
        }
      }
    );

    // 3. Listen for deep links (Supabase auth tokens)
    const handleDeepLink = (event: Linking.EventType) => {
      const url = event.url;
      if (url && url.includes('#access_token=')) {
        const hash = url.split('#')[1];
        const params = hash.split('&').reduce((acc, curr) => {
          const [key, value] = curr.split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        if (params.access_token && params.refresh_token) {
          supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token
          });
        }
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url } as any);
    });

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff" 
        translucent={false} 
      />
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
