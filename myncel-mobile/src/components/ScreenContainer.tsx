/**
 * ScreenContainer — standard wrapper providing safe area, background, and
 * optional pull-to-refresh / scrolling.
 */

import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
};

export function ScreenContainer({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  style,
  contentStyle,
  edges = ['top'],
}: Props) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});
