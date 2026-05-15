import React, { useCallback, useState, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { Badge, statusVariant, priorityVariant } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { workOrdersApi } from '@/api/endpoints';
import type { WorkOrder, WorkOrderStatus } from '@/api/types';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDate, isOverdue } from '@/utils/date';
import type { WorkOrdersStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<WorkOrdersStackParamList, 'WorkOrdersList'>;

const FILTERS: Array<{ id: 'ALL' | WorkOrderStatus; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
];

export default function WorkOrdersListScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [filter, setFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await workOrdersApi.list();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter((wo) => wo.status === filter);
  }, [orders, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Work Orders</Text>
        <Text style={styles.subtitle}>
          {filtered.length} {filtered.length === 1 ? 'order' : 'orders'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loadingText}>Loading…</Text>
          ) : error ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          ) : (
            <EmptyState title="No work orders" description="Work orders will appear here when created." />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('WorkOrderDetail', { id: item.id, number: item.number })
            }
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleCol}>
                  <Text style={styles.cardNumber}>#{item.number}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                </View>
                <View style={styles.badges}>
                  <Badge label={item.priority} variant={priorityVariant(item.priority)} />
                  <Badge label={item.status.replace('_', ' ')} variant={statusVariant(item.status)} />
                </View>
              </View>
              <View style={styles.cardMeta}>
                {item.machine ? (
                  <Text style={styles.metaText} numberOfLines={1}>{item.machine.name}</Text>
                ) : null}
                {item.dueAt ? (
                  <Text style={[styles.metaText, isOverdue(item.dueAt) && styles.overdue]}>
                    Due {formatDate(item.dueAt)}
                  </Text>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPage },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: typography.xxl, fontWeight: typography.bold, color: colors.text },
  subtitle: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.semibold },
  filterTextActive: { color: '#fff' },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  loadingText: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', marginTop: spacing.xl },
  card: { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitleCol: { flex: 1 },
  cardNumber: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textMuted,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  badges: { gap: spacing.xs, alignItems: 'flex-end' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  metaText: { fontSize: typography.xs, color: colors.textSecondary },
  overdue: { color: colors.danger, fontWeight: typography.semibold },
  pressed: { opacity: 0.7 },
  errorCard: { backgroundColor: colors.dangerBg, borderColor: '#fecaca' },
  errorText: { color: colors.danger, fontSize: typography.sm },
});
