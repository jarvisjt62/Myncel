import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Badge, statusVariant, priorityVariant } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Can } from '@/auth/Can';
import { workOrdersApi } from '@/api/endpoints';
import type { WorkOrder, WorkOrderStatus } from '@/api/types';
import { colors, spacing, typography } from '@/theme';
import { formatDateTime, isOverdue } from '@/utils/date';
import type { WorkOrdersStackParamList } from '@/navigation/types';

type RProps = RouteProp<WorkOrdersStackParamList, 'WorkOrderDetail'>;

const STATUS_OPTIONS: WorkOrderStatus[] = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

export default function WorkOrderDetailScreen() {
  const route = useRoute<RProps>();
  const { id } = route.params;

  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<WorkOrderStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await workOrdersApi.get(id);
      setWo(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setStatus = async (status: WorkOrderStatus) => {
    if (!wo || updating) return;
    setUpdating(status);
    try {
      const updated = await workOrdersApi.updateStatus(wo.id, status);
      setWo(updated);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!wo) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text style={styles.errorText}>Work order not found.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.number}>#{wo.number}</Text>
        <Text style={styles.title}>{wo.title}</Text>

        <View style={styles.badgeRow}>
          <Badge label={wo.priority} variant={priorityVariant(wo.priority)} size="md" />
          <Badge label={wo.status.replace('_', ' ')} variant={statusVariant(wo.status)} size="md" />
          {wo.type ? <Badge label={wo.type} variant="info" size="md" /> : null}
        </View>

        {wo.description ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.body}>{wo.description}</Text>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          {wo.machine ? <DetailRow label="Equipment" value={wo.machine.name} /> : null}
          {wo.assignedTo ? <DetailRow label="Assigned to" value={wo.assignedTo.name} /> : null}
          <DetailRow
            label="Due"
            value={wo.dueAt ? formatDateTime(wo.dueAt) : 'No due date'}
            highlight={wo.dueAt ? isOverdue(wo.dueAt) : false}
          />
          {wo.completedAt ? <DetailRow label="Completed" value={formatDateTime(wo.completedAt)} /> : null}
          <DetailRow label="Created" value={formatDateTime(wo.createdAt)} />
        </Card>

        {wo.notes ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.body}>{wo.notes}</Text>
          </Card>
        ) : null}

        <Can permission="workorders.edit">
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Update status</Text>
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s}
                  title={s.replace('_', ' ')}
                  onPress={() => setStatus(s)}
                  variant={wo.status === s ? 'primary' : 'secondary'}
                  size="sm"
                  loading={updating === s}
                  disabled={wo.status === s || updating !== null}
                />
              ))}
            </View>
          </Card>
        </Can>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueDanger]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPage },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: typography.sm },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  number: { fontSize: typography.sm, color: colors.textMuted, fontWeight: typography.semibold, marginBottom: spacing.xs },
  title: { fontSize: typography.xxl, fontWeight: typography.bold, color: colors.text, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  body: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: typography.sm * typography.lineHeight.relaxed },
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
  rowValueDanger: { color: colors.danger },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
