import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Badge, statusVariant } from '@/components/Badge';
import { machinesApi } from '@/api/endpoints';
import type { Machine } from '@/api/types';
import { colors, spacing, typography } from '@/theme';
import { formatDate } from '@/utils/date';
import type { EquipmentStackParamList } from '@/navigation/types';

type RProps = RouteProp<EquipmentStackParamList, 'EquipmentDetail'>;

export default function EquipmentDetailScreen() {
  const route = useRoute<RProps>();
  const { id } = route.params;

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await machinesApi.get(id);
      setMachine(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !machine) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{machine.name}</Text>
          <Badge label={machine.status.replace('_', ' ')} variant={statusVariant(machine.status)} size="md" />
        </View>

        <Card style={styles.card}>
          <DetailRow label="Type" value={machine.type} />
          {machine.serialNumber ? <DetailRow label="Serial Number" value={machine.serialNumber} /> : null}
          {machine.manufacturer ? <DetailRow label="Manufacturer" value={machine.manufacturer} /> : null}
          {machine.model ? <DetailRow label="Model" value={machine.model} /> : null}
          {machine.location ? <DetailRow label="Location" value={machine.location} /> : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Service</Text>
          <DetailRow label="Installed" value={formatDate(machine.installedAt)} />
          <DetailRow label="Last Service" value={formatDate(machine.lastServiceAt)} />
          <DetailRow label="Next Service" value={formatDate(machine.nextServiceAt)} />
        </Card>

        {machine.notes ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{machine.notes}</Text>
          </Card>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  card: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowLabel: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: typography.medium,
  },
  rowValue: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.text,
    fontWeight: typography.semibold,
    textAlign: 'right',
  },
  notes: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.lineHeight.relaxed,
  },
});
