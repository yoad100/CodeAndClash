import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { rootStore } from '../../stores/RootStore';
import { RootStackParamList } from '../../navigation/types';

type UpgradeNavigationProp = StackNavigationProp<RootStackParamList>;

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    period: '/month',
    features: [
      'Subject-specific battles',
      'Private matches with friends',
      'Priority matchmaking',
      'Exclusive badges',
      'Ad-free experience',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 79.99,
    period: '/year',
    discount: 'Save 33%',
    features: [
      'All monthly features',
      'Special yearly badge',
      'Early access to new features',
      'Premium support',
    ],
    popular: true,
  },
];

export const PremiumUpgradeScreen: React.FC = observer(() => {
  const navigation = useNavigation<UpgradeNavigationProp>();
  const { uiStore, userStore } = rootStore;
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    
    try {
      // Stripe payment integration would go here
      // await apiService.createSubscription(paymentMethodId);
      
      // Simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user store
      userStore.updateUser({ isPremium: true });
      
      uiStore.showToast('Welcome to Premium! 👑', 'success');
      navigation.goBack();
    } catch (error: any) {
      uiStore.showToast(error.message || 'Payment failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.icon}>👑</Text>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock exclusive features and dominate the leaderboard
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
                plan.popular && styles.popularPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.7}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{plan.discount}</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.checkmark}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={`Subscribe - ${PLANS.find(p => p.id === selectedPlan)?.price}`}
          onPress={handleSubscribe}
          loading={isProcessing}
          size="large"
          style={styles.subscribeButton}
        />

        <Text style={styles.disclaimer}>
          Cancel anytime. Subscription renews automatically.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedPlan: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  popularPlan: {
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  discountBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currency: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  period: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    marginLeft: 4,
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
