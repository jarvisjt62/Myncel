/**
 * HandbookChapterScreen.tsx
 *
 * Renders a single handbook chapter natively. Supports body paragraphs,
 * bullet lists, numbered steps, and tip / warning / info callouts.
 * Fully offline.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { findChapter, type HandbookSection } from '@/handbook';
import { colors, radius, spacing, typography } from '@/theme';
import type { HandbookStackParamList } from '@/navigation/types';

type Route = RouteProp<HandbookStackParamList, 'HandbookChapter'>;

export default function HandbookChapterScreen() {
  const route = useRoute<Route>();
  const chapter = findChapter(route.params.slug);

  if (!chapter) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>🤔</Text>
          <Text style={styles.notFoundText}>Chapter not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>{chapter.emoji}</Text>
        <Text style={styles.title}>{chapter.title}</Text>
        <Text style={styles.summary}>{chapter.summary}</Text>

        <View style={styles.divider} />

        {chapter.sections.map((section, idx) => (
          <SectionBlock key={idx} section={section} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionBlock({ section }: { section: HandbookSection }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{section.heading}</Text>

      {section.body.map((paragraph, i) => (
        <Text key={`b-${i}`} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      {section.bullets && section.bullets.length > 0 && (
        <View style={styles.list}>
          {section.bullets.map((b, i) => (
            <View key={`u-${i}`} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {section.steps && section.steps.length > 0 && (
        <View style={styles.list}>
          {section.steps.map((s, i) => (
            <View key={`s-${i}`} style={styles.listItem}>
              <Text style={styles.stepNum}>{i + 1}.</Text>
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {section.callout && <Callout {...section.callout} />}
    </View>
  );
}

function Callout({
  type,
  text,
}: {
  type: 'tip' | 'warning' | 'info';
  text: string;
}) {
  const palette =
    type === 'warning'
      ? { bg: colors.warningBg, border: colors.warning, label: '⚠️ Warning' }
      : type === 'info'
      ? { bg: colors.infoBg, border: colors.info, label: 'ℹ️ Note' }
      : { bg: colors.successBg, border: colors.success, label: '💡 Tip' };

  return (
    <View
      style={[
        styles.callout,
        { backgroundColor: palette.bg, borderLeftColor: palette.border },
      ]}
    >
      <Text style={[styles.calloutLabel, { color: palette.border }]}>
        {palette.label}
      </Text>
      <Text style={styles.calloutText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPage },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emoji: { fontSize: 44, marginBottom: spacing.sm },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold as '700',
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  summary: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  section: { marginBottom: spacing.xl },
  heading: {
    fontSize: typography.lg,
    fontWeight: typography.bold as '700',
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: typography.base,
    color: colors.text,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },
  list: { marginTop: spacing.xs, marginBottom: spacing.sm },
  listItem: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: typography.base,
    color: colors.primary,
    marginRight: spacing.sm,
    fontWeight: typography.bold as '700',
    width: 14,
  },
  stepNum: {
    fontSize: typography.base,
    color: colors.primary,
    marginRight: spacing.sm,
    fontWeight: typography.bold as '700',
    width: 22,
  },
  listText: {
    flex: 1,
    fontSize: typography.base,
    color: colors.text,
    lineHeight: 22,
  },
  callout: {
    borderLeftWidth: 4,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  calloutLabel: {
    fontSize: typography.sm,
    fontWeight: typography.bold as '700',
    marginBottom: 4,
  },
  calloutText: {
    fontSize: typography.base,
    color: colors.text,
    lineHeight: 22,
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundEmoji: { fontSize: 56, marginBottom: spacing.md },
  notFoundText: {
    fontSize: typography.lg,
    color: colors.textSecondary,
  },
});
