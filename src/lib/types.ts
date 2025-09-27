export type BlendMode = "normal" | "add" | "multiply" | "screen";

export type VisualMode =
  | "bars"
  | "waveform"
  | "particles" // simplified
  | "radial" // minimal radial spectrum
  | "mirror-eq"
  | "peak-bars"
  | "sparkline"
  | "rings"
  | "lissajous"
  | "grid" // disco dancefloor flashing
  | "snake" // moving animated grid
  | "radar"
  | "city-eq"
  | "led-matrix"
  | "blob"
  | "smoke"; // Canvas 2D Perlin-like smoke

export type Layer = {
  id: string;
  name: string;
  opacity: number; // 0..1
  blend: BlendMode;
  mode: VisualMode;
  paletteId: string;
  muted?: boolean;
  solo?: boolean;
  visible?: boolean; // visual visibility toggle
  mirrored?: boolean; // horizontal mirror flip
  mirroredVertical?: boolean; // vertical mirror flip
};

export type Palette = {
  id: string;
  name: string;
  colors: string[];
  isCustom?: boolean;
};


