/**
 * Badge — colored pill for statuses, priorities, severities.
 * Variants pull color pairs from theme.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Variant =
  | 'default'
  | 'open' | 'inProgress' | 'onHold' | 'completed' | 'cancelled'
  | 'critical' | 'high' | 'medium' | 'low'
  | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  label: string;
  variant?: Variant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

export function Badge({ label, variant = 'default', size = 'sm', style }: Props) {
  const palette = paletteFor(variant);
  return (
    <View
      style={[
        styles.base,
        size === 'md' ? styles.medium : styles.small,
        { backgroundColor: palette.bg },
        style,
      ]}
    >
      <Text
        style={[
          size === 'md' ? styles.textMedium : styles.textSmall,
          { color: palette.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function paletteFor(variant: Variant): { bg: string; text: string } {
  switch (variant) {
    case 'open':       return colors.status.open;
    case 'inProgress': return colors.status.inProgress;
    case 'onHold':     return colors.status.onHold;
    case 'completed':  return colors.status.completed;
    case 'cancelled':  return colors.status.cancelled;
    case 'critical':   return colors.priority.critical;
    case 'high':       return colors.priority.high;
    case 'medium':     return colors.priority.medium;
    case 'low':        return colors.priority.low;
    case 'success':    return { bg: colors.successBg, text: colors.success };
    case 'warning':    return { bg: colors.warningBg, text: colors.warning };
    case 'danger':     return { bg: colors.dangerBg, text: colors.danger };
    case 'info':       return { bg: colors.infoBg, text: colors.info };
    default:           return { bg: colors.bgSurface2, text: colors.textSecondary };
  }
}

/** Map a backend status string to a Badge variant. */
export function statusVariant(status: string): Variant {
  switch (status) {
    case 'OPEN': return 'open';
    case 'IN_PROGRESS': return 'inProgress';
    case 'ON_HOLD': return 'onHold';
    case 'COMPLETED': return 'completed';
    case 'CANCELLED': return 'cancelled';
    case 'OPERATIONAL': return 'completed';
    case 'MAINTENANCE': return 'inProgress';
    case 'WARNING': return 'medium';
    case 'DOWN': return 'critical';
    case 'OFFLINE': return 'cancelled';
    default: return 'default';
  }
}

/** Map a backend priority string to a Badge variant. */
export function priorityVariant(priority: string): Variant {
  switch (priority) {
    case 'CRITICAL': return 'critical';
    case 'HIGH': return 'high';
    case 'MEDIUM': return 'medium';
    case 'LOW': return 'low';
    default: return 'default';
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  textSmall: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  textMedium: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
