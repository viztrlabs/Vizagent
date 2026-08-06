import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConfigData, MaterialData, LightData } from '../types';
import { configDataSchema } from '../xr/validation';

const MAX_HISTORY = 50;
const AUTO_SAVE_DELAY = 3000;

interface HistoryEntry {
  config: ConfigData;
  timestamp: number;
}

interface ConfiguratorStore {
  config: ConfigData | null;
  history: HistoryEntry[];
  historyIndex: number;
  isDirty: boolean;
  lastSavedAt: number | null;
  xrAssetId: string | null;

  setConfig: (config: ConfigData) => void;
  loadConfig: (xrAssetId: string) => Promise<void>;
  saveConfig: () => Promise<void>;

  updateMaterial: (materialId: string, updates: Partial<MaterialData>) => void;
  addMaterial: (material: MaterialData) => void;
  removeMaterial: (materialId: string) => void;

  updateLight: (lightId: string, updates: Partial<LightData>) => void;

  updateScene: (updates: Partial<ConfigData['scene']>) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const defaultConfig: ConfigData = {
  scene: {
    bg: '#080a0f',
    exposure: 1.0,
    toneMapping: 'ACES',
    environment: 'studio',
  },
  materials: [],
  objects: [],
  lights: [
    {
      id: 'default-hemisphere',
      name: 'Hemisphere Light',
      enabled: true,
      type: 'hemisphere',
      color: '#ffffff',
      intensity: 0.8,
      position: [0, 10, 0],
      castShadow: false,
    },
  ],
  camera: {
    position: [0, 1.7, 5],
    target: [0, 1.7, 0],
    fov: 60,
  },
};

export const useConfiguratorStore = create<ConfiguratorStore>()(
  persist(
    (set, get) => ({
      config: null,
      history: [],
      historyIndex: -1,
      isDirty: false,
      lastSavedAt: null,
      xrAssetId: null,

      setConfig: (config) => {
        const validation = configDataSchema.safeParse(config);
        if (!validation.success) {
          console.error('Invalid config:', validation.error);
          return;
        }

        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ config, timestamp: Date.now() });

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        set({
          config,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isDirty: true,
        });
      },

      loadConfig: async (xrAssetId) => {
        try {
          const response = await fetch(`/api/xr/assets/${xrAssetId}/config`);
          if (response.ok) {
            const data = await response.json();
            const config = JSON.parse(data.config.data);
            set({
              config,
              xrAssetId,
              history: [{ config, timestamp: Date.now() }],
              historyIndex: 0,
              isDirty: false,
            });
          } else {
            set({ config: defaultConfig, xrAssetId });
          }
        } catch (error) {
          console.error('Failed to load config:', error);
          set({ config: defaultConfig, xrAssetId });
        }
      },

      saveConfig: async () => {
        const { config, xrAssetId, isDirty } = get();
        if (!config || !xrAssetId || !isDirty) return;

        try {
          await fetch(`/api/xr/assets/${xrAssetId}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: JSON.stringify(config), name: 'default' }),
          });
          set({ isDirty: false, lastSavedAt: Date.now() });
        } catch (error) {
          console.error('Failed to save config:', error);
        }
      },

      updateMaterial: (materialId, updates) => {
        const { config, setConfig } = get();
        if (!config) return;

        const updatedMaterials = config.materials.map((mat) =>
          mat.id === materialId ? { ...mat, ...updates } : mat
        );
        setConfig({ ...config, materials: updatedMaterials });
      },

      addMaterial: (material) => {
        const { config, setConfig } = get();
        if (!config) return;
        setConfig({ ...config, materials: [...config.materials, material] });
      },

      removeMaterial: (materialId) => {
        const { config, setConfig } = get();
        if (!config) return;
        setConfig({
          ...config,
          materials: config.materials.filter((m) => m.id !== materialId),
        });
      },

      updateLight: (lightId, updates) => {
        const { config, setConfig } = get();
        if (!config) return;

        const updatedLights = config.lights.map((light) =>
          light.id === lightId ? { ...light, ...updates } : light
        );
        setConfig({ ...config, lights: updatedLights });
      },

      updateScene: (updates) => {
        const { config, setConfig } = get();
        if (!config) return;
        setConfig({ ...config, scene: { ...config.scene, ...updates } });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex <= 0) return;
        const newIndex = historyIndex - 1;
        set({ historyIndex: newIndex, config: history[newIndex].config });
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex >= history.length - 1) return;
        const newIndex = historyIndex + 1;
        set({ historyIndex: newIndex, config: history[newIndex].config });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }),
    {
      name: 'viztr-configurator',
      partialize: (state) => ({
        config: state.config,
        xrAssetId: state.xrAssetId,
      }),
    }
  )
);
