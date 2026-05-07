import { Platform } from 'react-native';

export const C = {
  bg:             '#08090D',
  surface:        '#0D1119',
  surfaceRaised:  '#131B27',
  border:         '#182030',
  borderActive:   '#2D4060',

  gold:           '#C8A44A',
  goldLight:      '#E2BC6A',
  goldDim:        '#6A5520',

  danger:         '#C43838',
  dangerBg:       '#160808',
  dangerBorder:   '#5A1818',

  warning:        '#C47820',
  warningBg:      '#160E04',
  warningBorder:  '#5A3810',

  success:        '#389658',
  successBg:      '#051408',
  successBorder:  '#1A5028',

  text1:          '#EBF0F5',
  text2:          '#7A8599',
  text3:          '#3C4555',
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
