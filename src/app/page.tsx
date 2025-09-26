"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import AuthSignInButton from '@/components/auth/SignInButton';
import AuthUserButton from '@/components/auth/UserButton';
import { SpeakerLoudIcon, UploadIcon, PlayIcon, PauseIcon, DotFilledIcon, ImageIcon, BackpackIcon, StarIcon, CheckIcon } from '@radix-ui/react-icons';


export default function Home() {
  const { user, loading } = useAuth();
  const isSignedIn = !!user;
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/app');
    }
  }, [isSignedIn, router]);

  // Show loading spinner while checking authentication, but with a timeout
  if (loading) {
    return (
      <div className="h-screen bg-[#0A0F0C] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
          <p className="text-white/40 text-sm mt-2">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <SpeakerLoudIcon className="h-6 w-6" />,
      title: "Real-time Audio Analysis",
      description: "Advanced frequency and waveform analysis for stunning visuals"
    },
    {
      icon: <ImageIcon className="h-6 w-6" />,
      title: "13+ Visual Modes",
      description: "Bars, waveforms, particles, radial spectrums, and more"
    },
    {
      icon: <PlayIcon className="h-6 w-6" />,
      title: "Live Recording",
      description: "Record your sessions in high-quality MP4 format"
    },
    {
      icon: <BackpackIcon className="h-6 w-6" />,
      title: "Professional Mixer",
      description: "Multi-layer control with blend modes and palettes"
    }
  ];

  const testimonials = [
    {
      name: "DJ Sarah Chen",
      role: "Professional DJ",
      content: "VIXA transformed my live sets. The visual quality is incredible.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Event Producer",
      content: "Finally, a visual mixer that doesn't lag. Perfect for festivals.",
      rating: 5
    },
    {
      name: "Alex Thompson",
      role: "Streamer",
      content: "My viewers love the visuals. VIXA makes my streams stand out.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F0C] text-[#E6F1EE]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(10,12,11,0.8)] backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold">VIXA</span>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <Button variant="outline" size="md" onClick={() => router.push('/app')}>
                  Go to App
                </Button>
                <AuthUserButton />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AuthSignInButton />
              </div>
            )}
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <Logo className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              VIXA
            </h1>
            <p className="text-2xl md:text-3xl font-light mb-4">
              Professional Visual Mixer
            </p>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Create stunning audio-visual experiences with our professional DJ visual mixer. 
              Real-time analysis, multiple visual modes, and seamless recording.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <AuthSignInButton />
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => router.push('/pricing')}
            >
              View Pricing
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Free forever plan
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Instant access
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-white/70">Everything you need for professional visual mixing</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="text-emerald-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Professionals</h2>
            <p className="text-xl text-white/70">See what our users are saying</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 rounded-xl border border-white/10 bg-white/5">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-white/80 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-white/60 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Join thousands of DJs, streamers, and visual artists creating amazing experiences with VIXA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthSignInButton />
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => router.push('/pricing')}
            >
              View Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-semibold">VIXA</span>
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="text-center text-sm text-white/60 mt-8">
            © 2024 VIXA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}