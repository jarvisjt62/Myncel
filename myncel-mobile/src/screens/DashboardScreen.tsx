import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { useAuth } from '@/auth/AuthContext';
import { dashboardApi } from '@/api/endpoints';
import type { DashboardStats } from '@/api/types';
import { colors, radius, spacing, typography } from '@/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <View style={styles.greeting}>
        <Text style={styles.hello}>Hi, {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        <Text style={styles.org}>{user?.organizationName}</Text>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      <View style={styles.grid}>
        <KpiCard
          label="Open Work Orders"
          value={stats?.openWorkOrders ?? '—'}
          color={colors.primary}
          loading={loading}
        />
        <KpiCard
          label="Unresolved Alerts"
          value={stats?.unresolvedAlerts ?? '—'}
          color={colors.danger}
          loading={loading}
        />
        <KpiCard
          label="Critical Equipment"
          value={stats?.criticalMachines ?? '—'}
          color={colors.warning}
          loading={loading}
        />
        <KpiCard
          label="Pending Tasks"
          value={stats?.pendingTasks ?? '—'}
          color={colors.info}
          loading={loading}
        />
        <KpiCard
          label="Total Equipment"
          value={stats?.totalMachines ?? '—'}
          color={colors.textSecondary}
          loading={loading}
        />
        <KpiCard
          label="Low Stock Parts"
          value={stats?.lowStockParts ?? '—'}
          color={colors.warning}
          loading={loading}
        />
      </View>

      <Card style={styles.helpCard}>
        <Text style={styles.helpTitle}>Quick tip</Text>
        <Text style={styles.helpText}>
          Pull down to refresh any list. Use the bottom tabs to switch between
          equipment, work orders, schedules, and alerts.
        </Text>
      </Card>
    </ScreenContainer>
  );
}

function KpiCard({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number | string;
  color: string;
  loading: boolean;
}) {
  return (
    <Card style={styles.kpi} padding="md">
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>
        {loading ? '…' : value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: spacing.lg,
  },
  hello: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: 2,
  },
  org: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpi: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  kpiLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  kpiValue: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
  },
  errorCard: {
    backgroundColor: colors.dangerBg,
    borderColor: '#fecaca',
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  helpCard: {
    backgroundColor: colors.primaryBg,
    borderColor: 'rgba(99, 91, 255, 0.25)',
  },
  helpTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  helpText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.lineHeight.relaxed,
  },
});
