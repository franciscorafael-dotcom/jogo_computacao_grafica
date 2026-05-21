import * as THREE from 'three';
import { CELL, getCurrentMap } from './state.js';

const ACID_CELL = 2;
const acidMeshes = [];

export function clearAcidMeshes(scene) {
  for (const mesh of acidMeshes) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  acidMeshes.length = 0;
}

export function buildAcidMeshes(scene, map = getCurrentMap()) {
  clearAcidMeshes(scene);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x224411,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.88,
    roughness: 0.35,
    metalness: 0.08
  });
  const texLoader = new THREE.TextureLoader();
  texLoader.load(
    './assets/acido.jpeg',
    (loaded) => {
      loaded.wrapS = loaded.wrapT = THREE.RepeatWrapping;
      loaded.repeat.set(1, 1);
      mat.map = loaded;
      mat.needsUpdate = true;
    },
    undefined,
    () => {}
  );
  const geom = new THREE.PlaneGeometry(CELL * 0.94, CELL * 0.94);
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] !== ACID_CELL) continue;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(col * CELL + CELL / 2, 0.06, row * CELL + CELL / 2);
      mesh.receiveShadow = true;
      scene.add(mesh);
      acidMeshes.push(mesh);
    }
  }
}

export function updateAcidVisuals(t) {
  const pulse = 0.65 + Math.sin(t * 3.2) * 0.2;
  for (const mesh of acidMeshes) {
    mesh.material.emissiveIntensity = pulse;
    mesh.position.y = 0.05 + Math.sin(t * 2.4 + mesh.position.x) * 0.02;
  }
}

export function isAcidCellAt(wx, wz, map = getCurrentMap()) {
  const col = Math.floor(wx / CELL);
  const row = Math.floor(wz / CELL);
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return false;
  return map[row][col] === ACID_CELL;
}
