import { Platform } from 'react-native';

// iOS-native refined palette: light mode, system grays, single indigo accent.
export const C = {
  bg:             '#F5F5F7',   // iOS grouped table bg
  surface:        '#FFFFFF',
  surfaceRaised:  '#FFFFFF',
  border:         '#E5E5EA',   // systemGray5
  borderStrong:   '#D1D1D6',   // systemGray4
  separator:      '#C6C6C8',   // iOS hairline separator

  accent:         '#4F46E5',   // indigo-600
  accentSoft:     '#EEF0FF',
  accentDim:      '#7E7AE6',

  danger:         '#D63B36',
  dangerSoft:     '#FDECEC',
  warning:        '#C77A0A',
  warningSoft:    '#FBF1E2',
  success:        '#137333',
  successSoft:    '#E6F4EA',

  text1:          '#0A0A0F',
  text2:          '#3C3C43',   // iOS label secondary
  text3:          '#8E8E93',   // systemGray
  text4:          '#C7C7CC',   // systemGray2
  textInverse:    '#FFFFFF',
};

export const F = {
  // System font stack: SF Pro on iOS, Roboto on Android. No more serif/mono mix.
  body:    Platform.select({ ios: 'System', android: 'sans-serif' }) as string,
  display: Platform.select({ ios: 'System', android: 'sans-serif' }) as string,
};

export const riskColors = {
  high:   { fg: C.danger,  soft: C.dangerSoft  },
  medium: { fg: C.warning, soft: C.warningSoft },
  low:    { fg: C.success, soft: C.successSoft },
};

export const riskLabels: Record<'high'|'medium'|'low', string> = {
  high:   'Alto risco',
  medium: 'Atenção',
  low:    'Aprovado',
};
