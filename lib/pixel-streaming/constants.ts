import type { QualityPreset } from './types';

export const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || 'wss://stream.viztr.io';
export const METRICS_URL = process.env.NEXT_PUBLIC_METRICS_URL || 'https://metrics.viztr.io';

export const QUALITY_PRESETS: QualityPreset[] = [
  { name: 'Ultra', bitrate: 8, label: '8 Mbps' },
  { name: 'High', bitrate: 4, label: '4 Mbps' },
  { name: 'Standard', bitrate: 2, label: '2 Mbps' },
  { name: 'Low', bitrate: 1, label: '1 Mbps' },
];

export const DESIGN_TOKENS = {
  colors: {
    bg: '#0D0D0F',
    surface: '#141416',
    surface2: '#1A1A1E',
    surface3: '#222226',
    gold: '#C9A84C',
    green: '#1D9E75',
    cyan: '#00C8E0',
    purple: '#534AB7',
    red: '#E24B4A',
    text: '#F0EDE8',
    text2: '#A09D97',
    text3: '#55534E',
  },
  fonts: {
    syne: "'Syne', sans-serif",
    mono: "'JetBrains Mono', monospace",
    inter: "'Inter', sans-serif",
  },
} as const;
