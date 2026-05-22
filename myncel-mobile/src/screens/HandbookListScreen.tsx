/**
 * HandbookListScreen.tsx
 *
 * Native handbook chapter index. Bundled offline so technicians can read the
 * full Myncel manual even with no signal. Content is the same single source
 * of truth as the web handbook (lib/handbook/content.ts).
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HANDBOOK_CHAPTERS, type HandbookChapter } from '@/handbook';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import type { HandbookStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HandbookStackParamList, 'HandbookList'>;

export default function HandbookListScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HANDBOOK_CHAPTERS;
    return HANDBOOK_CHAPTERS.filter((c) => {
      if (c.title.toLowerCase().includes(q)) return true;
      if (c.summary.toLowerCase().includes(q)) return true;
      return c.sections.some(
        (s) =>
          s.heading.toLowerCase().includes(q) ||
          s.body.some((b) => b.toLowerCase().includes(q)) ||
          (s.bullets ?? []).some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>📖 Myncel Handbook</Text>
        <Text style={styles.subtitle}>
          Your complete user manual. Bundled with the app — works offline.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search the handbook…"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No chapters match "{query}"</Text>
          </View>
        ) : (
          filtered.map((chapter) => (
            <ChapterCard
              key={chapter.slug}
              chapter={chapter}
              onPress={() =>
                navigation.navigate('HandbookChapter', {
                  slug: chapter.slug,
                  title: chapter.title,
                })
              }
            />
          ))
        )}

        <Text style={styles.footer}>
          Updated continuously. Same content as myncel.com/handbook — bundled
          for offline use.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChapterCard({
  chapter,
  onPress,
}: {
  chapter: HandbookChapter;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.primaryBg }}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={styles.emoji}>{chapter.emoji}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{chapter.title}</Text>
        <Text style={styles.cardSummary} numberOfLines={3}>
          {chapter.summary}
        </Text>
        <Text style={styles.cardCount}>
          {chapter.sections.length} sections →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPage },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold as '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  search: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.base,
    color: colors.text,
    marginBottom: spacing.lg,
    minHeight: 44,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  emoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold as '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardCount: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.semibold as '600',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.base,
  },
  footer: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});
