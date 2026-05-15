import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.title}>Welcome to Myncel</Text>
            <Text style={styles.subtitle}>
              Sign in to manage equipment, work orders, and maintenance schedules.
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
                  'Please reset your password from the Myncel website at myncel.com.'
                )
              }
              style={styles.forgotLink}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in you agree to Myncel&apos;s Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
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
});
