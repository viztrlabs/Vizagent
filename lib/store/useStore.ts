import { create } from 'zustand';

import type { TourSettings } from '@/lib/tour/types';

interface TourStoreState {
  selectedFloor: string | null;
  showFloorPlan: boolean;
  currentRoom: string | null;
}

interface TourStoreActions {
  setTourStore: (partial: Partial<TourStoreState>) => void;
}

const useTourStore = create<TourStoreState & TourStoreActions>((set) => ({
  selectedFloor: null,
  showFloorPlan: false,
  currentRoom: null,
  setTourStore: (partial) => set((state) => ({ ...state, ...partial })),
}));

export const useStore = () => useTourStore();