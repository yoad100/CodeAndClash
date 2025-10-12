import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator, type BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { rootStore } from '../stores/RootStore';
import { socketService } from '../services/socket.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import { AuthScreen } from '../screens/Auth/AuthScreen';
import { EmailVerificationScreen } from '../screens/Auth/EmailVerificationScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PremiumScreen } from '../screens/Premium/PremiumScreen';
import { PremiumUpgradeScreen } from '../screens/Premium/PremiumUpgradeScreen';
import { MatchLobbyScreen } from '../screens/Match/MatchLobbyScreen';
import { MatchScreen } from '../screens/Match/MatchScreen';
import { ResultsScreen } from '../screens/Match/ResultsScreen';
import { RankingScreen } from '../screens/Ranking/RankingScreen';
import { navigationRef } from '../utils/navigationRef';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useNavigation } from '@react-navigation/native';
import { IncomingInviteDialog } from '../components/match/IncomingInviteDialog';
import { LevelBadge } from '../components/common/LevelBadge';

// Types
import { RootStackParamList, MainTabParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeStack = createStackNavigator();
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeRoot" component={HomeScreen} />
      <HomeStack.Screen name="MatchLobby" component={MatchLobbyScreen} />
      <HomeStack.Screen name="Match" component={MatchScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
    </HomeStack.Navigator>
  );
};

const MainTabs: React.FC = observer(() => {
  const { userStore, matchStore, authStore, uiStore } = rootStore as any;
  const [pendingTab, setPendingTab] = React.useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const tabBarStyle = React.useMemo(() => ({
    backgroundColor: COLORS.cardBackground,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingBottom: Math.max(12, insets.bottom + 8),
    paddingTop: 10,
    height: 64 + insets.bottom,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  }), [insets.bottom]);

  const isInActiveMatch = !!(matchStore?.currentMatch && matchStore.currentMatch.status === 'active');
  
  const handleLogout = () => {
    console.log('🚪 LOGOUT BUTTON CLICKED!');
    
    // Use a simple confirm for web, Alert for mobile
    const confirmLogout = () => {
      const doLogout = async () => {
        try {
          console.log('🔥 Starting logout process...');
          if (!authStore || typeof authStore.logout !== 'function') {
            console.error('❌ AuthStore or logout method not available');
            return;
          }
          await authStore.logout();
          console.log('✅ Logout completed successfully');
        } catch (error) {
          console.error('❌ Logout failed:', error);
        }
      };

      // For web, use browser confirm
      if (typeof globalThis !== 'undefined' && (globalThis as any).confirm) {
        const confirmed = (globalThis as any).confirm('Are you sure you want to logout?');
        if (confirmed) {
          doLogout();
        }
      } else {
        // Fallback to direct logout
        doLogout();
      }
    };

    confirmLogout();
  };

  // User Status Component for Navbar
  const getUserStatus = React.useCallback(() => {
    if (isInActiveMatch) return { text: 'In Match', color: COLORS.success, icon: 'game-controller' };
    if (matchStore.isSearching) return { text: 'Searching', color: COLORS.warning, icon: 'search' };
    return { text: uiStore.connectionStatus || 'Online', color: COLORS.secondary, icon: 'checkmark-circle' };
  }, [isInActiveMatch, matchStore.isSearching, uiStore.connectionStatus]);

  const renderHeader = React.useCallback((props: BottomTabHeaderProps) => {
    const { route, options } = props;
    const user = userStore.user;
    const status = getUserStatus();

    return (
      <LinearGradient
        colors={['#0f172a', '#161538', '#1f0e3b']}
        style={[headerStyles.gradient, { paddingTop: insets.top + 14 }]}
      >
        {isInActiveMatch && (
          <View style={[headerStyles.liveBadge, headerStyles.liveBadgeStandalone]}>
            <Ionicons name="flash" size={14} color={COLORS.background} />
            <Text style={headerStyles.liveBadgeText}>LIVE</Text>
          </View>
        )}

        <View style={headerStyles.userRow}>
          <View style={headerStyles.avatarRing}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={headerStyles.avatarImage} />
            ) : (
              <Text style={headerStyles.avatarLetter}>
                {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
              </Text>
            )}
          </View>

          <View style={headerStyles.infoColumn}>
            <View style={headerStyles.usernameRow}>
              <Text style={headerStyles.username} numberOfLines={1}>
                {user?.username ?? 'Guest'}
              </Text>
              <LevelBadge levelName={user?.levelName} levelKey={user?.levelKey} compact />
            </View>
            <View style={headerStyles.pillRow}>
              <View style={[headerStyles.statusPill, { borderColor: status.color, backgroundColor: `${status.color}22` }]}>
                <Ionicons
                  name={status.icon as any}
                  size={13}
                  color={status.color}
                  style={headerStyles.pillIcon}
                />
                <Text style={[headerStyles.pillText, { color: status.color }]}>{status.text}</Text>
              </View>
              <View style={headerStyles.statPill}>
                <Ionicons name="sparkles" size={13} color={COLORS.warning} style={headerStyles.pillIcon} />
                <Text style={[headerStyles.pillText, { color: COLORS.white }]}>{user?.rating ?? '—'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={headerStyles.logoutButton}
            accessibilityLabel="Logout"
            accessibilityRole="button"
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text style={headerStyles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }, [getUserStatus, handleLogout, insets.top, isInActiveMatch, matchStore.isSearching, uiStore.connectionStatus, userStore.user]);
  
  const requestLeaveMatch = (target: string) => {
    setPendingTab(target);
    setConfirmVisible(true);
  };
  const onCancelLeave = () => {
    setConfirmVisible(false);
    setPendingTab(null);
  };
  const onConfirmLeave = async () => {
    try { socketService.leaveMatch(); } catch {}
    try { matchStore?.resetMatch?.(); } catch {}
    setConfirmVisible(false);
    const target = pendingTab;
    setPendingTab(null);
    if (target) {
      if (target === 'Home') {
        try { nav.navigate('Home' as any, { screen: 'HomeRoot' } as any); } catch { nav.navigate('Home' as any); }
      } else {
        nav.navigate(target);
      }
    }
  };

  return (
    <React.Fragment>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle,
          tabBarActiveTintColor: COLORS.secondary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontWeight: '700',
            textShadowColor: COLORS.glowCyan,
            textShadowRadius: 6,
            textShadowOffset: { width: 0, height: 0 },
          },
          headerShadowVisible: false,
          header: renderHeader,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (isInActiveMatch) {
                e.preventDefault();
                requestLeaveMatch('Home');
              }
            },
          }}
        />
        <Tab.Screen
          name="Premium"
          component={PremiumScreen}
          options={{
            title: 'Premium',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star" size={size} color={color} />
            ),
            tabBarBadge: userStore.isPremium ? undefined : '🔒',
          }}
          listeners={{
            tabPress: (e) => {
              if (isInActiveMatch) {
                e.preventDefault();
                requestLeaveMatch('Premium');
              }
            },
          }}
        />
        <Tab.Screen
          name="Ranking"
          component={RankingScreen}
          options={{
            title: 'Ranking',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (isInActiveMatch) {
                e.preventDefault();
                requestLeaveMatch('Ranking');
              }
            },
          }}
        />
      </Tab.Navigator>
      <ConfirmDialog
        visible={confirmVisible}
        title="Leave Match?"
        message="If you leave now, you'll forfeit and your opponent will get the win. Are you sure?"
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={onConfirmLeave}
        onCancel={onCancelLeave}
        destructive
      />
      <IncomingInviteDialog />
    </React.Fragment>
  );
});

export const AppNavigator: React.FC = observer(() => {
  const { authStore } = rootStore;

  // Always connect socket, even for guests; token will be attached if present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try { await socketService.connect(); } catch (e) { console.error('Socket connection error:', e); }
    })();
    return () => {
      if (!mounted) return; 
      socketService.disconnect();
      mounted = false;
    };
  }, []);

  // keep helpers (unused now) for potential future conditional connects
  const connectSocket = async () => {
    try { await socketService.connect(); } catch (error) { console.error('Socket connection error:', error); }
  };

  const disconnectSocket = () => { socketService.disconnect(); };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.cardBackground,
            borderBottomColor: COLORS.border,
            borderBottomWidth: 1,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        {!authStore.isAuthenticated ? (
          <>
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EmailVerification"
              component={EmailVerificationScreen}
              options={{ 
                headerShown: false,
                gestureEnabled: false, // Prevent going back with swipe
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PremiumUpgrade"
              component={PremiumUpgradeScreen}
              options={{
                title: 'Upgrade to Premium',
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
});

const headerStyles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.12)',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  liveBadgeStandalone: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  liveBadgeText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(244, 114, 182, 0.6)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 18,
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    gap: 6,
  },
  pillIcon: {
    marginRight: 2,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    gap: 6,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
