import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';

export const AuthScreen: React.FC = observer(() => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { authStore, uiStore } = rootStore;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin && !username.trim()) {
      newErrors.username = 'Username is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isLogin) {
        await authStore.login({ email, password });
      } else {
        await authStore.register({ username, email, password });
      }
      uiStore.showToast('Welcome to Coding War!', 'success');
    } catch (error: any) {
      uiStore.showToast(error.message || 'Authentication failed', 'error');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      // Implementation depends on expo-auth-session
      uiStore.showToast(`${provider} login coming soon`, 'info');
      // await authStore.oauthLogin(provider, token);
    } catch (error: any) {
      uiStore.showToast(error.message || 'OAuth login failed', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>⚔️ Coding War</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <Input
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                error={errors.username}
                autoCapitalize="none"
              />
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
            />

            <Button
              title={isLogin ? 'Login' : 'Register'}
              onPress={handleSubmit}
              loading={authStore.isLoading}
              style={styles.submitButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.oauthButtons}>
              <Button
                title="Google"
                onPress={() => handleOAuthLogin('google')}
                variant="outline"
                style={styles.oauthButton}
              />
              <Button
                title="GitHub"
                onPress={() => handleOAuthLogin('github')}
                variant="outline"
                style={styles.oauthButton}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Register"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  oauthButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  oauthButton: {
    flex: 1,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
