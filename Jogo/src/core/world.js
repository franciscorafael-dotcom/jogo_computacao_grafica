import * as THREE from 'three';
import { CELL, MAP } from './state.js';

function makeWallTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a2800';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 8) {
    const offset = (Math.floor(y / 8) % 2) * 16;
    for (let x = -16; x < size; x += 32) {
      ctx.fillStyle = `hsl(15, 50%, ${18 + Math.random() * 8}%)`;
      ctx.fillRect(x + offset + 1, y + 1, 30, 6);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeFloorTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  for (let y = 0; y < size; y += 16) {
    for (let x = 0; x < size; x += 16) {
      const v = 20 + Math.random() * 15;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 15, 15);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export function createWorld(scene) {
  const wallTex = makeWallTexture();
  const floorTex = makeFloorTexture();
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTex });
  const floorMat = new THREE.MeshLambertMaterial({ map: floorTex, color: 0x666666 });
  const ceilMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

  const wallGeom = new THREE.BoxGeometry(CELL, CELL * 1.2, CELL);
  for (let row = 0; row < MAP.length; row++) {
    for (let col = 0; col < MAP[row].length; col++) {
      if (MAP[row][col] !== 1) continue;
      const wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(col * CELL + CELL / 2, CELL * 0.6, row * CELL + CELL / 2);
      wall.receiveShadow = true;
      wall.castShadow = true;
      scene.add(wall);
    }
  }

  const floorGeom = new THREE.PlaneGeometry(MAP[0].length * CELL, MAP.length * CELL);
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(MAP[0].length * CELL / 2, 0, MAP.length * CELL / 2);
  floor.receiveShadow = true;
  scene.add(floor);

  const ceil = new THREE.Mesh(floorGeom, ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(MAP[0].length * CELL / 2, CELL * 1.2, MAP.length * CELL / 2);
  scene.add(ceil);
}

export function isWall(wx, wz) {
  const col = Math.floor(wx / CELL);
  const row = Math.floor(wz / CELL);
  if (row < 0 || row >= MAP.length || col < 0 || col >= MAP[0].length) return true;
  return MAP[row][col] === 1;
}
