import * as THREE from 'three';
import { CELL } from '../core/state.js';

export const pickups = [];

export function maybeSpawnPickup(scene, x, z, chance = 0.4) {
  if (Math.random() > chance) return;
  const types = ['health', 'armor', 'ammo'];
  const type = types[Math.floor(Math.random() * types.length)];
  const color = type === 'health' ? 0x44ff44 : type === 'armor' ? 0x44aaff : 0xffcc33;
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    new THREE.MeshBasicMaterial({ color })
  );
  mesh.position.set(x, 0.6, z);
  scene.add(mesh);
  pickups.push({ type, mesh, x, z, phase: Math.random() * Math.PI * 2 });
}

export function updatePickups(scene, player, state, showMessage, updateHUD, updateAmmoBar, t) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.mesh.rotation.y += 0.02;
    p.mesh.position.y = 0.6 + Math.sin(t * 3 + p.phase) * 0.2;

    const dist = Math.hypot(player.x - p.x, player.z - p.z);
    if (dist > 1.4) continue;

    if (p.type === 'health') state.health = Math.min(100, state.health + 25);
    if (p.type === 'armor') state.armor = Math.min(100, state.armor + 30);
    if (p.type === 'ammo') state.ammo = Math.min(state.maxAmmo, state.ammo + 12);
    updateHUD();
    updateAmmoBar();
    showMessage(`PICKUP: ${p.type.toUpperCase()}`);
    scene.remove(p.mesh);
    pickups.splice(i, 1);
  }
}

export function clearPickups(scene) {
  for (const p of pickups) scene.remove(p.mesh);
  pickups.length = 0;
}
