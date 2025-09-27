"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import AuthSignInButton from '@/components/auth/SignInButton';
import AuthUserButton from '@/components/auth/UserButton';
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";
import OptimizedCanvas from "@/components/OptimizedCanvas";
import Mixer from "@/components/Mixer";
import { useAppStore } from "@/store/useAppStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Separator from "@radix-ui/react-separator";
import { SpeakerLoudIcon, UploadIcon, PlayIcon, PauseIcon, DotFilledIcon, ImageIcon, BackpackIcon, StarIcon, CheckIcon, InputIcon, TrackNextIcon, TrackPreviousIcon, RotateCounterClockwiseIcon } from '@radix-ui/react-icons';
import ProfileMenu from "@/components/auth/ProfileMenu";
import PricingModal from "@/components/PricingModal";

export default function Home() {
  const { user, loading } = useAuth();
  const isSignedIn = !!user;
  const router = useRouter();

  // App functionality (moved from /app page)
  const { data, playMic, playFile, isPlaying, pause, resume, hasInput, getOutputStream } = useAudioAnalyser();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [palette] = useState(["#071923", "#00BBF9", "#00F5D4", "#E0FBFC"]);
  const logo = useAppStore((s) => s.logo);
  const setLogo = useAppStore((s) => s.setLogo);
  const background = useAppStore((s) => s.background);
  const setBackground = useAppStore((s) => s.setBackground);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isRemuxing, setIsRemuxing] = useState(false);
  const [convertToMp4, setConvertToMp4] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Subscription management
  const { subscription, canExport, getRemainingExports, incrementExportUsage, setSubscription } = useSubscriptionStore();

  // Initialize free subscription if none exists
  useEffect(() => {
    if (!subscription && isSignedIn) {
      setSubscription({
        tier: 'free',
        status: 'active',
        exportsUsed: 0,
        exportsLimit: 3,
        startDate: new Date().toISOString(),
        endDate: null
      });
    }
  }, [subscription, isSignedIn, setSubscription]);

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
    },
    {
      icon: <StarIcon className="h-6 w-6" />,
      title: "Custom Palettes",
      description: "Create and save your own color schemes"
    },
    {
      icon: <DotFilledIcon className="h-6 w-6" />,
      title: "Blend Modes",
      description: "Screen, add, multiply, and more blend modes"
    },
    {
      icon: <UploadIcon className="h-6 w-6" />,
      title: "Logo Overlay",
      description: "Add custom logos and branding to your visuals"
    },
    {
      icon: <CheckIcon className="h-6 w-6" />,
      title: "Export Options",
      description: "Multiple resolution and format options"
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

  // If signed in, show the app interface
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0A0F0C] text-[#E6F1EE]">
        <header className="sticky top-0 z-10 px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-bold">VIXA</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/pricing')}
                className="text-white/70 hover:text-white"
              >
                Pricing
              </Button>
              <ProfileMenu />
            </div>
          </div>
        </header>
        
        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-0">
          <div className="relative flex flex-col">
            <div className="w-full" style={{ height: `550px` }}>
              <OptimizedCanvas width={1280} height={720} data={data} palette={palette} onCanvasReady={(c) => { canvasRef.current = c; }} paused={showPreview} />
            </div>
          </div>
          <div className="bg-[#0F1411] border-l border-white/10 p-4">
            <Mixer 
              data={data} 
              playMic={playMic} 
              playFile={playFile} 
              isPlaying={isPlaying} 
              pause={pause} 
              resume={resume} 
              hasInput={hasInput}
              fileRef={fileRef}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              canvasRef={canvasRef}
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              previewBlob={previewBlob}
              setPreviewBlob={setPreviewBlob}
              isRemuxing={isRemuxing}
              setIsRemuxing={setIsRemuxing}
              convertToMp4={convertToMp4}
              setConvertToMp4={setConvertToMp4}
              conversionProgress={conversionProgress}
              setConversionProgress={setConversionProgress}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              duration={duration}
              setDuration={setDuration}
              volume={volume}
              setVolume={setVolume}
              canExport={canExport}
              getRemainingExports={getRemainingExports}
              incrementExportUsage={incrementExportUsage}
              showPricing={showPricing}
              setShowPricing={setShowPricing}
            />
          </div>
        </div>
        
        {showPricing && (
          <PricingModal 
            isOpen={showPricing} 
            onClose={() => setShowPricing(false)} 
          />
        )}
      </div>
    );
  }

  // If not signed in, show the landing page
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/pricing')}
              className="text-white/70 hover:text-white"
            >
              Pricing
            </Button>
            <AuthSignInButton 
              size="sm"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Waveform Background */}
        <div className="absolute inset-0 z-0">
          {/* CSS Waveform Visualization */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="flex items-center justify-center space-x-1 opacity-30">
              {Array.from({ length: 60 }).map((_, i) => {
                // Use deterministic values based on index to avoid hydration mismatch
                // Round to fixed decimal places to ensure server/client consistency
                const baseHeight = 20 + Math.sin((i * Math.PI) / 30) * 40;
                const variation = Math.sin((i * Math.PI) / 15) * 15;
                const height = Math.round((baseHeight + variation) * 100) / 100; // Round to 2 decimal places
                const duration = 1.5 + (i % 3) * 0.3;
                const scale = Math.round((0.5 + Math.sin((i * Math.PI) / 15) * 0.5) * 1000000) / 1000000; // Round to 6 decimal places
                const animationDelay = Math.round(i * 0.1 * 10) / 10; // Round to 1 decimal place
                
                return (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-cyan-500 via-blue-500 to-pink-500 rounded-full animate-pulse"
                    style={{
                      width: '2px',
                      height: `${height}px`,
                      animationDelay: `${animationDelay}s`,
                      animationDuration: `${duration}s`,
                      transform: `scaleY(${scale})`,
                    }}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Animated CSS Background as Enhancement */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-pink-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/10 to-transparent animate-pulse delay-1000"></div>
          </div>
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="mb-8">
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
            <Button 
              variant="primary" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => router.push('/app')}
            >
              Try Free
            </Button>
            <AuthSignInButton 
              size="lg" 
              className="text-lg px-8 py-4"
            />
            <Button 
              variant="default" 
              size="lg" 
              className="text-lg px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold"
              onClick={() => router.push('/signup')}
            >
              Lifetime Access - $44.99
            </Button>
          </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Free plan
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Instant access
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              13+ visual modes
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Real-time audio analysis
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Live recording
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Professional mixer
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Custom palettes
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
            <Button 
              variant="primary" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => router.push('/app')}
            >
              Try Free
            </Button>
            <AuthSignInButton 
              size="lg" 
              className="text-lg px-8 py-4"
            />
            <Button 
              variant="default" 
              size="lg" 
              className="text-lg px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold"
              onClick={() => router.push('/signup')}
            >
              Lifetime Access - $44.99
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