import * as THREE from 'three';
import type { ThemeMode } from '../data/codexData';
import type { TesseraSkill } from '../data/tesseraeData';

export const LAYER_COLORS: Record<TesseraSkill['layer'], string> = {
  L1: '#E4C774', // Soft Honey Gold
  L2: '#C85254', // Muted Wax Crimson
  L3: '#68AFD2', // Soft Liturgical Sapphire
  L7: '#55AE7B', // Verdigris Sage
};

/* --------------------------------------------------------------------------
   Module-Level Persistent Texture Caches (0ms Instant Theme Switching)
   -------------------------------------------------------------------------- */
export interface MarbleTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export interface BronzeTextureSet {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export interface KeyTesseraTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export interface PlateTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export interface WaxSealTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
}

const marbleCache = new Map<ThemeMode, MarbleTextureSet>();
let bronzeCache: BronzeTextureSet | null = null;
const glowCache = new Map<ThemeMode, THREE.CanvasTexture>();
const keyTesseraCache = new Map<string, KeyTesseraTextureSet>();
const counterPlateCache = new Map<string, PlateTextureSet>();
const architraveCache = new Map<string, PlateTextureSet>();
const candleWaxCache = new Map<ThemeMode, THREE.CanvasTexture>();
let candleHaloCache: THREE.CanvasTexture | null = null;
let contactShadowCache: THREE.CanvasTexture | null = null;
let waxSealCache: WaxSealTextureSet | null = null;
const floorCache = new Map<ThemeMode, THREE.CanvasTexture>();
const roseCache = new Map<ThemeMode, THREE.CanvasTexture>();
const shaftCache = new Map<ThemeMode, THREE.CanvasTexture>();
let incenseWispCache: THREE.CanvasTexture | null = null;
const scrollParchmentCache = new Map<ThemeMode, THREE.CanvasTexture>();

/* --------------------------------------------------------------------------
   Canvas Rounded Path & Tileable Procedural Noise Helpers
   -------------------------------------------------------------------------- */
function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  traceRoundedRect(ctx, x, y, w, h, r);
  ctx.stroke();
}

function hash2D(ix: number, iy: number, seed = 1337): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function tileValueNoise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  const x0 = ((xi % period) + period) % period;
  const y0 = ((yi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y1 = (y0 + 1) % period;

  const n00 = hash2D(x0, y0, seed);
  const n10 = hash2D(x1, y0, seed);
  const n01 = hash2D(x0, y1, seed);
  const n11 = hash2D(x1, y1, seed);

  const nx0 = n00 + (n10 - n00) * u;
  const nx1 = n01 + (n11 - n01) * u;
  return nx0 + (nx1 - nx0) * v;
}

function tileFbm(u: number, v: number, basePeriod: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let period = basePeriod;
  for (let o = 0; o < octaves; o++) {
    sum += amp * tileValueNoise(u * period, v * period, period, seed + o * 97);
    norm += amp;
    amp *= 0.5;
    period *= 2;
  }
  return sum / norm;
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function heightCanvasToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  strength: number,
  repeat = false
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hctx = heightCanvas.getContext('2d')!;
  const src = hctx.getImageData(0, 0, w, h).data;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = w;
  normalCanvas.height = h;
  const nctx = normalCanvas.getContext('2d')!;
  const out = nctx.createImageData(w, h);
  const dst = out.data;

  // Extract 1-channel normalized float array once to eliminate 8x redundant modulo/index math per pixel
  const heights = new Float32Array(w * h);
  const inv255 = 1 / 255;
  for (let i = 0, p = 0; i < heights.length; i++, p += 4) {
    heights[i] = src[p] * inv255;
  }

  for (let y = 0; y < h; y++) {
    const ym1 = repeat ? (y === 0 ? h - 1 : y - 1) : y === 0 ? 0 : y - 1;
    const yp1 = repeat ? (y === h - 1 ? 0 : y + 1) : y === h - 1 ? h - 1 : y + 1;
    const rowTop = ym1 * w;
    const rowMid = y * w;
    const rowBot = yp1 * w;

    for (let x = 0; x < w; x++) {
      const xm1 = repeat ? (x === 0 ? w - 1 : x - 1) : x === 0 ? 0 : x - 1;
      const xp1 = repeat ? (x === w - 1 ? 0 : x + 1) : x === w - 1 ? w - 1 : x + 1;

      const tl = heights[rowTop + xm1];
      const t = heights[rowTop + x];
      const tr = heights[rowTop + xp1];
      const l = heights[rowMid + xm1];
      const r = heights[rowMid + xp1];
      const bl = heights[rowBot + xm1];
      const b = heights[rowBot + x];
      const br = heights[rowBot + xp1];

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * 0.25;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * 0.25;

      const nx = -dx * strength;
      const ny = dy * strength;
      const invLen = 1 / Math.sqrt(nx * nx + ny * ny + 1);

      const idx = (rowMid + x) << 2;
      dst[idx] = ((nx * invLen * 0.5 + 0.5) * 255 + 0.5) | 0;
      dst[idx + 1] = ((ny * invLen * 0.5 + 0.5) * 255 + 0.5) | 0;
      dst[idx + 2] = ((invLen * 0.5 + 0.5) * 255 + 0.5) | 0;
      dst[idx + 3] = 255;
    }
  }

  nctx.putImageData(out, 0, 0);

  const tex = new THREE.CanvasTexture(normalCanvas);
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  tex.anisotropy = 4;
  return tex;
}

/* --------------------------------------------------------------------------
   1. Procedural HDR Cathedral Softbox IBL Environment (PMREM)
   -------------------------------------------------------------------------- */
export function createCathedralEnvironmentMap(
  gl: THREE.WebGLRenderer,
  theme: ThemeMode
): { texture: THREE.Texture; dispose: () => void } {
  const pmrem = new THREE.PMREMGenerator(gl);
  const envScene = new THREE.Scene();

  const tempGeos: THREE.BufferGeometry[] = [];
  const tempMats: THREE.Material[] = [];

  const domeGeo = new THREE.SphereGeometry(24, 24, 16);
  const domeMat = new THREE.MeshBasicMaterial({
    color: theme === 'dark' ? '#12192D' : '#EDE4CF',
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(domeGeo, domeMat));
  tempGeos.push(domeGeo);
  tempMats.push(domeMat);

  const panels: {
    pos: [number, number, number];
    size: [number, number];
    rgb: [number, number, number];
  }[] =
    theme === 'dark'
      ? [
          { pos: [-12, 11, -6], size: [10, 7], rgb: [2.6, 2.1, 1.45] },
          { pos: [12, 8, 9], size: [10, 8], rgb: [1.1, 1.35, 2.0] },
          { pos: [-11, 14, -4], size: [10, 3.2], rgb: [1.35, 1.25, 1.1] },
          { pos: [0, 16, 0], size: [12, 12], rgb: [1.15, 1.24, 1.45] },
          { pos: [0, -10, 2], size: [16, 16], rgb: [0.55, 0.48, 0.34] },
          { pos: [9, 3, -11], size: [8, 10], rgb: [2.2, 1.72, 0.92] },
        ]
      : [
          { pos: [-12, 11, -6], size: [10, 7], rgb: [1.75, 1.65, 1.42] },
          { pos: [12, 8, 9], size: [10, 8], rgb: [1.15, 1.22, 1.36] },
          { pos: [-11, 14, -4], size: [10, 3.2], rgb: [1.05, 1.0, 0.92] },
          { pos: [0, 16, 0], size: [12, 12], rgb: [1.3, 1.28, 1.24] },
          { pos: [0, -10, 2], size: [16, 16], rgb: [0.95, 0.88, 0.72] },
          { pos: [9, 3, -11], size: [8, 10], rgb: [1.55, 1.34, 0.94] },
        ];

  panels.forEach((p) => {
    const geo = new THREE.PlaneGeometry(p.size[0], p.size[1]);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(p.rgb[0], p.rgb[1], p.rgb[2]),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
    tempGeos.push(geo);
    tempMats.push(mat);
  });

  const rt = pmrem.fromScene(envScene, 0.04);

  tempGeos.forEach((g) => g.dispose());
  tempMats.forEach((m) => m.dispose());

  return {
    texture: rt.texture,
    dispose: () => {
      rt.dispose();
      pmrem.dispose();
    },
  };
}

/* --------------------------------------------------------------------------
   2. Domain-Warped fBm PBR Marble Maps (Cached per Theme)
   -------------------------------------------------------------------------- */
export function createMarbleSurfaceTextures(theme: ThemeMode): MarbleTextureSet {
  const cached = marbleCache.get(theme);
  if (cached) return cached;

  const size = 384; // Crisp 384x384 anisotropic repeat (44% fewer pixels than 512, identical visual detail)
  const invSize = 1 / size;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;
  const colorImg = ctx.createImageData(size, size);
  const cData = colorImg.data;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;
  const bumpImg = bctx.createImageData(size, size);
  const bData = bumpImg.data;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;
  const roughImg = rctx.createImageData(size, size);
  const rData = roughImg.data;

  const isDark = theme === 'dark';

  for (let y = 0; y < size; y++) {
    const v = y * invSize;
    const rowOff = y * size;
    for (let x = 0; x < size; x++) {
      const u = x * invSize;
      const idx = (rowOff + x) << 2;

      const warp = tileFbm(u, v, 3, 4, 101);
      const secondary = tileFbm(u + warp * 0.35, v - warp * 0.3, 4, 3, 211);
      const grain = tileValueNoise(u * 28, v * 28, 28, 307);

      const primarySin = Math.abs(
        Math.sin((u * 2.8 + v * 2.1 + warp * 2.3 + secondary * 0.45) * Math.PI)
      );
      const oneMinusP = 1 - primarySin;
      const p2 = oneMinusP > 0 ? oneMinusP * oneMinusP : 0;
      const vein = p2 * p2 * p2; // ~pow(6) without expensive Math.pow

      const goldSin = Math.abs(
        Math.sin((u * 1.6 - v * 2.3 + warp * 2.8 + 0.65) * Math.PI)
      );
      const oneMinusG = 1 - goldSin;
      const g2 = oneMinusG > 0 ? oneMinusG * oneMinusG : 0;
      const g4 = g2 * g2;
      const goldVein = g4 * g4 * oneMinusG * (0.4 + 0.6 * secondary);

      let r: number;
      let g: number;
      let b: number;

      if (isDark) {
        r = lerpNum(18, 34, secondary);
        g = lerpNum(26, 48, secondary);
        b = lerpNum(47, 82, secondary);
        r = lerpNum(r, 178, vein * 0.34);
        g = lerpNum(g, 181, vein * 0.34);
        b = lerpNum(b, 195, vein * 0.34);
        r = lerpNum(r, 214, goldVein * 0.68);
        g = lerpNum(g, 176, goldVein * 0.68);
        b = lerpNum(b, 84, goldVein * 0.68);
      } else {
        r = lerpNum(233, 249, secondary);
        g = lerpNum(223, 243, secondary);
        b = lerpNum(198, 229, secondary);
        r = lerpNum(r, 146, vein * 0.38);
        g = lerpNum(g, 132, vein * 0.38);
        b = lerpNum(b, 106, vein * 0.38);
        r = lerpNum(r, 174, goldVein * 0.5);
        g = lerpNum(g, 138, goldVein * 0.5);
        b = lerpNum(b, 64, goldVein * 0.5);
      }

      const dither = (grain - 0.5) * 6;
      cData[idx] = clampByte(r + dither + 0.5);
      cData[idx + 1] = clampByte(g + dither + 0.5);
      cData[idx + 2] = clampByte(b + dither + 0.5);
      cData[idx + 3] = 255;

      const bumpVal = Math.max(
        20,
        Math.min(235, (148 - vein * 72 - goldVein * 38 + (grain - 0.5) * 16 + 0.5) | 0)
      );
      bData[idx] = bumpVal;
      bData[idx + 1] = bumpVal;
      bData[idx + 2] = bumpVal;
      bData[idx + 3] = 255;

      const baseRough = lerpNum(68, 96, secondary) + (grain - 0.5) * 12;
      const roughVal = Math.max(
        48,
        Math.min(220, (baseRough + vein * 92 + goldVein * 44 + 0.5) | 0)
      );
      rData[idx] = roughVal;
      rData[idx + 1] = roughVal;
      rData[idx + 2] = roughVal;
      rData[idx + 3] = 255;
    }
  }

  ctx.putImageData(colorImg, 0, 0);
  bctx.putImageData(bumpImg, 0, 0);
  rctx.putImageData(roughImg, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = 4;

  const normalMap = heightCanvasToNormalTexture(bumpCanvas, 2.2, true);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;

  const result = { map, bumpMap, normalMap, roughnessMap };
  marbleCache.set(theme, result);
  return result;
}

/* --------------------------------------------------------------------------
   3. Brushed Antique Bronze PBR Maps (Cached Globally)
   -------------------------------------------------------------------------- */
export function createBrushedBronzeTextures(): BronzeTextureSet {
  if (bronzeCache) return bronzeCache;

  const size = 256;
  const invSize = 1 / size;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;
  const bumpImg = bctx.createImageData(size, size);
  const bData = bumpImg.data;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;
  const roughImg = rctx.createImageData(size, size);
  const rData = roughImg.data;

  for (let y = 0; y < size; y++) {
    const v = y * invSize;
    const rowStreak = hash2D(17, y, 509);
    const rowOff = y * size;
    for (let x = 0; x < size; x++) {
      const u = x * invSize;
      const idx = (rowOff + x) << 2;
      const patina = tileFbm(u, v, 4, 3, 601);
      const micro = tileValueNoise(u * 20, v * 8, 20, 613);
      const streak = rowStreak * 0.65 + micro * 0.35;

      const bVal = Math.max(85, Math.min(175, (122 + (streak - 0.5) * 38 + 0.5) | 0));
      bData[idx] = bVal;
      bData[idx + 1] = bVal;
      bData[idx + 2] = bVal;
      bData[idx + 3] = 255;

      const rVal = Math.max(56, Math.min(148, (78 + patina * 34 + (1 - streak) * 18 + 0.5) | 0));
      rData[idx] = rVal;
      rData[idx + 1] = rVal;
      rData[idx + 2] = rVal;
      rData[idx + 3] = 255;
    }
  }

  bctx.putImageData(bumpImg, 0, 0);
  rctx.putImageData(roughImg, 0, 0);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;

  bronzeCache = { bumpMap, roughnessMap };
  return bronzeCache;
}

export function createCathedralGlowTexture(theme: ThemeMode): THREE.CanvasTexture {
  const cached = glowCache.get(theme);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 8, half, half, half);
  if (theme === 'dark') {
    grad.addColorStop(0, 'rgba(228, 199, 116, 0.24)');
    grad.addColorStop(0.45, 'rgba(200, 164, 70, 0.09)');
    grad.addColorStop(1, 'rgba(17, 23, 39, 0)');
  } else {
    grad.addColorStop(0, 'rgba(150, 114, 27, 0.16)');
    grad.addColorStop(0.45, 'rgba(200, 164, 70, 0.07)');
    grad.addColorStop(1, 'rgba(246, 240, 226, 0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  glowCache.set(theme, tex);
  return tex;
}

/* --------------------------------------------------------------------------
   4. Carved Stone Key-Tessera PBR Maps (Roman Numeral + Chiseled Marginalia)
   -------------------------------------------------------------------------- */
export function createKeyTesseraPbrTextures(
  skill: TesseraSkill,
  theme: ThemeMode,
  fontsReady = true
): KeyTesseraTextureSet {
  const cacheKey = `${skill.id}:${theme}:${fontsReady ? 'f1' : 'f0'}`;
  const cached = keyTesseraCache.get(cacheKey);
  if (cached) return cached;

  const size = 256;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d')!;

  const isDark = theme === 'dark';

  // Albedo background + organic mineral veining
  ctx.fillStyle = isDark ? '#1A2440' : '#EFE4CA';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = isDark ? 'rgba(228, 199, 116, 0.08)' : 'rgba(130, 96, 20, 0.1)';
  ctx.lineWidth = 1.3;
  for (let v = 0; v < 3; v++) {
    ctx.beginPath();
    const y0 = 38 + v * 74;
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(85, y0 - 16, 170, y0 + 18, size, y0 - 6);
    ctx.stroke();
  }

  // Subtle recessed bevel AO shading around key perimeter
  const edgeShade = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.25,
    size / 2,
    size / 2,
    size * 0.72
  );
  edgeShade.addColorStop(0, 'rgba(0,0,0,0)');
  edgeShade.addColorStop(1, isDark ? 'rgba(6, 10, 20, 0.34)' : 'rgba(120, 100, 62, 0.14)');
  ctx.fillStyle = edgeShade;
  ctx.fillRect(0, 0, size, size);

  // Neutral bump plateau & satin-matte roughness base
  bctx.fillStyle = '#969696';
  bctx.fillRect(0, 0, size, size);
  rctx.fillStyle = '#6A6A6A';
  rctx.fillRect(0, 0, size, size);

  const gold = isDark ? 'rgba(228, 199, 116, 0.56)' : 'rgba(122, 88, 16, 0.76)';
  const ink = isDark ? '#F5EEDD' : '#140F09';
  const muted = isDark ? '#BDB3A0' : '#3E3323';
  const layerCol = LAYER_COLORS[skill.layer];

  // Carved double Roman border across albedo, bump, and roughness
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;
  strokeRoundedRect(ctx, 12, 12, size - 24, size - 24, 24);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  strokeRoundedRect(ctx, 19, 19, size - 38, size - 38, 18);
  ctx.globalAlpha = 1;

  bctx.strokeStyle = '#323232';
  bctx.lineWidth = 3.2;
  strokeRoundedRect(bctx, 12, 12, size - 24, size - 24, 24);
  bctx.lineWidth = 1.5;
  strokeRoundedRect(bctx, 19, 19, size - 38, size - 38, 18);

  rctx.strokeStyle = '#404040';
  rctx.lineWidth = 3.2;
  strokeRoundedRect(rctx, 12, 12, size - 24, size - 24, 24);

  // Classical Roman numeral on top-left (replaces modern SaaS pill badge)
  ctx.font = '700 16px "Fraunces", Georgia, serif';
  ctx.fillStyle = layerCol;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(skill.roman, 29, 36);

  bctx.font = ctx.font;
  bctx.fillStyle = '#303030';
  bctx.textAlign = 'left';
  bctx.textBaseline = 'middle';
  bctx.fillText(skill.roman, 29, 36);

  // Tactile keyHint on top-right
  ctx.font = '600 17px "JetBrains Mono", monospace';
  ctx.fillStyle = muted;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(skill.keyHint, size - 29, 36);

  bctx.font = ctx.font;
  bctx.fillStyle = '#383838';
  bctx.textAlign = 'right';
  bctx.textBaseline = 'middle';
  bctx.fillText(skill.keyHint, size - 29, 36);

  // Delicate engraved upper hairline with central liturgical diamond inlay
  ctx.strokeStyle = isDark ? 'rgba(228, 199, 116, 0.28)' : 'rgba(130, 96, 20, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(30, 54);
  ctx.lineTo(size / 2 - 10, 54);
  ctx.moveTo(size / 2 + 10, 54);
  ctx.lineTo(size - 30, 54);
  ctx.stroke();

  bctx.strokeStyle = '#4A4A4A';
  bctx.lineWidth = 1.4;
  bctx.beginPath();
  bctx.moveTo(30, 54);
  bctx.lineTo(size / 2 - 10, 54);
  bctx.moveTo(size / 2 + 10, 54);
  bctx.lineTo(size - 30, 54);
  bctx.stroke();

  // Central diamond jewel mark
  ctx.fillStyle = layerCol;
  ctx.beginPath();
  ctx.moveTo(size / 2, 49);
  ctx.lineTo(size / 2 + 5, 54);
  ctx.lineTo(size / 2, 59);
  ctx.lineTo(size / 2 - 5, 54);
  ctx.closePath();
  ctx.fill();

  bctx.fillStyle = '#D8D8D8';
  bctx.beginPath();
  bctx.moveTo(size / 2, 49);
  bctx.lineTo(size / 2 + 5, 54);
  bctx.lineTo(size / 2, 59);
  bctx.lineTo(size / 2 - 5, 54);
  bctx.closePath();
  bctx.fill();

  // Centered plump soft Fraunces label — auto-fit inside 190px
  let fontSize = 43;
  ctx.font = `700 ${fontSize}px "Fraunces", Georgia, serif`;
  while (ctx.measureText(skill.code).width > 190 && fontSize > 22) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px "Fraunces", Georgia, serif`;
  }

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(skill.code, size / 2, size / 2 + 6);

  bctx.font = ctx.font;
  bctx.fillStyle = '#222222';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillText(skill.code, size / 2, size / 2 + 6);

  rctx.font = ctx.font;
  rctx.fillStyle = '#C8C8C8';
  rctx.textAlign = 'center';
  rctx.textBaseline = 'middle';
  rctx.fillText(skill.code, size / 2, size / 2 + 6);

  // Bottom carved italic Latin inscription + corner brass micro-rivets
  ctx.font = 'italic 500 15px "Fraunces", Georgia, serif';
  ctx.fillStyle = isDark ? 'rgba(228, 199, 116, 0.72)' : 'rgba(130, 96, 20, 0.82)';
  ctx.fillText(skill.latin, size / 2, size - 36);

  bctx.font = ctx.font;
  bctx.fillStyle = '#383838';
  bctx.fillText(skill.latin, size / 2, size - 36);

  [
    [30, size - 32],
    [size - 30, size - 32],
  ].forEach(([rx, ry]) => {
    ctx.fillStyle = isDark ? '#C8A446' : '#96721B';
    ctx.beginPath();
    ctx.arc(rx, ry, 2.3, 0, Math.PI * 2);
    ctx.fill();

    bctx.fillStyle = '#D6D6D6';
    bctx.beginPath();
    bctx.arc(rx, ry, 2.3, 0, Math.PI * 2);
    bctx.fill();

    rctx.fillStyle = '#383838';
    rctx.beginPath();
    rctx.arc(rx, ry, 2.3, 0, Math.PI * 2);
    rctx.fill();
  });

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;

  const normalMap = heightCanvasToNormalTexture(bumpCanvas, 3.0, false);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = 4;

  const result = { map, bumpMap, normalMap, roughnessMap };
  keyTesseraCache.set(cacheKey, result);
  return result;
}

/* --------------------------------------------------------------------------
   5. Engraved Counter Plate & Architrave Plaque (Cached)
   -------------------------------------------------------------------------- */
export function createCounterPlateTexture(
  count: number,
  theme: ThemeMode,
  fontsReady = true
): PlateTextureSet {
  const clamped = Math.min(999, Math.max(0, count));
  const key = `${clamped}:${theme}:${fontsReady ? 'f1' : 'f0'}`;
  const cached = counterPlateCache.get(key);
  if (cached) return cached;

  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bctx = bumpCanvas.getContext('2d')!;

  const isDark = theme === 'dark';
  ctx.fillStyle = isDark ? '#121A2E' : '#EDE2C7';
  ctx.fillRect(0, 0, w, h);

  bctx.fillStyle = '#969696';
  bctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(120,90,30,0.04)';
  ctx.lineWidth = 1;
  bctx.strokeStyle = '#888888';
  bctx.lineWidth = 1;
  for (let y = 4; y < h; y += 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    bctx.beginPath();
    bctx.moveTo(0, y);
    bctx.lineTo(w, y);
    bctx.stroke();
  }

  ctx.strokeStyle = isDark ? '#C8A446' : '#96721B';
  ctx.lineWidth = 2.6;
  strokeRoundedRect(ctx, 7, 7, w - 14, h - 14, 16);

  bctx.strokeStyle = '#323232';
  bctx.lineWidth = 3;
  strokeRoundedRect(bctx, 7, 7, w - 14, h - 14, 16);

  [
    [18, 18],
    [w - 18, 18],
    [18, h - 18],
    [w - 18, h - 18],
  ].forEach(([rx, ry]) => {
    ctx.fillStyle = isDark ? '#D2AF48' : '#96721B';
    ctx.beginPath();
    ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
    ctx.fill();
    bctx.fillStyle = '#D8D8D8';
    bctx.beginPath();
    bctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
    bctx.fill();
  });

  ctx.font = '600 16px "Fraunces", Georgia, serif';
  ctx.fillStyle = isDark ? '#E4C774' : '#96721B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CVSTOS', w / 2, 33);

  bctx.font = ctx.font;
  bctx.fillStyle = '#303030';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillText('CVSTOS', w / 2, 33);

  const digits = String(clamped).padStart(2, '0');
  ctx.font = '700 50px "Fraunces", Georgia, serif';
  ctx.fillStyle = isDark ? '#F5EEDD' : '#2B241A';
  ctx.fillText(digits, w / 2, 85);

  bctx.font = ctx.font;
  bctx.fillStyle = '#242424';
  bctx.fillText(digits, w / 2, 85);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;

  if (counterPlateCache.size > 24) {
    const oldestKey = counterPlateCache.keys().next().value;
    if (oldestKey) {
      const evicted = counterPlateCache.get(oldestKey);
      evicted?.map.dispose();
      evicted?.bumpMap.dispose();
      counterPlateCache.delete(oldestKey);
    }
  }

  const result = { map, bumpMap };
  counterPlateCache.set(key, result);
  return result;
}

export function createArchitraveTexture(theme: ThemeMode, fontsReady = true): PlateTextureSet {
  const key = `${theme}:${fontsReady ? 'f1' : 'f0'}`;
  const cached = architraveCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 64;
  const bctx = bumpCanvas.getContext('2d')!;

  const isDark = theme === 'dark';
  ctx.fillStyle = isDark ? '#121A2E' : '#EDE2C7';
  ctx.fillRect(0, 0, 512, 64);

  bctx.fillStyle = '#969696';
  bctx.fillRect(0, 0, 512, 64);

  ctx.strokeStyle = isDark ? 'rgba(228, 199, 116, 0.52)' : 'rgba(150, 114, 27, 0.52)';
  ctx.lineWidth = 2;
  strokeRoundedRect(ctx, 5, 5, 502, 54, 12);

  bctx.strokeStyle = '#303030';
  bctx.lineWidth = 2.4;
  strokeRoundedRect(bctx, 5, 5, 502, 54, 12);

  let fontSize = 21;
  const label = 'Tabula Romana — Ex Silicio ad Nubem';
  ctx.font = `600 ${fontSize}px "Fraunces", Georgia, serif`;
  while (ctx.measureText(label).width > 472 && fontSize > 14) {
    fontSize -= 1;
    ctx.font = `600 ${fontSize}px "Fraunces", Georgia, serif`;
  }

  ctx.fillStyle = isDark ? '#E4C774' : '#322B20';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 33);

  bctx.font = ctx.font;
  bctx.fillStyle = '#282828';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillText(label, 256, 33);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;

  const result = { map, bumpMap };
  architraveCache.set(key, result);
  return result;
}

/* --------------------------------------------------------------------------
   6. Translucent Beeswax Candle, Flame Halo, Incense Smoke & Contact Shadow
   -------------------------------------------------------------------------- */
export function createCandleWaxTexture(theme: ThemeMode): THREE.CanvasTexture {
  const cached = candleWaxCache.get(theme);
  if (cached) return cached;

  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#FFD488');
  grad.addColorStop(0.24, '#F5BD6A');
  grad.addColorStop(0.5, theme === 'dark' ? '#EFE2C8' : '#FAF2E1');
  grad.addColorStop(1, theme === 'dark' ? '#CFC1A1' : '#DFD2B3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 245, 224, 0.34)';
  for (let i = 0; i < 6; i++) {
    const x = 14 + i * 20;
    const len = 34 + ((i * 31) % 52);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, 6);
    ctx.lineTo(x + (i % 2 === 0 ? 1.5 : -1.5), len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  candleWaxCache.set(theme, tex);
  return tex;
}

export function createCandleHaloTexture(): THREE.CanvasTexture {
  if (candleHaloCache) return candleHaloCache;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 2, half, half, half - 2);
  grad.addColorStop(0, 'rgba(255, 238, 186, 0.92)');
  grad.addColorStop(0.28, 'rgba(255, 192, 98, 0.45)');
  grad.addColorStop(0.62, 'rgba(255, 152, 62, 0.12)');
  grad.addColorStop(1, 'rgba(255, 140, 48, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  candleHaloCache = tex;
  return tex;
}

export function createIncenseWispTexture(): THREE.CanvasTexture {
  if (incenseWispCache) return incenseWispCache;

  const w = 64;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.48);
  grad.addColorStop(0, 'rgba(244, 226, 186, 0.55)');
  grad.addColorStop(0.45, 'rgba(218, 196, 152, 0.22)');
  grad.addColorStop(1, 'rgba(218, 196, 152, 0)');

  ctx.save();
  ctx.scale(0.62, 1.35);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(w / (2 * 0.62), h / (2 * 1.35), w * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  incenseWispCache = tex;
  return tex;
}

export function createScrollParchmentTexture(theme: ThemeMode): THREE.CanvasTexture {
  const cached = scrollParchmentCache.get(theme);
  if (cached) return cached;

  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (theme === 'dark') {
    grad.addColorStop(0, '#CAB894');
    grad.addColorStop(0.45, '#E4D6B8');
    grad.addColorStop(1, '#B4A17D');
  } else {
    grad.addColorStop(0, '#DFCFAF');
    grad.addColorStop(0.45, '#F5EBDA');
    grad.addColorStop(1, '#CBB996');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle manuscript ruling lines along rolled parchment
  ctx.strokeStyle = 'rgba(92, 68, 36, 0.24)';
  ctx.lineWidth = 1;
  for (let x = 24; x < w - 24; x += 14) {
    if (Math.abs(x - w / 2) < 18) continue;
    ctx.beginPath();
    ctx.moveTo(x, 16);
    ctx.lineTo(x, h - 16);
    ctx.stroke();
  }

  // Central crimson silk ribbon binding the scroll
  ctx.fillStyle = '#8F2627';
  ctx.fillRect(w / 2 - 9, 0, 18, h);
  ctx.fillStyle = '#C8A446';
  ctx.fillRect(w / 2 - 11, 0, 2, h);
  ctx.fillRect(w / 2 + 9, 0, 2, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  scrollParchmentCache.set(theme, tex);
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  if (contactShadowCache) return contactShadowCache;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, size * 0.14, half, half, half - 4);
  grad.addColorStop(0, 'rgba(5, 8, 16, 0.56)');
  grad.addColorStop(0.55, 'rgba(5, 8, 16, 0.28)');
  grad.addColorStop(1, 'rgba(5, 8, 16, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  contactShadowCache = tex;
  return tex;
}

/* --------------------------------------------------------------------------
   7. Embossed Crimson Sealing Wax Seal (SIGILLVM + ☧) Maps
   -------------------------------------------------------------------------- */
export function createWaxSealTextures(): WaxSealTextureSet {
  if (waxSealCache) return waxSealCache;

  const size = 256;
  const c = size / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  const waxGrad = ctx.createRadialGradient(c - 18, c - 18, 10, c, c, c - 4);
  waxGrad.addColorStop(0, '#BC4344');
  waxGrad.addColorStop(0.58, '#8E2627');
  waxGrad.addColorStop(0.82, '#B63F40');
  waxGrad.addColorStop(1, '#701B1C');
  ctx.fillStyle = waxGrad;
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#5C5C5C';
  bctx.fillRect(0, 0, size, size);

  bctx.strokeStyle = '#CFCFCF';
  bctx.lineWidth = 22;
  bctx.beginPath();
  bctx.arc(c, c, 98, 0, Math.PI * 2);
  bctx.stroke();

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rx = c + Math.cos(a) * 102;
    const ry = c + Math.sin(a) * 102;
    bctx.fillStyle = i % 2 === 0 ? '#E4E4E4' : '#A6A6A6';
    bctx.beginPath();
    bctx.arc(rx, ry, 10, 0, Math.PI * 2);
    bctx.fill();
  }

  ctx.strokeStyle = '#D96465';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, 68, 0, Math.PI * 2);
  ctx.stroke();

  bctx.strokeStyle = '#DCDCDC';
  bctx.lineWidth = 5;
  bctx.beginPath();
  bctx.arc(c, c, 68, 0, Math.PI * 2);
  bctx.stroke();

  ctx.font = '700 48px "Fraunces", Georgia, serif';
  ctx.fillStyle = '#DF7576';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☧', c, c - 10);

  ctx.font = '700 18px "Fraunces", Georgia, serif';
  ctx.fillText('SIGILLVM', c, c + 36);

  bctx.font = '700 48px "Fraunces", Georgia, serif';
  bctx.fillStyle = '#ECECEC';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillText('☧', c, c - 10);

  bctx.font = '700 18px "Fraunces", Georgia, serif';
  bctx.fillText('SIGILLVM', c, c + 36);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;

  const normalMap = heightCanvasToNormalTexture(bumpCanvas, 3.2, false);

  waxSealCache = { map, bumpMap, normalMap };
  return waxSealCache;
}

/* --------------------------------------------------------------------------
   8. Roman Opus Sectile Basilica Pavement Floor Texture (Cached)
   -------------------------------------------------------------------------- */
export function createBasilicaFloorTexture(theme: ThemeMode): THREE.CanvasTexture {
  const cached = floorCache.get(theme);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const isDark = theme === 'dark';

  ctx.clearRect(0, 0, size, size);

  const bands = [
    { r0: 14, r1: 68, col: isDark ? '#1A2442' : '#E7DBBE' },
    { r0: 68, r1: 138, col: isDark ? '#151E37' : '#EFE5CC' },
    { r0: 138, r1: 214, col: isDark ? '#18223C' : '#E8DCBF' },
  ];

  bands.forEach((b, bIdx) => {
    const sectors = bIdx === 0 ? 8 : 16;
    const step = (Math.PI * 2) / sectors;
    for (let i = 0; i < sectors; i++) {
      const a0 = i * step;
      const a1 = (i + 1) * step;
      ctx.beginPath();
      ctx.arc(c, c, b.r1, a0, a1);
      ctx.arc(c, c, b.r0, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? b.col : isDark ? '#131B30' : '#F3EAD5';
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(200, 164, 70, 0.06)' : 'rgba(150, 114, 27, 0.07)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  const brass = isDark ? 'rgba(216, 184, 90, 0.18)' : 'rgba(150, 114, 27, 0.16)';
  [68, 138, 214].forEach((r) => {
    ctx.strokeStyle = brass;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createRadialGradient(c, c, size * 0.24, c, c, c - 4);
  fade.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
  fade.addColorStop(0.65, 'rgba(255, 255, 255, 0.65)');
  fade.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  floorCache.set(theme, tex);
  return tex;
}

/* --------------------------------------------------------------------------
   9. Enriched Cathedral Stained-Glass Rose Window & Light Shafts (Cached)
   -------------------------------------------------------------------------- */
export function createSoftRoseWindowTexture(theme: ThemeMode): THREE.CanvasTexture {
  const cached = roseCache.get(theme);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.clearRect(0, 0, size, size);

  const bloom = ctx.createRadialGradient(c, c, 24, c, c, 252);
  if (theme === 'dark') {
    bloom.addColorStop(0, 'rgba(228, 199, 116, 0.36)');
    bloom.addColorStop(0.5, 'rgba(90, 134, 178, 0.24)');
    bloom.addColorStop(0.84, 'rgba(154, 61, 67, 0.14)');
    bloom.addColorStop(1, 'rgba(17, 23, 39, 0)');
  } else {
    bloom.addColorStop(0, 'rgba(200, 164, 70, 0.28)');
    bloom.addColorStop(0.5, 'rgba(59, 111, 153, 0.18)');
    bloom.addColorStop(0.84, 'rgba(154, 61, 67, 0.12)');
    bloom.addColorStop(1, 'rgba(246, 240, 226, 0)');
  }
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(c, c, 252, 0, Math.PI * 2);
  ctx.fill();

  const petalTones = [
    ['#4E88B8', '#2C567A'],
    ['#DFBB62', '#A6832C'],
    ['#B65056', '#7A2C32'],
  ];
  const petalAlpha = theme === 'dark' ? 0.42 : 0.32;

  const count = 12;
  const slice = (Math.PI * 2) / count;
  for (let i = 0; i < count; i++) {
    const a0 = i * slice - slice * 0.44;
    const a1 = i * slice + slice * 0.44;
    const am = i * slice;
    const [lightHex, deepHex] = petalTones[i % petalTones.length];

    const gx0 = c + Math.cos(am) * 76;
    const gy0 = c + Math.sin(am) * 76;
    const gx1 = c + Math.cos(am) * 204;
    const gy1 = c + Math.sin(am) * 204;
    const cellGrad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    cellGrad.addColorStop(0, lightHex);
    cellGrad.addColorStop(1, deepHex);

    ctx.save();
    ctx.globalAlpha = petalAlpha;
    ctx.fillStyle = cellGrad;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a0) * 68, c + Math.sin(a0) * 68);
    ctx.arc(c, c, 206, a0, a1);
    ctx.arc(c, c, 68, a1, a0, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const lead = theme === 'dark' ? 'rgba(14, 20, 36, 0.90)' : 'rgba(84, 72, 54, 0.68)';
  const silverEdge = theme === 'dark' ? 'rgba(228, 199, 116, 0.24)' : 'rgba(255, 250, 236, 0.35)';
  const goldLead = theme === 'dark' ? 'rgba(228, 199, 116, 0.45)' : 'rgba(150, 114, 27, 0.45)';

  for (let i = 0; i < count; i++) {
    const a = i * slice;
    const am = (i + 0.5) * slice;
    const px = c + Math.cos(a) * 198;
    const py = c + Math.sin(a) * 198;

    ctx.beginPath();
    ctx.arc(px, py, 22, a - Math.PI * 0.55, a + Math.PI * 0.55);
    ctx.strokeStyle = goldLead;
    ctx.lineWidth = 2;
    ctx.stroke();

    const ex = c + Math.cos(am) * 170;
    const ey = c + Math.sin(am) * 170;
    ctx.beginPath();
    ctx.arc(ex, ey, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(228, 199, 116, 0.24)';
    ctx.fill();
    ctx.strokeStyle = lead;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 46, c + Math.sin(a) * 46);
    ctx.lineTo(c + Math.cos(a) * 222, c + Math.sin(a) * 222);
    ctx.strokeStyle = lead;
    ctx.lineWidth = 4.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 48, c + Math.sin(a) * 48);
    ctx.lineTo(c + Math.cos(a) * 220, c + Math.sin(a) * 220);
    ctx.strokeStyle = silverEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  [72, 136, 198, 224].forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.strokeStyle = idx % 2 === 0 ? goldLead : lead;
    ctx.lineWidth = idx === 3 ? 6 : 3;
    ctx.stroke();
  });

  ctx.fillStyle = theme === 'dark' ? 'rgba(228, 199, 116, 0.36)' : 'rgba(200, 164, 70, 0.28)';
  ctx.beginPath();
  ctx.arc(c, c, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '600 42px "Fraunces", Georgia, serif';
  ctx.fillStyle = theme === 'dark' ? 'rgba(241, 233, 216, 0.88)' : 'rgba(50, 43, 32, 0.72)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☧', c, c + 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  roseCache.set(theme, tex);
  return tex;
}

export function createLightShaftTexture(theme: ThemeMode): THREE.CanvasTexture {
  const cached = shaftCache.get(theme);
  if (cached) return cached;

  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const vert = ctx.createLinearGradient(0, 0, 0, h);
  if (theme === 'dark') {
    vert.addColorStop(0, 'rgba(255, 222, 160, 0)');
    vert.addColorStop(0.18, 'rgba(255, 222, 160, 0.52)');
    vert.addColorStop(0.7, 'rgba(228, 199, 116, 0.18)');
    vert.addColorStop(1, 'rgba(228, 199, 116, 0)');
  } else {
    vert.addColorStop(0, 'rgba(255, 238, 192, 0)');
    vert.addColorStop(0.2, 'rgba(255, 238, 192, 0.42)');
    vert.addColorStop(0.75, 'rgba(240, 212, 146, 0.14)');
    vert.addColorStop(1, 'rgba(240, 212, 146, 0)');
  }
  ctx.fillStyle = vert;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const horiz = ctx.createLinearGradient(0, 0, w, 0);
  horiz.addColorStop(0, 'rgba(255, 255, 255, 0)');
  horiz.addColorStop(0.28, 'rgba(255, 255, 255, 0.85)');
  horiz.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
  horiz.addColorStop(0.72, 'rgba(255, 255, 255, 0.85)');
  horiz.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  shaftCache.set(theme, tex);
  return tex;
}

/* --------------------------------------------------------------------------
   10. Non-Blocking Idle Warmup for Opposite Theme (Zero-Lag Theme Switching)
   -------------------------------------------------------------------------- */
export function warmAlternateThemeTextures(
  currentTheme: ThemeMode,
  fontsReady: boolean,
  skills: TesseraSkill[]
): () => void {
  const alt: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
  const tasks: Array<() => void> = [
    () => createMarbleSurfaceTextures(alt),
    () => createBasilicaFloorTexture(alt),
    () => createSoftRoseWindowTexture(alt),
    () => createLightShaftTexture(alt),
    () => createCathedralGlowTexture(alt),
    () => createCandleWaxTexture(alt),
    () => createScrollParchmentTexture(alt),
    () => createArchitraveTexture(alt, fontsReady),
    ...skills.map((s) => () => createKeyTesseraPbrTextures(s, alt, fontsReady)),
  ];

  let idx = 0;
  let cancelled = false;
  let timerId = 0;

  const scheduleNext = () => {
    if (cancelled || idx >= tasks.length) return;
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    if (ric) {
      ric(() => {
        if (cancelled || idx >= tasks.length) return;
        tasks[idx++]();
        scheduleNext();
      });
    } else {
      timerId = window.setTimeout(() => {
        if (cancelled || idx >= tasks.length) return;
        tasks[idx++]();
        scheduleNext();
      }, 45);
    }
  };

  timerId = window.setTimeout(scheduleNext, 600);

  return () => {
    cancelled = true;
    window.clearTimeout(timerId);
  };
}
