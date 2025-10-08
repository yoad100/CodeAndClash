import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants/colors';
import { rootStore } from '../stores/RootStore';
import { socketService } from '../services/socket.service';

// Screens
import { AuthScreen } from '../screens/Auth/AuthScreen';
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
  const getUserStatus = () => {
    if (isInActiveMatch) return { text: 'In Match', color: COLORS.success, icon: 'game-controller' };
    if (matchStore.isSearching) return { text: 'Searching', color: COLORS.warning, icon: 'search' };
    return { text: uiStore.connectionStatus || 'Online', color: COLORS.secondary, icon: 'checkmark-circle' };
  };

  const UserInfoHeader = () => {
    const user = userStore.user;
    console.log('🏠 UserInfoHeader render - user:', user ? 'exists' : 'null');
    console.log('🏠 UserInfoHeader render - authStore.isAuthenticated:', authStore?.isAuthenticated);
    
    if (!user) return (
      <TouchableOpacity
        onPress={handleLogout}
        style={navStyles.logoutOnlyButton}
        accessibilityLabel="Logout"
        accessibilityRole="button"
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
      </TouchableOpacity>
    );

    return (
      <View style={navStyles.userInfoContainer}>
        {/* User Avatar */}
        <View style={navStyles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={navStyles.avatar} />
          ) : (
            <View style={[navStyles.avatar, navStyles.avatarPlaceholder]}>
              <Text style={navStyles.avatarText}>
                {user.username?.charAt(0)?.toUpperCase() ?? 'U'}
              </Text>
            </View>
          )}
        </View>
        
        {/* User Details */}
        <View style={navStyles.userDetails}>
          <Text style={navStyles.username} numberOfLines={1}>
            {user.username ?? 'Guest'}
          </Text>
          <Text style={navStyles.ratingText}>
            Rating: {user.rating ?? '-'}
            {user.isPremium && (
              <Text> </Text>
            )}
            {user.isPremium && (
              <Ionicons name="star" size={12} color={COLORS.warning} />
            )}
          </Text>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={navStyles.logoutButton}
          accessibilityLabel="Logout"
          accessibilityRole="button"
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };
  
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
          tabBarStyle: {
            backgroundColor: COLORS.cardBackground,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
            // subtle glow under the tab bar
            shadowColor: COLORS.primary,
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -2 },
            elevation: 8,
          },
          tabBarActiveTintColor: COLORS.secondary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontWeight: '700',
            textShadowColor: COLORS.glowCyan,
            textShadowRadius: 6,
            textShadowOffset: { width: 0, height: 0 },
          },
          headerStyle: {
            backgroundColor: COLORS.cardBackground,
            borderBottomColor: COLORS.border,
            borderBottomWidth: 1,
            // subtle bottom shadow
            shadowColor: COLORS.primary,
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: COLORS.text,
            textShadowColor: COLORS.glowPrimary,
            textShadowRadius: 8,
            textShadowOffset: { width: 0, height: 0 },
          },
          headerRight: () => <UserInfoHeader />,
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
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
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

// Navigation header styles
const navStyles = StyleSheet.create({
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
    marginRight: 12,
    minWidth: 100,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.3)',
  },
  logoutOnlyButton: {
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 87, 0.3)',
  },
});
