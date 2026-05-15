import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/auth/AuthContext';
import { colors, radius, spacing, typography } from '@/theme';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const onSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  if (!user) return null;

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Profile</Text>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
        <Text style={styles.org}>{user.organizationName}</Text>
      </Card>

      <Card style={styles.section} padding="none">
        <SettingsRow
          label="Open web dashboard"
          onPress={() => Linking.openURL('https://www.myncel.com/dashboard')}
        />
        <SettingsRow
          label="Help & Support"
          onPress={() => Linking.openURL('https://www.myncel.com/contact')}
        />
        <SettingsRow
          label="Privacy Policy"
          onPress={() => Linking.openURL('https://www.myncel.com/privacy')}
        />
        <SettingsRow
          label="Terms of Service"
          onPress={() => Linking.openURL('https://www.myncel.com/terms')}
          last
        />
      </Card>

      <Card style={styles.section} padding="none">
        <SettingsRow label="App version" value={Constants.expoConfig?.version ?? '1.0.0'} last />
      </Card>

      <View style={styles.signOutWrap}>
        <Button
          title="Sign out"
          onPress={onSignOut}
          variant="danger"
          fullWidth
          size="lg"
        />
      </View>
    </ScreenContainer>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? '›'}</Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} android_ripple={{ color: colors.bgSurface2 }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: typography.xxl,
    fontWeight: typography.extrabold,
  },
  name: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  email: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  roleText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  org: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: { marginBottom: spacing.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: typography.base, color: colors.text, fontWeight: typography.medium },
  rowValue: { fontSize: typography.sm, color: colors.textMuted },
  signOutWrap: { marginTop: spacing.md },
});
