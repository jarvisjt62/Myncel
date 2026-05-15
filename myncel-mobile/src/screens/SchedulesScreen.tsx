import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/Card';
import { Badge, priorityVariant } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Can } from '@/auth/Can';
import { tasksApi } from '@/api/endpoints';
import type { MaintenanceTask } from '@/api/types';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDate, isOverdue } from '@/utils/date';

export default function SchedulesScreen() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await tasksApi.list();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const markDone = async (id: string) => {
    if (completing) return;
    setCompleting(id);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await tasksApi.markDone(id);
      setDoneIds((prev) => new Set(prev).add(id));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to mark task done.');
    } finally {
      setCompleting(null);
    }
  };

  const pending = tasks.filter((t) => !doneIds.has(t.id));
  const completed = tasks.filter((t) => doneIds.has(t.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={pending}
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
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Schedules</Text>
            <Text style={styles.subtitle}>
              {pending.length} pending · {completed.length} completed
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loadingText}>Loading…</Text>
          ) : error ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          ) : completed.length > 0 ? (
            <Card style={styles.allDone}>
              <Text style={styles.allDoneTitle}>All caught up! 🎉</Text>
              <Text style={styles.allDoneText}>You&apos;ve completed every pending task.</Text>
            </Card>
          ) : (
            <EmptyState
              title="No tasks due"
              description="Maintenance tasks scheduled in the next 7 days will appear here."
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <Can permission="schedules.complete" fallback={<View style={styles.checkbox} />}>
                <Pressable
                  onPress={() => markDone(item.id)}
                  disabled={completing === item.id}
                  style={styles.checkbox}
                  hitSlop={8}
                >
                  {completing === item.id ? (
                    <View style={styles.checkboxLoading} />
                  ) : null}
                </Pressable>
              </Can>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {item.machine?.name ?? 'General'}
                </Text>
                <View style={styles.cardMeta}>
                  <Badge label={item.priority} variant={priorityVariant(item.priority)} />
                  {item.nextDueAt ? (
                    <Text
                      style={[
                        styles.dueText,
                        isOverdue(item.nextDueAt) && styles.overdueText,
                      ]}
                    >
                      {isOverdue(item.nextDueAt) ? 'Overdue · ' : ''}
                      {formatDate(item.nextDueAt)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </Card>
        )}
        ListFooterComponent={
          completed.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={styles.completedHeader}>
                ✓ Completed this session ({completed.length})
              </Text>
              {completed.map((t) => (
                <Card key={t.id} style={[styles.card, styles.completedCard]}>
                  <View style={styles.cardRow}>
                    <View style={[styles.checkbox, styles.checkboxDone]} />
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardTitle, styles.completedTitle]} numberOfLines={2}>{t.title}</Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        {t.machine?.name ?? 'General'} · Marked done
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPage },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: { marginBottom: spacing.lg },
  title: { fontSize: typography.xxl, fontWeight: typography.bold, color: colors.text },
  subtitle: { fontSize: typography.sm, color: colors.textMuted, marginTop: 2 },
  loadingText: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', marginTop: spacing.xl },
  card: { marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLoading: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text, marginBottom: 2 },
  cardSub: { fontSize: typography.sm, color: colors.textMuted, marginBottom: spacing.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  dueText: { fontSize: typography.xs, color: colors.textSecondary, fontWeight: typography.medium },
  overdueText: { color: colors.danger, fontWeight: typography.semibold },
  completedSection: { marginTop: spacing.lg },
  completedHeader: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  completedCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  completedTitle: { textDecorationLine: 'line-through', color: colors.textMuted },
  errorCard: { backgroundColor: colors.dangerBg, borderColor: '#fecaca' },
  errorText: { color: colors.danger, fontSize: typography.sm },
  allDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', alignItems: 'center', paddingVertical: spacing.xl },
  allDoneTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.success, marginBottom: spacing.xs },
  allDoneText: { fontSize: typography.sm, color: colors.successBg === '#ecfdf5' ? '#047857' : colors.success },
});
