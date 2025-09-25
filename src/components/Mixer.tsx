"use client";

import * as Slider from "@radix-ui/react-slider";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { palettes } from "@/lib/palettes";
import { Button } from "@/components/ui/Button";

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
    <div className="w-full h-full p-3">
      <div className="flex flex-col gap-3">
        {layers.map((l) => (
          <div key={l.id} className="w-full rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{l.name}</div>
              <button
                className={`text-xs px-2 py-1 rounded border ${l.visible === false ? "bg-white/5 border-white/10 text-white/50" : "bg-emerald-500/20 border-emerald-400/30"}`}
                onClick={() => updateLayer(l.id, { visible: l.visible === false ? true : false })}
              >
                {l.visible === false ? "Show" : "Hide"}
              </button>
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="w-full text-left text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1">
                Mode: {l.mode}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="min-w-40 bg-neutral-900 text-neutral-100 border border-white/10 rounded p-1 max-h-64 overflow-y-auto">
                {["bars", "waveform", "radial", "mirror-eq", "peak-bars", "sparkline", "rings", "lissajous", "grid", "snake", "radar", "city-eq", "led-matrix", "blob", "smoke"].map((m) => (
                  <DropdownMenu.Item
                    key={m}
                    className="px-2 py-1.5 text-xs rounded hover:bg-white/10"
                    onSelect={() => updateLayer(l.id, { mode: m as any, name: titleForMode(m) })}
                  >
                    {titleForMode(m)}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <div className="mt-3 text-xs">Opacity</div>
            <Slider.Root
              className="relative flex items-center select-none touch-none h-5"
              min={0}
              max={1}
              step={0.01}
              value={[l.opacity]}
              onValueChange={(val) => updateLayer(l.id, { opacity: val[0] ?? 1 })}
            >
              <Slider.Track className="bg-white/10 relative grow rounded h-1">
                <Slider.Range className="absolute bg-emerald-400 h-full rounded" />
              </Slider.Track>
              <Slider.Thumb className="block w-3 h-3 rounded-full bg-white shadow" />
            </Slider.Root>

            <div className="mt-3 text-xs">Blend</div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="w-full text-left text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1">
                {l.blend}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="min-w-40 bg-neutral-900 text-neutral-100 border border-white/10 rounded p-1">
                {["normal", "add", "multiply", "screen"].map((b) => (
                  <DropdownMenu.Item key={b} className="px-2 py-1.5 text-xs rounded hover:bg-white/10" onSelect={() => updateLayer(l.id, { blend: b as any })}>
                    {b}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <div className="mt-3 text-xs">Palette</div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="w-full text-left text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1">
                {palettes.find((p) => p.id === l.paletteId)?.name ?? l.paletteId}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="min-w-40 max-h-64 overflow-y-auto bg-neutral-900 text-neutral-100 border border-white/10 rounded p-1">
                {palettes.map((p) => (
                  <DropdownMenu.Item key={p.id} className="px-2 py-1.5 text-xs rounded hover:bg-white/10" onSelect={() => updateLayer(l.id, { paletteId: p.id })}>
                    {p.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <button className="mt-3 w-full text-xs bg-red-500/20 hover:bg-red-500/30 rounded px-2 py-1 border border-red-400/30" onClick={() => removeLayer(l.id)}>
              Delete
            </button>
          </div>
        ))}
        <div className="w-full p-3 flex items-start">
          <Button variant="outline" size="lg" className="w-full" onClick={addLayer}>+ Add Layer</Button>
        </div>
      </div>
    </div>
  );
}

export default Mixer;


