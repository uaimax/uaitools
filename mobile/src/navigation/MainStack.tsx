/**
 * Stack de navegação principal (após login)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainScreen } from '@/screens/home/MainScreen';
import { InboxScreen } from '@/screens/inbox/InboxScreen';
import { BoxesManagementScreen } from '@/screens/boxes/BoxesManagementScreen';
import { NoteDetailScreen } from '@/screens/notes/NoteDetailScreen';
import { NoteEditScreen } from '@/screens/notes/NoteEditScreen';
import { NotesListScreen } from '@/screens/notes/NotesListScreen';
import { NotesSearchScreen } from '@/screens/notes/NotesSearchScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { QueryScreen } from '@/screens/query/QueryScreen';
import { BrainAnswerScreen } from '@/screens/query/BrainAnswerScreen';
import { AudioReceivedScreen } from '@/screens/audio/AudioReceivedScreen';
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
      <Stack.Screen name="Home" component={MainScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="BoxesManagement" component={BoxesManagementScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      <Stack.Screen name="NoteEdit" component={NoteEditScreen} />
      <Stack.Screen name="NotesList" component={NotesListScreen} />
      <Stack.Screen name="NotesSearch" component={NotesSearchScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Query" component={QueryScreen} />
      <Stack.Screen name="BrainAnswer" component={BrainAnswerScreen} />
      <Stack.Screen name="AudioReceived" component={AudioReceivedScreen} />
    </Stack.Navigator>
  );
};

