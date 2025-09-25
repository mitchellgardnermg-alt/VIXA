"use client";

import { useState } from 'react';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/subscription';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Button } from '@/components/ui/Button';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { setSubscription } = useSubscriptionStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === 'free') {
      // Set free subscription
      setSubscription({
        tier: 'free',
        startDate: new Date(),
        dailyExportsUsed: 0,
        lastResetDate: new Date().toISOString().split('T')[0]
      });
      onClose();
      return;
    }

    // For paid plans, redirect to Stripe checkout
    setLoading(tier);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
            body: JSON.stringify({
              plan: tier,
              email: user?.email,
            }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl border border-white/10 p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl"
          >
            <Cross2Icon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-6 ${
                plan.popular
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-neutral-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.limitedTime && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Limited Time
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold mb-2">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  {plan.price > 0 && plan.id === 'lifetime' && (
                    <span className="text-sm text-white/60 ml-1">one-time</span>
                  )}
                  {plan.price > 0 && plan.id === 'pro' && (
                    <span className="text-sm text-white/60 ml-1">/month</span>
                  )}
                </div>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                variant={plan.popular ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  plan.id === 'free' ? 'Get Started' : 
                  plan.id === 'lifetime' ? 'Get Lifetime Access' : 
                  'Subscribe to Pro'
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-white/60">
          <p>All plans include access to all visual modes and features.</p>
          <p>Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </div>
  );
}
