import * as THREE from 'three';

export const keys = {};

export function clearInputState() {
  for (const key in keys) keys[key] = false;
}

export function bindPlayerInput(ctx) {
  const { state, player, canvas, toggleCamera, toggleLight, reload, shoot, togglePause } = ctx;
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && state.running) {
      e.preventDefault();
      togglePause();
      return;
    }
    if (state.paused) return;
    keys[e.code] = true;
    if (e.code === 'KeyC') toggleCamera();
    if (e.code === 'KeyL') toggleLight();
    if (e.code === 'KeyR') reload();
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

  camera.position.set(player.x, player.height, player.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  if (dx !== 0 || dz !== 0) {
    const t = Date.now() * 0.008;
    camera.position.y = player.height + Math.sin(t * 2) * 0.06;
  }
  pointLight.position.set(player.x, 2, player.z);
  updateHUD();
}
