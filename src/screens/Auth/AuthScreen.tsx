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
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { OAuthButtonGroup } from '../../components/auth/OAuthButton';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { useOAuth } from '../../hooks/useOAuth';
import type { RootStackParamList } from '../../navigation/types';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

export const AuthScreen: React.FC = observer(() => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { authStore, uiStore } = rootStore;
  
  // OAuth hook for Google and GitHub authentication
  const {
    googleState,
    githubState,
    authenticateWithGoogle,
    authenticateWithGitHub,
  } = useOAuth();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!isLogin && !confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!isLogin && !username.trim()) {
      newErrors.username = 'Please choose a username';
    } else if (!isLogin && username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!isLogin && !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isLogin) {
        await authStore.login({ email, password });
        uiStore.showToast('Welcome back to CodeAndClash! 🎉', 'success');
      } else {
        const response = await authStore.register({ username, email, password });
        
        // Check if email verification is required
        if (response && response.emailSent) {
          uiStore.showToast('Registration successful! Please check your email to verify your account. 📧', 'success');
          navigation.navigate('EmailVerification', { email, fromRegistration: true });
          return;
        } else {
          uiStore.showToast('Account created successfully! Welcome to CodeAndClash! 🚀', 'success');
        }
      }
    } catch (error: any) {
      console.log('Auth error:', error);
      console.log('Response data:', error?.response?.data);
      console.log('Response data stringified:', JSON.stringify(error?.response?.data, null, 2));
      console.log('Response status:', error?.response?.status);
      console.log('Is login mode:', isLogin);
      console.log('responseData?.errors exists?', !!error?.response?.data?.errors);
      console.log('responseData?.errors value:', error?.response?.data?.errors);
      
      // Handle structured field errors from backend (NEW IMPROVED VERSION)
      const responseData = error?.response?.data;
      if (!isLogin && error?.response?.status === 400) {
        
        // Check for new structured format first
        if (responseData?.errors) {
          console.log('✅ Backend sent structured field errors:', responseData.errors);
          setErrors(prev => ({ ...prev, ...responseData.errors }));
          
          const errorFields = Object.keys(responseData.errors);
          if (errorFields.includes('email')) {
            uiStore.showToast('This email is already registered. Please use a different email or try logging in.', 'error');
          } else if (errorFields.includes('username')) {
            uiStore.showToast('This username is already taken. Please choose a different username.', 'error');
          } else {
            uiStore.showToast('Please fix the errors highlighted below and try again.', 'error');
          }
          return;
        }
        
        // Handle old format: {"message": "User already exists"}
        else if (responseData?.message === 'User already exists') {
          console.log('⚠️ Backend sent old format - checking both email and username');
          setErrors(prev => ({
            ...prev,
            email: 'This email may already be registered.',
            username: 'This username may already be taken.'
          }));
          uiStore.showToast('An account with this email or username already exists. Please try different values.', 'error');
          return;
        }
      }
      
      // Handle login errors specifically
      if (isLogin && error?.response?.status === 401) {
        uiStore.showToast('Invalid email or password. Please check your credentials and try again.', 'error');
        return;
      }

      // Handle email verification errors
      if (isLogin && error?.response?.status === 403 && error?.response?.data?.error === 'email_not_verified') {
        uiStore.showToast('Please verify your email address before logging in. Check your inbox for the verification link.', 'error');
        navigation.navigate('EmailVerification', { email });
        return;
      }
      
      // Handle network errors
      if (!error?.response) {
        uiStore.showToast('Connection error. Please check your internet connection and try again.', 'error');
        return;
      }
      
      console.log('❌ No structured errors detected, falling back to general error');
      // Fall back to general error for other cases
      const errorMessage = responseData?.message || error.message || 'Something went wrong. Please try again.';
      uiStore.showToast(errorMessage, 'error');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      if (provider === 'google') {
        await authenticateWithGoogle();
        uiStore.showToast('Successfully signed in with Google! 🎉', 'success');
      } else if (provider === 'github') {
        await authenticateWithGitHub();
        uiStore.showToast('Successfully signed in with GitHub! 🎉', 'success');
      }
    } catch (error: any) {
      console.error(`OAuth ${provider} error:`, error);
      uiStore.showToast(`Failed to sign in with ${provider}. Please try again or use email/password.`, 'error');
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
            <Text style={styles.title}>⚔️ CodeAndClash</Text>
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
                onChangeText={(text) => {
                  setUsername(text);
                  // Clear username error when user starts typing
                  if (errors.username) {
                    setErrors(prev => ({ ...prev, username: '' }));
                  }
                }}
                error={errors.username}
                autoCapitalize="none"
              />
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                // Clear email error when user starts typing
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                // Clear password error when user starts typing
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: '' }));
                }
                // Also clear confirm password error if they match now
                if (!isLogin && confirmPassword && text === confirmPassword && errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              error={errors.password}
              secureTextEntry
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  // Clear confirm password error when user starts typing
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                  // Also clear error if passwords match now
                  if (password && text === password && errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                error={errors.confirmPassword}
                secureTextEntry
              />
            )}

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

            <OAuthButtonGroup
              onGooglePress={() => handleOAuthLogin('google')}
              onGitHubPress={() => handleOAuthLogin('github')}
              googleLoading={googleState.loading}
              githubLoading={githubState.loading}
              disabled={authStore.isLoading}
            />

            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setErrors({});
                // Clear confirm password when switching to login mode
                if (!isLogin) {
                  setConfirmPassword('');
                }
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
