import { Platform } from 'react-native';

export const C = {
  bg:             '#0f0f0f',
  surface:        '#1a1a1a',
  surfaceRaised:  '#222222',
  border:         '#2a2a2a',
  borderActive:   '#4f46e5',

  gold:           '#4f46e5',
  goldLight:      '#6366f1',
  goldDim:        '#312e81',

  danger:         '#ef4444',
  dangerBg:       '#1a0000',
  dangerBorder:   '#7f1d1d',

  warning:        '#f59e0b',
  warningBg:      '#1a1000',
  warningBorder:  '#78350f',

  success:        '#22c55e',
  successBg:      '#001a0a',
  successBorder:  '#14532d',

  text1:          '#f3f4f6',
  text2:          '#9ca3af',
  text3:          '#4b5563',
};

export const F = {
  display: Platform.select({ ios: 'Georgia', android: 'serif' }) as string,
  body:    Platform.select({ ios: 'System',  android: 'sans-serif' }) as string,
  mono:    Platform.select({ ios: 'Courier New', android: 'monospace' }) as string,
};

export const riskColors = {
  high:   { fg: C.danger,  bg: C.dangerBg,  border: C.dangerBorder },
  medium: { fg: C.warning, bg: C.warningBg, border: C.warningBorder },
  low:    { fg: C.success, bg: C.successBg, border: C.successBorder },
};
