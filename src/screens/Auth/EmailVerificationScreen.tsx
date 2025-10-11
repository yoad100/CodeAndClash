import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { apiService } from '../../services/api.service';

interface EmailVerificationScreenProps {
  route?: {
    params?: {
      email?: string;
      fromRegistration?: boolean;
    };
  };
  navigation?: any;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = observer(
  ({ route, navigation }) => {
    const [email, setEmail] = useState(route?.params?.email || '');
    const [isResending, setIsResending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verificationSent, setVerificationSent] = useState(route?.params?.fromRegistration || false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

    const { uiStore } = rootStore;

    useEffect(() => {
      let interval: ReturnType<typeof setInterval> | null = null;
      if (resendCooldown > 0) {
        interval = setInterval(() => {
          setResendCooldown((prev) => prev - 1);
        }, 1000);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [resendCooldown]);

    // Check for verification token in URL (web)
    useEffect(() => {
      if (Platform.OS === 'web' && typeof (globalThis as any).window !== 'undefined') {
        const urlParams = new URLSearchParams((globalThis as any).window.location.search);
        const token = urlParams.get('token');
        if (token) {
          handleVerifyEmail(token);
        }
      }
    }, []);

    const handleVerifyEmail = async (token: string) => {
      setIsVerifying(true);
      try {
        await apiService.verifyEmail(token);
        setVerificationStatus('success');
        uiStore.showToast('Email verified successfully! You can now login. 🎉', 'success');
        
        // Navigate to login after a short delay
        setTimeout(() => {
          if (navigation) {
            navigation.navigate('Auth');
          }
        }, 2000);
      } catch (error: any) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        const errorMessage = error?.response?.data?.message || 'Failed to verify email';
        uiStore.showToast(errorMessage, 'error');
      } finally {
        setIsVerifying(false);
      }
    };

    const handleResendVerification = async () => {
      if (!email.trim()) {
        uiStore.showToast('Please enter your email address', 'error');
        return;
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        uiStore.showToast('Please enter a valid email address', 'error');
        return;
      }

      setIsResending(true);
      try {
        await apiService.resendVerification(email);
        setVerificationSent(true);
        setResendCooldown(60); // 60 seconds cooldown
        uiStore.showToast('Verification email sent! Check your inbox.', 'success');
      } catch (error: any) {
        console.error('Resend verification error:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to send verification email';
        uiStore.showToast(errorMessage, 'error');
      } finally {
        setIsResending(false);
      }
    };

    const handleBackToLogin = () => {
      if (navigation) {
        navigation.navigate('Auth');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={
                    verificationStatus === 'success' ? 'checkmark-circle' :
                    verificationStatus === 'error' ? 'close-circle' :
                    'mail'
                  } 
                  size={64} 
                  color={
                    verificationStatus === 'success' ? COLORS.success :
                    verificationStatus === 'error' ? COLORS.error :
                    COLORS.primary
                  } 
                />
              </View>
              <Text style={styles.title}>
                {verificationStatus === 'success' ? 'Email Verified!' :
                 verificationStatus === 'error' ? 'Verification Failed' :
                 'Verify Your Email'}
              </Text>
              <Text style={styles.subtitle}>
                {verificationStatus === 'success' 
                  ? 'Your email has been successfully verified. You can now login to your account.'
                  : verificationStatus === 'error'
                  ? 'There was an issue verifying your email. Please try again or request a new verification email.'
                  : verificationSent
                  ? 'We\'ve sent a verification link to your email'
                  : 'Enter your email to receive a verification link'
                }
              </Text>
            </View>

          {/* Email Input */}
          {!route?.params?.fromRegistration && (
            <View style={styles.form}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* Verification Status */}
          {isVerifying && (
            <View style={styles.statusContainer}>
              <View style={styles.statusCard}>
                <Ionicons name="refresh" size={24} color={COLORS.primary} />
                <Text style={styles.statusText}>
                  Verifying your email...
                </Text>
              </View>
            </View>
          )}

          {verificationStatus === 'success' && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusCard, { borderLeftColor: COLORS.success }]}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={styles.statusText}>
                  Email verified successfully! Redirecting to login...
                </Text>
              </View>
            </View>
          )}

          {verificationStatus === 'error' && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusCard, { borderLeftColor: COLORS.error }]}>
                <Ionicons name="alert-circle" size={24} color={COLORS.error} />
                <Text style={styles.statusText}>
                  Verification failed. Please try requesting a new verification email.
                </Text>
              </View>
            </View>
          )}

          {verificationSent && verificationStatus === 'pending' && (
            <View style={styles.statusContainer}>
              <View style={styles.statusCard}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={styles.statusText}>
                  Verification email sent to:
                </Text>
                <Text style={styles.emailText}>{email}</Text>
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>What to do next:</Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Check your email inbox for a message from CodeAndClash
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="link-outline" size={20} color={COLORS.primary} />
                <Text style={styles.instructionText}>
                  Click the verification link in the email
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.warning} />
                <Text style={styles.instructionText}>
                  The link expires in 24 hours for security
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {verificationStatus === 'success' ? (
              <Button
                title="Go to Login"
                onPress={handleBackToLogin}
                style={styles.primaryButton}
              />
            ) : (
              <>
                <Button
                  title={
                    resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Verification Email'
                  }
                  onPress={handleResendVerification}
                  loading={isResending}
                  disabled={resendCooldown > 0 || isVerifying}
                  style={styles.primaryButton}
                />

                <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
                  <Text style={styles.backButtonText}>
                    ← Back to Login
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 <Text style={styles.helpBold}>Tip:</Text> Check your spam or junk folder if you don't see the email.
            </Text>
            <Text style={styles.helpText}>
              🔒 Email verification helps keep your account secure.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 100, // Extra padding to ensure scrolling works
    minHeight: 800, // Minimum height to force scrolling on web
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.glowPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  statusContainer: {
    marginBottom: 32,
  },
  statusCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  emailText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 36,
    width: '100%',
    marginTop: 4,
  },
  instructionsContainer: {
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
});