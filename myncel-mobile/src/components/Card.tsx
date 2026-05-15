/**
 * Card — standard surface with rounded corners, subtle shadow, optional padding.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof spacing | 'none';
  elevated?: boolean;
};

export function Card({ children, style, padding = 'lg', elevated = true }: Props) {
  const padValue = padding === 'none' ? 0 : spacing[padding];
  return (
    <View
      style={[
        styles.base,
        { padding: padValue },
        elevated && shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
