import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { alertsApi } from '@/api/endpoints';
import type { Alert as AlertType, AlertSeverity } from '@/api/types';
import { colors, spacing, typography } from '@/theme';
import { formatRelative } from '@/utils/date';
import type { AlertsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AlertsStackParamList, 'AlertsList'>;

function severityVariant(s: AlertSeverity) {
  switch (s) {
    case 'CRITICAL': return 'critical' as const;
    case 'HIGH': return 'high' as const;
    case 'MEDIUM': return 'medium' as const;
    case 'LOW': return 'low' as const;
  }
}

export default function AlertsListScreen() {
  const navigation = useNavigation<Nav>();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await alertsApi.list();
      // Show unresolved first, then most recent
      const sorted = [...data].sort((a, b) => {
        if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAlerts(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={alerts}
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
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.subtitle}>
              {unresolvedCount} unresolved · {alerts.length - unresolvedCount} resolved
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
          ) : (
            <EmptyState title="No alerts" description="System and equipment alerts will appear here." />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('AlertDetail', { id: item.id })}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card style={[styles.card, item.resolved && styles.cardResolved]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleCol}>
                  <Text style={[styles.cardTitle, item.resolved && styles.resolvedText]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={2}>{item.message}</Text>
                </View>
                <View style={styles.badges}>
                  <Badge label={item.severity} variant={severityVariant(item.severity)} />
                  {item.resolved ? <Badge label="Resolved" variant="success" /> : null}
                </View>
              </View>
              <View style={styles.cardMeta}>
                {item.machine ? (
                  <Text style={styles.metaText} numberOfLines={1}>{item.machine.name}</Text>
                ) : null}
                <Text style={styles.metaText}>{formatRelative(item.createdAt)}</Text>
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
  cardResolved: { opacity: 0.65 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitleCol: { flex: 1 },
  cardTitle: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.text, marginBottom: 2 },
  cardSub: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: typography.sm * typography.lineHeight.normal },
  resolvedText: { textDecorationLine: 'line-through', color: colors.textMuted },
  badges: { gap: spacing.xs, alignItems: 'flex-end' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  metaText: { fontSize: typography.xs, color: colors.textMuted },
  pressed: { opacity: 0.7 },
  errorCard: { backgroundColor: colors.dangerBg, borderColor: '#fecaca' },
  errorText: { color: colors.danger, fontSize: typography.sm },
});
