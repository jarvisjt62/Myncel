import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Pressable,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.title}>Welcome to Myncel</Text>
            <Text style={styles.subtitle}>
              Sign in with the credentials provided by your workspace administrator to manage equipment, work orders, and maintenance schedules.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                style={styles.input}
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  style={[styles.input, styles.passwordInput]}
                  editable={!submitting}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.passwordToggle}
                  hitSlop={8}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Sign in"
              onPress={onSubmit}
              loading={submitting}
              fullWidth
              size="lg"
            />

            <Pressable
              onPress={() =>
                RNAlert.alert(
                  'Forgot password?',
                  'To reset your password, please visit myncel.com on your computer and use the "Forgot password" link on the sign-in page. Your workspace administrator can also reset it for you.'
                )
              }
              style={styles.forgotLink}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                RNAlert.alert(
                  'How do I get a Myncel account?',
                  'Myncel is a workplace tool. Your account is created and managed by your organization\u2019s administrator.\n\n\u2022 If your team already uses Myncel, ask your administrator to invite you. You will receive an email with a sign-in link.\n\n\u2022 If your organization does not yet use Myncel, your administrator can set up the workspace at myncel.com.\n\nThis app is for signing in to an existing account only \u2014 you cannot create a new workspace from inside the app.'
                )
              }
              style={styles.forgotLink}
              hitSlop={8}
            >
              <Text style={styles.helperText}>How do I get an account?</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in you agree to Myncel&apos;s Terms of Service and Privacy Policy.
            </Text>
            <Text style={styles.footerSubtext}>
              Myncel accounts are provisioned by your organization administrator. New workspaces are created on the web at myncel.com.
            </Text>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    color: '#fff',
    fontSize: typography.xxl,
    fontWeight: typography.extrabold,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sm * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
  field: { gap: spacing.xs },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.base,
    color: colors.text,
    minHeight: 48,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 64,
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  forgotLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.xs * typography.lineHeight.relaxed,
  },
  footerSubtext: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.xs * typography.lineHeight.relaxed,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
