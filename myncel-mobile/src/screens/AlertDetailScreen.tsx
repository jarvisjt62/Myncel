import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Can } from '@/auth/Can';
import { alertsApi } from '@/api/endpoints';
import type { Alert as AlertType, AlertSeverity } from '@/api/types';
import { colors, spacing, typography } from '@/theme';
import { formatDateTime, formatRelative } from '@/utils/date';
import type { AlertsStackParamList } from '@/navigation/types';

type RProps = RouteProp<AlertsStackParamList, 'AlertDetail'>;

function severityVariant(s: AlertSeverity) {
  switch (s) {
    case 'CRITICAL': return 'critical' as const;
    case 'HIGH': return 'high' as const;
    case 'MEDIUM': return 'medium' as const;
    case 'LOW': return 'low' as const;
  }
}

export default function AlertDetailScreen() {
  const route = useRoute<RProps>();
  const { id } = route.params;

  const [alert, setAlert] = useState<AlertType | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await alertsApi.get(id);
      setAlert(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onResolve = async () => {
    if (!alert || resolving) return;
    setResolving(true);
    try {
      const updated = await alertsApi.resolve(alert.id);
      setAlert(updated);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to resolve.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text style={styles.errorText}>Alert not found.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          <Badge label={alert.severity} variant={severityVariant(alert.severity)} size="md" />
          {alert.resolved ? <Badge label="Resolved" variant="success" size="md" /> : null}
          {alert.source ? <Badge label={alert.source} variant="default" size="md" /> : null}
        </View>

        <Text style={styles.title}>{alert.title}</Text>

        <Card style={styles.card}>
          <Text style={styles.body}>{alert.message}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          {alert.machine ? <DetailRow label="Equipment" value={alert.machine.name} /> : null}
          <DetailRow label="Triggered" value={formatDateTime(alert.createdAt)} />
          <DetailRow label="Time ago" value={formatRelative(alert.createdAt)} />
          {alert.resolvedAt ? <DetailRow label="Resolved" value={formatDateTime(alert.resolvedAt)} /> : null}
        </Card>

        {!alert.resolved ? (
          <Can permission="alerts.resolve">
            <Button
              title="Mark as resolved"
              onPress={onResolve}
              loading={resolving}
              fullWidth
              size="lg"
            />
          </Can>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPage },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: typography.sm },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: typography.xxl, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  body: { fontSize: typography.base, color: colors.textSecondary, lineHeight: typography.base * typography.lineHeight.normal },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowLabel: { fontSize: typography.sm, color: colors.textMuted, fontWeight: typography.medium },
  rowValue: { flex: 1, fontSize: typography.sm, color: colors.text, fontWeight: typography.semibold, textAlign: 'right' },
});
