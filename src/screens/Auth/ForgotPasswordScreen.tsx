import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { apiService } from '../../services/api.service';
import { rootStore } from '../../stores/RootStore';

export const ForgotPasswordScreen: React.FC<any> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { uiStore } = rootStore as any;

  const handleRequest = async () => {
    if (!email.trim()) return uiStore.showToast('Please enter your email', 'error');
    setLoading(true);
    try {
      await apiService.requestPasswordReset(email.trim());
      uiStore.showToast('If an account exists, a reset link was sent to the email.', 'success');
      navigation.navigate('Auth');
    } catch (err: any) {
      console.error('Request password reset error:', err);
      try {
        console.error('Request URL:', err?.config?.url || err?.request?.responseURL);
        console.error('Status:', err?.response?.status);
        console.error('Response data:', err?.response?.data);
      } catch (e) { /* ignore */ }
      uiStore.showToast(err?.response?.data?.message || 'Failed to request password reset', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>Enter your account email and we'll send you a secure link to reset your password.</Text>
        <View style={styles.form}>
          <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Button title="Send reset link" onPress={handleRequest} loading={loading} style={styles.button} />
          <Button title="Back to Login" onPress={() => navigation.navigate('Auth')} variant="outline" style={styles.ghost} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, marginTop: 40 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { color: COLORS.textSecondary, marginBottom: 20 },
  form: { marginTop: 12 },
  button: { marginTop: 8 },
  ghost: { marginTop: 12 },
});
