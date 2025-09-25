import type { Palette } from "./types";

export const palettes: Palette[] = [
  { id: "ocean-neon", name: "Ocean Neon", colors: ["#030B0F", "#071923", "#00F5D4", "#00BBF9", "#F15BB5", "#E0FBFC"] },
  { id: "terminal-matrix", name: "Terminal Matrix", colors: ["#020202", "#0A0A0A", "#00FF88", "#00E5FF", "#39FF14", "#D4D4D4"] },
  { id: "emerald", name: "Emerald", colors: ["#05130E", "#0B1F18", "#10B981", "#22D3EE", "#60A5FA", "#E5E7EB"] },
  { id: "cyberpunk-grid", name: "Cyberpunk Grid", colors: ["#0A0014", "#160021", "#FF2BD6", "#19D1FF", "#F9F871", "#EAEAEA"] },
  { id: "vaporwave-sunset", name: "Vaporwave Sunset", colors: ["#0D0A1F", "#1A1036", "#FF71CE", "#01CDFE", "#B967FF", "#F8F7FF"] },
  { id: "glacier", name: "Glacier", colors: ["#071017", "#0D1B24", "#7DD3FC", "#38BDF8", "#A5F3FC", "#E2E8F0"] },
  { id: "hologram", name: "Hologram", colors: ["#090B11", "#121826", "#A78BFA", "#22D3EE", "#F472B6", "#E5E7EB"] },
  { id: "royal-prism", name: "Royal Prism", colors: ["#0B0A12", "#151425", "#7C3AED", "#22C55E", "#F59E0B", "#F3F4F6"] },
  { id: "inferno", name: "Inferno", colors: ["#100806", "#1A0E0A", "#FF6B00", "#FF1744", "#FFD166", "#F1F5F9"] },
  { id: "deep-space", name: "Deep Space", colors: ["#00010A", "#0B0F1F", "#64FFDA", "#8892B0", "#48A9A6", "#E6F1FF"] },
  { id: "steel-ember", name: "Steel & Ember", colors: ["#0B0B0C", "#141417", "#EF4444", "#94A3B8", "#F97316", "#E5E7EB"] },
  { id: "oceanic", name: "Oceanic", colors: ["#021015", "#06202A", "#06B6D4", "#14B8A6", "#3B82F6", "#D1FAE5"] },
  { id: "pastel-pop", name: "Pastel Pop", colors: ["#0F1115", "#161A22", "#FFD6E8", "#CAFFBF", "#BDB2FF", "#E5E7EB"] },
];

const paletteMap = new Map(palettes.map((p) => [p.id, p] as const));
export function getPalette(id: string): Palette {
  return paletteMap.get(id) ?? palettes[0];
}


