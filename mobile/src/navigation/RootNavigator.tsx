/**
 * Navegador raiz - Decide entre AuthStack e MainStack
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export interface RootNavigatorRef {
  navigate: (name: string, params?: any) => void;
  getNavigation: () => any;
}

export const RootNavigator = forwardRef<RootNavigatorRef>((props, ref) => {
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = React.useRef<any>(null);

  useImperativeHandle(ref, () => ({
    navigate: (name: string, params?: any) => {
      if (navigationRef.current) {
        navigationRef.current.navigate(name, params);
      }
    },
    getNavigation: () => navigationRef.current,
  }));

  if (loading) {
    // TODO: Adicionar SplashScreen
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

