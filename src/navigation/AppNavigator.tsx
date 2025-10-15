import React, { useEffect } from 'react';
import { Platform } from 'react-native';
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
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/Auth/ResetPasswordScreen';
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
import { buildLevelBreakpoints, getLevelByRank } from '../constants/levels';

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
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If leaderboard is empty, fetch it so header can compute level cutoffs
        if (mounted && Array.isArray(userStore?.leaderboard) && userStore.leaderboard.length === 0 && !userStore.isLoading) {
          await userStore.fetchLeaderboard();
        }
      } catch (err) {
        if (process?.env?.NODE_ENV === 'development') console.warn('Failed to fetch leaderboard on mount:', err);
      }
    })();
    return () => { mounted = false; };
  }, [userStore]);
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
        style={[headerStyles.gradient, { paddingTop: insets.top + 8 }]}
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
              <View style={headerStyles.ratingContainer}>
                {(() => {
                  const rating = typeof user?.rating === 'number' ? user.rating : NaN;
                  const store = (rootStore as any).userStore;
                  const isMax = !!store?.isMaxLevel;
                  const next = typeof store?.nextRating === 'number' ? store.nextRating : undefined;
                  const progress = typeof store?.progressToNextLevel === 'number' ? store.progressToNextLevel : undefined;
                  const displayCurrent = Number.isFinite(rating) ? rating : '—';

                  // If user is at max level, show full bar with 'Max Level'
                  if (isMax) {
                    return (
                      <View style={headerStyles.ratingInner}>
                        <View style={headerStyles.ratingBarBackground}>
                          <View style={[headerStyles.ratingBarFill, { width: `100%`, backgroundColor: COLORS.warning || COLORS.secondary }]} />
                        </View>
                        <Text style={headerStyles.ratingText}>{`MAX LEVEL`}</Text>
                      </View>
                    );
                  }

                  // Normal rendering: prefer authoritative next rating and progress from UserStore.
                  // If we don't have a next cutoff (e.g. leaderboard not loaded), don't show an arbitrary
                  // "/ 2000" denominator — instead display only the current rating and hide the progress fill.
                  const hasNext = typeof next === 'number' && Number.isFinite(next);
                  const finalNext = hasNext ? next : undefined;
                  const finalProgress = (typeof progress === 'number' && Number.isFinite(progress))
                    ? progress
                    : (hasNext && Number.isFinite(rating) ? Math.max(0, Math.min(1, rating / (finalNext as number))) : undefined);

                  const numericCurrent = typeof displayCurrent === 'number' ? displayCurrent : (Number.isFinite(Number(displayCurrent)) ? Number(displayCurrent) : NaN);
                  const shouldShowDenom = typeof finalNext === 'number' && Number.isFinite(numericCurrent) && finalNext > numericCurrent;

                  return (
                    <View style={headerStyles.ratingInner}>
                      <View style={headerStyles.ratingBarBackground}>
                        {/* Only show fill when we have a sensible progress value */}
                        {typeof finalProgress === 'number' ? (
                          <View style={[headerStyles.ratingBarFill, { width: `${finalProgress * 100}%`, backgroundColor: COLORS.secondary }]} />
                        ) : null}
                      </View>
                      <Text style={headerStyles.ratingText}>
                        {Number.isFinite(numericCurrent) ? (shouldShowDenom ? `${numericCurrent} / ${finalNext}` : `${numericCurrent}`) : '—'}
                      </Text>
                    </View>
                  );
                })()}
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
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Handle simple web deep-link for reset-password token (e.g. /reset-password?token=...)
        try {
          if (Platform.OS === 'web') {
            const loc = (globalThis as any).location;
            if (loc && loc.pathname && loc.pathname.startsWith('/reset-password')) {
              const q = new URLSearchParams(loc.search || '');
              const t = q.get('token');
              if (t && !authStore?.isAuthenticated) {
                // Navigate to ResetPassword with token
                navigationRef.current && (navigationRef.current as any).navigate('ResetPassword', { token: t });
              }
            }
          }
        } catch (e) {
          console.warn('Deep link handling failed', e);
        }
      }}
    >
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
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.12)',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ratingContainer: {
    marginLeft: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  ratingInner: {
    width: 140,
  },
  ratingBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  ratingBarFill: {
    height: 8,
    borderRadius: 6,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
    gap: 6,
    marginBottom: 2,
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
