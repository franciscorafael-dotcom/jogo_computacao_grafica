import * as THREE from 'three';
import { CELL } from './state.js';

export const LEVEL3_DOOR = { row: 12, col: 10 };
export const LEVEL3_ARENA = {
  minRow: 13,
  maxRow: 21,
  minCol: 6,
  maxCol: 22
};

let doorOpen = false;
let doorMesh = null;

export function isLevel3ArenaCell(row, col) {
  return (
    row >= LEVEL3_ARENA.minRow &&
    row <= LEVEL3_ARENA.maxRow &&
    col >= LEVEL3_ARENA.minCol &&
    col <= LEVEL3_ARENA.maxCol
  );
}

export function resetLevel3Gate() {
  doorOpen = false;
  syncLevel3DoorMesh();
}

export function openLevel3Gate() {
  doorOpen = true;
  syncLevel3DoorMesh();
}

export function isLevel3GateOpen() {
  return doorOpen;
}

export function isLevel3GateBlockingCell(row, col) {
  if (doorOpen) return false;
  return row === LEVEL3_DOOR.row && col === LEVEL3_DOOR.col;
}

export function registerLevel3DoorMesh(mesh) {
  doorMesh = mesh || null;
  syncLevel3DoorMesh();
}

function syncLevel3DoorMesh() {
  if (!doorMesh) return;
  doorMesh.visible = !doorOpen;
}

export function buildLevel3DoorMesh(material) {
  const geom = new THREE.BoxGeometry(CELL * 0.95, CELL * 1.15, CELL * 0.34);
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(
    LEVEL3_DOOR.col * CELL + CELL / 2,
    CELL * 0.575,
    LEVEL3_DOOR.row * CELL + CELL / 2
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}