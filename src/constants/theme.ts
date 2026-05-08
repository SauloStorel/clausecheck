import { Platform } from 'react-native';

export const lightColors = {
  bg:             '#F5F5F7',
  surface:        '#FFFFFF',
  surfaceRaised:  '#FFFFFF',
  border:         '#E5E5EA',
  borderStrong:   '#D1D1D6',
  separator:      '#C6C6C8',

  accent:         '#4F46E5',
  accentSoft:     '#EEF0FF',
  accentDim:      '#7E7AE6',

  danger:         '#D63B36',
  dangerSoft:     '#FDECEC',
  warning:        '#C77A0A',
  warningSoft:    '#FBF1E2',
  success:        '#137333',
  successSoft:    '#E6F4EA',

  text1:          '#0A0A0F',
  text2:          '#3C3C43',
  text3:          '#8E8E93',
  text4:          '#C7C7CC',
  textInverse:    '#FFFFFF',
};

export const darkColors = {
  bg:             '#000000',
  surface:        '#1C1C1E',
  surfaceRaised:  '#2C2C2E',
  border:         '#38383A',
  borderStrong:   '#48484A',
  separator:      '#545458',
  accent:         '#6366F1',
  accentSoft:     '#1E1B4B',
  accentDim:      '#4F46E5',
  danger:         '#FF6961',
  dangerSoft:     '#3B1A1A',
  warning:        '#FF9F0A',
  warningSoft:    '#2E2100',
  success:        '#30D158',
  successSoft:    '#0D2B0D',
  text1:          '#FFFFFF',
  text2:          '#EBEBF5',
  text3:          '#8D8D93',
  text4:          '#48484A',
  textInverse:    '#000000',
};

export const C = lightColors;

export const F = {
  body:    Platform.select({ ios: 'System', android: 'sans-serif' }) as string,
  display: Platform.select({ ios: 'System', android: 'sans-serif' }) as string,
};

export function makeRiskColors(colors: typeof lightColors) {
  return {
    high:   { fg: colors.danger,  soft: colors.dangerSoft  },
    medium: { fg: colors.warning, soft: colors.warningSoft },
    low:    { fg: colors.success, soft: colors.successSoft },
  };
}

export const riskColors = makeRiskColors(lightColors);

export const riskLabels: Record<'high'|'medium'|'low', string> = {
  high:   'Alto risco',
  medium: 'Atenção',
  low:    'Aprovado',
};
