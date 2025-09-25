import * as THREE from 'three';
import { Renderer, AudioData, RendererParams } from './types';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_res;
  uniform float u_low;
  uniform float u_mid;
  uniform float u_high;
  uniform float u_speed;
  uniform float u_segments;
  uniform float u_spike;
  uniform float u_lineWidth;
  uniform float u_hue;
  
  varying vec2 vUv;
  
  // Noise function
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  
  // Smooth noise
  float smoothNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = noise(i);
    float b = noise(i + vec3(1.0, 0.0, 0.0));
    float c = noise(i + vec3(0.0, 1.0, 0.0));
    float d = noise(i + vec3(1.0, 1.0, 0.0));
    float e = noise(i + vec3(0.0, 0.0, 1.0));
    float f1 = noise(i + vec3(1.0, 0.0, 1.0));
    float g = noise(i + vec3(0.0, 1.0, 1.0));
    float h = noise(i + vec3(1.0, 1.0, 1.0));
    
    return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
               mix(mix(e, f1, f.x), mix(g, h, f.x), f.y), f.z);
  }
  
  // Fractal noise
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
      value += amplitude * smoothNoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  // Kaleidoscope function
  vec2 kaleidoscope(vec2 p, float segments) {
    float angle = atan(p.y, p.x);
    float radius = length(p);
    
    angle = mod(angle, 2.0 * 3.14159 / segments);
    angle = min(angle, 2.0 * 3.14159 / segments - angle);
    
    return vec2(cos(angle), sin(angle)) * radius;
  }
  
  // SDF for tunnel
  float sdfTunnel(vec3 p) {
    vec2 tunnel = kaleidoscope(p.xy, u_segments);
    return length(tunnel) - 1.0;
  }
  
  // SDF for star shell
  float sdfStarShell(vec3 p) {
    float radius = length(p);
    float star = 0.0;
    
    // Create star pattern
    for(int i = 0; i < 8; i++) {
      float angle = float(i) * 3.14159 / 4.0;
      vec2 dir = vec2(cos(angle), sin(angle));
      float dist = abs(dot(p.xy, dir));
      star = max(star, dist);
    }
    
    // Noise modulation
    float noiseVal = fbm(p * 2.0 + u_time * 0.5) * 0.1;
    float shellRadius = 0.8 + noiseVal + u_mid * 0.3;
    
    return radius - shellRadius + star * 0.1 * u_spike;
  }
  
  // Raymarching function
  float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    float minDist = 1000.0;
    
    for(int i = 0; i < 32; i++) {
      vec3 p = ro + rd * t;
      
      // Tunnel SDF
      float tunnelDist = sdfTunnel(p);
      
      // Star shell SDF
      float shellDist = sdfStarShell(p);
      
      float dist = min(tunnelDist, shellDist);
      minDist = min(minDist, dist);
      
      if(dist < 0.1) break;
      
      t += max(dist * 0.8, 0.01);
      if(t > 8.0) break;
    }
    
    return minDist;
  }
  
  // Grid wireframe function
  float grid(vec2 p, float lineWidth) {
    vec2 grid = abs(fract(p) - 0.5);
    float line = min(grid.x, grid.y);
    return smoothstep(lineWidth, 0.0, line);
  }
  
  // HSV to RGB conversion
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= u_res.x / u_res.y;
    
    // Camera setup - start closer to see the effect
    vec3 ro = vec3(0.0, 0.0, u_time * u_speed * (0.5 + u_low * 0.5));
    vec3 rd = normalize(vec3(uv, 1.0));
    
    // Raymarch
    float dist = raymarch(ro, rd);
    
    // Base color with brighter background for visibility
    vec3 color = vec3(0.1, 0.1, 0.2);
    
    // Always show some effect, even when no audio - make it more visible
    float baseIntensity = 0.8 + u_high * 0.2;
    
    if(dist < 2.0) {
      // Tunnel color
      float tunnelIntensity = 1.0 - smoothstep(0.0, 1.5, dist);
      vec3 tunnelColor = hsv2rgb(vec3(u_hue, 0.8, tunnelIntensity * baseIntensity));
      
      // Star shell color
      float shellIntensity = 1.0 - smoothstep(0.0, 0.8, abs(dist - 0.8));
      vec3 shellColor = hsv2rgb(vec3(u_hue + 0.3, 0.6, shellIntensity * baseIntensity * u_high));
      
      // Grid wireframe
      vec2 gridUv = uv * 8.0;
      float gridLines = grid(gridUv, u_lineWidth * 2.0);
      vec3 gridColor = hsv2rgb(vec3(u_hue + 0.6, 0.4, gridLines * baseIntensity * 0.8));
      
      // Combine colors
      color += tunnelColor + shellColor + gridColor;
      
      // Glow effect
      float glow = exp(-dist * 1.5) * (0.5 + u_high * 0.5);
      color += glow * hsv2rgb(vec3(u_hue, 0.5, 0.6));
    }
    
    // Add some sparkles
    float sparkle = fbm(vec3(uv * 15.0, u_time * 1.5)) * (0.3 + u_mid * 0.7);
    if(sparkle > 0.7) {
      color += vec3(1.0) * (sparkle - 0.7) * 3.0;
    }
    
    // Add some background pattern
    float bgPattern = fbm(vec3(uv * 3.0, u_time * 0.5)) * 0.1;
    color += bgPattern * hsv2rgb(vec3(u_hue + 0.8, 0.3, 0.3));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export class KaleidoStarTunnel implements Renderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;
  private mesh: THREE.Mesh;
  private params: Required<RendererParams>;

  constructor(params: RendererParams = {}) {
    this.params = {
      speed: params.speed ?? 1.0,
      segments: params.segments ?? 8,
      spike: params.spike ?? 1.4,
      lineWidth: params.lineWidth ?? 0.008,
      hue: params.hue ?? 0.5,
    };

    this.init();
  }

  private init() {
    // Create scene
    this.scene = new THREE.Scene();

    // Create camera (orthographic for full-screen quad)
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create geometry (full-screen quad)
    this.geometry = new THREE.PlaneGeometry(2, 2);

    // Create material with shader
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_res: { value: new THREE.Vector2(1920, 1080) },
        u_low: { value: 0.0 },
        u_mid: { value: 0.0 },
        u_high: { value: 0.0 },
        u_speed: { value: this.params.speed },
        u_segments: { value: this.params.segments },
        u_spike: { value: this.params.spike },
        u_lineWidth: { value: this.params.lineWidth },
        u_hue: { value: this.params.hue },
      },
    });

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  render(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    time: number,
    audioData: AudioData
  ): void {
    // Update uniforms
    this.material.uniforms.u_time.value = time;
    this.material.uniforms.u_res.value.set(renderer.domElement.width, renderer.domElement.height);
    this.material.uniforms.u_low.value = audioData.low;
    this.material.uniforms.u_mid.value = audioData.mid;
    this.material.uniforms.u_high.value = audioData.high;

    // Render
    renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    // Update resolution uniform
    this.material.uniforms.u_res.value.set(width, height);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export default KaleidoStarTunnel;
