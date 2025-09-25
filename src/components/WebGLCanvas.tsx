import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { KaleidoStarTunnel } from '@/lib/render/webgl';
import { useAudioAnalyser } from '@/hooks/useAudioAnalyser';
import { getPalette } from '@/lib/palettes';

// Test the import
console.log('KaleidoStarTunnel imported:', KaleidoStarTunnel);

interface WebGLCanvasProps {
  width: number;
  height: number;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export default function WebGLCanvas({ width, height, className = '', onCanvasReady }: WebGLCanvasProps) {
  console.log('WebGLCanvas component rendered with props:', { width, height, className });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rendererInstanceRef = useRef<KaleidoStarTunnel | null>(null);
  const rafRef = useRef<number | null>(null);
  const { data } = useAudioAnalyser();

  const initWebGL = useCallback(() => {
    if (!canvasRef.current) return;
    
    console.log('Initializing WebGL Canvas...');

    // Create Three.js renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    console.log('WebGL renderer setup:', { width, height, canvasSize: { w: canvasRef.current.width, h: canvasRef.current.height } });
    
    rendererRef.current = renderer;

    // Create KaleidoStarTunnel renderer
    const kaleidoRenderer = new KaleidoStarTunnel({
      speed: 1.0,
      segments: 8,
      spike: 1.4,
      lineWidth: 0.008,
      hue: 0.5,
    });

    console.log('KaleidoStarTunnel created:', kaleidoRenderer);
    rendererInstanceRef.current = kaleidoRenderer;

    // Call onCanvasReady if provided
    if (onCanvasReady && canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }

    // Create dummy scene and camera for the render method
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const render = (time: number) => {
      if (!rendererRef.current || !rendererInstanceRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      
      // Convert audio data to the format expected by the WebGL renderer
      // Provide default values if data is not available
      const audioData = {
        low: data?.frequency ? data.frequency.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255) : 0,
        mid: data?.frequency ? data.frequency.slice(8, 32).reduce((a, b) => a + b, 0) / (24 * 255) : 0,
        high: data?.frequency ? data.frequency.slice(32, 64).reduce((a, b) => a + b, 0) / (32 * 255) : 0,
        rms: data?.rms || 0,
        frequency: data?.frequency || new Uint8Array(64),
        waveform: data?.waveform || new Uint8Array(256),
      };

             // Debug: log every 60 frames (once per second)
             if (Math.floor(time / 16.67) % 60 === 0) {
               console.log('WebGL rendering...', { time, audioData: !!audioData, low: audioData.low, mid: audioData.mid, high: audioData.high });
               console.log('Renderer instance:', !!rendererInstanceRef.current);
               console.log('Three.js renderer:', !!rendererRef.current);
             }

      // Render the kaleidoscope effect
      rendererInstanceRef.current.render(scene, camera, rendererRef.current, time * 0.001, audioData);

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
  }, [width, height, data]);

  useEffect(() => {
    initWebGL();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (rendererInstanceRef.current) {
        rendererInstanceRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [initWebGL]);

         // Handle resize
         useEffect(() => {
           if (rendererRef.current) {
             rendererRef.current.setSize(width, height);
             console.log('WebGL canvas resized:', { width, height });
           }
           if (rendererInstanceRef.current) {
             rendererInstanceRef.current.resize(width, height);
           }
         }, [width, height]);

  return (
    <div className="w-full h-full relative bg-red-500/20">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full block"
      />
      <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
        WebGL Canvas
      </div>
    </div>
  );
}
