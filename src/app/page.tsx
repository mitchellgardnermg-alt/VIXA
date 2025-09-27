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
  const [showAppInterface, setShowAppInterface] = useState(false);

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

  // If signed in OR "Try Free" clicked, show the full featured app interface
  if (isSignedIn || showAppInterface) {
    const exportWidth = 1280;
    const exportHeight = 720;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVolumeChange = (newVolume: number) => {
      setVolume(newVolume);
      if (getOutputStream) {
        getOutputStream().volume = newVolume;
      }
    };

    const seekTo = (time: number) => {
      setCurrentTime(time);
      // TODO: Implement actual seeking
    };

    const restartTrack = () => {
      setCurrentTime(0);
      // TODO: Implement actual restart
    };

    const exportVideo = async () => {
      if (!previewBlob) return;
      
      setIsRemuxing(true);
      setConversionProgress(0);
      
      try {
        const formData = new FormData();
        formData.append('video', previewBlob, 'recording.webm');
        formData.append('convertToMp4', convertToMp4.toString());
        
        const response = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Conversion failed');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vixa-recording-${Date.now()}.${convertToMp4 ? 'mp4' : 'webm'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setShowPreview(false);
        setPreviewBlob(null);
        
        // Increment export usage
        incrementExportUsage();
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
      } finally {
        setIsRemuxing(false);
        setConversionProgress(0);
      }
    };

    const discardRecording = () => {
      setShowPreview(false);
      setPreviewBlob(null);
    };

    return (
      <div className="min-h-screen bg-[#0A0F0C] text-[#E6F1EE]">
        <header className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-[rgba(10,12,11,0.8)] backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-bold">VIXA</span>
              {user && (
                <span className="text-sm text-white/60 ml-4">
                  Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </span>
              )}
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
              {!isSignedIn && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAppInterface(false)}
                  className="text-white/70 hover:text-white"
                >
                  Back to Landing
                </Button>
              )}
              
              {/* Load File Button */}
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <UploadIcon className="w-4 h-4 mr-2" />
                Load
              </Button>

              {/* Record Button */}
              <Button 
                variant={isRecording ? "destructive" : "outline"} 
                size="sm" 
                onClick={() => setIsRecording(!isRecording)}
              >
                <DotFilledIcon className="w-4 h-4 mr-2" />
                {isRecording ? 'Stop' : 'Record'}
              </Button>

              {/* Logo Upload Button */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="outline" size="sm">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Logo
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="w-64 p-4 bg-neutral-900 border border-white/10">
                  <div className="text-xs opacity-70 mb-2">Logo Image</div>
                  <input type="file" accept="image/*" className="mb-2" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => setLogo({ src: String(reader.result) });
                    reader.readAsDataURL(f);
                  }} />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={() => setLogo({ src: undefined })}>Remove Logo</Button>
                  </div>
                  <div className="text-xs opacity-70 pt-1">Logo Size</div>
                  <input type="range" min={0.1} max={2} step={0.1} value={logo.scale || 1} onChange={(e) => setLogo({ scale: Number(e.target.value) })} />
                  <div className="text-xs opacity-70 pt-1">Logo Opacity</div>
                  <input type="range" min={0} max={1} step={0.01} value={logo.opacity || 1} onChange={(e) => setLogo({ opacity: Number(e.target.value) })} />
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              {/* Background Button */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Background
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="w-64 p-4 bg-neutral-900 border border-white/10">
                  <div className="text-xs opacity-70 mb-2">Background Image</div>
                  <input type="file" accept="image/*" className="mb-2" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => setBackground({ src: String(reader.result) });
                    reader.readAsDataURL(f);
                  }} />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={() => setBackground({ src: undefined })}>Remove Image</Button>
                  </div>
                  <div className="text-xs opacity-70 pt-1">Fit</div>
                  <div className="flex gap-2">
                    {(["cover", "contain", "stretch"] as const).map((k) => (
                      <Button key={k} size="sm" variant={background.fit === k ? "subtle" : "ghost"} onClick={() => setBackground({ fit: k })}>{k}</Button>
                    ))}
                  </div>
                  <div className="text-xs opacity-70">Image Opacity</div>
                  <input type="range" min={0} max={1} step={0.01} value={background.opacity} onChange={(e) => setBackground({ opacity: Number(e.target.value) })} />
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              <ProfileMenu />
              <AuthUserButton />
            </div>
          </div>
        </header>
        
        <div className="flex h-[calc(100vh-56px)]">
          {/* Main Content Area - Fixed */}
          <div className="flex-1 flex flex-col">
            <div className="w-full" style={{ height: `550px` }}>
              <OptimizedCanvas width={exportWidth} height={exportHeight} data={data} palette={palette} onCanvasReady={(c) => { canvasRef.current = c; }} paused={showPreview} />
            </div>
            {!hasInput && (
              <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">Load a file or use mic to start</div>
            )}
            
            {/* Music Control Section - Fixed */}
            <div className="bg-[rgba(10,12,11,0.8)] backdrop-blur-md border-t border-white/10 p-4">
              <div className="max-w-4xl mx-auto">
                {/* Track Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                      <SpeakerLoudIcon className="w-6 h-6 text-white/60" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Current Track</div>
                      <div className="text-xs text-white/60">Audio File</div>
                    </div>
                  </div>
                  <div className="text-sm text-white/60">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <SpeakerLoudIcon className="w-4 h-4 text-white/60" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-white/60 w-8">{Math.round(volume * 100)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Previous Track */}
                    <Button variant="outline" size="sm" onClick={restartTrack}>
                      <TrackPreviousIcon className="w-4 h-4" />
                    </Button>

                    {/* Play/Pause */}
                    {isPlaying ? (
                      <Button variant="primary" size="md" onClick={pause}>
                        <PauseIcon className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button variant="primary" size="md" onClick={resume}>
                        <PlayIcon className="w-5 h-5" />
                      </Button>
                    )}

                    {/* Next Track */}
                    <Button variant="outline" size="sm">
                      <TrackNextIcon className="w-4 h-4" />
                    </Button>

                    {/* Restart */}
                    <Button variant="outline" size="sm" onClick={restartTrack}>
                      <RotateCounterClockwiseIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Load File Button */}
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      <UploadIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar - Independent Scrolling */}
          <aside className="w-[360px] border-l border-white/10 bg-black/30 overflow-y-auto">
            <Mixer />
          </aside>
        </div>

        {/* Preview Modal */}
        {showPreview && previewBlob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 rounded-xl border border-white/10 p-6 max-w-4xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Preview Recording</h3>
                  <p className="text-sm text-white/60">Canvas animation paused for better audio focus</p>
                </div>
                <button
                  onClick={discardRecording}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <video
                  src={URL.createObjectURL(previewBlob)}
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: '60vh' }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">
                  {previewBlob.type.includes('mp4') ? 'MP4' : 'WebM'} • 
                  {(previewBlob.size / 1024 / 1024).toFixed(1)} MB
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={discardRecording}
                    disabled={isRemuxing}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="default"
                    onClick={exportVideo}
                    disabled={isRemuxing}
                  >
                    {isRemuxing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        {convertToMp4 ? 'Converting...' : 'Exporting...'}
                      </>
                    ) : (
                      `Export ${convertToMp4 ? 'as MP4' : 'Video'}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Modal */}
        <PricingModal 
          isOpen={showPricing} 
          onClose={() => setShowPricing(false)} 
        />
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
              onClick={() => setShowAppInterface(true)}
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
              onClick={() => setShowAppInterface(true)}
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