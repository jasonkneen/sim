import { create } from 'zustand'

interface SmartNodeSettingsState {
  openBlockId: string | null
  open: (blockId: string) => void
  close: () => void
}

export const useSmartNodeSettingsStore = create<SmartNodeSettingsState>((set) => ({
  openBlockId: null,
  open: (blockId: string) => set({ openBlockId: blockId }),
  close: () => set({ openBlockId: null }),
}))
