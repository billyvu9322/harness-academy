import { create } from 'zustand';

interface ChatUiState {
  draft: string;
  setDraft: (draft: string) => void;
}

export const useChatUiStore = create<ChatUiState>((set) => ({
  draft: '',
  setDraft: (draft) => set({ draft }),
}));
