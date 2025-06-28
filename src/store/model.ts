import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_MODEL_ID } from '../lib/models'

interface ModelStore {
  selectedModelId: string
  setSelectedModelId: (modelId: string) => void
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      selectedModelId: DEFAULT_MODEL_ID,
      setSelectedModelId: (modelId) => set({ selectedModelId: modelId }),
    }),
    {
      name: 'model-storage',
    }
  )
)