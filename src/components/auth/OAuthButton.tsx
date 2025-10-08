import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export type OAuthProvider = 'google' | 'github';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

const PROVIDER_CONFIG = {
  google: {
    icon: 'logo-google' as const,
    label: 'Continue with Google',
    backgroundColor: '#4285F4',
    textColor: '#FFFFFF',
    borderColor: '#4285F4',
  },
  github: {
    icon: 'logo-github' as const,
    label: 'Continue with GitHub',
    backgroundColor: '#24292e',
    textColor: '#FFFFFF',
    borderColor: '#24292e',
  },
};

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  const config = PROVIDER_CONFIG[provider];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityLabel={config.label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={config.textColor} 
            style={styles.icon} 
          />
        ) : (
          <Ionicons 
            name={config.icon} 
            size={20} 
            color={config.textColor} 
            style={styles.icon} 
          />
        )}
        <Text style={[styles.text, { color: config.textColor }]}>
          {loading ? 'Connecting...' : config.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

interface OAuthButtonGroupProps {
  onGooglePress: () => void;
  onGitHubPress: () => void;
  googleLoading?: boolean;
  githubLoading?: boolean;
  disabled?: boolean;
}

export const OAuthButtonGroup: React.FC<OAuthButtonGroupProps> = ({
  onGooglePress,
  onGitHubPress,
  googleLoading = false,
  githubLoading = false,
  disabled = false,
}) => {
  return (
    <View style={styles.group}>
      <OAuthButton
        provider="google"
        onPress={onGooglePress}
        loading={googleLoading}
        disabled={disabled}
        style={styles.groupButton}
      />
      <OAuthButton
        provider="github"
        onPress={onGitHubPress}
        loading={githubLoading}
        disabled={disabled}
        style={styles.groupButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  group: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  groupButton: {
    flex: 1,
    marginVertical: 0,
  },
});