import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { CELL, G } from './state.js';

const loader = new GLTFLoader();

/** AABBs no plano XZ (com folga para raio do jogador) — preenchido em loadWorldProps. */
export const propColliders = [];

/**
 * Props ainda presentes em assets/objects (barrel x2 + estação de emergência).
 * row/col = índices do MAP (0 = chão livre).
 */
const PROP_PLACEMENTS = [
  { url: './assets/objects/barrel/scene.gltf', row: 7, col: 3, yRot: 0.15, targetHeight: 1.05 },
  { url: './assets/objects/barrel/scene.gltf', row: 14, col: 16, yRot: 1.05, targetHeight: 1.05 },
  { url: './assets/objects/emergency_power_station_ps1/scene.gltf', row: 8, col: 9, yRot: -0.35, targetHeight: 2.2 }
];

function placeScaledRoot(scene, root, row, col, yRot, targetHeight) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const h = Math.max(size.y, 0.001);
  const s = targetHeight / h;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  const wx = col * CELL + CELL / 2;
  const wz = row * CELL + CELL / 2;
  root.position.set(wx, -box2.min.y, wz);
  root.rotation.y = yRot;
  root.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  scene.add(root);
  root.updateMatrixWorld(true);
  const worldBox = new THREE.Box3().setFromObject(root);
  const pad = 0.38;
  propColliders.push({
    minX: worldBox.min.x - pad,
    maxX: worldBox.max.x + pad,
    minZ: worldBox.min.z - pad,
    maxZ: worldBox.max.z + pad
  });
}

function loadGltf(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf), undefined, reject);
  });
}

/** Teste círculo-jogador vs colisores dos props (só movimento do jogador). */
export function circleIntersectsPropCollider(px, pz, radius) {
  const r2 = radius * radius;
  for (const b of propColliders) {
    const cx = Math.max(b.minX, Math.min(px, b.maxX));
    const cz = Math.max(b.minZ, Math.min(pz, b.maxZ));
    const dx = px - cx;
    const dz = pz - cz;
    if (dx * dx + dz * dz < r2) return true;
  }
  return false;
}

/**
 * Carrega modelos de assets/objects e coloca-os no chão do mapa.
 */
export function loadWorldProps(scene) {
  propColliders.length = 0;
  if (typeof G !== 'undefined' && G.currentLevel === 3) {
    return Promise.resolve();
  }
  const cache = new Map();
  const tasks = PROP_PLACEMENTS.map(async (spec) => {
    try {
      let gltf = cache.get(spec.url);
      if (!gltf) {
        gltf = await loadGltf(spec.url);
        cache.set(spec.url, gltf);
      }
      const root = gltf.scene.clone(true);
      placeScaledRoot(scene, root, spec.row, spec.col, spec.yRot, spec.targetHeight);
    } catch (_) {
      /* ficheiros em falta — ignora */
    }
  });
  return Promise.all(tasks);
}