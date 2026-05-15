/**
 * Button — primary, secondary, danger, ghost variants.
 * Designed to match the Stripe-inspired aesthetic of the Myncel web app.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant].container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} size="small" />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text style={[textSizeStyles[size], variantStyles[variant].text, textStyle]}>
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 8, paddingHorizontal: spacing.md, minHeight: 36 },
  md: { paddingVertical: 12, paddingHorizontal: spacing.lg, minHeight: 44 },
  lg: { paddingVertical: 14, paddingHorizontal: spacing.xl, minHeight: 52 },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: typography.sm, fontWeight: typography.semibold },
  md: { fontSize: typography.base, fontWeight: typography.semibold },
  lg: { fontSize: typography.lg, fontWeight: typography.semibold },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: colors.primary },
    text: { color: colors.textOnPrimary },
  }),
  secondary: StyleSheet.create({
    container: {
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: { color: colors.text },
  }),
  danger: StyleSheet.create({
    container: { backgroundColor: colors.danger },
    text: { color: '#fff' },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  }),
};
