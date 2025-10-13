import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Platform } from 'react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { apiService } from '../../services/api.service';
import { rootStore } from '../../stores/RootStore';

export const ResetPasswordScreen: React.FC<any> = ({ route, navigation }) => {
  const { uiStore } = rootStore as any;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (route?.params?.token) setToken(route.params.token);
    // On web, token may be in query string
    if (!route?.params?.token && Platform.OS === 'web' && typeof (globalThis as any).location !== 'undefined') {
      const q = new URLSearchParams((globalThis as any).location.search);
      const t = q.get('token');
      if (t) setToken(t);
    }
  }, [route]);

  const handleReset = async () => {
    if (!token) return uiStore.showToast('Missing reset token', 'error');
    if (!password || password.length < 6) return uiStore.showToast('Password must be at least 6 chars', 'error');
    if (password !== confirm) return uiStore.showToast('Passwords do not match', 'error');

    setLoading(true);
    try {
      await apiService.resetPassword(token, password);
      uiStore.showToast('Password reset successfully. Please login.', 'success');
      navigation.navigate('Auth');
    } catch (err: any) {
      console.error('Reset password error:', err);
      uiStore.showToast(err?.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>Choose a strong password for your account.</Text>
        <View style={styles.form}>
          <Input label="New password" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
          <Input label="Confirm password" placeholder="••••••••" secureTextEntry value={confirm} onChangeText={setConfirm} />
          <Button title="Save new password" onPress={handleReset} loading={loading} style={styles.button} />
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
