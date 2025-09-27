import type { Palette } from "./types";

export const palettes: Palette[] = [
  // Blue-based palettes
  { id: "blue-ocean", name: "Blue Ocean", colors: ["#001122", "#003366", "#0066CC", "#3399FF", "#66CCFF", "#CCEEFF"] },
  { id: "blue-deep", name: "Deep Blue", colors: ["#000811", "#001122", "#002244", "#004488", "#0088FF", "#44AAFF"] },
  { id: "blue-ice", name: "Ice Blue", colors: ["#0A0F14", "#1A2332", "#2A4A66", "#4A8ACC", "#8AC4FF", "#E6F3FF"] },
  
  // Green-based palettes
  { id: "green-forest", name: "Forest Green", colors: ["#0A1408", "#1A2E0F", "#2A4A1A", "#4A8A2A", "#6ACC3A", "#CCFFAA"] },
  { id: "green-mint", name: "Mint Green", colors: ["#0A140F", "#1A2E1F", "#2A4A3A", "#4A8A6A", "#6ACC9A", "#CCFFEE"] },
  { id: "green-lime", name: "Lime Green", colors: ["#141408", "#2E2E0F", "#4A4A1A", "#8A8A2A", "#CCCC3A", "#FFFFAA"] },
  
  // Red-based palettes
  { id: "red-fire", name: "Fire Red", colors: ["#140808", "#2E0F0F", "#4A1A1A", "#8A2A2A", "#CC3A3A", "#FFAAAA"] },
  { id: "red-rose", name: "Rose Red", colors: ["#140A0F", "#2E1A1F", "#4A2A3A", "#8A4A6A", "#CC6A9A", "#FFAAEE"] },
  { id: "red-crimson", name: "Crimson", colors: ["#140808", "#2E0F0F", "#4A1A1A", "#8A2A2A", "#CC3A3A", "#FFAAAA"] },
  
  // Purple-based palettes
  { id: "purple-royal", name: "Royal Purple", colors: ["#140A14", "#2E1A2E", "#4A2A4A", "#8A4A8A", "#CC6ACC", "#FFAAFF"] },
  { id: "purple-violet", name: "Violet", colors: ["#0F0A14", "#1F1A2E", "#3A2A4A", "#6A4A8A", "#9A6ACC", "#EEAAFF"] },
  { id: "purple-indigo", name: "Indigo", colors: ["#0A0A14", "#1A1A2E", "#2A2A4A", "#4A4A8A", "#6A6ACC", "#AAAAFF"] },
  
  // Orange-based palettes
  { id: "orange-sunset", name: "Sunset Orange", colors: ["#140A08", "#2E1A0F", "#4A2A1A", "#8A4A2A", "#CC6A3A", "#FFAAAA"] },
  { id: "orange-amber", name: "Amber", colors: ["#141008", "#2E1F0F", "#4A3A1A", "#8A6A2A", "#CC9A3A", "#FFEEAA"] },
  { id: "orange-peach", name: "Peach", colors: ["#140F0A", "#2E1F1A", "#4A3A2A", "#8A6A4A", "#CC9A6A", "#FFEEAA"] },
  
  // Yellow-based palettes
  { id: "yellow-gold", name: "Gold", colors: ["#141208", "#2E1F0F", "#4A3A1A", "#8A6A2A", "#CC9A3A", "#FFEEAA"] },
  { id: "yellow-lemon", name: "Lemon", colors: ["#141408", "#2E2E0F", "#4A4A1A", "#8A8A2A", "#CCCC3A", "#FFFFAA"] },
  { id: "yellow-cream", name: "Cream", colors: ["#14140F", "#2E2E1F", "#4A4A3A", "#8A8A6A", "#CCCC9A", "#FFFFEE"] },
  
  // Monochrome palettes
  { id: "mono-dark", name: "Dark Mono", colors: ["#000000", "#1A1A1A", "#333333", "#4D4D4D", "#666666", "#808080"] },
  { id: "mono-light", name: "Light Mono", colors: ["#333333", "#4D4D4D", "#666666", "#808080", "#999999", "#CCCCCC"] },
  { id: "mono-gray", name: "Gray Scale", colors: ["#0A0A0A", "#1A1A1A", "#2A2A2A", "#4A4A4A", "#6A6A6A", "#AAAAAA"] },
  
  // Cyan-based palettes
  { id: "cyan-aqua", name: "Aqua Cyan", colors: ["#0A1414", "#1A2E2E", "#2A4A4A", "#4A8A8A", "#6ACCCC", "#AAFFFF"] },
  { id: "cyan-teal", name: "Teal", colors: ["#0A1412", "#1A2E28", "#2A4A3A", "#4A8A6A", "#6ACC9A", "#AAFFEE"] },
  
  // Pink-based palettes
  { id: "pink-rose", name: "Rose Pink", colors: ["#140A0F", "#2E1A1F", "#4A2A3A", "#8A4A6A", "#CC6A9A", "#FFAAEE"] },
  { id: "pink-magenta", name: "Magenta", colors: ["#140A14", "#2E1A2E", "#4A2A4A", "#8A4A8A", "#CC6ACC", "#FFAAFF"] },
  
  // Classic combinations
  { id: "classic-blue", name: "Classic Blue", colors: ["#000033", "#000066", "#000099", "#0033CC", "#0066FF", "#3399FF"] },
  { id: "classic-green", name: "Classic Green", colors: ["#003300", "#006600", "#009900", "#00CC00", "#00FF00", "#33FF33"] },
  { id: "classic-red", name: "Classic Red", colors: ["#330000", "#660000", "#990000", "#CC0000", "#FF0000", "#FF3333"] },
];

const paletteMap = new Map(palettes.map((p) => [p.id, p] as const));
export function getPalette(id: string): Palette {
  return paletteMap.get(id) ?? palettes[0];
}


