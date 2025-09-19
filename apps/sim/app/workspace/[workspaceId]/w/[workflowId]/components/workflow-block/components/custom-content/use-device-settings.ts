import { create } from 'zustand'

type DeviceSettingsKind = 'camera' | 'microphone'

interface DeviceSettingsState {
  openBlockId: string | null
  kind: DeviceSettingsKind | null
  open: (blockId: string, kind: DeviceSettingsKind) => void
  close: () => void
}

export const useDeviceSettingsStore = create<DeviceSettingsState>((set) => ({
  openBlockId: null,
  kind: null,
  open: (blockId: string, kind: DeviceSettingsKind) => set({ openBlockId: blockId, kind }),
  close: () => set({ openBlockId: null, kind: null }),
}))
