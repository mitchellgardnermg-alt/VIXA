export interface Renderer {
  render(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, time: number, audioData: AudioData): void;
  dispose(): void;
}

export interface AudioData {
  low: number;
  mid: number;
  high: number;
  rms: number;
  frequency: Uint8Array;
  waveform: Uint8Array;
}

export interface RendererParams {
  speed?: number;
  segments?: number;
  spike?: number;
  lineWidth?: number;
  hue?: number;
}


