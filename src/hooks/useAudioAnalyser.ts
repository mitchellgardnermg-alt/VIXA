"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AnalyserData = {
  freq: Uint8Array;
  wave: Uint8Array;
  rms: number;
};

export function useAudioAnalyser(bufferSize: number = 2048, fftSize: number = 1024) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaElRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInput, setHasInput] = useState(false);

  const freqData = useMemo(() => new Uint8Array(fftSize / 2), [fftSize]);
  const waveData = useMemo(() => new Uint8Array(fftSize), [fftSize]);

  const ensureContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: "interactive" });
      console.log('Audio context created, state:', audioCtxRef.current.state);
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
      console.log('Audio context resumed, new state:', audioCtxRef.current.state);
    }
    if (!analyserRef.current) {
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      console.log('Analyser created with fftSize:', fftSize);
    }
    if (!mediaStreamDestRef.current) {
      mediaStreamDestRef.current = audioCtxRef.current.createMediaStreamDestination();
      console.log('Media stream destination created');
    }
    return audioCtxRef.current;
  }, [fftSize]);

  const stopCurrentSource = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (sourceRef.current) {
      try {
        // @ts-ignore - both have disconnect
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    try {
      if (mediaElRef.current) {
        mediaElRef.current.pause();
        mediaElRef.current.srcObject = null;
        mediaElRef.current.src = "";
        // Create a new audio element to avoid reuse issues
        mediaElRef.current = null;
      }
    } catch {}
    setIsPlaying(false);
    setHasInput(false);
  }, []);

  const startLoop = useCallback(() => {
    let frameCount = 0;
    const tick = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(waveData);
        
        // Debug logging every 60 frames (once per second)
        frameCount++;
        if (frameCount % 60 === 0) {
          const freqSum = freqData.reduce((a, b) => a + b, 0);
          const waveSum = waveData.reduce((a, b) => a + Math.abs(b - 128), 0);
          console.log('Audio analysis:', {
            freqSum,
            waveSum,
            freqLength: freqData.length,
            waveLength: waveData.length,
            analyserState: analyser.context.state,
            hasInput: hasInput,
            isPlaying: isPlaying
          });
        }
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
  }, [freqData, waveData, hasInput, isPlaying]);

  const attachToDestination = useCallback((node: AudioNode) => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    node.connect(analyser);
    // Mirror output to both speakers and recording destination
    analyser.connect(audioCtxRef.current!.destination);
    if (mediaStreamDestRef.current) {
      analyser.connect(mediaStreamDestRef.current);
    }
  }, []);

      const playFile = useCallback(
        async (file: File) => {
          try {
             // Validate file type and size
             if (!file.type.startsWith('audio/')) {
               throw new Error(`Invalid file type: ${file.type}. Please select an audio file.`);
             }
             
             // Check file size (limit to 50MB to prevent memory issues)
             if (file.size > 50 * 1024 * 1024) {
               throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Please use files under 50MB.`);
             }
             
             // Check if browser supports the file type
             const audio = new Audio();
             const canPlay = audio.canPlayType(file.type);
             if (canPlay === '') {
               console.warn(`Browser may not support file type: ${file.type}`);
             }
            
            console.log('Loading audio file:', { name: file.name, type: file.type, size: file.size });
            
            await ensureContext();
            stopCurrentSource();

            // Always create a new audio element to avoid reuse issues
            mediaElRef.current = new Audio();
            // Only set crossOrigin for remote URLs, not local files
            if (!file.name.startsWith('blob:')) {
              mediaElRef.current.crossOrigin = "anonymous";
            }
            mediaElRef.current.preload = "auto";
        
        // Set up event listeners
        mediaElRef.current.addEventListener('loadeddata', () => {
          console.log('Audio loaded successfully');
        });
        
        mediaElRef.current.addEventListener('error', (e) => {
          const audioEl = mediaElRef.current;
          const errorDetails = {
            event: e,
            errorCode: audioEl?.error?.code,
            errorMessage: audioEl?.error?.message,
            networkState: audioEl?.networkState,
            readyState: audioEl?.readyState,
            src: audioEl?.src,
            fileType: file.type,
            fileSize: file.size,
            fileName: file.name,
            canPlayTypes: {
              mp3: Audio.canPlayType('audio/mpeg'),
              mp4: Audio.canPlayType('audio/mp4'),
              wav: Audio.canPlayType('audio/wav'),
              ogg: Audio.canPlayType('audio/ogg')
            }
          };
          
          console.error('Audio playback error:', errorDetails);
          
          // Provide user-friendly error messages
          if (audioEl?.error) {
            switch (audioEl.error.code) {
              case 1:
                console.error('MEDIA_ERR_ABORTED: Audio loading was aborted');
                break;
              case 2:
                console.error('MEDIA_ERR_NETWORK: Network error occurred while loading audio');
                break;
              case 3:
                console.error('MEDIA_ERR_DECODE: Audio file is corrupted or unsupported format');
                break;
              case 4:
                console.error('MEDIA_ERR_SRC_NOT_SUPPORTED: Audio format not supported by browser');
                break;
              default:
                console.error('Unknown audio error:', audioEl.error.code);
            }
          }
          
          // Reset audio state on error
          setIsPlaying(false);
          setHasInput(false);
        });

        mediaElRef.current.src = URL.createObjectURL(file);
        
        // Wait for the audio to be ready with timeout
        await new Promise((resolve, reject) => {
          if (!mediaElRef.current) return reject(new Error('No audio element'));
          
          let resolved = false;
          
          const cleanup = () => {
            mediaElRef.current?.removeEventListener('canplay', timeoutOnCanPlay);
            mediaElRef.current?.removeEventListener('error', timeoutOnError);
          };
          
          const onCanPlay = () => {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve(void 0);
          };
          
          const onError = (e: Event) => {
            if (resolved) return;
            resolved = true;
            cleanup();
            console.error('Audio load error:', e);
            console.error('Audio element state:', {
              error: mediaElRef.current?.error,
              networkState: mediaElRef.current?.networkState,
              readyState: mediaElRef.current?.readyState
            });
            reject(new Error(`Audio failed to load: ${mediaElRef.current?.error?.message || 'Unknown error'}`));
          };
          
          // Set timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (resolved) return;
            resolved = true;
            cleanup();
            reject(new Error('Audio loading timeout - file may be corrupted or unsupported'));
          }, 10000); // 10 second timeout
          
          const timeoutOnCanPlay = () => {
            clearTimeout(timeout);
            onCanPlay();
          };
          
          const timeoutOnError = (e: Event) => {
            clearTimeout(timeout);
            onError(e);
          };
          
          mediaElRef.current.addEventListener('canplay', timeoutOnCanPlay);
          mediaElRef.current.addEventListener('error', timeoutOnError);
          
          // Load the audio
          mediaElRef.current.load();
        });

        // Play the audio
        await mediaElRef.current.play();
        console.log('Audio playback started');

        const ctx = audioCtxRef.current!;
        const src = ctx.createMediaElementSource(mediaElRef.current);
        sourceRef.current = src;
        attachToDestination(src);
        console.log('Audio source connected to analyser');
        
        startLoop();
        setIsPlaying(true);
        setHasInput(true);
        console.log('Audio analysis started');
           } catch (error) {
             console.error('Error playing file:', error);
             setIsPlaying(false);
             setHasInput(false);
             
             // Clean up on error
             if (mediaElRef.current) {
               mediaElRef.current.src = '';
               mediaElRef.current.load();
             }
             
             // Provide user feedback
             if (error instanceof Error) {
               console.error('Audio error details:', error.message);
             }
           }
    },
    [attachToDestination, ensureContext, startLoop, stopCurrentSource]
  );

  const playMic = useCallback(async () => {
    await ensureContext();
    stopCurrentSource();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false }, video: false });
    const ctx = audioCtxRef.current!;
    const src = ctx.createMediaStreamSource(stream);
    sourceRef.current = src;
    attachToDestination(src);
    startLoop();
    setIsPlaying(true);
    setHasInput(true);
  }, [attachToDestination, ensureContext, startLoop, stopCurrentSource]);

  const pause = useCallback(() => {
    if (mediaElRef.current) {
      mediaElRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const resume = useCallback(async () => {
    await ensureContext();
    if (mediaElRef.current) {
      await mediaElRef.current.play();
    }
    setIsPlaying(true);
  }, [ensureContext]);

  useEffect(() => {
    return () => {
      stopCurrentSource();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stopCurrentSource]);

  const data: AnalyserData = useMemo(() => {
    // Expose live views into freq/wave arrays
    let sumSquares = 0;
    for (let i = 0; i < waveData.length; i++) {
      const v = (waveData[i] - 128) / 128;
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / waveData.length);
    return { freq: freqData, wave: waveData, rms };
  }, [freqData, waveData]);

  return {
    isPlaying,
    hasInput,
    data,
    playFile,
    playMic,
    pause,
    resume,
    mediaElRef,
    bufferSize,
    getOutputStream: () => mediaStreamDestRef.current?.stream ?? null,
  } as const;
}


