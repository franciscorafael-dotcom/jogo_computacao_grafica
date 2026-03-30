import * as THREE from 'three';

export const keys = {};

let wasSpaceDown = false;

export function clearInputState() {
  for (const key in keys) keys[key] = false;
  wasSpaceDown = false;
}

export function bindPlayerInput(ctx) {
  const {
    state, player, canvas, toggleCamera, toggleLight, reload, shoot, togglePause, selectWeapon
  } = ctx;
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && state.running) {
      e.preventDefault();
      togglePause();
      return;
    }
    if (state.paused) return;
    if (e.code === 'Space' && state.running) {
      e.preventDefault();
    }
    keys[e.code] = true;
    if (e.code === 'KeyC') toggleCamera();
    if (e.code === 'KeyL') toggleLight();
    if (e.code === 'KeyR') reload();
    if (e.code === 'Digit1' && selectWeapon) selectWeapon('shotgun');
    if (e.code === 'Digit2' && selectWeapon) selectWeapon('magnum');
    if (e.code === 'Digit3' && selectWeapon) selectWeapon('axe');
  });
  document.addEventListener('keyup', (e) => { keys[e.code] = false; });

  document.addEventListener('mousemove', (e) => {
    if (!state.isPointerLocked || state.paused) return;
    player.yaw -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    player.pitch = Math.max(-0.5, Math.min(0.5, player.pitch));
  });

  canvas.addEventListener('click', () => {
    if (state.running && !state.paused) canvas.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    state.isPointerLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && state.isPointerLocked && !state.paused) shoot();
  });
}

/** Mesmo tempo de voo (~2.5× o original); altura ≈ metade (g e v0 ambos /2). */
const GRAVITY = 0.004;
const JUMP_VEL = 0.155;

export function updatePlayer(ctx) {
  const { state, player, camera, pointLight, isWall, updateHUD } = ctx;
  const radius = 0.35;
  const moving = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD;
  const wantsSprint = keys.ShiftLeft || keys.ShiftRight;
  const sprinting = wantsSprint && moving && state.stamina > 0;
  let speed = sprinting ? 0.16 : 0.10;

  if (sprinting) state.stamina = Math.max(0, state.stamina - 0.8);
  else state.stamina = Math.min(state.maxStamina, state.stamina + 0.45);
  if (state.stamina <= 0) speed = 0.09;

  const spaceDown = keys.Space === true;
  if (spaceDown && !wasSpaceDown && player.jumpOffset <= 0.01 && player.jumpVy <= 0) {
    player.jumpVy = JUMP_VEL;
  }
  wasSpaceDown = spaceDown;

  player.jumpVy -= GRAVITY;
  player.jumpOffset += player.jumpVy;
  if (player.jumpOffset <= 0) {
    player.jumpOffset = 0;
    player.jumpVy = 0;
  }

  const fwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  let dx = 0;
  let dz = 0;
  if (keys.KeyW) { dx += fwd.x; dz += fwd.z; }
  if (keys.KeyS) { dx -= fwd.x; dz -= fwd.z; }
  if (keys.KeyA) { dx -= right.x; dz -= right.z; }
  if (keys.KeyD) { dx += right.x; dz += right.z; }

  const nx = player.x + dx * speed;
  const nz = player.z + dz * speed;
  const blockedX =
    isWall(nx + radius, player.z + radius) ||
    isWall(nx - radius, player.z + radius) ||
    isWall(nx + radius, player.z - radius) ||
    isWall(nx - radius, player.z - radius);
  const blockedZ =
    isWall(player.x + radius, nz + radius) ||
    isWall(player.x - radius, nz + radius) ||
    isWall(player.x + radius, nz - radius) ||
    isWall(player.x - radius, nz - radius);

  if (!blockedX) player.x = nx;
  if (!blockedZ) player.z = nz;

  const t = Date.now() * 0.008;
  const bob = (moving && player.jumpOffset <= 0.02) ? Math.sin(t * 2) * 0.06 : 0;
  camera.position.set(player.x, player.height + player.jumpOffset + bob, player.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  pointLight.position.set(player.x, 2, player.z);
  updateHUD();
}
