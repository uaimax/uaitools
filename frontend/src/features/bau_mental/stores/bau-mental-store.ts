/** Store Zustand para estado do Baú Mental Web. */

import { create } from "zustand";

interface BauMentalState {
  // Navegação
  selectedBoxId: string | null;
  setSelectedBoxId: (boxId: string | null) => void;

  // Busca
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Context Panel
  contextPanelOpen: boolean;
  setContextPanelOpen: (open: boolean) => void;
  contextPanelContent: "details" | "edit" | "metadata" | null;
  setContextPanelContent: (content: "details" | "edit" | "metadata" | null) => void;

  // Histórico de buscas
  searchHistory: string[];
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
}

/** Store do Baú Mental usando Zustand.
 *
 * Gerencia estado global da interface web:
 * - Caixinha selecionada
 * - Busca textual
 * - Painel contextual
 * - Histórico de buscas
 */
export const useBauMentalStore = create<BauMentalState>((set) => ({
  // Navegação
  selectedBoxId: null,
  setSelectedBoxId: (boxId) => set({ selectedBoxId: boxId }),

  // Busca
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Context Panel
  contextPanelOpen: false,
  setContextPanelOpen: (open) => set({ contextPanelOpen: open }),
  contextPanelContent: null,
  setContextPanelContent: (content) =>
    set({ contextPanelContent: content, contextPanelOpen: content !== null }),

  // Histórico de buscas (usando localStorage diretamente)
  searchHistory: (() => {
    try {
      const stored = localStorage.getItem("bau-mental-search-history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  addToSearchHistory: (query) =>
    set((state) => {
      const trimmed = query.trim();
      if (!trimmed) return state;
      const filtered = state.searchHistory.filter((q) => q !== trimmed);
      const newHistory = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem("bau-mental-search-history", JSON.stringify(newHistory));
      } catch {
        // Ignorar erros de localStorage
      }
      return { searchHistory: newHistory };
    }),
  clearSearchHistory: () => {
    try {
      localStorage.removeItem("bau-mental-search-history");
    } catch {
      // Ignorar erros
    }
    set({ searchHistory: [] });
  },
}));
