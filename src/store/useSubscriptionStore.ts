import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSubscription, SubscriptionTier, canExport, getRemainingExports } from '@/lib/subscription';

interface SubscriptionState {
  subscription: UserSubscription | null;
  setSubscription: (subscription: UserSubscription) => void;
  canExport: () => boolean;
  getRemainingExports: () => number;
  incrementExportUsage: () => void;
  resetDailyUsage: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      
      setSubscription: (subscription) => set({ subscription }),
      
      canExport: () => {
        const { subscription } = get();
        if (!subscription) return false;
        return canExport(subscription);
      },
      
      getRemainingExports: () => {
        const { subscription } = get();
        if (!subscription) return 0;
        return getRemainingExports(subscription);
      },
      
      incrementExportUsage: () => {
        const { subscription } = get();
        if (!subscription) return;
        
        const today = new Date().toISOString().split('T')[0];
        const isNewDay = subscription.lastResetDate !== today;
        
        set({
          subscription: {
            ...subscription,
            dailyExportsUsed: isNewDay ? 1 : subscription.dailyExportsUsed + 1,
            lastResetDate: today
          }
        });
      },
      
      resetDailyUsage: () => {
        const { subscription } = get();
        if (!subscription) return;
        
        const today = new Date().toISOString().split('T')[0];
        set({
          subscription: {
            ...subscription,
            dailyExportsUsed: 0,
            lastResetDate: today
          }
        });
      }
    }),
    {
      name: 'subscription-storage',
    }
  )
);
