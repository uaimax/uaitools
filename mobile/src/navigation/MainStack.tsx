/**
 * Stack de navegação principal (após login)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { InboxScreen } from '@/screens/inbox/InboxScreen';
import { BoxesManagementScreen } from '@/screens/boxes/BoxesManagementScreen';
import { NoteDetailScreen } from '@/screens/notes/NoteDetailScreen';
import { NoteEditScreen } from '@/screens/notes/NoteEditScreen';
import { NotesListScreen } from '@/screens/notes/NotesListScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { QueryScreen } from '@/screens/query/QueryScreen';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="BoxesManagement" component={BoxesManagementScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      <Stack.Screen name="NoteEdit" component={NoteEditScreen} />
      <Stack.Screen name="NotesList" component={NotesListScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Query" component={QueryScreen} />
    </Stack.Navigator>
  );
};

