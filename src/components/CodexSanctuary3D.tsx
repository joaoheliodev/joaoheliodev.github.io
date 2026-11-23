import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThemeMode } from '../data/codexData';
import { TESSERAE, type TesseraSkill } from '../data/tesseraeData';
import {
  createArchitraveTexture,
  createBasilicaFloorTexture,
  createBrushedBronzeTextures,
  createCandleHaloTexture,
  createCandleWaxTexture,
  createCathedralEnvironmentMap,
  createCathedralGlowTexture,
  createContactShadowTexture,
  createCounterPlateTexture,
  createKeyTesseraPbrTextures,
  createLightShaftTexture,
  createMarbleSurfaceTextures,
  createSoftRoseWindowTexture,
  createWaxSealTextures,
  LAYER_COLORS,
} from '../utils/sanctuaryTextures';

const MOTE_COUNT = 160;

// Camera screen-space basis for position = [-7.2, 7.6, 7.6] looking at [0, 0.15, 0]
const ISO_RIGHT: [number, number, number] = [0.726, 0, 0.688];
const ISO_UP: [number, number, number] = [-0.398, 0.815, 0.42];
const ISO_FORWARD: [number, number, number] = [0.56, -0.579, -0.591];

function screenOffset(right: number, up: number, depth = 0): [number, number, number] {
  return [
    right * ISO_RIGHT[0] + up * ISO_UP[0] + depth * ISO_FORWARD[0],
    right * ISO_RIGHT[1] + up * ISO_UP[1] + depth * ISO_FORWARD[1],
    right * ISO_RIGHT[2] + up * ISO_UP[2] + depth * ISO_FORWARD[2],
  ];
}

interface MoteSeed {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  tintIndex: number;
}

declare global {
  interface Window {
    __CODEX_WEBGL_STATS__?: () => {
      drawCalls: number;
      triangles: number;
      instances: number;
    };
  }
}

/* --------------------------------------------------------------------------
   Sculpted Procedural Geometry Builders
   -------------------------------------------------------------------------- */
function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw * 0.9, hh * 0.9);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

function normalizeBoxUVs(geom: THREE.BufferGeometry, w: number, d: number) {
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const uv = geom.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / w + 0.5, pos.getZ(i) / d + 0.5);
  }
  uv.needsUpdate = true;
}

function buildRoundedSlabGeometry(
  w: number,
  d: number,
  h: number,
  radius: number,
  bevel: number
): THREE.BufferGeometry {
  const innerW = Math.max(0.05, w - bevel * 2);
  const innerD = Math.max(0.05, d - bevel * 2);
  const innerH = Math.max(0.01, h - bevel * 2);
  const shape = createRoundedRectShape(innerW, innerD, Math.max(0.02, radius - bevel));

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: innerH,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 12,
  });

  geom.rotateX(-Math.PI / 2);
  geom.center();
  normalizeBoxUVs(geom, w, d);
  geom.computeVertexNormals();
  return geom;
}

function buildCounterHousingGeometry(): THREE.BufferGeometry {
  // Rounded upright plaque in XY (width 0.76, height 0.36, thickness 0.16)
  const w = 0.76;
  const h = 0.36;
  const d = 0.16;
  const bevel = 0.022;
  const shape = createRoundedRectShape(w - bevel * 2, h - bevel * 2, 0.055);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: d - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 10,
  });
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

function buildPillowyKeyGeometry(): THREE.BufferGeometry {
  const w = 0.84;
  const d = 0.74;
  const bevel = 0.056;
  const innerW = w - bevel * 2;
  const innerD = d - bevel * 2;
  const shape = createRoundedRectShape(innerW, innerD, 0.13);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.21,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 12,
  });

  geom.rotateX(-Math.PI / 2);
  geom.center();

  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y > 0) {
      const t = y / 0.16;
      const taper = 1 - t * 0.095;
      pos.setXYZ(i, x * taper, y, z * taper);
    }
  }
  pos.needsUpdate = true;
  normalizeBoxUVs(geom, w, d);
  geom.computeVertexNormals();
  return geom;
}

function buildBrassFootGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.16, 0),
    new THREE.Vector2(0.17, 0.025),
    new THREE.Vector2(0.11, 0.055),
    new THREE.Vector2(0.13, 0.08),
    new THREE.Vector2(0.1, 0.11),
    new THREE.Vector2(0.001, 0.11),
  ];
  const geom = new THREE.LatheGeometry(pts, 20);
  geom.computeVertexNormals();
  return geom;
}

function buildCandlestickGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.15, 0),
    new THREE.Vector2(0.155, 0.015),
    new THREE.Vector2(0.11, 0.03),
    new THREE.Vector2(0.058, 0.046),
    new THREE.Vector2(0.052, 0.064),
    new THREE.Vector2(0.125, 0.075),
    new THREE.Vector2(0.135, 0.092),
    new THREE.Vector2(0.112, 0.096),
    new THREE.Vector2(0.075, 0.078),
    new THREE.Vector2(0.001, 0.078),
  ];
  const geom = new THREE.LatheGeometry(pts, 24);
  geom.computeVertexNormals();
  return geom;
}

function buildCandleWaxGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.001, 0.074),
    new THREE.Vector2(0.066, 0.074),
    new THREE.Vector2(0.065, 0.24),
    new THREE.Vector2(0.06, 0.345),
    new THREE.Vector2(0.056, 0.365),
    new THREE.Vector2(0.042, 0.362),
    new THREE.Vector2(0.018, 0.348),
    new THREE.Vector2(0.001, 0.346),
  ];
  const geom = new THREE.LatheGeometry(pts, 20);
  geom.computeVertexNormals();
  return geom;
}

function buildFlameTeardropGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.019, 0.007),
    new THREE.Vector2(0.027, 0.024),
    new THREE.Vector2(0.022, 0.05),
    new THREE.Vector2(0.01, 0.078),
    new THREE.Vector2(0.002, 0.099),
    new THREE.Vector2(0.001, 0.102),
  ];
  const geom = new THREE.LatheGeometry(pts, 16);
  geom.computeVertexNormals();
  return geom;
}

function buildWaxSealGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.184, 0),
    new THREE.Vector2(0.192, 0.012),
    new THREE.Vector2(0.176, 0.036),
    new THREE.Vector2(0.148, 0.052),
    new THREE.Vector2(0.122, 0.046),
    new THREE.Vector2(0.106, 0.034),
    new THREE.Vector2(0.001, 0.034),
  ];
  const geom = new THREE.LatheGeometry(pts, 32);
  // Planar top-down UVs so stamped SIGILLVM relief maps without polar distortion
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const uv = geom.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / 0.39 + 0.5, 0.5 - pos.getZ(i) / 0.39);
  }
  uv.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

function buildFlutedColumnGeometry(height: number): THREE.BufferGeometry {
  const radialSegs = 80; // Exact multiple of 20 flutes -> sharp Doric/Roman fillets
  const heightSegs = 14;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= heightSegs; row++) {
    const v = row / heightSegs;
    const y = (v - 0.5) * height;
    const entasis = 1 + 0.04 * Math.sin(v * Math.PI * 0.85) - 0.11 * v;
    const endFade =
      THREE.MathUtils.smoothstep(v, 0.015, 0.065) *
      (1 - THREE.MathUtils.smoothstep(v, 0.935, 0.985));
    const baseR = 0.345 * entasis;

    for (let col = 0; col <= radialSegs; col++) {
      const u = col / radialSegs;
      const theta = u * Math.PI * 2;
      const fluteDepth = 0.023 * Math.pow(Math.abs(Math.sin(theta * 10)), 0.78) * endFade;
      const r = baseR - fluteDepth;
      positions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
      uvs.push(u * 2, v * 3);
    }
  }

  const stride = radialSegs + 1;
  for (let row = 0; row < heightSegs; row++) {
    for (let col = 0; col < radialSegs; col++) {
      const a = row * stride + col;
      const b = a + 1;
      const c = (row + 1) * stride + col;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setIndex(indices);
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();
  return geom;
}

function buildAtticBaseGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.46, 0),
    new THREE.Vector2(0.46, 0.08),
    new THREE.Vector2(0.43, 0.11),
    new THREE.Vector2(0.44, 0.16),
    new THREE.Vector2(0.39, 0.21),
    new THREE.Vector2(0.35, 0.26),
    new THREE.Vector2(0.39, 0.31),
    new THREE.Vector2(0.38, 0.37),
    new THREE.Vector2(0.34, 0.42),
    new THREE.Vector2(0.001, 0.44),
  ];
  const geom = new THREE.LatheGeometry(pts, 28);
  geom.computeVertexNormals();
  return geom;
}

function buildCompositeCapitalGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.001, -0.14),
    new THREE.Vector2(0.32, -0.14),
    new THREE.Vector2(0.35, -0.11),
    new THREE.Vector2(0.31, -0.07),
    new THREE.Vector2(0.35, 0.02),
    new THREE.Vector2(0.44, 0.14),
    new THREE.Vector2(0.47, 0.19),
    new THREE.Vector2(0.47, 0.25),
    new THREE.Vector2(0.001, 0.26),
  ];
  const geom = new THREE.LatheGeometry(pts, 28);
  geom.computeVertexNormals();
  return geom;
}

function buildMoteGeometry(): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(0.32, 0.22, 3, 2);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 7) * 0.022 + x * y * 0.16);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

function createMoteSeeds(): MoteSeed[] {
  let seed = 0x73c91a;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  return Array.from({ length: MOTE_COUNT }, (_, i) => ({
    x: (rand() - 0.5) * 24,
    y: (rand() - 0.5) * 14 - 1.5,
    z: -1 - rand() * 14,
    rx: rand() * Math.PI,
    ry: rand() * Math.PI,
    rz: rand() * Math.PI,
    scale: 0.45 + rand() * 0.85,
    tintIndex: i % 4,
  }));
}

// Pre-allocated outside render loop (zero per-frame GC)
const SCRATCH_OBJ = new THREE.Object3D();
const SCRATCH_COLOR = new THREE.Color();
const MARBLE_NORMAL_SCALE = new THREE.Vector2(0.45, 0.45);
const ENGRAVED_NORMAL_SCALE = new THREE.Vector2(0.55, 0.55);
const TARGET_GLOW_COLOR = new THREE.Color('#E4C774');

/* --------------------------------------------------------------------------
   0. Procedural HDR Sanctuary Environment (PMREM IBL + Neutral ToneMapping)
   -------------------------------------------------------------------------- */
function CathedralEnvironment({ theme }: { theme: ThemeMode }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = theme === 'dark' ? 1.08 : 1.0;

    const env = createCathedralEnvironmentMap(gl, theme);
    scene.environment = env.texture;

    return () => {
      if (scene.environment === env.texture) {
        scene.environment = null;
      }
      env.dispose();
    };
  }, [gl, scene, theme]);

  return null;
}

/* --------------------------------------------------------------------------
   1. Single-Draw-Call InstancedMesh Parchment Slips & Gold Incense Motes
   -------------------------------------------------------------------------- */
function DistantMoteField({
  theme,
  reducedMotionRef,
}: {
  theme: ThemeMode;
  reducedMotionRef: React.RefObject<boolean>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => buildMoteGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.88,
        metalness: 0.14,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: theme === 'dark' ? 0.24 : 0.2,
      }),
    [theme]
  );
  const seeds = useMemo(() => createMoteSeeds(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const palette =
      theme === 'dark'
        ? ['#28355C', '#C8A446', '#3A4A73', '#9E9072']
        : ['#DDD0B0', '#96721B', '#CFC09C', '#9E8C68'];

    seeds.forEach((s, i) => {
      SCRATCH_OBJ.position.set(s.x, s.y, s.z);
      SCRATCH_OBJ.rotation.set(s.rx, s.ry, s.rz);
      SCRATCH_OBJ.scale.setScalar(s.scale);
      SCRATCH_OBJ.updateMatrix();
      mesh.setMatrixAt(i, SCRATCH_OBJ.matrix);
      SCRATCH_COLOR.set(palette[s.tintIndex]);
      mesh.setColorAt(i, SCRATCH_COLOR);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [seeds, theme]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh || reducedMotionRef.current) return;
    const dt = Math.min(delta, 0.1);
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollProg = window.scrollY / maxScroll;
    mesh.rotation.y = THREE.MathUtils.damp(
      mesh.rotation.y,
      scrollProg * 0.35 + state.clock.elapsedTime * 0.012,
      2.2,
      dt
    );
    mesh.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.22;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MOTE_COUNT]} frustumCulled={false} />
  );
}

/* --------------------------------------------------------------------------
   2. Realistic Sculpted Fluted Roman Apse, Opus Sectile Floor & Rosa Vitrea
   -------------------------------------------------------------------------- */
const APSE_CENTER: [number, number] = [0.8, -0.8];
const APSE_RADIUS = 7.6;
const COL_ANGLES_DEG = [-77, -55, -33, -11, 11, 33, 55, 77];
const COL_Y_BASE = -7.7;
const COL_SHAFT_H = 5.2;
const COL_Y_CAP = COL_Y_BASE + COL_SHAFT_H;

function CathedralBackdrop3D({
  theme,
  marbleTextures,
  bronzeTextures,
  candleHaloTex,
  reducedMotionRef,
}: {
  theme: ThemeMode;
  marbleTextures: {
    map: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  };
  bronzeTextures: {
    bumpMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  };
  candleHaloTex: THREE.CanvasTexture;
  reducedMotionRef: React.RefObject<boolean>;
}) {
  const backdropRef = useRef<THREE.Group>(null);
  const roseGroupRef = useRef<THREE.Group>(null);
  const lanternLRef = useRef<THREE.Group>(null);
  const lanternRRef = useRef<THREE.Group>(null);

  const roseTex = useMemo(() => createSoftRoseWindowTexture(theme), [theme]);
  const shaftTex = useMemo(() => createLightShaftTexture(theme), [theme]);
  const floorTex = useMemo(() => createBasilicaFloorTexture(theme), [theme]);
  const flutedColGeo = useMemo(() => buildFlutedColumnGeometry(COL_SHAFT_H), []);
  const atticBaseGeo = useMemo(() => buildAtticBaseGeometry(), []);
  const capitalGeo = useMemo(() => buildCompositeCapitalGeometry(), []);

  useEffect(() => () => roseTex.dispose(), [roseTex]);
  useEffect(() => () => shaftTex.dispose(), [shaftTex]);
  useEffect(() => () => floorTex.dispose(), [floorTex]);
  useEffect(() => () => flutedColGeo.dispose(), [flutedColGeo]);
  useEffect(() => () => atticBaseGeo.dispose(), [atticBaseGeo]);
  useEffect(() => () => capitalGeo.dispose(), [capitalGeo]);

  const columns = useMemo(
    () =>
      COL_ANGLES_DEG.map((deg) => {
        const theta = -Math.PI / 4 + (deg * Math.PI) / 180;
        return {
          theta,
          x: APSE_CENTER[0] + Math.cos(theta) * APSE_RADIUS,
          z: APSE_CENTER[1] + Math.sin(theta) * APSE_RADIUS,
        };
      }),
    []
  );

  const arches = useMemo(() => {
    const items: { mx: number; mz: number; rotY: number; radius: number }[] = [];
    for (let i = 0; i < columns.length - 1; i++) {
      const a = columns[i];
      const b = columns[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      items.push({
        mx: (a.x + b.x) * 0.5,
        mz: (a.z + b.z) * 0.5,
        rotY: Math.atan2(-dz, dx),
        radius: Math.hypot(dx, dz) * 0.5,
      });
    }
    return items;
  }, [columns]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const backdrop = backdropRef.current;
    const rose = roseGroupRef.current;
    const elapsed = state.clock.elapsedTime;

    if (rose && !reducedMotionRef.current) {
      rose.rotation.z += dt * 0.015;
    }

    if (!reducedMotionRef.current) {
      if (lanternLRef.current) lanternLRef.current.rotation.z = Math.sin(elapsed * 0.75) * 0.035;
      if (lanternRRef.current) {
        lanternRRef.current.rotation.z = Math.sin(elapsed * 0.75 + 1.4) * 0.035;
      }
    }

    if (backdrop && !reducedMotionRef.current) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProg = window.scrollY / maxScroll;
      backdrop.rotation.y = THREE.MathUtils.damp(backdrop.rotation.y, scrollProg * 0.12, 2.0, dt);
      backdrop.position.y = THREE.MathUtils.damp(backdrop.position.y, scrollProg * 0.65, 2.0, dt);
    }
  });

  const stoneCol = theme === 'dark' ? '#1E2A48' : '#EDE3CC';
  const trimStone = theme === 'dark' ? '#162039' : '#E3D6B8';
  const goldTrim = theme === 'dark' ? '#C49F42' : '#A6832E';
  const arcSpan = (154 * Math.PI) / 180;
  const arcRotY = (122 * Math.PI) / 180;

  return (
    <group ref={backdropRef}>
      {/* Grounded Roman Opus Sectile Nave Pavement Framed Beneath Altar */}
      <mesh position={[0, -0.54, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6.2, 64]} />
        <meshStandardMaterial
          map={floorTex}
          transparent
          opacity={theme === 'dark' ? 0.36 : 0.28}
          roughness={0.58}
          metalness={0.08}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={1}
        />
      </mesh>

      {/* Curved Roman Apse Stylobate Floor Ledge */}
      <group position={[APSE_CENTER[0], COL_Y_BASE - 0.18, APSE_CENTER[1]]} rotation={[0, arcRotY, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[APSE_RADIUS, 0.56, 12, 52, arcSpan]} />
          <meshStandardMaterial
            map={marbleTextures.map}
            bumpMap={marbleTextures.bumpMap}
            normalMap={marbleTextures.normalMap}
            normalScale={MARBLE_NORMAL_SCALE}
            roughnessMap={marbleTextures.roughnessMap}
            bumpScale={0.016}
            color={trimStone}
            roughness={0.78}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* Curved Upper Entablature Cornice Spanning Above the Arches */}
      <group
        position={[APSE_CENTER[0], COL_Y_CAP + 1.85, APSE_CENTER[1]]}
        rotation={[0, arcRotY, 0]}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[APSE_RADIUS, 0.28, 12, 52, arcSpan]} />
          <meshStandardMaterial
            map={marbleTextures.map}
            bumpMap={marbleTextures.bumpMap}
            normalMap={marbleTextures.normalMap}
            normalScale={MARBLE_NORMAL_SCALE}
            roughnessMap={marbleTextures.roughnessMap}
            bumpScale={0.015}
            color={stoneCol}
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>
      </group>

      {/* Curved Overhead Apse Semi-Dome Collector Rib + Center Vault Boss */}
      <group
        position={[APSE_CENTER[0], COL_Y_CAP + 4.98, APSE_CENTER[1]]}
        rotation={[0, arcRotY, 0]}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5.0, 0.08, 10, 48, arcSpan]} />
          <meshStandardMaterial
            map={marbleTextures.map}
            normalMap={marbleTextures.normalMap}
            normalScale={MARBLE_NORMAL_SCALE}
            color={stoneCol}
            roughness={0.72}
            metalness={0.12}
          />
        </mesh>
      </group>
      <mesh
        position={[APSE_CENTER[0] + 3.55, COL_Y_CAP + 4.98, APSE_CENTER[1] - 3.55]}
      >
        <cylinderGeometry args={[0.36, 0.36, 0.18, 20]} />
        <meshStandardMaterial
          color={goldTrim}
          bumpMap={bronzeTextures.bumpMap}
          roughnessMap={bronzeTextures.roughnessMap}
          roughness={0.36}
          metalness={0.85}
        />
      </mesh>

      {/* 8 Classical Fluted & Entasis Roman Columns with Attic Bases, Composite Capitals & Radial Vault Ribs */}
      {columns.map((col, idx) => (
        <group key={`apse-col-${idx}`} position={[col.x, 0, col.z]}>
          {/* Square stepped marble plinth */}
          <mesh position={[0, COL_Y_BASE + 0.12, 0]}>
            <boxGeometry args={[0.96, 0.24, 0.96]} />
            <meshStandardMaterial
              map={marbleTextures.map}
              bumpMap={marbleTextures.bumpMap}
              normalMap={marbleTextures.normalMap}
              normalScale={MARBLE_NORMAL_SCALE}
              color={trimStone}
              roughness={0.72}
              metalness={0.1}
            />
          </mesh>

          {/* Sculpted Lathe Attic Base (Torus-Scotia-Torus) */}
          <mesh position={[0, COL_Y_BASE + 0.16, 0]} geometry={atticBaseGeo}>
            <meshStandardMaterial
              map={marbleTextures.map}
              bumpMap={marbleTextures.bumpMap}
              normalMap={marbleTextures.normalMap}
              normalScale={MARBLE_NORMAL_SCALE}
              roughnessMap={marbleTextures.roughnessMap}
              bumpScale={0.014}
              color={stoneCol}
              roughness={0.64}
              metalness={0.14}
            />
          </mesh>

          {/* 20-Flute Concave Carved Marble Shaft with Classical Entasis */}
          <mesh position={[0, COL_Y_BASE + COL_SHAFT_H * 0.5, 0]} geometry={flutedColGeo}>
            <meshStandardMaterial
              map={marbleTextures.map}
              bumpMap={marbleTextures.bumpMap}
              normalMap={marbleTextures.normalMap}
              normalScale={MARBLE_NORMAL_SCALE}
              roughnessMap={marbleTextures.roughnessMap}
              bumpScale={0.015}
              color={stoneCol}
              roughness={0.58}
              metalness={0.14}
            />
          </mesh>

          {/* Brushed Bronze Astragal Collar + Sculpted Composite Capital & Abacus */}
          <mesh position={[0, COL_Y_CAP - 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.045, 8, 22]} />
            <meshStandardMaterial
              color={goldTrim}
              bumpMap={bronzeTextures.bumpMap}
              roughnessMap={bronzeTextures.roughnessMap}
              bumpScale={0.008}
              roughness={0.36}
              metalness={0.85}
            />
          </mesh>
          <mesh position={[0, COL_Y_CAP, 0]} geometry={capitalGeo}>
            <meshStandardMaterial
              map={marbleTextures.map}
              bumpMap={marbleTextures.bumpMap}
              normalMap={marbleTextures.normalMap}
              normalScale={MARBLE_NORMAL_SCALE}
              roughnessMap={marbleTextures.roughnessMap}
              bumpScale={0.014}
              color={stoneCol}
              roughness={0.62}
              metalness={0.14}
            />
          </mesh>
          <mesh position={[0, COL_Y_CAP + 0.25, 0]}>
            <boxGeometry args={[0.94, 0.14, 0.94]} />
            <meshStandardMaterial
              map={marbleTextures.map}
              color={trimStone}
              roughness={0.68}
              metalness={0.12}
            />
          </mesh>

          {/* Radial Curved Semi-Dome Vault Rib Soaring Above Each Column */}
          <group position={[0, COL_Y_CAP + 1.85, 0]} rotation={[0, -col.theta, 0]}>
            <mesh position={[-3.2, 0, 0]}>
              <torusGeometry args={[3.2, 0.075, 8, 24, Math.PI * 0.44]} />
              <meshStandardMaterial
                map={marbleTextures.map}
                normalMap={marbleTextures.normalMap}
                normalScale={MARBLE_NORMAL_SCALE}
                color={stoneCol}
                roughness={0.72}
                metalness={0.12}
              />
            </mesh>
          </group>

          {/* Oriented Carved Spandrel Rosette Medallions Facing Radially Inward */}
          {idx > 0 && idx < columns.length - 1 && (
            <group position={[0, COL_Y_CAP + 1.08, 0]} rotation={[0, -col.theta, Math.PI / 2]}>
              <mesh>
                <cylinderGeometry args={[0.24, 0.24, 0.14, 20]} />
                <meshStandardMaterial
                  map={marbleTextures.map}
                  normalMap={marbleTextures.normalMap}
                  normalScale={MARBLE_NORMAL_SCALE}
                  color={trimStone}
                  roughness={0.62}
                  metalness={0.16}
                />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.14, 0.15, 0.19, 16]} />
                <meshStandardMaterial
                  color={goldTrim}
                  bumpMap={bronzeTextures.bumpMap}
                  roughnessMap={bronzeTextures.roughnessMap}
                  roughness={0.38}
                  metalness={0.78}
                />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* 7 Spanning Semicircular Roman Arches + Keystones + 2 Suspended Votive Lanterns */}
      {arches.map((arch, idx) => (
        <group
          key={`apse-arch-${idx}`}
          position={[arch.mx, COL_Y_CAP + 0.3, arch.mz]}
          rotation={[0, arch.rotY, 0]}
        >
          <mesh>
            <torusGeometry args={[arch.radius, 0.17, 12, 26, Math.PI]} />
            <meshStandardMaterial
              map={marbleTextures.map}
              bumpMap={marbleTextures.bumpMap}
              normalMap={marbleTextures.normalMap}
              normalScale={MARBLE_NORMAL_SCALE}
              roughnessMap={marbleTextures.roughnessMap}
              bumpScale={0.014}
              color={stoneCol}
              roughness={0.64}
              metalness={0.14}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[arch.radius - 0.16, 0.06, 8, 22, Math.PI]} />
            <meshStandardMaterial color={trimStone} roughness={0.72} metalness={0.12} />
          </mesh>
          <mesh position={[0, arch.radius + 0.03, 0]}>
            <boxGeometry args={[0.21, 0.34, 0.38]} />
            <meshStandardMaterial
              color={goldTrim}
              bumpMap={bronzeTextures.bumpMap}
              roughnessMap={bronzeTextures.roughnessMap}
              bumpScale={0.008}
              roughness={0.4}
              metalness={0.78}
            />
          </mesh>

          {/* Suspended Roman Sanctuary Votive Lanterns Hanging in Bays #2 & #6 */}
          {(idx === 1 || idx === 5) && (
            <group
              ref={idx === 1 ? lanternLRef : lanternRRef}
              position={[0, arch.radius - 0.08, 0]}
            >
              {/* Brass suspension chain */}
              <mesh position={[0, -0.675, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 1.35, 6]} />
                <meshStandardMaterial color={goldTrim} metalness={0.86} roughness={0.34} />
              </mesh>
              {/* Brass canopy bell */}
              <mesh position={[0, -1.36, 0]}>
                <coneGeometry args={[0.16, 0.14, 12]} />
                <meshStandardMaterial color={goldTrim} metalness={0.86} roughness={0.32} />
              </mesh>
              {/* Glowing amber sanctuary lantern core */}
              <mesh position={[0, -1.52, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
                <meshStandardMaterial
                  color="#FFD08A"
                  emissive="#FFAD4D"
                  emissiveIntensity={theme === 'dark' ? 1.45 : 0.7}
                  transparent
                  opacity={0.88}
                  roughness={0.22}
                />
              </mesh>
              {/* Turned brass lower finial cup */}
              <mesh position={[0, -1.66, 0]}>
                <cylinderGeometry args={[0.14, 0.06, 0.1, 12]} />
                <meshStandardMaterial color={goldTrim} metalness={0.86} roughness={0.32} />
              </mesh>
              <sprite position={[0, -1.52, 0]} scale={[0.75, 0.75, 1]}>
                <spriteMaterial
                  map={candleHaloTex}
                  transparent
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                  opacity={theme === 'dark' ? 0.55 : 0.22}
                />
              </sprite>
            </group>
          )}
        </group>
      ))}

      {/* Distant Mist-Veiled Cathedral Rose Window (Rosa Vitrea) + Volumetric Light Shafts */}
      <group position={[7.8, -3.2, -7.8]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[2.56, 0.16, 12, 48]} />
          <meshStandardMaterial color={stoneCol} roughness={0.68} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <torusGeometry args={[2.38, 0.04, 8, 48]} />
          <meshStandardMaterial color={goldTrim} roughness={0.4} metalness={0.78} />
        </mesh>

        <group ref={roseGroupRef} position={[0, 0, -0.04]}>
          <mesh>
            <circleGeometry args={[2.42, 48]} />
            <meshBasicMaterial
              map={roseTex}
              transparent
              opacity={theme === 'dark' ? 0.5 : 0.3}
              depthWrite={false}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Two whisper-soft descending stained-glass light shafts */}
        <mesh position={[-0.75, -2.5, 0.75]} rotation={[0.22, 0, -0.14]}>
          <planeGeometry args={[2.4, 5.8]} />
          <meshBasicMaterial
            map={shaftTex}
            transparent
            opacity={theme === 'dark' ? 0.085 : 0.042}
            blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0.75, -2.5, 0.75]} rotation={[0.22, 0, 0.14]}>
          <planeGeometry args={[2.4, 5.8]} />
          <meshBasicMaterial
            map={shaftTex}
            transparent
            opacity={theme === 'dark' ? 0.07 : 0.036}
            blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

/* --------------------------------------------------------------------------
   3. Individual Sculpted PBR Marble Key-Tessera with Carved Fraunces Cap
   -------------------------------------------------------------------------- */
interface StoneKeyProps {
  skill: TesseraSkill;
  position: [number, number, number];
  theme: ThemeMode;
  fontsReady: boolean;
  keyGeometry: THREE.BufferGeometry;
  collarGeometry: THREE.BufferGeometry;
  marbleTextures: {
    map: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  };
  bronzeTextures: {
    bumpMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  };
  isSelected: boolean;
  isHovered: boolean;
  pressPulseRef: React.RefObject<Record<string, number>>;
  reducedMotionRef: React.RefObject<boolean>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function StoneKeyTile({
  skill,
  position,
  theme,
  fontsReady,
  keyGeometry,
  collarGeometry,
  marbleTextures,
  bronzeTextures,
  isSelected,
  isHovered,
  pressPulseRef,
  reducedMotionRef,
  onHover,
  onSelect,
}: StoneKeyProps) {
  const keyRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const jewelMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const facePbr = useMemo(
    () => createKeyTesseraPbrTextures(skill, theme),
    [skill, theme, fontsReady]
  );
  useEffect(() => {
    return () => {
      facePbr.map.dispose();
      facePbr.bumpMap.dispose();
      facePbr.normalMap.dispose();
      facePbr.roughnessMap.dispose();
    };
  }, [facePbr]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const group = keyRef.current;
    const mat = matRef.current;
    const jewelMat = jewelMatRef.current;
    if (!group || !mat) return;

    const pressedAt = pressPulseRef.current?.[skill.id] ?? 0;
    const isPressedRecently = performance.now() - pressedAt < 250;

    const targetY = isPressedRecently
      ? 0.19
      : isHovered
        ? 0.375
        : isSelected
          ? 0.355
          : 0.335;

    if (reducedMotionRef.current) {
      group.position.y = targetY;
    } else {
      group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 16, dt);
    }

    const targetEmissive = isPressedRecently
      ? 0.36
      : isHovered
        ? 0.22
        : isSelected
          ? 0.13
          : 0.015;
    mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, targetEmissive, 12, dt);

    if (jewelMat) {
      const targetJewel = isPressedRecently
        ? 1.25
        : isHovered
          ? 0.92
          : isSelected
            ? 0.7
            : 0.22;
      jewelMat.emissiveIntensity = THREE.MathUtils.damp(
        jewelMat.emissiveIntensity,
        targetJewel,
        12,
        dt
      );
    }
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    onHover(skill.id);
  };

  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = '';
    onHover(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (pressPulseRef.current) {
      pressPulseRef.current[skill.id] = performance.now();
    }
    onSelect(skill.id);
  };

  const bodyColor = theme === 'dark' ? '#202C4D' : '#F3EAD4';
  const rimGold = theme === 'dark' ? '#D2AF48' : '#96721B';
  const layerAccent = LAYER_COLORS[skill.layer];

  return (
    <group position={position}>
      {/* Brushed antique-gold recessed socket collar */}
      <mesh position={[0, 0.174, 0]} geometry={collarGeometry} receiveShadow>
        <meshStandardMaterial
          color={rimGold}
          bumpMap={bronzeTextures.bumpMap}
          roughnessMap={bronzeTextures.roughnessMap}
          bumpScale={0.008}
          metalness={0.86}
          roughness={0.34}
          envMapIntensity={1.3}
        />
      </mesh>

      <group ref={keyRef} position={[0, 0.335, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={keyGeometry}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={handleClick}
        >
          <meshPhysicalMaterial
            ref={matRef}
            map={marbleTextures.map}
            bumpMap={marbleTextures.bumpMap}
            normalMap={marbleTextures.normalMap}
            normalScale={MARBLE_NORMAL_SCALE}
            roughnessMap={marbleTextures.roughnessMap}
            bumpScale={0.014}
            color={bodyColor}
            emissive={rimGold}
            emissiveIntensity={0.015}
            roughness={0.42}
            metalness={0.08}
            clearcoat={0.28}
            clearcoatRoughness={0.32}
            envMapIntensity={1.08}
          />
        </mesh>

        {/* Satin-matte honed stone key engraving top face (glare-free Fraunces typography) */}
        <mesh position={[0, 0.163, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.64, 0.56]} />
          <meshPhysicalMaterial
            map={facePbr.map}
            bumpMap={facePbr.bumpMap}
            normalMap={facePbr.normalMap}
            normalScale={ENGRAVED_NORMAL_SCALE}
            roughnessMap={facePbr.roughnessMap}
            bumpScale={0.014}
            emissiveMap={facePbr.map}
            emissive={theme === 'dark' ? '#F1E9D8' : '#000000'}
            emissiveIntensity={theme === 'dark' ? 0.24 : 0}
            roughness={0.88}
            metalness={0.02}
            clearcoat={0}
            envMapIntensity={0.42}
          />
        </mesh>

        {/* Smooth horizontal capsule jewel inlaid along front bevel shoulder */}
        <mesh position={[0, 0.158, 0.305]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.013, 0.21, 6, 12]} />
          <meshStandardMaterial
            ref={jewelMatRef}
            color={layerAccent}
            emissive={layerAccent}
            emissiveIntensity={0.22}
            roughness={0.26}
            metalness={0.35}
          />
        </mesh>
      </group>
    </group>
  );
}

/* --------------------------------------------------------------------------
   4. Photorealistic PBR Isometric Roman Marble Key-Altar (TABVLA ROMANA)
   -------------------------------------------------------------------------- */
interface MonolithProps {
  theme: ThemeMode;
  fontsReady: boolean;
  pressCount: number;
  selectedId: string | null;
  hoveredId: string | null;
  pressPulseRef: React.RefObject<Record<string, number>>;
  reducedMotionRef: React.RefObject<boolean>;
  pointerRef: React.RefObject<{ x: number; y: number }>;
  marbleTextures: {
    map: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  };
  bronzeTextures: {
    bumpMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  };
  candleHaloTex: THREE.CanvasTexture;
  onHoverTessera: (id: string | null) => void;
  onSelectTessera: (id: string) => void;
}

function SanctuaryMonolith({
  theme,
  fontsReady,
  pressCount,
  selectedId,
  hoveredId,
  pressPulseRef,
  reducedMotionRef,
  pointerRef,
  marbleTextures,
  bronzeTextures,
  candleHaloTex,
  onHoverTessera,
  onSelectTessera,
}: MonolithProps) {
  const monolithRef = useRef<THREE.Group>(null);
  const outerHaloRef = useRef<THREE.Group>(null);
  const innerHaloRef = useRef<THREE.Group>(null);
  const flameLRef = useRef<THREE.Group>(null);
  const flameRRef = useRef<THREE.Group>(null);
  const candleLightRef = useRef<THREE.PointLight>(null);
  const altarCoreLightRef = useRef<THREE.PointLight>(null);

  const anchorsRef = useRef({
    tabulaTop: 800,
    pars1Top: 1850,
    colophonTop: 4600,
    isNarrow: false,
  });

  useEffect(() => {
    const measure = () => {
      const tabulaEl = document.getElementById('tabula-3d');
      const pars1El = document.getElementById('pars-i');
      const colophonEl = document.getElementById('colophon');
      const sy = window.scrollY;
      anchorsRef.current = {
        tabulaTop: tabulaEl ? tabulaEl.getBoundingClientRect().top + sy : window.innerHeight * 0.95,
        pars1Top: pars1El ? pars1El.getBoundingClientRect().top + sy : window.innerHeight * 2.2,
        colophonTop: colophonEl
          ? colophonEl.getBoundingClientRect().top + sy
          : document.documentElement.scrollHeight - window.innerHeight,
        isNarrow: window.innerWidth < 960,
      };
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    const timer = window.setTimeout(measure, 400);
    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(timer);
    };
  }, []);

  // Sculpted PBR geometries (all disposed cleanly on unmount)
  const keyGeometry = useMemo(() => buildPillowyKeyGeometry(), []);
  const collarGeometry = useMemo(() => buildRoundedSlabGeometry(0.92, 0.82, 0.018, 0.14, 0.008), []);
  const lowerPlinthGeo = useMemo(() => buildRoundedSlabGeometry(5.64, 4.24, 0.22, 0.28, 0.035), []);
  const goldBandGeo = useMemo(() => buildRoundedSlabGeometry(5.26, 3.9, 0.045, 0.24, 0.015), []);
  const upperPlinthGeo = useMemo(() => buildRoundedSlabGeometry(5.04, 3.74, 0.24, 0.24, 0.04), []);
  const basinGeo = useMemo(() => buildRoundedSlabGeometry(4.28, 2.88, 0.03, 0.18, 0.01), []);
  const brassFootGeo = useMemo(() => buildBrassFootGeometry(), []);
  const candlestickGeo = useMemo(() => buildCandlestickGeometry(), []);
  const candleWaxGeo = useMemo(() => buildCandleWaxGeometry(), []);
  const flameGeo = useMemo(() => buildFlameTeardropGeometry(), []);
  const waxSealGeo = useMemo(() => buildWaxSealGeometry(), []);
  const counterHousingGeo = useMemo(() => buildCounterHousingGeometry(), []);

  // Textures (all disposed cleanly on unmount or theme/count update)
  const glowTexture = useMemo(() => createCathedralGlowTexture(theme), [theme]);
  const contactShadowTex = useMemo(() => createContactShadowTexture(), []);
  const candleWaxTex = useMemo(() => createCandleWaxTexture(theme), [theme]);
  const waxSealTex = useMemo(() => createWaxSealTextures(), []);
  const architraveTex = useMemo(() => createArchitraveTexture(theme), [theme, fontsReady]);
  const counterTex = useMemo(
    () => createCounterPlateTexture(pressCount, theme),
    [pressCount, theme, fontsReady]
  );

  useEffect(() => () => keyGeometry.dispose(), [keyGeometry]);
  useEffect(() => () => collarGeometry.dispose(), [collarGeometry]);
  useEffect(() => () => lowerPlinthGeo.dispose(), [lowerPlinthGeo]);
  useEffect(() => () => goldBandGeo.dispose(), [goldBandGeo]);
  useEffect(() => () => upperPlinthGeo.dispose(), [upperPlinthGeo]);
  useEffect(() => () => basinGeo.dispose(), [basinGeo]);
  useEffect(() => () => brassFootGeo.dispose(), [brassFootGeo]);
  useEffect(() => () => candlestickGeo.dispose(), [candlestickGeo]);
  useEffect(() => () => candleWaxGeo.dispose(), [candleWaxGeo]);
  useEffect(() => () => flameGeo.dispose(), [flameGeo]);
  useEffect(() => () => waxSealGeo.dispose(), [waxSealGeo]);
  useEffect(() => () => counterHousingGeo.dispose(), [counterHousingGeo]);

  useEffect(() => () => glowTexture.dispose(), [glowTexture]);
  useEffect(() => () => contactShadowTex.dispose(), [contactShadowTex]);
  useEffect(() => () => candleWaxTex.dispose(), [candleWaxTex]);
  useEffect(() => {
    return () => {
      waxSealTex.map.dispose();
      waxSealTex.bumpMap.dispose();
      waxSealTex.normalMap.dispose();
    };
  }, [waxSealTex]);
  useEffect(() => {
    return () => {
      architraveTex.map.dispose();
      architraveTex.bumpMap.dispose();
    };
  }, [architraveTex]);
  useEffect(() => {
    return () => {
      counterTex.map.dispose();
      counterTex.bumpMap.dispose();
    };
  }, [counterTex]);

  const spokeAngles = useMemo(
    () => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2),
    []
  );
  const laurelAngles = useMemo(
    () => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2),
    []
  );
  const frontTriglyphs = useMemo(() => [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8], []);
  const sideTriglyphs = useMemo(() => [-1.2, -0.6, 0, 0.6, 1.2], []);

  // Scroll-choreographed isometric movement + calm candle flame breathing
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const monolith = monolithRef.current;
    const outerHalo = outerHaloRef.current;
    const innerHalo = innerHaloRef.current;
    if (!monolith) return;

    const elapsed = state.clock.elapsedTime;

    if (!reducedMotionRef.current) {
      if (outerHalo) outerHalo.rotation.y += dt * 0.024;
      if (innerHalo) innerHalo.rotation.y -= dt * 0.036;

      const breathe = Math.sin(elapsed * 2.1) * 0.06 + Math.sin(elapsed * 3.7) * 0.03;
      if (flameLRef.current) {
        flameLRef.current.scale.set(1, 1 + breathe, 1);
        flameLRef.current.rotation.z = Math.sin(elapsed * 1.9) * 0.05;
      }
      if (flameRRef.current) {
        flameRRef.current.scale.set(1, 1 - breathe * 0.85, 1);
        flameRRef.current.rotation.z = Math.cos(elapsed * 1.7) * 0.05;
      }
      if (candleLightRef.current) {
        candleLightRef.current.intensity = (theme === 'dark' ? 1.55 : 0.72) + breathe * 1.3;
      }
    }

    // Track latest key press impulse + active liturgical layer underglow
    let latestSkillIdx = -1;
    let latestPressedAt = 0;
    const pulses = pressPulseRef.current;
    if (pulses) {
      for (let i = 0; i < TESSERAE.length; i++) {
        const t = pulses[TESSERAE[i].id] ?? 0;
        if (t > latestPressedAt) {
          latestPressedAt = t;
          latestSkillIdx = i;
        }
      }
    }
    const pulseAge = latestPressedAt > 0 ? performance.now() - latestPressedAt : 9999;
    const pulseEnv = pulseAge < 340 ? Math.sin((pulseAge / 340) * Math.PI) : 0;

    if (altarCoreLightRef.current) {
      const glowId = hoveredId ?? selectedId;
      const activeSkill = glowId ? TESSERAE.find((item) => item.id === glowId) : null;
      TARGET_GLOW_COLOR.set(activeSkill ? LAYER_COLORS[activeSkill.layer] : '#E4C774');
      altarCoreLightRef.current.color.lerp(TARGET_GLOW_COLOR, Math.min(1, dt * 6));
      const baseInt = theme === 'dark' ? (activeSkill ? 0.58 : 0.35) : activeSkill ? 0.25 : 0.14;
      altarCoreLightRef.current.intensity = THREE.MathUtils.damp(
        altarCoreLightRef.current.intensity,
        baseInt + pulseEnv * 0.72,
        10,
        dt
      );
    }

    const { tabulaTop, pars1Top, colophonTop, isNarrow } = anchorsRef.current;
    const vh = Math.max(1, window.innerHeight);
    const scrollCenter = window.scrollY + vh * 0.5;

    const tTabula = THREE.MathUtils.smoothstep(
      scrollCenter,
      tabulaTop - vh * 0.18,
      tabulaTop + vh * 0.35
    );
    const tChapters = THREE.MathUtils.smoothstep(
      scrollCenter,
      pars1Top - vh * 0.3,
      pars1Top + vh * 0.18
    );
    const tColophon = THREE.MathUtils.smoothstep(
      scrollCenter,
      colophonTop - vh * 0.45,
      colophonTop + vh * 0.12
    );

    const p0Pos = isNarrow ? screenOffset(0, -1.65, -0.5) : screenOffset(1.88, -0.18, 0);
    const p0rx = 0.04;
    const p0ry = isNarrow ? -0.62 : -0.48;
    const p0s = isNarrow ? 0.52 : 0.78;

    const p1Pos = screenOffset(0, isNarrow ? -0.06 : -0.66, isNarrow ? -0.65 : 0.35);
    const p1rx = 0.08;
    const p1ry = -0.62;
    const p1s = isNarrow ? 0.56 : 0.94;

    const p2Pos = screenOffset(0, -0.25, -4.8);
    const p2rx = 0.24;
    const p2ry = 0.35;
    const p2s = 0.58;

    const p3Pos = isNarrow ? screenOffset(0, -1.75, -0.8) : screenOffset(1.92, -0.2, -0.2);
    const p3rx = 0.06;
    const p3ry = -0.35;
    const p3s = isNarrow ? 0.5 : 0.74;

    let tx = THREE.MathUtils.lerp(p0Pos[0], p1Pos[0], tTabula);
    let ty = THREE.MathUtils.lerp(p0Pos[1], p1Pos[1], tTabula);
    let tz = THREE.MathUtils.lerp(p0Pos[2], p1Pos[2], tTabula);
    let trx = THREE.MathUtils.lerp(p0rx, p1rx, tTabula);
    let tryRot = THREE.MathUtils.lerp(p0ry, p1ry, tTabula);
    let ts = THREE.MathUtils.lerp(p0s, p1s, tTabula);

    tx = THREE.MathUtils.lerp(tx, p2Pos[0], tChapters);
    ty = THREE.MathUtils.lerp(ty, p2Pos[1], tChapters);
    tz = THREE.MathUtils.lerp(tz, p2Pos[2], tChapters);
    trx = THREE.MathUtils.lerp(trx, p2rx, tChapters);
    tryRot = THREE.MathUtils.lerp(tryRot, p2ry, tChapters);
    ts = THREE.MathUtils.lerp(ts, p2s, tChapters);

    tx = THREE.MathUtils.lerp(tx, p3Pos[0], tColophon);
    ty = THREE.MathUtils.lerp(ty, p3Pos[1], tColophon);
    tz = THREE.MathUtils.lerp(tz, p3Pos[2], tColophon);
    trx = THREE.MathUtils.lerp(trx, p3rx, tColophon);
    tryRot = THREE.MathUtils.lerp(tryRot, p3ry, tColophon);
    ts = THREE.MathUtils.lerp(ts, p3s, tColophon);

    let trzImpulse = 0;
    if (!reducedMotionRef.current) {
      ty += Math.sin(elapsed * 0.65) * 0.045;
      tryRot += (pointerRef.current?.x ?? 0) * 0.048;
      trx += (pointerRef.current?.y ?? 0) * 0.028;

      if (latestSkillIdx >= 0 && pulseEnv > 0) {
        const colNorm = ((latestSkillIdx % 4) - 1.5) / 1.5;
        const rowNorm = Math.floor(latestSkillIdx / 4) - 1;
        trx += rowNorm * 0.018 * pulseEnv;
        trzImpulse = -colNorm * 0.018 * pulseEnv;
        ty -= 0.014 * pulseEnv;
      }
    }

    if (reducedMotionRef.current) {
      monolith.position.set(tx, ty, tz);
      monolith.rotation.set(trx, tryRot, 0);
      monolith.scale.setScalar(ts);
      return;
    }

    monolith.position.x = THREE.MathUtils.damp(monolith.position.x, tx, 2.8, dt);
    monolith.position.y = THREE.MathUtils.damp(monolith.position.y, ty, 2.8, dt);
    monolith.position.z = THREE.MathUtils.damp(monolith.position.z, tz, 2.8, dt);
    monolith.rotation.x = THREE.MathUtils.damp(monolith.rotation.x, trx, 2.8, dt);
    monolith.rotation.y = THREE.MathUtils.damp(monolith.rotation.y, tryRot, 2.8, dt);
    monolith.rotation.z = THREE.MathUtils.damp(monolith.rotation.z, trzImpulse, 10, dt);

    const nextScale = THREE.MathUtils.damp(monolith.scale.x, ts, 2.8, dt);
    monolith.scale.setScalar(nextScale);
  });

  const lowerMarble = theme === 'dark' ? '#17213B' : '#EAE0C6';
  const upperMarble = theme === 'dark' ? '#1D2948' : '#F6EFE0';
  const wellStone = theme === 'dark' ? '#0C1222' : '#D5C7A6';
  const goldColor = theme === 'dark' ? '#D2AF48' : '#96721B';

  return (
    <group
      ref={monolithRef}
      position={screenOffset(1.88, -0.18, 0)}
      rotation={[0.04, -0.48, 0]}
      scale={0.78}
    >
      {/* Candlelight radial glow halo & Grounded Plinth Contact AO Shadow */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.6, 8.6]} />
        <meshBasicMaterial map={glowTexture} transparent depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.6, 5.1]} />
        <meshBasicMaterial
          map={contactShadowTex}
          transparent
          opacity={theme === 'dark' ? 0.68 : 0.36}
          depthWrite={false}
        />
      </mesh>

      {/* Floor Astrolabe Rings */}
      <group ref={outerHaloRef} position={[0, -0.46, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.48, 0.016, 8, 64]} />
          <meshStandardMaterial
            color={goldColor}
            transparent
            opacity={0.28}
            metalness={0.82}
            roughness={0.32}
          />
        </mesh>
        {spokeAngles.map((ang) => (
          <mesh key={ang} rotation={[0, ang, 0]}>
            <boxGeometry args={[6.8, 0.008, 0.012]} />
            <meshStandardMaterial
              color={goldColor}
              transparent
              opacity={0.14}
              metalness={0.8}
              roughness={0.34}
            />
          </mesh>
        ))}
      </group>

      <group ref={innerHaloRef} position={[0, -0.45, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.38, 0.012, 8, 64]} />
          <meshStandardMaterial
            color={goldColor}
            transparent
            opacity={0.24}
            metalness={0.82}
            roughness={0.32}
          />
        </mesh>
        {spokeAngles.map((ang) => (
          <mesh
            key={`tick-${ang}`}
            position={[Math.cos(ang) * 2.38, 0, Math.sin(ang) * 2.38]}
            rotation={[0, -ang, 0]}
          >
            <boxGeometry args={[0.14, 0.016, 0.024]} />
            <meshStandardMaterial color={goldColor} transparent opacity={0.34} metalness={0.82} />
          </mesh>
        ))}
      </group>

      {/* 4 Sculpted Classical Stepped Brass Reliquary Feet Supporting the Altar */}
      {[
        [-2.42, -0.37, -1.8],
        [2.42, -0.37, -1.8],
        [-2.42, -0.37, 1.8],
        [2.42, -0.37, 1.8],
      ].map(([fx, fy, fz], idx) => (
        <mesh key={`brass-foot-${idx}`} position={[fx, fy, fz]} geometry={brassFootGeo} castShadow>
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            bumpScale={0.008}
            metalness={0.88}
            roughness={0.34}
            envMapIntensity={1.35}
          />
        </mesh>
      ))}

      {/* Stepped Beveled PBR Marble Plinth Tiers with Clearcoat & Tangent-Space Normals */}
      <mesh position={[0, -0.18, 0]} geometry={lowerPlinthGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={marbleTextures.map}
          bumpMap={marbleTextures.bumpMap}
          normalMap={marbleTextures.normalMap}
          normalScale={MARBLE_NORMAL_SCALE}
          roughnessMap={marbleTextures.roughnessMap}
          bumpScale={0.018}
          color={lowerMarble}
          roughness={0.44}
          metalness={0.08}
          clearcoat={0.26}
          clearcoatRoughness={0.34}
          envMapIntensity={1.15}
        />
      </mesh>

      {/* Brushed Antique-Gold Reveal Band */}
      <mesh position={[0, -0.075, 0]} geometry={goldBandGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={goldColor}
          bumpMap={bronzeTextures.bumpMap}
          roughnessMap={bronzeTextures.roughnessMap}
          bumpScale={0.008}
          metalness={0.88}
          roughness={0.34}
          envMapIntensity={1.35}
        />
      </mesh>

      <mesh position={[0, 0.05, 0]} geometry={upperPlinthGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={marbleTextures.map}
          bumpMap={marbleTextures.bumpMap}
          normalMap={marbleTextures.normalMap}
          normalScale={MARBLE_NORMAL_SCALE}
          roughnessMap={marbleTextures.roughnessMap}
          bumpScale={0.016}
          color={upperMarble}
          roughness={0.38}
          metalness={0.08}
          clearcoat={0.28}
          clearcoatRoughness={0.3}
          envMapIntensity={1.15}
        />
      </mesh>

      {/* Rounded Brushed-Bronze Roman Triglyphs Along Front & Left Fascia */}
      {frontTriglyphs.map((tx) => (
        <mesh key={`ft-${tx}`} position={[tx, 0.05, 1.87]} castShadow>
          <capsuleGeometry args={[0.022, 0.14, 4, 8]} />
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            bumpScale={0.008}
            metalness={0.88}
            roughness={0.34}
            envMapIntensity={1.35}
          />
        </mesh>
      ))}
      {sideTriglyphs.map((tz) => (
        <mesh key={`st-${tz}`} position={[-2.52, 0.05, tz]} castShadow>
          <capsuleGeometry args={[0.022, 0.14, 4, 8]} />
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            bumpScale={0.008}
            metalness={0.88}
            roughness={0.34}
            envMapIntensity={1.35}
          />
        </mesh>
      ))}

      {/* 4 Corner Brushed-Bronze Finial Studs */}
      {[
        [-2.34, 0.185, -1.7],
        [2.34, 0.185, -1.7],
        [-2.34, 0.185, 1.7],
        [2.34, 0.185, 1.7],
      ].map(([fx, fy, fz], idx) => (
        <mesh key={`finial-${idx}`} position={[fx, fy, fz]} castShadow>
          <cylinderGeometry args={[0.042, 0.058, 0.038, 16]} />
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            bumpScale={0.008}
            metalness={0.88}
            roughness={0.3}
            envMapIntensity={1.35}
          />
        </mesh>
      ))}

      {/* Two Realistic Roman Brass Votive Candles (Turned Chalice, Subsurface Beeswax & Teardrop Flame) */}
      <pointLight
        ref={candleLightRef}
        position={[0, 1.25, -1.7]}
        distance={7.5}
        decay={2}
        intensity={theme === 'dark' ? 1.55 : 0.72}
        color="#FFD38E"
      />
      {[
        { pos: [-2.64, -0.075, -1.94] as [number, number, number], ref: flameLRef },
        { pos: [2.64, -0.075, -1.94] as [number, number, number], ref: flameRRef },
      ].map(({ pos, ref }, idx) => (
        <group key={`votive-${idx}`} position={pos}>
          {/* Turned Classical Brass Candlestick Chalice */}
          <mesh geometry={candlestickGeo} castShadow>
            <meshStandardMaterial
              color={goldColor}
              bumpMap={bronzeTextures.bumpMap}
              roughnessMap={bronzeTextures.roughnessMap}
              bumpScale={0.008}
              metalness={0.88}
              roughness={0.32}
              envMapIntensity={1.35}
            />
          </mesh>

          {/* Cupped Translucent Glowing Beeswax Pillar */}
          <mesh geometry={candleWaxGeo} castShadow>
            <meshStandardMaterial
              map={candleWaxTex}
              emissiveMap={candleWaxTex}
              emissive="#FFAD52"
              emissiveIntensity={theme === 'dark' ? 0.42 : 0.16}
              roughness={0.55}
              metalness={0.02}
            />
          </mesh>

          {/* Dark Braided Wick Inside Molten Pool */}
          <mesh position={[0, 0.358, 0]}>
            <cylinderGeometry args={[0.004, 0.005, 0.028, 8]} />
            <meshStandardMaterial color="#1B1714" roughness={0.95} />
          </mesh>

          {/* Layered Teardrop Flame + Camera-Facing Luminous Halo */}
          <group ref={ref} position={[0, 0.368, 0]}>
            <mesh geometry={flameGeo}>
              <meshStandardMaterial
                color="#FFC266"
                emissive="#FF9838"
                emissiveIntensity={1.5}
                transparent
                opacity={0.88}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0, 0.012, 0]} scale={[0.52, 0.62, 0.52]} geometry={flameGeo}>
              <meshBasicMaterial color="#FFF6D6" toneMapped={false} />
            </mesh>
            <sprite position={[0, 0.048, 0]} scale={[0.34, 0.34, 1]}>
              <spriteMaterial
                map={candleHaloTex}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
                opacity={theme === 'dark' ? 0.82 : 0.36}
              />
            </sprite>
          </group>
        </group>
      ))}

      {/* Dark Recessed Honed-Stone Basin + Liturgical Underglow Light */}
      <pointLight
        ref={altarCoreLightRef}
        position={[0, 0.55, 0.1]}
        distance={4.2}
        decay={2}
        intensity={theme === 'dark' ? 0.35 : 0.14}
        color="#E4C774"
      />
      <mesh position={[0, 0.165, 0.02]} geometry={basinGeo} receiveShadow>
        <meshStandardMaterial
          map={marbleTextures.map}
          bumpMap={marbleTextures.bumpMap}
          normalMap={marbleTextures.normalMap}
          normalScale={MARBLE_NORMAL_SCALE}
          roughnessMap={marbleTextures.roughnessMap}
          bumpScale={0.012}
          color={wellStone}
          roughness={0.78}
          metalness={0.08}
        />
      </mesh>

      {/* Carved Brushed-Bronze Reliquary Grid Coffer Partition Bars (3 vertical x 2 horizontal) */}
      {[-1.02, 0, 1.02].map((gx) => (
        <mesh key={`grid-v-${gx}`} position={[gx, 0.18, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.013, 2.74, 4, 8]} />
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            metalness={0.88}
            roughness={0.34}
            envMapIntensity={1.35}
          />
        </mesh>
      ))}
      {[-0.43, 0.47].map((gz) => (
        <mesh key={`grid-h-${gz}`} position={[0, 0.18, gz]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.013, 4.14, 4, 8]} />
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            metalness={0.88}
            roughness={0.34}
            envMapIntensity={1.35}
          />
        </mesh>
      ))}

      {/* Rounded Brushed-Bronze Cornice Strips Framing the Basin */}
      <mesh position={[0, 0.18, -1.43]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.015, 4.3, 4, 8]} />
        <meshStandardMaterial
          color={goldColor}
          bumpMap={bronzeTextures.bumpMap}
          roughnessMap={bronzeTextures.roughnessMap}
          metalness={0.88}
          roughness={0.32}
          envMapIntensity={1.35}
        />
      </mesh>
      <mesh position={[0, 0.18, 1.47]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.015, 4.3, 4, 8]} />
        <meshStandardMaterial
          color={goldColor}
          bumpMap={bronzeTextures.bumpMap}
          roughnessMap={bronzeTextures.roughnessMap}
          metalness={0.88}
          roughness={0.32}
          envMapIntensity={1.35}
        />
      </mesh>
      <mesh position={[-2.15, 0.18, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.015, 2.88, 4, 8]} />
        <meshStandardMaterial
          color={goldColor}
          bumpMap={bronzeTextures.bumpMap}
          roughnessMap={bronzeTextures.roughnessMap}
          metalness={0.88}
          roughness={0.32}
          envMapIntensity={1.35}
        />
      </mesh>
      <mesh position={[2.15, 0.18, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.015, 2.88, 4, 8]} />
        <meshStandardMaterial
          color={goldColor}
          bumpMap={bronzeTextures.bumpMap}
          roughnessMap={bronzeTextures.roughnessMap}
          metalness={0.88}
          roughness={0.32}
          envMapIntensity={1.35}
        />
      </mesh>

      {/* Physically Lit Engraved Back Architrave Plaque */}
      <mesh position={[0, 0.176, -1.64]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.56, 0.28]} />
        <meshStandardMaterial
          map={architraveTex.map}
          bumpMap={architraveTex.bumpMap}
          bumpScale={0.014}
          emissiveMap={architraveTex.map}
          emissive={theme === 'dark' ? '#E4C774' : '#000000'}
          emissiveIntensity={theme === 'dark' ? 0.16 : 0}
          roughness={0.45}
          metalness={0.18}
        />
      </mesh>

      {/* Sculpted 3D Brushed-Bronze Chi-Rho (☧) Medallion with Elliptical Laurel Wreath — Back-Left */}
      <group position={[-1.92, 0.2, -1.64]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.21, 0.24, 0.06, 24]} />
          <meshStandardMaterial
            map={marbleTextures.map}
            color={lowerMarble}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 0, 0.032]}>
          <torusGeometry args={[0.21, 0.018, 8, 28]} />
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            metalness={0.88}
            roughness={0.3}
            envMapIntensity={1.35}
          />
        </mesh>
        {laurelAngles.map((ang) => (
          <mesh
            key={`leaf-${ang}`}
            position={[Math.cos(ang) * 0.245, Math.sin(ang) * 0.245, 0.02]}
            rotation={[0, 0, ang + 0.4]}
            scale={[1.8, 0.78, 0.55]}
            castShadow
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial
              color={goldColor}
              metalness={0.88}
              roughness={0.28}
              envMapIntensity={1.35}
            />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.045]} castShadow>
          <boxGeometry args={[0.032, 0.28, 0.03]} />
          <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.28} />
        </mesh>
        <mesh position={[0.045, 0.08, 0.045]} rotation={[0, 0, -Math.PI * 0.5]} castShadow>
          <torusGeometry args={[0.055, 0.015, 8, 20, Math.PI]} />
          <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.28} />
        </mesh>
        <mesh position={[0, -0.02, 0.045]} rotation={[0, 0, 0.68]} castShadow>
          <boxGeometry args={[0.026, 0.22, 0.028]} />
          <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.28} />
        </mesh>
        <mesh position={[0, -0.02, 0.045]} rotation={[0, 0, -0.68]} castShadow>
          <boxGeometry args={[0.026, 0.22, 0.028]} />
          <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.28} />
        </mesh>
      </group>

      {/* Live Angled Brushed-Bronze Counter Lectern (CVSTOS) with Crystal Glass Cover — Back-Right */}
      <group position={[1.86, 0.29, -1.64]} rotation={[-0.85, 0, 0]}>
        <mesh geometry={counterHousingGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            bumpScale={0.008}
            metalness={0.88}
            roughness={0.34}
            envMapIntensity={1.35}
          />
        </mesh>
        {/* Physically Lit Carved Bronze Dial */}
        <mesh position={[0, 0, 0.082]}>
          <planeGeometry args={[0.66, 0.28]} />
          <meshStandardMaterial
            map={counterTex.map}
            bumpMap={counterTex.bumpMap}
            bumpScale={0.012}
            emissiveMap={counterTex.map}
            emissive={theme === 'dark' ? '#F1E9D8' : '#000000'}
            emissiveIntensity={theme === 'dark' ? 0.25 : 0}
            roughness={0.5}
            metalness={0.22}
          />
        </mesh>
        {/* Crisp Protective Crystal Glass Pane Over Dial */}
        <mesh position={[0, 0, 0.089]}>
          <planeGeometry args={[0.66, 0.28]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            transparent
            opacity={0.13}
            roughness={0.06}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.4}
          />
        </mesh>
      </group>

      {/* Authentic Melted Crimson Sealing-Wax Stamp (SIGILLVM + ☧) — Front-Left Apron */}
      <mesh position={[-1.92, 0.172, 1.65]} geometry={waxSealGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={waxSealTex.map}
          bumpMap={waxSealTex.bumpMap}
          normalMap={waxSealTex.normalMap}
          normalScale={ENGRAVED_NORMAL_SCALE}
          bumpScale={0.026}
          roughness={0.34}
          metalness={0.06}
          clearcoat={0.65}
          clearcoatRoughness={0.24}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* Subtle Gilded Compass / Cross Medallion — Front-Right Apron */}
      <group position={[1.92, 0.19, 1.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <cylinderGeometry args={[0.15, 0.17, 0.032, 24]} />
          <meshStandardMaterial color={lowerMarble} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.018]}>
          <torusGeometry args={[0.13, 0.011, 8, 24]} />
          <meshStandardMaterial
            color={goldColor}
            bumpMap={bronzeTextures.bumpMap}
            roughnessMap={bronzeTextures.roughnessMap}
            metalness={0.88}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.2, 0.02, 0.014]} />
          <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.02, 0.2, 0.014]} />
          <meshStandardMaterial color={goldColor} metalness={0.88} roughness={0.3} />
        </mesh>
      </group>

      {/* 12 Interactive Pillowy PBR Stone Key-Tesserae */}
      {TESSERAE.map((skill, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const tx = (col - 1.5) * 1.02;
        const tz = -0.88 + row * 0.9;

        return (
          <StoneKeyTile
            key={skill.id}
            skill={skill}
            position={[tx, 0, tz]}
            theme={theme}
            fontsReady={fontsReady}
            keyGeometry={keyGeometry}
            collarGeometry={collarGeometry}
            marbleTextures={marbleTextures}
            bronzeTextures={bronzeTextures}
            isSelected={selectedId === skill.id}
            isHovered={hoveredId === skill.id}
            pressPulseRef={pressPulseRef}
            reducedMotionRef={reducedMotionRef}
            onHover={onHoverTessera}
            onSelect={onSelectTessera}
          />
        );
      })}
    </group>
  );
}

/* --------------------------------------------------------------------------
   5. Inner Scene Wiring Shared PBR Maps, IBL Environment & Atmospheric Fog
   -------------------------------------------------------------------------- */
function SanctuaryScene({
  theme,
  fontsReady,
  pressCount,
  selectedId,
  hoveredId,
  pressPulseRef,
  reducedMotionRef,
  pointerRef,
  onHoverTessera,
  onSelectTessera,
}: Omit<MonolithProps, 'marbleTextures' | 'bronzeTextures' | 'candleHaloTex'>) {
  const sharedMarble = useMemo(() => createMarbleSurfaceTextures(theme), [theme]);
  const sharedBronze = useMemo(() => createBrushedBronzeTextures(), []);
  const sharedCandleHalo = useMemo(() => createCandleHaloTexture(), []);

  useEffect(() => {
    return () => {
      sharedMarble.map.dispose();
      sharedMarble.bumpMap.dispose();
      sharedMarble.normalMap.dispose();
      sharedMarble.roughnessMap.dispose();
    };
  }, [sharedMarble]);

  useEffect(() => {
    return () => {
      sharedBronze.bumpMap.dispose();
      sharedBronze.roughnessMap.dispose();
    };
  }, [sharedBronze]);

  useEffect(() => () => sharedCandleHalo.dispose(), [sharedCandleHalo]);

  const fogColor = theme === 'dark' ? '#111727' : '#F6F0E2';

  return (
    <>
      <CathedralEnvironment theme={theme} />
      <fog attach="fog" args={[fogColor, 14, 25.5]} />

      <ambientLight intensity={theme === 'dark' ? 0.36 : 0.62} />
      <hemisphereLight
        args={[
          theme === 'dark' ? '#8CA6D9' : '#FFFBF0',
          theme === 'dark' ? '#1A233A' : '#D8CAA8',
          theme === 'dark' ? 0.42 : 0.56,
        ]}
      />
      <directionalLight
        position={[-6, 10, -2]}
        intensity={theme === 'dark' ? 2.25 : 1.75}
        color={theme === 'dark' ? '#FFF6DD' : '#FFFFFF'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={5.5}
        shadow-camera-bottom={-5.5}
        shadow-camera-near={1}
        shadow-camera-far={25}
      />
      <directionalLight
        position={[5, 6, 7]}
        intensity={theme === 'dark' ? 0.52 : 0.42}
        color="#F2D680"
      />

      <CathedralBackdrop3D
        theme={theme}
        marbleTextures={sharedMarble}
        bronzeTextures={sharedBronze}
        candleHaloTex={sharedCandleHalo}
        reducedMotionRef={reducedMotionRef}
      />

      <DistantMoteField theme={theme} reducedMotionRef={reducedMotionRef} />

      <SanctuaryMonolith
        theme={theme}
        fontsReady={fontsReady}
        pressCount={pressCount}
        selectedId={selectedId}
        hoveredId={hoveredId}
        pressPulseRef={pressPulseRef}
        reducedMotionRef={reducedMotionRef}
        pointerRef={pointerRef}
        marbleTextures={sharedMarble}
        bronzeTextures={sharedBronze}
        candleHaloTex={sharedCandleHalo}
        onHoverTessera={onHoverTessera}
        onSelectTessera={onSelectTessera}
      />
    </>
  );
}

/* --------------------------------------------------------------------------
   6. Exported R3F Canvas Wrapper
   -------------------------------------------------------------------------- */
interface CodexSanctuary3DProps {
  theme: ThemeMode;
  pressCount: number;
  selectedId: string | null;
  hoveredId: string | null;
  pressPulseRef: React.RefObject<Record<string, number>>;
  onHoverTessera: (id: string | null) => void;
  onSelectTessera: (id: string) => void;
  onWebGLStatus: (available: boolean) => void;
}

export function CodexSanctuary3D({
  theme,
  pressCount,
  selectedId,
  hoveredId,
  pressPulseRef,
  onHoverTessera,
  onSelectTessera,
  onWebGLStatus,
}: CodexSanctuary3DProps) {
  const reducedMotionRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [webglDisabled, setWebglDisabled] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (alive) setFontsReady(true);
      });
    } else {
      setFontsReady(true);
    }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', onChange);

    try {
      const probe = document.createElement('canvas');
      const ok = !!(probe.getContext('webgl2') || probe.getContext('webgl'));
      if (!ok) {
        setWebglDisabled(true);
        onWebGLStatus(false);
      } else {
        onWebGLStatus(true);
      }
    } catch {
      setWebglDisabled(true);
      onWebGLStatus(false);
    }

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerRef.current.y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      alive = false;
      mq.removeEventListener('change', onChange);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [onWebGLStatus]);

  if (webglDisabled) {
    return <div className="webgl-fallback" aria-hidden="true" />;
  }

  return (
    <div className="sanctuary-stage" aria-hidden="true">
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: [-7.2, 7.6, 7.6], fov: 34, near: 0.5, far: 80 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: theme === 'dark' ? 1.08 : 1.0,
        }}
        onCreated={({ gl, camera }) => {
          camera.lookAt(0, 0.15, 0);
          window.__CODEX_WEBGL_STATS__ = () => ({
            drawCalls: gl.info.render.calls,
            triangles: gl.info.render.triangles,
            instances: MOTE_COUNT,
          });
          gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault();
              setWebglDisabled(true);
              onWebGLStatus(false);
            },
            { once: true }
          );
        }}
      >
        <SanctuaryScene
          theme={theme}
          fontsReady={fontsReady}
          pressCount={pressCount}
          selectedId={selectedId}
          hoveredId={hoveredId}
          pressPulseRef={pressPulseRef}
          reducedMotionRef={reducedMotionRef}
          pointerRef={pointerRef}
          onHoverTessera={onHoverTessera}
          onSelectTessera={onSelectTessera}
        />
      </Canvas>
    </div>
  );
}
