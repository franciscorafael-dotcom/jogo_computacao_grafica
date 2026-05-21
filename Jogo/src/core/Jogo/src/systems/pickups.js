import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { addReserveAmmo } from './weapons.js';

export const pickups = [];

const ammoLoader = new GLTFLoader();
let ammoTemplate = null;
let ammoLoadAttempted = false;

function disposeObject3D(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

/** Luz ambiente quente + PBR tingem de laranja; BasicMaterial com mapa = cores da textura “puras”. */
function useUnlitAmmoMaterials(root) {
  root.traverse((c) => {
    if (!c.isMesh || !c.material) return;
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    const next = mats.map((m) => {
      if (!m) return m;
      const basic = new THREE.MeshBasicMaterial({
        map: m.map || null,
        transparent: m.transparent === true,
        opacity: m.opacity !== undefined ? m.opacity : 1,
        alphaTest: m.alphaTest !== undefined ? m.alphaTest : 0,
        side: m.side !== undefined ? m.side : THREE.FrontSide,
        fog: false
      });
      if (!m.map && m.color) basic.color.copy(m.color);
      return basic;
    });
    c.material = next.length === 1 ? next[0] : next;
  });
}

/**
 * Carrega o modelo GLTF da caixa de munição (uma vez). Falha silenciosa → fallback em pickup.
 */
export function preloadAmmoPickupModel() {
  if (ammoLoadAttempted) return;
  ammoLoadAttempted = true;
  ammoLoader.load(
    './assets/ammo_boxes/scene.gltf',
    (gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const s = 0.55 / maxDim;
      root.scale.setScalar(s);
      root.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      useUnlitAmmoMaterials(root);
      ammoTemplate = root;
    },
    undefined,
    () => {}
  );
}

function makeAmmoPickupMesh(scene, x, z) {
  if (ammoTemplate) {
    const root = ammoTemplate.clone(true);
    useUnlitAmmoMaterials(root);
    root.position.set(x, 0, z);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    root.position.y = -box.min.y + AMMO_FLOAT_LIFT;
    const baseY = root.position.y;
    scene.add(root);
    return { mesh: root, isGltf: true, baseY };
  }
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    new THREE.MeshBasicMaterial({ color: 0xffcc33, fog: false })
  );
  mesh.position.set(x, 0.6 + AMMO_FLOAT_LIFT, z);
  scene.add(mesh);
  return { mesh, isGltf: false, baseY: 0.6 + AMMO_FLOAT_LIFT };
}

export function maybeSpawnPickup(scene, x, z, chance = 0.4) {
  if (Math.random() > chance) return;
  const types = ['health', 'armor', 'ammo'];
  const type = types[Math.floor(Math.random() * types.length)];
  let mesh;
  let phase = Math.random() * Math.PI * 2;
  let yBase = 0.6;
  if (type === 'ammo') {
    const pack = makeAmmoPickupMesh(scene, x, z);
    mesh = pack.mesh;
    pickups.push({ type, mesh, x, z, phase, yBase: pack.baseY, isGltf: !!pack.isGltf, createdAt: Date.now() });
    return;
  }
  const color = type === 'health' ? 0x44ff44 : 0x44aaff;
  mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    new THREE.MeshBasicMaterial({ color })
  );
  mesh.position.set(x, yBase, z);
  scene.add(mesh);
  pickups.push({ type, mesh, x, z, phase, yBase: 0.6, isGltf: false, createdAt: Date.now() });
}

export function updatePickups(scene, player, state, showMessage, updateHUD, updateAmmoBar, t) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];

    // Expirar pickups não apanhados após 10 segundos
    if (Date.now() - p.createdAt > 10000) {
      disposeObject3D(p.mesh);
      scene.remove(p.mesh);
      pickups.splice(i, 1);
      continue;
    }

    p.mesh.rotation.y += 0.02;
    const y = p.yBase + Math.sin(t * 3 + p.phase) * (p.isGltf ? AMMO_BOB_AMP : 0.2);
    p.mesh.position.y = y;

    const dist = Math.hypot(player.x - p.x, player.z - p.z);
    if (dist > 1.4) continue;

    if (p.type === 'health') state.health = Math.min(100, state.health + 25);
    if (p.type === 'armor') state.armor = Math.min(100, state.armor + 30);
    if (p.type === 'ammo') {
      addReserveAmmo(state, 'shotgun', 8);
      addReserveAmmo(state, 'magnum', 8);
      state.ammo = state.weapon === 'shotgun' ? state.ammoShotgun : state.ammoMagnum;
      state.maxAmmo = state.weapon === 'shotgun' ? 2 : 6;
    }
    updateHUD();
    updateAmmoBar();
    showMessage(`PICKUP: ${p.type.toUpperCase()}`);
    disposeObject3D(p.mesh);
    scene.remove(p.mesh);
    pickups.splice(i, 1);
  }
}

export function clearPickups(scene) {
  for (const p of pickups) {
    disposeObject3D(p.mesh);
    scene.remove(p.mesh);
  }
  pickups.length = 0;
}
