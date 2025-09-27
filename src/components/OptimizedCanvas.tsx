"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getPalette } from "@/lib/palettes";
import WebGLCanvas from "./WebGLCanvas";

export type VisualProps = {
  width?: number;
  height?: number;
  data: { freq: Uint8Array; wave: Uint8Array; rms: number };
  palette?: string[];
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  paused?: boolean;
};

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

export function OptimizedCanvas({ width = 1280, height = 720, data, palette = ["#0B0F14", "#10B981", "#22D3EE", "#60A5FA"], onCanvasReady, paused = false }: VisualProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layers = useAppStore((s) => s.layers);
  const logo = useAppStore((s) => s.logo);
  const colors = useMemo(() => palette, [palette]);
  const background = useAppStore((s) => s.background);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Notify parent when canvas mounts (for recording)
    if (onCanvasReady) onCanvasReady(canvas);
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      // Don't render if paused
      if (paused) {
        raf = requestAnimationFrame(render);
        return;
      }

      const { freq, wave, rms } = data;
      const w = canvas.width;
      const h = canvas.height;

      // Background color
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = background.color || colors[0] || "#0B0F14";
      ctx.fillRect(0, 0, w, h);

      // Background image (no re-create each frame)
      if (background.src) {
        const img = new Image();
        img.src = background.src;
        const drawBg = () => {
          const bw = img.width;
          const bh = img.height;
          if (bw && bh) {
            let dw = w, dh = h;
            if (background.fit === "contain") {
              const scale = Math.min(w / bw, h / bh);
              dw = bw * scale; dh = bh * scale;
            } else if (background.fit === "cover") {
              const scale = Math.max(w / bw, h / bh);
              dw = bw * scale; dh = bh * scale;
            } else {
              dw = w; dh = h; // stretch
            }
            const dx = (w - dw) / 2;
            const dy = (h - dh) / 2;
            ctx.globalAlpha = Math.max(0, Math.min(1, background.opacity));
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.globalAlpha = 1;
          }
        };
        if (img.complete) drawBg(); else img.onload = drawBg;
      }

      // Render layers in order
      for (const layer of layers) {
        if (layer.visible === false) continue;
        if (layer.opacity <= 0) continue;
        const pal = getPalette(layer.paletteId).colors;
        const baseOpacity = Math.max(0, Math.min(1, layer.opacity));
        ctx.globalAlpha = baseOpacity;
        switch (layer.blend) {
          case "add": ctx.globalCompositeOperation = "lighter"; break;
          case "multiply": ctx.globalCompositeOperation = "multiply"; break;
          case "screen": ctx.globalCompositeOperation = "screen"; break;
          default: ctx.globalCompositeOperation = "source-over"; break;
        }

        // Apply mirror transformations if enabled
        if (layer.mirrored || layer.mirroredVertical) {
          ctx.save();
          if (layer.mirrored && layer.mirroredVertical) {
            // Both horizontal and vertical mirror
            ctx.scale(-1, -1);
            ctx.translate(-w, -h);
          } else if (layer.mirrored) {
            // Horizontal mirror only
            ctx.scale(-1, 1);
            ctx.translate(-w, 0);
          } else if (layer.mirroredVertical) {
            // Vertical mirror only
            ctx.scale(1, -1);
            ctx.translate(0, -h);
          }
        }

        if (layer.mode === "bars") {
          // Adjust bar count based on aspect ratio
          const aspectRatio = w / h;
          const barCount = aspectRatio > 1.5 ? 128 : aspectRatio < 0.8 ? 64 : 96;
          const binSize = Math.floor(freq.length / barCount) || 1;
          const barWidth = w / barCount;
          for (let i = 0; i < barCount; i++) {
            let sum = 0;
            for (let j = 0; j < binSize; j++) sum += freq[i * binSize + j] || 0;
            const v = sum / (binSize * 255);
            const barH = v * (h * 0.6);
            ctx.fillStyle = pick(pal, 1 + (i % (pal.length - 1)));
            ctx.fillRect(i * barWidth, h - barH, barWidth - 1, barH);
          }
        } else if (layer.mode === "waveform") {
          // Adjust line width based on aspect ratio
          const aspectRatio = w / h;
          ctx.lineWidth = aspectRatio > 1.5 ? 3 : aspectRatio < 0.8 ? 1.5 : 2;
          ctx.strokeStyle = pick(pal, 2);
          ctx.beginPath();
          for (let x = 0; x < w; x++) {
            const idx = Math.floor((x / w) * wave.length);
            const y = ((wave[idx] - 128) / 128) * 0.4 * h + h * 0.5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        } else if (layer.mode === "radial") {
          const cx = w * 0.5;
          const cy = h * 0.5;
          const aspectRatio = w / h;
          const radius = Math.min(w, h) * (aspectRatio > 1.5 ? 0.25 : aspectRatio < 0.8 ? 0.45 : 0.35);
          const N = aspectRatio > 1.5 ? 160 : aspectRatio < 0.8 ? 80 : 120;
          const step = Math.max(1, Math.floor(freq.length / N));
          for (let i = 0; i < N; i++) {
            const v = (freq[i * step] ?? 0) / 255;
            const a0 = (i / N) * Math.PI * 2;
            const a1 = ((i + 1) / N) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.fillStyle = pick(pal, 1 + (i % (pal.length - 1)));
            ctx.arc(cx, cy, radius * (0.4 + v * 0.9), a0, a1);
            ctx.closePath();
            ctx.fill();
          }
        } else if (layer.mode === "mirror-eq") {
          // Adjust bar count based on aspect ratio
          const aspectRatio = w / h;
          const barCount = aspectRatio > 1.5 ? 80 : aspectRatio < 0.8 ? 40 : 64;
          const binSize = Math.floor(freq.length / barCount) || 1;
          const barWidth = (w / 2) / barCount;
          for (let i = 0; i < barCount; i++) {
            let sum = 0; for (let j = 0; j < binSize; j++) sum += freq[i * binSize + j] || 0;
            const v = sum / (binSize * 255);
            const barH = v * (h * 0.45);
            ctx.fillStyle = pick(pal, 1 + (i % (pal.length - 1)));
            // left
            ctx.fillRect((w * 0.5) - (i + 1) * barWidth, (h * 0.5) - barH, barWidth - 1, barH * 2);
            // right
            ctx.fillRect((w * 0.5) + i * barWidth, (h * 0.5) - barH, barWidth - 1, barH * 2);
          }
        } else if (layer.mode === "peak-bars") {
          // Adjust bar count based on aspect ratio
          const aspectRatio = w / h;
          const barCount = aspectRatio > 1.5 ? 128 : aspectRatio < 0.8 ? 64 : 96;
          const binSize = Math.floor(freq.length / barCount) || 1;
          const barWidth = w / barCount;
          for (let i = 0; i < barCount; i++) {
            let peak = 0; for (let j = 0; j < binSize; j++) peak = Math.max(peak, freq[i * binSize + j] || 0);
            const v = peak / 255;
            const barH = v * (h * 0.6);
            ctx.fillStyle = pick(pal, 1 + (i % (pal.length - 1)));
            ctx.fillRect(i * barWidth, h - barH, barWidth - 1, barH);
          }
        } else if (layer.mode === "sparkline") {
          // mini history graph top-left
          ctx.globalAlpha = layer.opacity * 0.9;
          ctx.strokeStyle = pick(pal, 2);
          const aspectRatio = w / h;
          ctx.lineWidth = aspectRatio > 1.5 ? 2 : aspectRatio < 0.8 ? 1 : 1.5;
          const ww = Math.min(240, w * 0.3), hh = Math.min(80, h * 0.2);
          ctx.strokeRect(12, 12, ww, hh);
          ctx.beginPath();
          for (let x = 0; x < ww; x++) {
            const idx = Math.floor((x / ww) * wave.length);
            const y = 12 + (hh / 2) + ((wave[idx] - 128) / 128) * (hh * 0.45);
            if (x === 0) ctx.moveTo(12, y); else ctx.lineTo(12 + x, y);
          }
          ctx.stroke();
        } else if (layer.mode === "rings") {
          const cx = w * 0.5, cy = h * 0.5;
          const aspectRatio = w / h;
          ctx.lineWidth = aspectRatio > 1.5 ? 3 : aspectRatio < 0.8 ? 1.5 : 2;
          const ringCount = aspectRatio > 1.5 ? 8 : aspectRatio < 0.8 ? 4 : 6;
          for (let i = 0; i < ringCount; i++) {
            const idx = Math.floor((i / ringCount) * freq.length);
            const v = (freq[idx] ?? 0) / 255;
            ctx.strokeStyle = pick(pal, 1 + i);
            ctx.beginPath();
            ctx.arc(cx, cy, (Math.min(w, h) * 0.12) * (i + 1) * (0.8 + v * 0.6), 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (layer.mode === "lissajous") {
          // XY scope approximation from stereo proxy (use waveform)
          const cx = w * 0.5, cy = h * 0.5;
          const aspectRatio = w / h;
          const scale = Math.min(w, h) * (aspectRatio > 1.5 ? 0.25 : aspectRatio < 0.8 ? 0.45 : 0.35);
          ctx.strokeStyle = pick(pal, 2);
          ctx.globalAlpha = layer.opacity * 0.85;
          ctx.beginPath();
          const len = wave.length;
          for (let i = 0; i < len; i++) {
            const a = wave[i] - 128;
            const b = wave[(i + (len >> 2)) % len] - 128; // phase shifted
            const x = cx + (a / 128) * scale * 0.8;
            const y = cy + (b / 128) * scale * 0.8;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        } else if (layer.mode === "snake") {
          // Grid squares that light up randomly with music colors
          const gridSize = 32; // Fixed grid size for consistent squares
          const cols = Math.floor(w / gridSize);
          const rows = Math.floor(h / gridSize);
          
          // Draw grid lines (subtle)
          ctx.strokeStyle = pick(pal, 0);
          ctx.globalAlpha = 0.15;
          ctx.lineWidth = 1;
          for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0);
            ctx.lineTo(x * gridSize, h);
            ctx.stroke();
          }
          for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * gridSize);
            ctx.lineTo(w, y * gridSize);
            ctx.stroke();
          }
          
          // Light up random squares based on music
          const maxActiveSquares = Math.min(50, Math.floor(rms * cols * rows * 0.4)); // Maximum squares to light up
          const time = performance.now() * 0.001;
          
          // Create a set to track used positions to avoid duplicates
          const usedPositions = new Set<string>();
          
          for (let i = 0; i < maxActiveSquares; i++) {
            // Generate random position with better distribution
            let col, row;
            let attempts = 0;
            
            do {
              // Use different seeds for x and y to get better distribution
              const seedX = Math.sin(time * 2 + i * 0.1 + attempts * 0.01);
              const seedY = Math.cos(time * 1.5 + i * 0.07 + attempts * 0.015);
              col = Math.floor((seedX + 1) * 0.5 * cols);
              row = Math.floor((seedY + 1) * 0.5 * rows);
              attempts++;
            } while (usedPositions.has(`${col},${row}`) && attempts < 10);
            
            // Add to used positions
            usedPositions.add(`${col},${row}`);
            
            // Get frequency data for this square's position
            const freqIndex = Math.floor(((row * cols + col) / (cols * rows)) * freq.length);
            const intensity = (freq[freqIndex] ?? 0) / 255;
            
            // Light up squares based on both RMS and frequency intensity
            const shouldLightUp = intensity > 0.05 || (rms > 0.1 && Math.random() < 0.3);
            
            if (shouldLightUp) {
              const x = col * gridSize;
              const y = row * gridSize;
              const size = gridSize * (0.7 + intensity * 0.3); // Size varies with intensity
              const offset = (gridSize - size) / 2;
              
              // Choose color based on frequency and position
              const colorIndex = 1 + ((col + row + Math.floor(intensity * 10)) % (pal.length - 1));
              ctx.fillStyle = pick(pal, colorIndex);
              ctx.globalAlpha = layer.opacity * (0.6 + intensity * 0.4);
              
              ctx.fillRect(x + offset, y + offset, size, size);
            }
          }
        } else if (layer.mode === "grid") {
          // Disco dancefloor flashing grid
          const gridSize = 24; // Smaller squares for more disco effect
          const cols = Math.floor(w / gridSize);
          const rows = Math.floor(h / gridSize);
          
          // Draw subtle grid lines
          ctx.strokeStyle = pick(pal, 0);
          ctx.globalAlpha = layer.opacity * 0.1;
          ctx.lineWidth = 1;
          for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0);
            ctx.lineTo(x * gridSize, h);
            ctx.stroke();
          }
          for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * gridSize);
            ctx.lineTo(w, y * gridSize);
            ctx.stroke();
          }
          
          // Flash squares based on music
          const time = performance.now() * 0.001;
          const beatThreshold = 0.15; // Minimum RMS to trigger flashing
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              // Get frequency data for this position
              const freqIndex = Math.floor(((row * cols + col) / (cols * rows)) * freq.length);
              const intensity = (freq[freqIndex] ?? 0) / 255;
              
              // Flash based on beat and frequency
              const shouldFlash = rms > beatThreshold && (
                intensity > 0.2 || // High frequency activity
                (rms > 0.3 && Math.random() < 0.4) || // Random flashing on strong beat
                (time * 4 + row + col) % 1 < 0.1 // Strobe effect
              );
              
              if (shouldFlash) {
                const x = col * gridSize;
                const y = row * gridSize;
                
                // Choose color based on position and intensity
                const colorIndex = 1 + ((col + row + Math.floor(intensity * 5)) % (pal.length - 1));
                ctx.fillStyle = pick(pal, colorIndex);
                
                // Flash intensity based on music
                ctx.globalAlpha = layer.opacity * (0.8 + intensity * 0.2);
                
                // Draw the flashing square
                ctx.fillRect(x, y, gridSize, gridSize);
              }
            }
          }
        } else if (layer.mode === "radar") {
          // Radar sweep using waveform
          const cx = w * 0.5, cy = h * 0.5;
          const radius = Math.min(w, h) * 0.45;
          ctx.strokeStyle = pick(pal, 3);
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
          const t = performance.now() * 0.001;
          const angle = (t % (Math.PI * 2));
          const sweep = Math.PI / 12;
          const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
          grad.addColorStop(0, pick(pal, 3) + "00");
          grad.addColorStop(1, pick(pal, 3) + "88");
          ctx.fillStyle = grad as any;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, radius, angle - sweep, angle + sweep);
          ctx.closePath();
          ctx.fill();
        } else if (layer.mode === "city-eq") {
          // Skyline style bars
          const N = 72;
          const step = Math.floor(freq.length / N) || 1;
          const colW = w / N;
          for (let i = 0; i < N; i++) {
            let sum = 0; for (let j = 0; j < step; j++) sum += freq[i * step + j] || 0;
            const v = sum / (step * 255);
            const hgt = v * (h * 0.8);
            const bw = Math.max(2, colW * 0.6);
            const x = i * colW + (colW - bw) / 2;
            ctx.fillStyle = pick(pal, 1 + (i % (pal.length - 1)));
            ctx.fillRect(x, h - hgt, bw, hgt);
          }
        } else if (layer.mode === "led-matrix") {
          // Low-res dot matrix
          const cols = 64, rows = 36;
          const cw = w / cols, rh = h / rows;
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const idx = Math.floor(((y * cols + x) / (cols * rows)) * freq.length);
              const v = (freq[idx] ?? 0) / 255;
              if (v < 0.1) continue;
              ctx.fillStyle = pick(pal, 1 + ((x + y) % (pal.length - 1)));
              const s = Math.min(cw, rh) * v * 0.9;
              ctx.beginPath();
              ctx.arc(x * cw + cw / 2, y * rh + rh / 2, s / 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (layer.mode === "blob") {
          // Radial blob using rms
          const cx = w * 0.5, cy = h * 0.5;
          const base = Math.min(w, h) * 0.28;
          ctx.fillStyle = pick(pal, 2);
          ctx.globalAlpha = layer.opacity * 0.75;
          ctx.beginPath();
          const N = 180; const step = Math.floor(freq.length / N) || 1;
          for (let i = 0; i <= N; i++) {
            const v = (freq[i * step] ?? 0) / 255;
            const r = base * (1 + v * 0.6);
            const a = (i / N) * Math.PI * 2;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath(); ctx.fill();
        } else if (false && layer.mode === "kaleido-tunnel") {
          // Kaleidoscope Star Tunnel - Canvas 2D implementation
          const time = performance.now() * 0.001;
          const centerX = w / 2;
          const centerY = h / 2;
          const maxRadius = Math.min(w, h) * 0.5;
          
          // Audio-reactive parameters (mapped like WebGL shader)
          const lowFreq = freq.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255); // u_low
          const midFreq = freq.slice(8, 32).reduce((a, b) => a + b, 0) / (24 * 255); // u_mid
          const highFreq = freq.slice(32, 64).reduce((a, b) => a + b, 0) / (32 * 255); // u_high
          
          const speed = 1.0 + lowFreq * 2; // u_low -> zoom speed
          const segments = 8;
          const spike = 1.4 + midFreq * 0.8; // u_mid -> spike amount
          const glow = 0.5 + highFreq * 0.5; // u_high -> glow
          
          // Tunnel depth effect
          const tunnelDepth = (time * speed) % 2;
          
          // Draw multiple tunnel layers for depth
          for (let layerDepth = 0; layerDepth < 5; layerDepth++) {
            const depth = tunnelDepth + layerDepth * 0.4;
            const radius = maxRadius * (1 - depth * 0.3);
            const opacity = (1 - depth) * 0.8;
            
            if (radius <= 0) continue;
            
            // Kaleidoscope segments
            const segmentAngle = (Math.PI * 2) / segments;
            
            for (let seg = 0; seg < segments; seg++) {
              const startAngle = seg * segmentAngle;
              
              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.rotate(startAngle);
              
              // Star shell effect
              const starPoints = 8;
              const starRadius = radius * 0.8;
              const spikeLength = starRadius * spike * 0.2;
              
              ctx.beginPath();
              for (let i = 0; i < starPoints * 2; i++) {
                const angle = (i / (starPoints * 2)) * Math.PI * 2;
                const r = i % 2 === 0 ? starRadius : starRadius - spikeLength;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                
                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              }
              ctx.closePath();
              
              // Gradient for star shell
              const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, starRadius);
              gradient.addColorStop(0, pick(pal, 1 + seg));
              gradient.addColorStop(0.7, pick(pal, 2 + seg));
              gradient.addColorStop(1, "transparent");
              
              ctx.fillStyle = gradient;
              ctx.globalAlpha = layer.opacity * opacity * glow;
              ctx.fill();
              
              // Wireframe effect
              ctx.strokeStyle = pick(pal, 0);
              ctx.lineWidth = 2;
              ctx.globalAlpha = layer.opacity * opacity * 0.3;
              ctx.stroke();
              
              // Mirror the segment for kaleidoscope effect
              ctx.scale(-1, 1);
              
              // Draw mirrored star
              ctx.beginPath();
              for (let i = 0; i < starPoints * 2; i++) {
                const angle = (i / (starPoints * 2)) * Math.PI * 2;
                const r = i % 2 === 0 ? starRadius : starRadius - spikeLength;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                
                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              }
              ctx.closePath();
              
              ctx.fillStyle = gradient;
              ctx.globalAlpha = layer.opacity * opacity * glow * 0.7;
              ctx.fill();
              
              ctx.restore();
            }
          }
          
          // Add central glow
          const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 0.3);
          centerGradient.addColorStop(0, pick(pal, 0));
          centerGradient.addColorStop(1, "transparent");
          
          ctx.fillStyle = centerGradient;
          ctx.globalAlpha = layer.opacity * glow * 0.5;
          ctx.fillRect(0, 0, w, h);
        } else if (false && layer.mode === "mandelbulb") {
          // Mandelbulb Fractal - Canvas 2D implementation
          const time = performance.now() * 0.001;
          const centerX = w / 2;
          const centerY = h / 2;
          const maxRadius = Math.min(w, h) * 0.6;
          
          // Audio-reactive parameters (mapped like WebGL shader)
          const lowFreq = freq.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255); // u_low
          const midFreq = freq.slice(8, 32).reduce((a, b) => a + b, 0) / (24 * 255); // u_mid
          const highFreq = freq.slice(32, 64).reduce((a, b) => a + b, 0) / (32 * 255); // u_high
          
          // Mandelbulb parameters
          const iterations = Math.max(8, Math.min(16, 12 + midFreq * 4)); // u_mid -> iterations
          const power = 8.0;
          const gain = 1.0;
          const fog = 0.8;
          const rotate = 0.3 + highFreq * 0.4; // u_high -> camera roll
          const forwardSpeed = 1.0 + lowFreq * 2; // u_low -> forward speed
          
          // Camera orbit parameters
          const orbitRadius = 3.0;
          const orbitSpeed = time * 0.1;
          const camX = Math.cos(orbitSpeed + highFreq * 2) * orbitRadius;
          const camY = Math.sin(orbitSpeed + highFreq * 1.5) * orbitRadius * 0.5;
          const camZ = 2.0 + Math.sin(time * forwardSpeed * 0.5) * 1.0;
          
          // Tri-tone neon palette (jade/cyan/violet)
          const neonPalette = [
            [0, 255, 150], // Jade
            [0, 255, 255], // Cyan  
            [150, 0, 255], // Violet
          ];
          
          // Create gradient for fog effect
          const fogGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
          fogGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          fogGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
          fogGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
          
          // Draw Mandelbulb fractal
          const imageData = ctx.createImageData(w, h);
          const data = imageData.data;
          
          // Simplified raymarching simulation
          for (let y = 0; y < h; y += 2) { // Skip pixels for performance
            for (let x = 0; x < w; x += 2) {
              // Convert screen coordinates to normalized coordinates
              const nx = (x - centerX) / maxRadius;
              const ny = (y - centerY) / maxRadius;
              
              // Ray direction (simplified 3D projection)
              const rayX = nx * 2.0;
              const rayY = ny * 2.0;
              const rayZ = 1.0;
              
              // Mandelbulb distance estimation (simplified)
              let px = rayX + camX * 0.1;
              let py = rayY + camY * 0.1;
              let pz = rayZ + camZ * 0.1;
              
              let distance = 0;
              let iterationsUsed = 0;
              
              for (let i = 0; i < iterations; i++) {
                const r = Math.sqrt(px * px + py * py + pz * pz);
                if (r > 2.0) break;
                
                const theta = Math.acos(pz / r);
                const phi = Math.atan2(py, px);
                
                const newR = Math.pow(r, power);
                const newTheta = theta * power;
                const newPhi = phi * power;
                
                px = newR * Math.sin(newTheta) * Math.cos(newPhi) + rayX;
                py = newR * Math.sin(newTheta) * Math.sin(newPhi) + rayY;
                pz = newR * Math.cos(newTheta) + rayZ;
                
                distance += newR;
                iterationsUsed = i;
              }
              
              // Color based on iterations and distance
              const normalizedIter = iterationsUsed / iterations;
              const normalizedDist = Math.min(1, distance / 10);
              
              // Select color from neon palette based on iterations
              const colorIndex = Math.floor(normalizedIter * neonPalette.length);
              const color = neonPalette[Math.min(colorIndex, neonPalette.length - 1)];
              
              // Apply fog and audio reactivity
              const fogFactor = Math.exp(-normalizedDist * fog);
              const audioIntensity = 0.3 + (lowFreq + midFreq + highFreq) * 0.7;
              const intensity = fogFactor * audioIntensity * layer.opacity;
              
              // Set pixel color (RGBA)
              const pixelIndex = (y * w + x) * 4;
              data[pixelIndex] = color[0] * intensity;     // R
              data[pixelIndex + 1] = color[1] * intensity; // G
              data[pixelIndex + 2] = color[2] * intensity; // B
              data[pixelIndex + 3] = 255;                  // A
              
              // Fill 2x2 block for better performance
              if (x + 1 < w && y + 1 < h) {
                const indices = [
                  ((y + 1) * w + x) * 4,
                  (y * w + (x + 1)) * 4,
                  ((y + 1) * w + (x + 1)) * 4
                ];
                indices.forEach(idx => {
                  data[idx] = color[0] * intensity;
                  data[idx + 1] = color[1] * intensity;
                  data[idx + 2] = color[2] * intensity;
                  data[idx + 3] = 255;
                });
              }
            }
          }
          
          // Draw the fractal
          ctx.putImageData(imageData, 0, 0);
          
          // Add soft shadows and exponential fog
          ctx.fillStyle = fogGradient;
          ctx.globalAlpha = layer.opacity * 0.6;
          ctx.fillRect(0, 0, w, h);
          
          // Add subtle camera roll effect
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rotate * Math.sin(time * 0.5) * 0.1);
          ctx.globalAlpha = layer.opacity * 0.3;
          
          // Draw some additional fractal details
          for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + time * 0.5;
            const radius = maxRadius * 0.3 + Math.sin(time + i) * 20;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
            gradient.addColorStop(0, `rgba(${neonPalette[i % 3].join(',')}, 0.8)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
        } else if (false && layer.mode === "metaball-tunnel") {
          // Metaball Tunnel - 3D Geometric Canvas 2D implementation
          console.log('Rendering metaball-tunnel mode', { w, h, freq: freq.slice(0, 5) });
          const time = performance.now() * 0.001;
          const centerX = w / 2;
          const centerY = h / 2;
          const maxRadius = Math.min(w, h) * 0.6;
          
          // Audio-reactive parameters
          const lowFreq = freq.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255);
          const midFreq = freq.slice(8, 32).reduce((a, b) => a + b, 0) / (24 * 255);
          const highFreq = freq.slice(32, 64).reduce((a, b) => a + b, 0) / (32 * 255);
          
          // 3D tunnel parameters
          const tunnelDepth = 15;
          const ringRadius = maxRadius * 0.35;
          const ballsPerRing = 8;
          const spikeAmp = 0.8 + highFreq * 1.2;
          const speed = 1.0 + lowFreq * 1.5;
          
          // Clear with dark background
          ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
          ctx.fillRect(0, 0, w, h);
          
          // Draw simple visible metaballs first
          console.log('Audio data:', { lowFreq, midFreq, highFreq });
          
          // Draw multiple rings of metaballs for tunnel effect
          const numRings = 6;
          const orbsPerRing = 12;
          
          for (let ring = 0; ring < numRings; ring++) {
            const ringDepth = ring / numRings;
            const currentRingRadius = ringRadius * (0.3 + ringDepth * 0.7);
            const ringAlpha = 1 - ringDepth * 0.3;
            
            for (let i = 0; i < orbsPerRing; i++) {
              const angle = (i / orbsPerRing) * Math.PI * 2 + time * 0.5 + ring * 0.3;
              const radius = currentRingRadius + Math.sin(time * 2 + i + ring) * 15;
              
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              
              // Use selected palette color
              const colorIndex = (i + ring) % pal.length;
              const baseColor = pick(pal, colorIndex);
              
              // Parse hex color to RGB
              const hex = baseColor.replace('#', '');
              const r = parseInt(hex.substr(0, 2), 16);
              const g = parseInt(hex.substr(2, 2), 16);
              const b = parseInt(hex.substr(4, 2), 16);
              
              // Add audio-reactive brightness variation
              const brightness = 0.7 + midFreq * 0.3 + highFreq * 0.2;
              const finalR = Math.floor(r * brightness);
              const finalG = Math.floor(g * brightness);
              const finalB = Math.floor(b * brightness);
              
              // Size with audio reactivity and depth
              const baseSize = 20 + midFreq * 25 + highFreq * 15;
              const size = baseSize * (1 - ringDepth * 0.4);
              
              // Skip if too small
              if (size < 8) continue;
              
              // Draw solid circle
              ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${layer.opacity * ringAlpha})`;
              ctx.globalAlpha = 1;
              ctx.beginPath();
              ctx.arc(x, y, size, 0, Math.PI * 2);
              ctx.fill();
              
              // Add glow
              const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
              glowGradient.addColorStop(0, `rgba(${finalR}, ${finalG}, ${finalB}, 0.4)`);
              glowGradient.addColorStop(0.5, `rgba(${finalR}, ${finalG}, ${finalB}, 0.2)`);
              glowGradient.addColorStop(1, `rgba(${finalR}, ${finalG}, ${finalB}, 0)`);
              
              ctx.fillStyle = glowGradient;
              ctx.globalAlpha = layer.opacity * ringAlpha;
              ctx.beginPath();
              ctx.arc(x, y, size * 2, 0, Math.PI * 2);
              ctx.fill();
              
              // Add bright core
              const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.5);
              coreGradient.addColorStop(0, `rgba(255, 255, 255, 0.8)`);
              coreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
              
              ctx.fillStyle = coreGradient;
              ctx.globalAlpha = layer.opacity * ringAlpha * 0.6;
              ctx.beginPath();
              ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          // Add some floating orbs around the edges
          for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2 + time * 0.8;
            const radius = maxRadius * 0.8 + Math.sin(time * 1.5 + i) * 30;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Use palette colors for floating orbs
            const colorIndex = i % pal.length;
            const baseColor = pick(pal, colorIndex);
            
            // Parse hex color to RGB
            const hex = baseColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            // Add audio-reactive brightness
            const brightness = 0.8 + highFreq * 0.2;
            const color = [
              Math.floor(r * brightness),
              Math.floor(g * brightness),
              Math.floor(b * brightness)
            ];
            const size = 15 + Math.sin(time * 3 + i) * 8 + highFreq * 10;
            
            // Draw floating orb
            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${layer.opacity * 0.7})`;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
            glowGradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`);
            glowGradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
            
            ctx.fillStyle = glowGradient;
            ctx.globalAlpha = layer.opacity * 0.5;
            ctx.beginPath();
            ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Draw tunnel structure lines for 3D effect
          ctx.strokeStyle = `rgba(100, 150, 255, ${layer.opacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.globalCompositeOperation = "source-over";
          
          for (let depth = 0; depth < tunnelDepth; depth += 3) {
            const z = (depth - tunnelDepth / 2) * 0.4;
            const zOffset = time * speed * 1.5;
            const currentZ = z + zOffset;
            
            if (currentZ < -1.5) continue;
            
            const perspective = 1 / (1 + currentZ * 0.3);
            const ringScale = ringRadius * perspective;
            const alpha = Math.max(0, 1 - currentZ * 0.2) * layer.opacity * 0.5;
            
            ctx.globalAlpha = alpha;
            
            // Draw ring outline
            ctx.beginPath();
            for (let i = 0; i <= ballsPerRing; i++) {
              const angle = (i / ballsPerRing) * Math.PI * 2 + time * 0.3 + currentZ * 0.2;
              const x = centerX + Math.cos(angle) * ringScale;
              const y = centerY + Math.sin(angle) * ringScale;
              
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.stroke();
            
            // Draw radial lines
            for (let i = 0; i < ballsPerRing; i += 2) {
              const angle = (i / ballsPerRing) * Math.PI * 2 + time * 0.3 + currentZ * 0.2;
              const x = centerX + Math.cos(angle) * ringScale;
              const y = centerY + Math.sin(angle) * ringScale;
              
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.lineTo(x, y);
              ctx.stroke();
            }
          }
          
          // Add a simple test circle to ensure something is visible
          ctx.fillStyle = `rgba(255, 100, 100, ${layer.opacity})`;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
          ctx.fill();
          
          // Reset composite operation
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        } else if (false && layer.mode === "bouncing-orbs") {
          // Bouncing Orbs - Canvas 2D implementation with physics
          const time = performance.now() * 0.001;
          const centerX = w / 2;
          const centerY = h / 2;
          
          // Audio-reactive parameters
          const lowFreq = freq.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255);
          const midFreq = freq.slice(8, 32).reduce((a, b) => a + b, 0) / (24 * 255);
          const highFreq = freq.slice(32, 64).reduce((a, b) => a + b, 0) / (32 * 255);
          
          // Initialize orbs array if not exists
          if (!layer.orbs) {
            layer.orbs = [];
            const numOrbs = 20;
            for (let i = 0; i < numOrbs; i++) {
              layer.orbs.push({
                x: Math.random() * (w - 100) + 50, // Keep away from edges
                y: Math.random() * (h - 100) + 50,
                vx: (Math.random() - 0.5) * 6, // Faster initial velocity
                vy: (Math.random() - 0.5) * 6,
                size: 15 + Math.random() * 35,
                colorIndex: i % pal.length,
                bounce: 0.85 + Math.random() * 0.15, // Higher bounce
                gravity: 0.05 + Math.random() * 0.1, // Lighter gravity
                audioReact: true, // ALL orbs are audio-reactive
                minSize: 15 + Math.random() * 20,
                maxSize: 40 + Math.random() * 30
              });
            }
          }
          
          // Update and draw orbs
          layer.orbs.forEach((orb, index) => {
            // Apply gravity
            orb.vy += orb.gravity;
            
            // Subtle audio-reactive forces with randomness to prevent corner accumulation
            // Add some randomness to prevent all orbs moving in same direction
            const audioRandomness = Math.sin(time * 0.5 + index * 0.3) * 0.3;
            
            // Low freq affects vertical movement (gentle bass influence with randomness)
            orb.vy += (lowFreq - 0.5) * (0.8 + audioRandomness);
            // Mid freq affects horizontal movement (gentle mid influence with randomness)
            orb.vx += (midFreq - 0.5) * (0.6 + audioRandomness);
            // High freq affects size (treble makes orbs pulse)
            const targetSize = orb.minSize + (orb.maxSize - orb.minSize) * (0.4 + highFreq * 0.6);
            orb.size = orb.size * 0.95 + targetSize * 0.05;
            
            // Anti-corner behavior - push orbs away from corners
            const cornerThreshold = 100;
            const centerX = w / 2;
            const centerY = h / 2;
            
            // Calculate distance from center
            const distFromCenterX = orb.x - centerX;
            const distFromCenterY = orb.y - centerY;
            const distFromCenter = Math.sqrt(distFromCenterX * distFromCenterX + distFromCenterY * distFromCenterY);
            
            // If orb is too far from center (near corners), gently push it back
            if (distFromCenter > cornerThreshold) {
              const pushForce = 0.02;
              orb.vx -= (distFromCenterX / distFromCenter) * pushForce;
              orb.vy -= (distFromCenterY / distFromCenter) * pushForce;
            }
            
            // Update position
            orb.x += orb.vx;
            orb.y += orb.vy;
            
            // IMPROVED bouncing - ensure ALL orbs bounce
            let bounced = false;
            
            // Left/Right walls
            if (orb.x - orb.size <= 0) {
              orb.vx = Math.abs(orb.vx) * orb.bounce; // Ensure positive velocity
              orb.x = orb.size; // Keep inside bounds
              bounced = true;
            } else if (orb.x + orb.size >= w) {
              orb.vx = -Math.abs(orb.vx) * orb.bounce; // Ensure negative velocity
              orb.x = w - orb.size; // Keep inside bounds
              bounced = true;
            }
            
            // Top/Bottom walls
            if (orb.y - orb.size <= 0) {
              orb.vy = Math.abs(orb.vy) * orb.bounce; // Ensure positive velocity
              orb.y = orb.size; // Keep inside bounds
              bounced = true;
            } else if (orb.y + orb.size >= h) {
              orb.vy = -Math.abs(orb.vy) * orb.bounce; // Ensure negative velocity
              orb.y = h - orb.size; // Keep inside bounds
              bounced = true;
            }
            
            // Gentle audio-reactive bounce boost (only on strong beats)
            if (bounced && (lowFreq > 0.6 || midFreq > 0.6 || highFreq > 0.6)) {
              const boost = 1.0 + (lowFreq + midFreq + highFreq) * 0.1; // Much smaller boost
              orb.vx *= boost;
              orb.vy *= boost;
            }
            
            // Normal damping to prevent excessive movement
            orb.vx *= 0.998;
            orb.vy *= 0.998;
            
            // Ensure minimum velocity to prevent orbs from stopping (but not too high)
            const minVel = 0.3;
            if (Math.abs(orb.vx) < minVel && Math.abs(orb.vx) > 0.01) orb.vx = Math.sign(orb.vx) * minVel;
            if (Math.abs(orb.vy) < minVel && Math.abs(orb.vy) > 0.01) orb.vy = Math.sign(orb.vy) * minVel;
            
            // Get color from palette
            const baseColor = pick(pal, orb.colorIndex);
            const hex = baseColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            // Audio-reactive brightness - ALL orbs react to music
            const brightness = 0.6 + midFreq * 0.4 + highFreq * 0.2;
            const finalR = Math.floor(r * brightness);
            const finalG = Math.floor(g * brightness);
            const finalB = Math.floor(b * brightness);
            
            // Draw orb
            ctx.globalCompositeOperation = "source-over";
            
            // Main orb
            ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${layer.opacity})`;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect
            const glowGradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size * 2);
            glowGradient.addColorStop(0, `rgba(${finalR}, ${finalG}, ${finalB}, 0.3)`);
            glowGradient.addColorStop(0.5, `rgba(${finalR}, ${finalG}, ${finalB}, 0.1)`);
            glowGradient.addColorStop(1, `rgba(${finalR}, ${finalG}, ${finalB}, 0)`);
            
            ctx.fillStyle = glowGradient;
            ctx.globalAlpha = layer.opacity * 0.6;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Bright core
            const coreGradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size * 0.4);
            coreGradient.addColorStop(0, `rgba(255, 255, 255, 0.6)`);
            coreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            ctx.fillStyle = coreGradient;
            ctx.globalAlpha = layer.opacity * 0.4;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Add trail effect for fast-moving orbs
            const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
            if (speed > 2) {
              ctx.strokeStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${layer.opacity * 0.3})`;
              ctx.lineWidth = 3;
              ctx.globalAlpha = layer.opacity * 0.5;
              ctx.beginPath();
              ctx.moveTo(orb.x, orb.y);
              ctx.lineTo(orb.x - orb.vx * 5, orb.y - orb.vy * 5);
              ctx.stroke();
            }
          });
          
          // Add some audio-reactive sparkles
          if (highFreq > 0.3) {
            for (let i = 0; i < 5; i++) {
              const sparkleX = Math.random() * w;
              const sparkleY = Math.random() * h;
              const sparkleSize = 3 + highFreq * 8;
              
              const sparkleColor = pick(pal, Math.floor(Math.random() * pal.length));
              const hex = sparkleColor.replace('#', '');
              const r = parseInt(hex.substr(0, 2), 16);
              const g = parseInt(hex.substr(2, 2), 16);
              const b = parseInt(hex.substr(4, 2), 16);
              
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${layer.opacity * 0.8})`;
              ctx.globalAlpha = 1;
              ctx.beginPath();
              ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (layer.mode === "smoke") {
          // Optimized smoke: low-res offscreen noise, scaled up + smoothed.
          const time = performance.now() * 0.001;

          // Audio reactivity
          const bass = (freq[2] ?? 0) / 255;
          const mids = (freq[32] ?? 0) / 255;
          const highs = (freq[96] ?? 0) / 255;

          // Two palette colors to blend smoke between
          const c1Hex = pick(pal, 1);
          const c2Hex = pick(pal, 3);
          const c1r = parseInt(c1Hex.slice(1, 3), 16), c1g = parseInt(c1Hex.slice(3, 5), 16), c1b = parseInt(c1Hex.slice(5, 7), 16);
          const c2r = parseInt(c2Hex.slice(1, 3), 16), c2g = parseInt(c2Hex.slice(3, 5), 16), c2b = parseInt(c2Hex.slice(5, 7), 16);

          // Maintain offscreen cache on layer
          if (!(layer as any)._smoke) {
            const scaleDown = 4; // render at quarter res
            const ow = Math.max(160, Math.floor(w / scaleDown));
            const oh = Math.max(90, Math.floor(h / scaleDown));
            const off = document.createElement('canvas');
            off.width = ow; off.height = oh;
            const octx = off.getContext('2d', { alpha: true })!;
            (layer as any)._smoke = { off, octx, frame: 0, ow, oh };
          } else {
            // Resize offscreen if main canvas changed a lot
            const cache = (layer as any)._smoke;
            const ow = Math.max(160, Math.floor(w / 4));
            const oh = Math.max(90, Math.floor(h / 4));
            if (ow !== cache.ow || oh !== cache.oh) {
              cache.off.width = ow; cache.off.height = oh; cache.ow = ow; cache.oh = oh;
            }
          }

          const cache = (layer as any)._smoke as { off: HTMLCanvasElement; octx: CanvasRenderingContext2D; frame: number; ow: number; oh: number };
          cache.frame++;

          // Compute parameters (very cheap) and skip heavy update every other frame
          const density = 0.55 + bass * 0.45;
          const baseScale = 0.008 + mids * 0.004; // larger scale -> fewer features
          const flow = time * (0.5 + bass * 1.2);
          const swirlX = 0.8 + highs * 1.2;
          const swirlY = 0.6 + highs * 1.0;

          const octx = cache.octx;
          const ow = cache.ow;
          const oh = cache.oh;

          if ((cache.frame % 2) === 0) {
            // Update offscreen pixels (half the FPS for heavy step)
            const img = octx.createImageData(ow, oh);
            const data = img.data;

            // Lightweight noise
            const seed = Math.sin(time * 0.15) * 10000;
            const hash = (x: number, y: number) => {
              const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
              return s - Math.floor(s);
            };
            const noise = (x: number, y: number) => {
              const xi = Math.floor(x), yi = Math.floor(y);
              const xf = x - xi, yf = y - yi;
              const u = xf * xf * (3 - 2 * xf);
              const v = yf * yf * (3 - 2 * yf);
              const n00 = hash(xi, yi), n10 = hash(xi + 1, yi), n01 = hash(xi, yi + 1), n11 = hash(xi + 1, yi + 1);
              const nx0 = n00 * (1 - u) + n10 * u;
              const nx1 = n01 * (1 - u) + n11 * u;
              return nx0 * (1 - v) + nx1 * v;
            };
            const fbm = (x: number, y: number) => {
              // Only 3 octaves for speed
              let value = 0, amp = 0.5, f = 1.0;
              for (let i = 0; i < 3; i++) { value += amp * noise(x * f, y * f); f *= 2.0; amp *= 0.5; }
              return value;
            };

            let idx = 0;
            for (let y = 0; y < oh; y++) {
              // Precompute row terms
              const yy = (y + Math.cos((y + flow * 60) * 0.01) * (8 * swirlY));
              for (let x = 0; x < ow; x++) {
                const xx = (x + Math.sin((x - flow * 50) * 0.01) * (10 * swirlX));
                const n = fbm(xx * baseScale, yy * baseScale);
                const v = Math.pow(n, 1.35) * (0.7 + mids * 0.5);
                const t = Math.min(1, Math.max(0, v));
                const r = Math.floor(c1r * (1 - t) + c2r * t);
                const g = Math.floor(c1g * (1 - t) + c2g * t);
                const b = Math.floor(c1b * (1 - t) + c2b * t);
                const a = Math.floor(255 * density);
                data[idx++] = r; data[idx++] = g; data[idx++] = b; data[idx++] = a;
              }
            }
            octx.putImageData(img, 0, 0);
          }

          // Draw scaled with smoothing + slight blur
          const prevSmoothing = ctx.imageSmoothingEnabled;
          const prevQuality = (ctx as any).imageSmoothingQuality;
          ctx.imageSmoothingEnabled = true;
          (ctx as any).imageSmoothingQuality = 'high';

          ctx.save();
          ctx.globalCompositeOperation = layer.blend === 'add' ? 'lighter' : (layer.blend === 'screen' ? 'screen' : ctx.globalCompositeOperation);
          ctx.globalAlpha = layer.opacity;
          // Subtle blur for softer smoke edges
          (ctx as any).filter = 'blur(2px)';
          ctx.drawImage(cache.off, 0, 0, w, h);
          (ctx as any).filter = 'none';
          ctx.restore();

          ctx.imageSmoothingEnabled = prevSmoothing;
          (ctx as any).imageSmoothingQuality = prevQuality;
        }

        // Restore canvas state if mirror was applied
        if (layer.mirrored || layer.mirroredVertical) {
          ctx.restore();
        }
        
        // Reset opacity for next layer
        ctx.globalAlpha = 1;
      }

      // Logo overlay
      if (logo.src) {
        const img = new Image();
        img.src = logo.src;
        const draw = () => {
          const scale = Math.max(0.1, Math.min(2, logo.scale));
          const iw = Math.min(w, h) * 0.25 * scale;
          const ih = iw;
          const x = logo.x * (w - iw);
          const y = logo.y * (h - ih);
          ctx.globalAlpha = Math.max(0, Math.min(1, logo.opacity));
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(img, x, y, iw, ih);
        };
        if (img.complete) draw();
        else img.onload = draw;
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [colors, data, layers, logo, background, paused]);

  // Debug logging
  console.log('Layers:', layers.map(l => ({ mode: l.mode, visible: l.visible })));

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full block"
    />
  );
}

export default OptimizedCanvas;


