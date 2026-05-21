import * as THREE from 'three';
import { CELL } from './state.js';
import { openLevel3Gate } from './level3Gate.js';

// Posição da chave no mapa (row=11, col=15 — corredor antes do portão)
export const KEY_POSITION = { row: 9, col: 15 };

let keyMesh = null;
let pedestalMesh = null;
let _keyCollected = false;
let _keyScene = null;
let _t = 0;

export function resetKey() {
  _keyCollected = false;
  if (keyMesh && _keyScene) {
    _keyScene.remove(keyMesh);
    _keyScene.remove(pedestalMesh);
  }
  keyMesh = null;
  pedestalMesh = null;
}

function buildKeyMesh() {
  const group = new THREE.Group();

  // Cabo da chave (cilindro)
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8),
    new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.9 })
  );
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  // Aro da chave
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.032, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.9 })
  );
  ring.position.set(0.24, 0, 0);
  ring.rotation.y = Math.PI / 2;
  group.add(ring);

  // Dentes da chave
  [0.09, -0.04].forEach((dz, i) => {
    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.035, 0.07),
      new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3, metalness: 0.9 })
    );
    tooth.position.set(-0.14 - i * 0.09, -0.052, 0);
    group.add(tooth);
  });

  return group;
}

function buildPedestal() {
  const group = new THREE.Group();

  // Base do pedestal
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.6, metalness: 0.7 })
  );
  base.position.y = 0;
  group.add(base);

  // Coluna
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.48, 10),
    new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.5, metalness: 0.75 })
  );
  column.position.y = 0.28;
  group.add(column);

  // Topo
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.1, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.8 })
  );
  top.position.y = 0.55;
  group.add(top);

  // Anel emissivo no topo
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.018, 6, 20),
    new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 1.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.57;
  group.add(ring);

  // Luz de glow à volta do pedestal
  const glow = new THREE.PointLight(0xffcc00, 1.8, 4.5);
  glow.position.y = 0.8;
  group.add(glow);

  return group;
}

export function spawnKey(scene) {
  _keyScene = scene;
  _keyCollected = false;

  const wx = KEY_POSITION.col * CELL + CELL / 2;
  const wz = KEY_POSITION.row * CELL + CELL / 2;

  pedestalMesh = buildPedestal();
  pedestalMesh.position.set(wx, 0, wz);
  scene.add(pedestalMesh);

  keyMesh = buildKeyMesh();
  keyMesh.position.set(wx, 0.85, wz);
  scene.add(keyMesh);
}

export function updateKey(player, showMessage, dt) {
  if (_keyCollected || !keyMesh) return;

  _t += dt;

  // Rotação e flutuação da chave
  keyMesh.rotation.y += dt * 1.8;
  keyMesh.position.y = 0.85 + Math.sin(_t * 2.2) * 0.08;

  // Verificar colisão com jogador
  const dx = player.x - keyMesh.position.x;
  const dz = player.z - keyMesh.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 1.5) {
    _keyCollected = true;
    if (_keyScene) {
      _keyScene.remove(keyMesh);
      // Deixar pedestal mas apagar a luz
      pedestalMesh.traverse((c) => {
        if (c.isLight) c.intensity = 0;
      });
    }
    openLevel3Gate();
    showMessage('CHAVE RECOLHIDA — PORTÃO ABERTO');
  }
}

export function isKeyCollected() {
  return _keyCollected;
}