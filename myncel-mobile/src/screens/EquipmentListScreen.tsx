import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/Card';
import { Badge, statusVariant } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { machinesApi } from '@/api/endpoints';
import type { Machine } from '@/api/types';
import { colors, radius, spacing, typography } from '@/theme';
import type { EquipmentStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<EquipmentStackParamList, 'EquipmentList'>;

export default function EquipmentListScreen() {
  const navigation = useNavigation<Nav>();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await machinesApi.list();
      setMachines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment.');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading equipment…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={machines}
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
            <Text style={styles.title}>Equipment</Text>
            <Text style={styles.subtitle}>
              {machines.length} {machines.length === 1 ? 'machine' : 'machines'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          error ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          ) : (
            <EmptyState
              title="No equipment yet"
              description="Equipment added in the Myncel web app will appear here."
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('EquipmentDetail', { id: item.id, name: item.name })
            }
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                </View>
                <Badge label={item.status.replace('_', ' ')} variant={statusVariant(item.status)} />
              </View>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.type}
                {item.location ? ` · ${item.location}` : ''}
              </Text>
              {item.manufacturer || item.model ? (
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {[item.manufacturer, item.model].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPage },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textMuted, fontSize: typography.sm },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: { marginBottom: spacing.lg },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardTitleRow: { flex: 1, marginRight: spacing.sm },
  cardTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  cardSub: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  cardMeta: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  pressed: { opacity: 0.7 },
  errorCard: {
    backgroundColor: colors.dangerBg,
    borderColor: '#fecaca',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sm,
  },
});
