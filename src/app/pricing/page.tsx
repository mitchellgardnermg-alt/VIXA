"use client";

import { useUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import PricingCard from '@/components/pricing/PricingCard';
import { Button } from '@/components/ui/Button';

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleSelectPlan = (plan: string) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    // TODO: Integrate with Stripe for actual payments
    alert(`Selected ${plan} plan. Payment integration coming soon!`);
  };

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#E6F1EE] py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-white/70">
            Unlock the full potential of VIXA with our professional plans
          </p>
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
