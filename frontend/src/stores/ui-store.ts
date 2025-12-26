/** Store Zustand para estado de UI (sidebar, theme, etc). */

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

/** Store de UI usando Zustand.
 *
 * Gerencia estado de componentes de UI como sidebar.
 */
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));



