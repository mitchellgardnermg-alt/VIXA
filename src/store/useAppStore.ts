"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Layer } from "@/lib/types";

type LogoState = {
  src?: string;
  x: number; // 0..1
  y: number; // 0..1
  scale: number; // 0.1..2
  opacity: number; // 0..1
};

type BackgroundState = {
  color: string;
  src?: string;
  fit: "cover" | "contain" | "stretch";
  opacity: number; // 0..1 for image overlay
};

type AppState = {
  layers: Layer[];
  logo: LogoState;
  background: BackgroundState;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  setLogo: (partial: Partial<LogoState>) => void;
  setBackground: (partial: Partial<BackgroundState>) => void;
};

export const useAppStore = create<AppState>((set) => ({
  layers: [
    { id: "1", name: "Smoke", opacity: 1, blend: "normal", mode: "smoke", paletteId: "blue-ocean", visible: true, mirrored: false, mirroredVertical: false },
    { id: "2", name: "Waveform", opacity: 0.9, blend: "screen", mode: "waveform", paletteId: "blue-ocean", visible: true, mirrored: false, mirroredVertical: false },
  ],
  logo: { x: 0.92, y: 0.08, scale: 0.5, opacity: 0.8 },
  background: { color: "#07140e", src: undefined, fit: "cover", opacity: 1 },
  addLayer: () => set((s) => ({
    layers: s.layers.concat({ id: nanoid(6), name: `Layer ${s.layers.length + 1}`, opacity: 1, blend: "normal", mode: "bars", paletteId: "blue-ocean", visible: true, mirrored: false, mirroredVertical: false }),
  })),
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),
  updateLayer: (id, partial) => set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, ...partial } : l)) })),
  setLogo: (partial) => set((s) => ({ logo: { ...s.logo, ...partial } })),
  setBackground: (partial) => set((s) => ({ background: { ...s.background, ...partial } })),
}));


