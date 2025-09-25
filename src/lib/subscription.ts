export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  dailyExports: number;
  features: string[];
  description: string;
  popular?: boolean;
  limitedTime?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    dailyExports: 3,
    features: [
      'All visual modes',
      'All aspect ratios',
      'MP4 conversion',
      '3 exports per day',
      'Basic support'
    ],
    description: 'Perfect for trying out the app'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 8.99,
    dailyExports: 20,
    features: [
      'Everything in Free',
      '20 exports per day',
      'Priority processing',
      'Advanced export options',
      'Priority support'
    ],
    description: 'For content creators and professionals',
    popular: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 44.99,
    dailyExports: -1, // Unlimited
    features: [
      'Everything in Pro',
      'Unlimited exports',
      'All future features',
      'Beta access',
      'Lifetime updates'
    ],
    description: 'One-time payment, lifetime access',
    limitedTime: true
  }
];

export interface UserSubscription {
  tier: SubscriptionTier;
  startDate: Date;
  endDate?: Date; // undefined for lifetime
  dailyExportsUsed: number;
  lastResetDate: string; // YYYY-MM-DD format
}

export function getSubscriptionLimits(tier: SubscriptionTier) {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === tier);
  return {
    dailyExports: plan?.dailyExports || 3,
    isUnlimited: plan?.dailyExports === -1
  };
}

export function canExport(userSub: UserSubscription): boolean {
  const limits = getSubscriptionLimits(userSub.tier);
  
  if (limits.isUnlimited) return true;
  
  // Check if we need to reset daily counter
  const today = new Date().toISOString().split('T')[0];
  if (userSub.lastResetDate !== today) {
    return true; // New day, reset counter
  }
  
  return userSub.dailyExportsUsed < limits.dailyExports;
}

export function getRemainingExports(userSub: UserSubscription): number {
  const limits = getSubscriptionLimits(userSub.tier);
  
  if (limits.isUnlimited) return -1; // Unlimited
  
  const today = new Date().toISOString().split('T')[0];
  if (userSub.lastResetDate !== today) {
    return limits.dailyExports; // New day, full allowance
  }
  
  return Math.max(0, limits.dailyExports - userSub.dailyExportsUsed);
}
