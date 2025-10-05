import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { COLORS } from '../../constants/colors';

export const NetworkStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠️ No Internet Connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.error,
    padding: 12,
    zIndex: 9999,
  },
  text: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
  },
});
