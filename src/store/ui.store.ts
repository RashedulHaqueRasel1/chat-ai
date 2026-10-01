import { create } from 'zustand';
import { DEFAULT_MODEL } from '@/config/models';

interface UIState {
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  selectedModel: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSelectedModel: (model: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isSettingsOpen: false,
  selectedModel: DEFAULT_MODEL,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setSelectedModel: (model) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_selected_model', model);
    }
    set({ selectedModel: model });
  },
}));
