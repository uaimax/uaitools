/**
 * Tipos de navegação
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Inbox: undefined;
  NotesList:
    | {
        boxId?: string;
        filterType?: 'audio' | 'text' | 'checklist' | 'all';
        viewMode?: 'grid' | 'list';
      }
    | undefined;
  NoteDetail: { noteId: string };
  NoteEdit: { noteId: string };
  BoxesManagement: undefined;
  Settings: undefined;
  Query: undefined;
  BrainAnswer: {
    question: string;
    answer: string;
    sources: Array<{
      note_id: string;
      excerpt: string;
      date: string;
      box_name: string;
    }>;
  };
  AudioReceived: { audioUri?: string; audioName?: string };
  NotesSearch: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

