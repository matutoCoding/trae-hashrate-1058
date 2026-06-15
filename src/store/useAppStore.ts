import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Location, MeteorShower, AppState } from '@/types';
import { getLocations, getShowers, getCurrentSetting } from '@/utils/storage';
import { getTodayDateString } from '@/utils/format';

interface AppStore extends AppState {
  locations: Location[];
  showers: MeteorShower[];
  setLocation: (location: Location | null) => void;
  setShower: (shower: MeteorShower | null) => void;
  setObservationDate: (date: string) => void;
  setCloudCover: (cover: number) => void;
  setLightPollution: (level: number) => void;
  refreshLocations: () => void;
  refreshShowers: () => void;
  initializeFromStorage: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      currentShower: null,
      observationDate: getTodayDateString(),
      cloudCover: 0,
      lightPollution: 4,
      locations: [],
      showers: [],

      setLocation: (location) => set({ currentLocation: location }),
      setShower: (shower) => set({ currentShower: shower }),
      setObservationDate: (date) => set({ observationDate: date }),
      setCloudCover: (cover) => set({ cloudCover: cover }),
      setLightPollution: (level) => set({ lightPollution: level }),

      refreshLocations: () => {
        const locations = getLocations();
        set({ locations });
        if (!get().currentLocation && locations.length > 0) {
          set({ currentLocation: locations[0] });
        }
      },

      refreshShowers: () => {
        const showers = getShowers();
        set({ showers });
        if (!get().currentShower && showers.length > 0) {
          const defaultShower = showers.find(s => s.id === 'geminids') || showers[0];
          set({ currentShower: defaultShower });
        }
      },

      initializeFromStorage: () => {
        get().refreshLocations();
        get().refreshShowers();

        const savedSetting = getCurrentSetting();
        if (savedSetting) {
          const locations = get().locations;
          const showers = get().showers;

          const location = locations.find(l => l.id === savedSetting.locationId);
          const shower = showers.find(s => s.id === savedSetting.showerId);

          if (location) set({ currentLocation: location });
          if (shower) set({ currentShower: shower });
          if (savedSetting.observationDate) set({ observationDate: savedSetting.observationDate });
          if (savedSetting.cloudCover !== undefined) set({ cloudCover: savedSetting.cloudCover });
          if (savedSetting.lightPollution !== undefined) set({ lightPollution: savedSetting.lightPollution });
        }
      },
    }),
    {
      name: 'meteor-app-store',
      partialize: (state) => ({
        observationDate: state.observationDate,
        cloudCover: state.cloudCover,
        lightPollution: state.lightPollution,
      }),
    }
  )
);
