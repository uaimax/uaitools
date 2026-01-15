/**
 * Componente Button - Botão reutilizável
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[size],
    variant === 'primary' ? styles.primary : null,
    variant === 'secondary' ? styles.secondary : null,
    variant === 'ghost' ? styles.ghost : null,
    isDisabled ? styles.disabled : null,
    style,
  ].filter((s): s is ViewStyle => s !== null && s !== undefined);

  const textStyle: (TextStyle | null)[] = [
    styles.text,
    variant === 'primary' ? styles.textPrimary : null,
    variant === 'secondary' ? styles.textSecondary : null,
    variant === 'ghost' ? styles.textGhost : null,
    isDisabled ? styles.textDisabled : null,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.text.primary : colors.primary.default}
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  medium: {
    height: 48,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
  },
  large: {
    height: 56,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
  },
  primary: {
    backgroundColor: colors.primary.default,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.title3,
  },
  textPrimary: {
    color: colors.text.primary,
  },
  textSecondary: {
    color: colors.text.primary,
  },
  textGhost: {
    color: colors.primary.default,
  },
  textDisabled: {
    opacity: 0.7,
  },
});


