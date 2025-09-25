"use client";

import { useRef, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";
import OptimizedCanvas from "@/components/OptimizedCanvas";
import Mixer from "@/components/Mixer";
import { useAppStore } from "@/store/useAppStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Separator from "@radix-ui/react-separator";
import { SpeakerLoudIcon, UploadIcon, PlayIcon, PauseIcon, DotFilledIcon, ImageIcon, BackpackIcon, StarIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/Button";
import AuthUserButton from "@/components/auth/UserButton";
import AuthSignInButton from "@/components/auth/SignInButton";
import ProfileMenu from "@/components/auth/ProfileMenu";
import Logo from "@/components/Logo";
import PricingModal from "@/components/PricingModal";

export default function App() {
  const { user, loading } = useAuth();
  const isSignedIn = !!user;
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

  // Subscription management
  const { subscription, canExport, getRemainingExports, incrementExportUsage, setSubscription } = useSubscriptionStore();

  // Initialize free subscription if none exists
  if (!subscription && isSignedIn) {
    setSubscription({
      tier: 'free',
      startDate: new Date(),
      dailyExportsUsed: 0,
      lastResetDate: new Date().toISOString().split('T')[0]
    });
  }

  // Export settings
  const [exportWidth, setExportWidth] = useState<number>(1280);
  const [exportHeight, setExportHeight] = useState<number>(720);
  const [exportFps, setExportFps] = useState<number>(60);
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");

  // Aspect ratio presets for social media
  const aspectRatios = {
    "16:9": { width: 1920, height: 1080, name: "YouTube (16:9)" },
    "9:16": { width: 1080, height: 1920, name: "TikTok (9:16)" },
    "1:1": { width: 1080, height: 1080, name: "Instagram Square (1:1)" },
    "4:5": { width: 1080, height: 1350, name: "Instagram Portrait (4:5)" },
    "custom": { width: exportWidth, height: exportHeight, name: "Custom" }
  };

  // Update export dimensions when aspect ratio changes
  const handleAspectRatioChange = (ratio: string) => {
    setAspectRatio(ratio);
    if (ratio !== "custom") {
      const preset = aspectRatios[ratio as keyof typeof aspectRatios];
      setExportWidth(preset.width);
      setExportHeight(preset.height);
    }
  };

  // Compress video before upload to reduce file size
  async function compressVideo(blob: Blob, quality: number = 0.7): Promise<Blob> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        ctx?.drawImage(video, 0, 0);
        
        // Convert to blob with compression
        canvas.toBlob((compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            resolve(blob); // Fallback to original
          }
        }, 'video/webm', quality);
      };
      
      video.src = URL.createObjectURL(blob);
    });
  }

  // Server-side conversion to MP4 using Cloudinary with progress tracking
  async function convertToMp4Blob(webmBlob: Blob): Promise<Blob> {
    setConversionProgress(10);
    
    // Compress video before upload
    const compressedBlob = await compressVideo(webmBlob, 0.6);
    setConversionProgress(30);
    
    const formData = new FormData();
    formData.append('file', compressedBlob, 'recording.webm');
    formData.append('width', exportWidth.toString());
    formData.append('height', exportHeight.toString());
    
    setConversionProgress(50);
    
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });
    
    setConversionProgress(80);
    
    if (!response.ok) {
      throw new Error(`Conversion failed: ${response.status}`);
    }
    
    const result = await response.blob();
    setConversionProgress(100);
    
    return result;
  }

  async function startRecording() {
    const canvas = canvasRef.current;
    const audioStream = getOutputStream();
    if (!canvas || !audioStream) return;
    // Switch to export resolution before capture
    setIsRecording(true);
    await new Promise(requestAnimationFrame);
    // Use selected FPS for export
    const canvasStream = canvas.captureStream(Math.max(1, Math.min(120, exportFps)));
    const audioTracks = audioStream.getAudioTracks();
    audioTracks.forEach((t) => canvasStream.addTrack(t));

    // Choose recording format based on convertToMp4 setting
    let selectedType: string;
    if (convertToMp4) {
      // Use best supported format for conversion
      const preferredTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus", 
        "video/webm"
      ];
      selectedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";
    } else {
      // Try MP4 first, fallback to WebM
      if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264,aac")) {
        selectedType = "video/mp4;codecs=h264,aac";
      } else {
        const webmTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
        selectedType = webmTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      }
    }
    
    if (!selectedType) {
      setIsRecording(false);
      alert("No supported recording format found in this browser.");
      return;
    }

    const mr = new MediaRecorder(canvasStream, {
      mimeType: selectedType,
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 192_000,
    });
    recordedChunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: mr.mimeType });
      
      // Show preview instead of immediate download
      setPreviewBlob(blob);
      setShowPreview(true);
      setIsRecording(false);
    };
    mr.start(250);
    mediaRecorderRef.current = mr;
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  // Export the preview video
  async function exportVideo() {
    if (!previewBlob) return;
    
    // Check subscription limits
    if (!canExport()) {
      setShowPricing(true);
      return;
    }
    
    try {
      setIsRemuxing(true);
      
      if (convertToMp4 && !previewBlob.type.includes('mp4')) {
        const convertedBlob = await convertToMp4Blob(previewBlob);
        const url = URL.createObjectURL(convertedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vixa-recording.mp4`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Direct download
        const url = URL.createObjectURL(previewBlob);
        const a = document.createElement("a");
        a.href = url;
        const ext = previewBlob.type.includes('mp4') ? 'mp4' : 'webm';
        a.download = `vixa-recording.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      // Increment usage counter
      incrementExportUsage();
      
      // Close preview
      setShowPreview(false);
      setPreviewBlob(null);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsRemuxing(false);
    }
  }

  // Discard the recording
  function discardRecording() {
    setShowPreview(false);
    setPreviewBlob(null);
    recordedChunksRef.current = [];
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="h-screen bg-[#0A0F0C] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="h-screen bg-[#0A0F0C] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <Logo className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            VIXA
          </h1>
          <p className="text-white/70 mb-8">Please sign in to access the visual mixer</p>
          <AuthSignInButton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0A0F0C] text-[#E6F1EE]">
      <header className="sticky top-0 z-10 px-4 pt-3 pb-2">
        <div className="w-full rounded-xl border border-white/10 bg-[rgba(10,12,11,0.6)] backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)] px-3 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2">
            <Logo className="h-8 w-8" />
            <div className="text-base font-semibold tracking-wide">VIXA</div>
          </div>
          <Separator.Root className="h-6 w-px bg-white/10" decorative orientation="vertical" />
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <div className="hidden md:flex items-center gap-2 text-sm text-white/70">
                <span>Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
              </div>
            ) : null}
          </div>
          <div className="ml-auto" />
          <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2 py-1">
            <input ref={fileRef} type="file" accept="audio/mp3,.mp3" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) playFile(f);
            }} />
            <Button variant="primary" size="md" onClick={() => fileRef.current?.click()}>
              <UploadIcon className="mr-2 h-4 w-4" /> Load
            </Button>
            {isPlaying ? (
              <Button variant="subtle" size="md" onClick={pause}>
                <PauseIcon className="mr-2 h-4 w-4" /> Pause
              </Button>
            ) : (
              <Button variant="subtle" size="md" onClick={resume}>
                <PlayIcon className="mr-2 h-4 w-4" /> Play
              </Button>
            )}
            {isRecording ? (
              <Button variant="danger" size="md" onClick={stopRecording}>
                <DotFilledIcon className="mr-2 h-4 w-4" /> Stop
              </Button>
            ) : isRemuxing ? (
              <div className="flex flex-col items-center gap-2">
                <Button variant="secondary" size="md" disabled>
                  <DotFilledIcon className="mr-2 h-4 w-4" /> Converting...
                </Button>
                <div className="w-32 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
                <div className="text-xs opacity-70">{conversionProgress}%</div>
              </div>
            ) : (
              <Button variant="secondary" size="md" onClick={startRecording} disabled={!hasInput}>
                <DotFilledIcon className="mr-2 h-4 w-4" /> Rec
              </Button>
            )}
          </div>
          <Separator.Root className="h-6 w-px bg-white/10" decorative orientation="vertical" />
          <div className="flex items-center gap-2">
            {/* Subscription Status */}
            {subscription && (
              <div className="flex items-center gap-2 text-sm">
                <StarIcon className="w-4 h-4 text-yellow-500" />
                <span className="capitalize">{subscription.tier}</span>
                {getRemainingExports() !== -1 && (
                  <span className="text-white/60">
                    ({getRemainingExports()} exports left today)
                  </span>
                )}
                {getRemainingExports() === -1 && (
                  <span className="text-green-500">Unlimited</span>
                )}
              </div>
            )}

            {/* Export settings */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="md">Export</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="min-w-72 bg-neutral-900 text-neutral-100 border border-white/10 rounded p-3 space-y-3">
                <div className="text-xs opacity-70">Aspect Ratio</div>
                <div className="text-xs opacity-50">Current: {exportWidth}×{exportHeight}</div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(aspectRatios).map(([key, preset]) => (
                    <Button 
                      key={key}
                      size="sm" 
                      variant={aspectRatio === key ? "default" : "subtle"}
                      onClick={() => handleAspectRatioChange(key)}
                    >
                      {preset.name} {key !== "custom" && `(${preset.width}×${preset.height})`}
                    </Button>
                  ))}
                </div>
                <div className="text-xs opacity-70 pt-1">Custom</div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-xs opacity-70 col-span-1">Width</div>
                  <input className="col-span-2 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                    type="number" min={160} max={7680} step={10}
                    value={exportWidth}
                    onChange={(e) => setExportWidth(Math.max(160, Math.min(7680, Number(e.target.value) || 0)))} />
                  <div className="text-xs opacity-70 col-span-1">Height</div>
                  <input className="col-span-2 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                    type="number" min={90} max={4320} step={10}
                    value={exportHeight}
                    onChange={(e) => setExportHeight(Math.max(90, Math.min(4320, Number(e.target.value) || 0)))} />
                  <div className="text-xs opacity-70 col-span-1">FPS</div>
                  <input className="col-span-2 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                    type="number" min={1} max={120} step={1}
                    value={exportFps}
                    onChange={(e) => setExportFps(Math.max(1, Math.min(120, Number(e.target.value) || 0)))} />
                </div>
                <div className="text-xs opacity-70 pt-1">Convert to MP4</div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={convertToMp4} 
                    onChange={(e) => setConvertToMp4(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Convert WebM to MP4 after recording</span>
                </div>
                
                {/* Upgrade Button */}
                {subscription?.tier === 'free' && (
                  <div className="pt-2 border-t border-white/10">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowPricing(true)}
                    >
                      <StarIcon className="w-4 h-4 mr-2" />
                      Upgrade for More Exports
                    </Button>
                  </div>
                )}
                <div className="text-xs text-white/60">Recording uses these settings. Canvas will render at the selected resolution.</div>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="md"><ImageIcon className="mr-2 h-4 w-4" /> Logo</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="min-w-56 bg-neutral-900 text-neutral-100 border border-white/10 rounded p-2 space-y-2">
                <div className="text-xs opacity-70">Upload</div>
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setLogo({ src: String(reader.result) });
                  reader.readAsDataURL(f);
                }} />
                <div className="flex gap-2 pt-1">
                  <Button variant="danger" size="sm" onClick={() => setLogo({ src: undefined })}>Delete Logo</Button>
                  <Button variant="subtle" size="sm" onClick={() => setLogo({ x: 0.5, y: 0.5 })}>Center</Button>
                </div>
                <div className="text-xs opacity-70 pt-1">Position</div>
                <div className="flex gap-2">
                  <input type="range" min={0} max={1} step={0.01} value={logo.x} onChange={(e) => setLogo({ x: Number(e.target.value) })} />
                  <input type="range" min={0} max={1} step={0.01} value={logo.y} onChange={(e) => setLogo({ y: Number(e.target.value) })} />
                </div>
                <div className="text-xs opacity-70">Scale</div>
                <input type="range" min={0.1} max={2} step={0.01} value={logo.scale} onChange={(e) => setLogo({ scale: Number(e.target.value) })} />
                <div className="text-xs opacity-70">Opacity</div>
                <input type="range" min={0} max={1} step={0.01} value={logo.opacity} onChange={(e) => setLogo({ opacity: Number(e.target.value) })} />
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="md">Background</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="min-w-64 bg-neutral-900 text-neutral-100 border border-white/10 rounded p-2 space-y-2">
                <div className="text-xs opacity-70">Color</div>
                <input type="color" value={background.color} onChange={(e) => setBackground({ color: e.target.value })} />
                <div className="text-xs opacity-70 pt-1">Image</div>
                <input type="file" accept="image/*" onChange={(e) => {
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

            {isSignedIn ? (
              <>
                <ProfileMenu />
                <AuthUserButton />
              </>
            ) : (
              <AuthSignInButton />
            )}
          </div>
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-0 h-[calc(100vh-56px)]">
        <div className="relative">
          <div className="w-full h-full">
            <OptimizedCanvas width={1280} height={720} data={data} palette={palette} onCanvasReady={(c) => { canvasRef.current = c; }} paused={showPreview} />
          </div>
          {!hasInput && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">Load a file or use mic to start</div>
          )}
        </div>
        <aside className="border-l border-white/10 bg-black/30 h-[calc(100vh-56px)] overflow-y-auto">
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
