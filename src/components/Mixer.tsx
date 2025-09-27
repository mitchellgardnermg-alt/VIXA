"use client";

import * as Slider from "@radix-ui/react-slider";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { palettes } from "@/lib/palettes";
import { Button } from "@/components/ui/Button";
import { EyeOpenIcon, EyeClosedIcon, MixerHorizontalIcon, ColorWheelIcon, TrashIcon, PlusIcon, DragHandleDots2Icon, CopyIcon, ArrowUpIcon } from "@radix-ui/react-icons";

function titleForMode(mode: string) {
  return mode
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function Mixer() {
  const layers = useAppStore((s) => s.layers);
  const updateLayer = useAppStore((s) => s.updateLayer);
  const addLayer = useAppStore((s) => s.addLayer);
  const removeLayer = useAppStore((s) => s.removeLayer);

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-900/50 to-black/80 backdrop-blur-sm">
      {/* Professional Mixer Header */}
      <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <MixerHorizontalIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Layer Mixer</h2>
          <div className="ml-auto text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
            {layers.length} Layer{layers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Mixer Content */}
      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-80px)]">
        {layers.map((l, index) => (
          <div key={l.id} className="group relative">
            {/* Professional Layer Card */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/90 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-emerald-400/30">
              {/* Layer Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <DragHandleDots2Icon className="w-4 h-4 text-white/40" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{l.name}</div>
                    <div className="text-xs text-white/60">Layer {index + 1}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Visibility Toggle */}
                  <button
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      l.visible === false 
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                        : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    }`}
                    onClick={() => {
                      console.log('Visibility toggle clicked:', l.id, l.visible);
                      updateLayer(l.id, { visible: l.visible === false ? true : false });
                    }}
                  >
                    {l.visible === false ? <EyeClosedIcon className="w-4 h-4" /> : <EyeOpenIcon className="w-4 h-4" />}
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      console.log('Delete layer clicked:', l.id);
                      removeLayer(l.id);
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Layer Controls */}
              <div className="p-4 space-y-4">
                {/* Mode Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/80 uppercase tracking-wide">Visual Mode</label>
                  <select 
                    className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white text-sm"
                    value={l.mode}
                    onChange={(e) => {
                      console.log('Mode changed:', e.target.value);
                      updateLayer(l.id, { mode: e.target.value as any, name: titleForMode(e.target.value) });
                    }}
                  >
                    {["bars", "waveform", "radial", "mirror-eq", "peak-bars", "sparkline", "rings", "lissajous", "grid", "snake", "radar", "city-eq", "led-matrix", "blob", "smoke"].map((m) => (
                      <option key={m} value={m} className="bg-neutral-900 text-white">
                        {titleForMode(m)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opacity Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white/80 uppercase tracking-wide">Opacity</label>
                    <span className="text-xs text-emerald-400 font-mono">{Math.round(l.opacity * 100)}%</span>
                  </div>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none h-6"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[l.opacity]}
                    onValueChange={(val) => updateLayer(l.id, { opacity: val[0] ?? 1 })}
                  >
                    <Slider.Track className="bg-white/10 relative grow rounded-full h-2">
                      <Slider.Range className="absolute bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full shadow-sm" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-5 h-5 rounded-full bg-white shadow-lg border-2 border-emerald-400 hover:scale-110 transition-transform duration-200" />
                  </Slider.Root>
                </div>


                {/* Blend Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/80 uppercase tracking-wide">Blend Mode</label>
                  <select 
                    className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white text-sm"
                    value={l.blend}
                    onChange={(e) => {
                      console.log('Blend changed:', e.target.value);
                      updateLayer(l.id, { blend: e.target.value as any });
                    }}
                  >
                    {["normal", "add", "multiply", "screen"].map((b) => (
                      <option key={b} value={b} className="bg-neutral-900 text-white capitalize">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Palette */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/80 uppercase tracking-wide">Color Palette</label>
                  <select 
                    className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white text-sm"
                    value={l.paletteId}
                    onChange={(e) => {
                      console.log('Palette changed:', e.target.value);
                      updateLayer(l.id, { paletteId: e.target.value });
                    }}
                  >
                    {palettes.map((p) => (
                      <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mirror Controls */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/80 uppercase tracking-wide">Mirror</label>
                  
                  <div className="flex items-center gap-2">
                    {/* Horizontal Mirror */}
                    <button
                      onClick={() => updateLayer(l.id, { mirrored: !l.mirrored })}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        l.mirrored 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' 
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10'
                      }`}
                    >
                      <CopyIcon className="w-3 h-3" />
                      H
                    </button>

                    {/* Vertical Mirror */}
                    <button
                      onClick={() => updateLayer(l.id, { mirroredVertical: !l.mirroredVertical })}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        l.mirroredVertical 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' 
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10'
                      }`}
                    >
                      <ArrowUpIcon className="w-3 h-3" />
                      V
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Layer Button */}
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-12 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-400/30 hover:border-emerald-400/50 hover:from-emerald-500/20 hover:to-cyan-500/20 transition-all duration-200" 
            onClick={() => {
              console.log('Add layer clicked');
              addLayer();
            }}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Layer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Mixer;


