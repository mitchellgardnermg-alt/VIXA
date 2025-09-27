"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import PricingCard from '@/components/pricing/PricingCard';
import { Button } from '@/components/ui/Button';
import { StarIcon, CheckIcon } from '@radix-ui/react-icons';
import { Suspense } from 'react';

function PricingContent() {
  const { user, loading } = useAuth();
  const isSignedIn = !!user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new_user') === 'true';

  const handleSelectPlan = (plan: string) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    
    if (plan === 'Free') {
      // For new users, redirect to app after selecting free plan
      router.push('/app');
      return;
    }
    
    // TODO: Integrate with Stripe for actual payments
    alert(`Selected ${plan} plan. Payment integration coming soon!`);
  };

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#E6F1EE] py-12">
      <div className="container mx-auto px-4">
        {/* Welcome Message for New Users */}
        {isNewUser && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-8 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Welcome to VIXA!</span>
              </div>
              
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Get Started with VIXA
              </h2>
              
              <p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto">
                Thanks for signing up! You're now on the free plan. Choose your path below to unlock VIXA's full potential.
              </p>
              
              <div className="flex items-center justify-center gap-6 text-sm text-white/60 mb-6">
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                  Start with free plan
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                  Upgrade anytime
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                  Lifetime access available
                </div>
              </div>
              
              <Button 
                variant="default" 
                size="lg" 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg px-8 py-4"
                onClick={() => router.push('/signup')}
              >
                <StarIcon className="h-5 w-5 mr-2" />
                Get Lifetime Access - $44.99
              </Button>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-white/70">
            {isNewUser ? "Select the plan that works best for you" : "Unlock the full potential of VIXA with our professional plans"}
          </p>
        </div>

        {/* Lifetime Access Offer - Featured */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/40 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                BEST DEAL
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <StarIcon className="h-6 w-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-yellow-300">Lifetime Access</h2>
              </div>
              
              <div className="mb-6">
                <div className="inline-block relative">
                  <div className="text-5xl font-bold text-yellow-300">$44.99</div>
                  <div className="absolute -top-2 -right-8 text-sm text-white/60 line-through">$199</div>
                </div>
                <div className="text-white/70 mt-2">One-time payment • Own VIXA forever</div>
              </div>
              
              <p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto">
                Get unlimited access to all current and future VIXA features. Be part of the development process and never pay again.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-yellow-400" />
                  All features
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-yellow-400" />
                  Early access
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-yellow-400" />
                  Development input
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-yellow-400" />
                  Priority support
                </div>
              </div>
              
              <Button 
                variant="default" 
                size="lg" 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg px-12 py-4"
                onClick={() => router.push('/signup')}
              >
                <StarIcon className="h-5 w-5 mr-2" />
                Get Lifetime Access
              </Button>
              
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                  30-day guarantee
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                  Instant access
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">Or choose a subscription plan</h3>
          <p className="text-white/70">Monthly and yearly options available</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            title="Free"
            price="$0"
            description="Perfect for getting started"
            features={[
              "3 visual layers",
              "Basic visual modes",
              "Local storage only",
              "Standard palettes",
              "Community support"
            ]}
            buttonText="Get Started"
            onSelect={() => handleSelectPlan('Free')}
          />

          <PricingCard
            title="Pro"
            price="$19"
            description="For professional DJs"
            isPopular
            features={[
              "Unlimited layers",
              "All visual modes",
              "Cloud sync & backup",
              "Premium palettes",
              "High-res recording",
              "Priority support",
              "Custom branding"
            ]}
            buttonText="Go Pro"
            onSelect={() => handleSelectPlan('Pro')}
          />

          <PricingCard
            title="Studio"
            price="$49"
            description="For studios and teams"
            features={[
              "Everything in Pro",
              "Team collaboration",
              "Custom visual modes",
              "API access",
              "White-label options",
              "Dedicated support",
              "Advanced analytics"
            ]}
            buttonText="Go Studio"
            onSelect={() => handleSelectPlan('Studio')}
          />
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" onClick={() => router.push('/')}>
            ← Back to App
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0A0F0C] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading pricing...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
