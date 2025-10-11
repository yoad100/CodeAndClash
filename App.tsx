import React, { useEffect, useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { configure } from 'mobx';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Toast } from './src/components/common/Toast';
import { LoadingSpinner } from './src/components/common/LoadingSpinner';
import { rootStore } from './src/stores/RootStore';
import { COLORS } from './src/constants/colors';
import { ConnectionBanner } from './src/components/common/ConnectionBanner';
import { QueuedModal } from './src/components/common/QueuedModal';
import { NeonBackground } from './src/components/fx/NeonBackground';

// Configure MobX once at module load. Using non-proxy mode avoids RN Fabric/Animated mutation issues.
configure({ disableErrorBoundaries: false, enforceActions: 'never', useProxies: 'never' });

const ToastHost: React.FC = observer(() => {
  const { uiStore } = rootStore;
  return (
    <>
      {uiStore.toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => uiStore.removeToast(toast.id)}
          actionLabel={toast.actionLabel}
          onAction={() => {
            try { toast.action && toast.action(); } catch (e) { /* ignore */ }
            uiStore.removeToast(toast.id);
          }}
        />
      ))}
    </>
  );
});

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { uiStore } = rootStore;

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // capture global unhandled exceptions/rejections
    const onUnhandled = (e: any) => {
      // No-op placeholder for error reporting integration
    };
    const onError = (e: any) => {
      // No-op placeholder for error reporting integration
    };
    // @ts-ignore - add global handlers where available
    if (typeof global !== 'undefined' && (global as any).process) {
      (global as any).process.on && (global as any).process.on('unhandledRejection', onUnhandled);
      (global as any).process.on && (global as any).process.on('uncaughtException', onError);
    }
    return () => {
      try {
        (global as any).process.off && (global as any).process.off('unhandledRejection', onUnhandled);
        (global as any).process.off && (global as any).process.off('uncaughtException', onError);
      } catch (err) { }
    };
  }, []);

  const initializeApp = async () => {
    try {
      await rootStore.initialize();
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  if (!isInitialized) {
    return <LoadingSpinner message="Loading Coding War..." />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />
      <View style={styles.container}>
        <ConnectionBanner />
        <AppNavigator />
        {/* Animated tri-color background overlay (light opacity, no interactions) */}
        <NeonBackground />
        {/* Keep modals/toasts above background overlay */}
        <QueuedModal />
        {/* Toast Notifications */}
        <ToastHost />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default App;
