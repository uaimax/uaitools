/**
 * Hook para gerenciar estado da interface de notas
 * Modo de visualização, filtros, sidebar, etc.
 */

import { useState, useCallback } from 'react';
import type { DrawerFilterType } from '@/components/navigation/NotesDrawer';

export type ViewMode = 'grid' | 'list';
export type FilterType = 'audio' | 'text' | 'checklist' | 'all';

interface UseNotesViewReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  activeFilter: DrawerFilterType;
  activeBoxId: string | null;
  setFilter: (filter: DrawerFilterType, boxId?: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function useNotesView(initialBoxId?: string): UseNotesViewReturn {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DrawerFilterType>(
    initialBoxId ? 'box' : 'all'
  );
  const [activeBoxId, setActiveBoxId] = useState<string | null>(
    initialBoxId || null
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const setFilter = useCallback(
    (filter: DrawerFilterType, boxId?: string | null) => {
      setActiveFilter(filter);
      setActiveBoxId(boxId || null);
    },
    []
  );

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    drawerOpen,
    setDrawerOpen,
    toggleDrawer,
    activeFilter,
    activeBoxId,
    setFilter,
    searchQuery,
    setSearchQuery,
  };
}

