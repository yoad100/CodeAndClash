import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { observer } from 'mobx-react-lite';
import { Ionicons } from '@expo/vector-icons';
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

const MainTabs: React.FC = () => {
  const { userStore, matchStore } = rootStore as any;
  const [pendingTab, setPendingTab] = React.useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const nav = useNavigation<any>();

  const isInActiveMatch = !!(matchStore?.currentMatch && matchStore.currentMatch.status === 'active');
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
            headerShown: false,
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
};

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
