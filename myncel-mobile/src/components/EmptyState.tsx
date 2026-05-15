/**
 * EmptyState — placeholder for empty list screens.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  icon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.sm * typography.lineHeight.relaxed,
  },
  action: {
    marginTop: spacing.lg,
  },
});
