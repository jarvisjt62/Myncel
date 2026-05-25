/**
 * SyncIndicator
 * ─────────────
 * Tiny pill that lives in the navigation header area of every screen
 * with mutating actions. Shows at-a-glance whether the device is
 * online, offline, or has pending writes — and tapping it opens a
 * drawer listing every pending item with a "Retry now" affordance.
 *
 * Visibility rules:
 *   - Online + zero pending      → render nothing (no UI noise)
 *   - Online + N pending         → blue pill "⟳ Syncing N…" or "↻ N pending"
 *   - Offline                    → amber pill "● Offline (N queued)"
 *   - Any item permanently failed → red pill "! Sync failed"
 */

import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing, typography } from '@/theme';
import { useSync } from '@/sync/SyncContext';
import { MAX_ATTEMPTS } from '@/sync/processor';

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function SyncIndicator() {
  const {
    connectivity,
    pending,
    isSyncing,
    lastSyncedAt,
    lastError,
    retryNow,
    discardMutation,
  } = useSync();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasFailed = useMemo(
    () => pending.some((m) => m.attemptCount >= MAX_ATTEMPTS),
    [pending]
  );

  // Decide pill style
  const visible =
    connectivity === 'offline' ||
    pending.length > 0 ||
    hasFailed;

  if (!visible) return null;

  const tone = hasFailed
    ? 'danger'
    : connectivity === 'offline'
      ? 'warning'
      : 'info';

  const labelText = hasFailed
    ? `! Sync failed`
    : connectivity === 'offline'
      ? `● Offline${pending.length > 0 ? ` (${pending.length})` : ''}`
      : isSyncing
        ? `⟳ Syncing ${pending.length}…`
        : `↻ ${pending.length} pending`;

  const palette = {
    info: { bg: colors.infoBg, fg: colors.info, border: colors.info },
    warning: { bg: colors.warningBg, fg: colors.warning, border: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger, border: colors.danger },
  }[tone];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sync status: ${labelText}. Tap for details.`}
        onPress={() => setDrawerOpen(true)}
        style={[
          styles.pill,
          { backgroundColor: palette.bg, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.pillText, { color: palette.fg }]} numberOfLines={1}>
          {labelText}
        </Text>
      </Pressable>

      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)}>
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sync status</Text>
              <Pressable hitSlop={12} onPress={() => setDrawerOpen(false)}>
                <Text style={styles.closeBtn}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Connectivity</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    {
                      color:
                        connectivity === 'online'
                          ? colors.success
                          : connectivity === 'offline'
                            ? colors.warning
                            : colors.textMuted,
                    },
                  ]}
                >
                  {connectivity === 'online'
                    ? 'Online'
                    : connectivity === 'offline'
                      ? 'Offline'
                      : 'Checking…'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={styles.summaryValue}>{pending.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Last synced</Text>
                <Text style={styles.summaryValueSmall}>
                  {lastSyncedAt ? relativeTime(lastSyncedAt) : '—'}
                </Text>
              </View>
            </View>

            {lastError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Last error</Text>
                <Text style={styles.errorBody} numberOfLines={3}>
                  {lastError}
                </Text>
              </View>
            ) : null}

            <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: spacing.md }}>
              {pending.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Text style={styles.emptyTitle}>You're all caught up</Text>
                  <Text style={styles.emptyBody}>
                    Every change you've made has reached the server. Future
                    edits made while offline will appear here automatically.
                  </Text>
                </View>
              ) : (
                pending.map((m) => {
                  const failed = m.attemptCount >= MAX_ATTEMPTS;
                  return (
                    <View
                      key={m.id}
                      style={[
                        styles.itemCard,
                        failed && { borderColor: colors.danger },
                      ]}
                    >
                      <Text style={styles.itemTitle}>{m.label}</Text>
                      <Text style={styles.itemMeta}>
                        Queued {relativeTime(m.createdAt)} · {m.attemptCount}{' '}
                        attempt{m.attemptCount === 1 ? '' : 's'}
                      </Text>
                      {m.lastError ? (
                        <Text style={styles.itemError} numberOfLines={2}>
                          {m.lastError}
                        </Text>
                      ) : null}
                      {failed ? (
                        <Pressable
                          onPress={() => discardMutation(m.id)}
                          style={styles.discardBtn}
                        >
                          <Text style={styles.discardBtnText}>Discard</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {pending.length > 0 ? (
              <Pressable
                onPress={() => {
                  retryNow();
                }}
                disabled={isSyncing}
                style={[styles.retryBtn, isSyncing && { opacity: 0.5 }]}
              >
                <Text style={styles.retryBtnText}>
                  {isSyncing ? 'Syncing…' : 'Retry now'}
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  closeBtn: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.bgSurface2,
    borderRadius: 8,
    padding: spacing.sm,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryValueSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  errorBody: {
    fontSize: 13,
    color: colors.danger,
  },
  list: {
    maxHeight: 320,
  },
  emptyBlock: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  itemCard: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgSurface,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  discardBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  discardBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  retryBtnText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
