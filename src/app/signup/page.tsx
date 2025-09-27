"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { 
  CheckIcon, 
  StarIcon, 
  RocketIcon, 
  HeartIcon, 
  LockClosedIcon,
  LightningBoltIcon,
  PersonIcon,
  CodeIcon,
  StarFilledIcon,
  PlusIcon
} from '@radix-ui/react-icons';

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLifetimeAccess = async () => {
    if (!user) {
      // Redirect to sign in first
      router.push('/auth/sign-in');
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Integrate with Stripe for actual payment processing
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful payment, redirect to app
      router.push('/app');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const lifetimeFeatures = [
    {
      icon: <StarFilledIcon className="h-5 w-5" />,
      title: "Unlimited Access",
      description: "Full access to all current and future features"
    },
    {
      icon: <RocketIcon className="h-5 w-5" />,
      title: "Early Access",
      description: "Be the first to try new features before public release"
    },
    {
      icon: <CodeIcon className="h-5 w-5" />,
      title: "Development Input",
      description: "Influence the roadmap and vote on new features"
    },
    {
      icon: <LightningBoltIcon className="h-5 w-5" />,
      title: "Priority Support",
      description: "Get help when you need it with dedicated support"
    },
    {
      icon: <PersonIcon className="h-5 w-5" />,
      title: "Exclusive Community",
      description: "Join the VIP community of power users and creators"
    },
    {
      icon: <LockClosedIcon className="h-5 w-5" />,
      title: "Future-Proof",
      description: "Never pay again - lifetime updates included"
    }
  ];

  const currentFeatures = [
    "13+ Visual Modes",
    "Real-time Audio Analysis", 
    "Professional Mixer",
    "Custom Palettes",
    "Live Recording",
    "Logo Overlay",
    "Multiple Export Formats",
    "Blend Modes"
  ];

  const upcomingFeatures = [
    "AI-Generated Visuals",
    "3D Particle Systems",
    "Advanced Audio Effects",
    "Team Collaboration",
    "Cloud Sync",
    "Mobile App",
    "VR Support",
    "Custom Visual Shaders"
  ];

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#E6F1EE]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[rgba(10,12,11,0.8)] backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold">VIXA</span>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
              <StarIcon className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-300">Limited Time Offer</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Lifetime Access
            </h1>
            
            <p className="text-2xl md:text-3xl font-light mb-4 text-white/90">
              Own VIXA Forever
            </p>
            
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Join the exclusive group of creators who have lifetime access to VIXA. 
              Be part of the development process and never pay again.
            </p>

            {/* Price */}
            <div className="mb-8">
              <div className="inline-block relative">
                <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  $44.99
                </div>
                <div className="absolute -top-2 -right-8 text-sm text-white/60 line-through">
                  $199
                </div>
              </div>
              <div className="text-lg text-white/70 mt-2">One-time payment • Lifetime access</div>
            </div>

            {/* CTA Button */}
            <div className="mb-12">
              <Button 
                variant="primary" 
                size="lg" 
                className="text-xl px-12 py-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold"
                onClick={handleLifetimeAccess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <StarFilledIcon className="h-6 w-6" />
                    Get Lifetime Access
                  </div>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <LockClosedIcon className="h-4 w-4 text-emerald-400" />
                  30-day money-back guarantee
                </div>
                <div className="flex items-center gap-2">
                  <HeartIcon className="h-4 w-4 text-red-400" />
                  Support indie development
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What You Get</h2>
            <p className="text-xl text-white/70">Everything you need to create amazing visuals, forever</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {lifetimeFeatures.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="text-emerald-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current vs Upcoming Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Current & Upcoming Features</h2>
            <p className="text-xl text-white/70">See what's available now and what's coming next</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Current Features */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-emerald-400">Available Now</h3>
                <p className="text-white/70">Everything you need to start creating</p>
              </div>
              
              <div className="space-y-3">
                {currentFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <CheckIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/90">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Features */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-cyan-400">Coming Soon</h3>
                <p className="text-white/70">Your input shapes what we build next</p>
              </div>
              
              <div className="space-y-3">
                {upcomingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <PlusIcon className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-white/90">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">Join the VIXA Community</h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-2">500+</div>
                <div className="text-white/70">Active Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">50K+</div>
                <div className="text-white/70">Videos Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">99%</div>
                <div className="text-white/70">Satisfaction Rate</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-8 border border-white/10">
              <blockquote className="text-lg text-white/90 mb-4 italic">
                "VIXA has completely transformed my live streams. The lifetime access was the best investment I've made for my content creation setup."
              </blockquote>
              <div className="text-white/70">
                <div className="font-semibold">Sarah Chen</div>
                <div className="text-sm">Professional Streamer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Ready to Own VIXA Forever?</h2>
            <p className="text-xl text-white/70 mb-8">
              Join the exclusive group of creators with lifetime access. 
              Be part of the development process and never pay again.
            </p>
            
            <Button 
              variant="primary" 
              size="lg" 
              className="text-xl px-12 py-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold"
              onClick={handleLifetimeAccess}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <StarFilledIcon className="h-6 w-6" />
                  Get Lifetime Access - $44.99
                </div>
              )}
            </Button>
            
            <div className="mt-6 text-sm text-white/60">
              <div>✓ 30-day money-back guarantee</div>
              <div>✓ Instant access after payment</div>
              <div>✓ Support indie development</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-semibold">VIXA</span>
          </div>
          <div className="text-sm text-white/60">
            © 2024 VIXA. Lifetime access • Forever updates • Endless creativity.
          </div>
        </div>
      </footer>
    </div>
  );
}
