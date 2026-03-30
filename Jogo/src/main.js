import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { G, player, MAP, CELL, resetState, applyDifficulty } from './core/state.js';
import { createWorld, isWall } from './core/world.js';
import { loadWorldProps, circleIntersectsPropCollider } from './core/worldProps.js';
import { createHUD } from './ui/hud.js';
import { createMinimap } from './ui/minimap.js';
import { enemies, spawnWave, updateEnemies, clearEnemies } from './systems/enemies.js';
import { createCombat, updateBullets, clearBullets } from './systems/combat.js';
import { updatePickups, clearPickups, preloadAmmoPickupModel } from './systems/pickups.js';
import { bindPlayerInput, updatePlayer, clearInputState } from './systems/player.js';
import { createAudioSystem } from './systems/audio.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight - 100);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setPixelRatio(0.8);

const perspCam = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 100), 0.1, 200);
const orthoCam = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 500);
let camera = perspCam;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x110000);
scene.fog = new THREE.Fog(0x110000, 10, 50);

const ambientLight = new THREE.AmbientLight(0x331100, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xff6600, 0.8);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);
const pointLight = new THREE.PointLight(0xff2200, 2, 20);
scene.add(pointLight);

const lampLights = [];
for (let i = 0; i < 4; i++) {
  const l = new THREE.PointLight(0xffaa00, 1.5, 12);
  scene.add(l);
  lampLights.push(l);
}
lampLights[0].position.set(4 * CELL, 2, 4 * CELL);
lampLights[1].position.set(15 * CELL, 2, 4 * CELL);
lampLights[2].position.set(4 * CELL, 2, 15 * CELL);
lampLights[3].position.set(15 * CELL, 2, 15 * CELL);

createWorld(scene);
loadWorldProps(scene);
perspCam.position.set(player.x, player.height, player.z);

const hud = createHUD(G);
const minimap = createMinimap(MAP, CELL, enemies, player);
const weaponViewEl = document.getElementById('weaponView');
const pauseScreenEl = document.getElementById('pauseScreen');
const audio = createAudioSystem();
const musicMuteEl = document.getElementById('musicMute');
musicMuteEl.checked = audio.getMusicMuted();
musicMuteEl.addEventListener('change', () => audio.setMusicMuted(musicMuteEl.checked));
audio.initAudioOnFirstUserGesture();
preloadAmmoPickupModel();

const PLAYER_RADIUS = 0.35;
function isPlayerBlocked(wx, wz) {
  return isWall(wx, wz) || circleIntersectsPropCollider(wx, wz, PLAYER_RADIUS);
}

const AXE_SWING_MS = 300;
let axeSwingEnd = 0;

const weaponRig = new THREE.Group();
perspCam.add(weaponRig);
scene.add(perspCam);

const weaponBasePos = new THREE.Vector3(0.34, -0.42, -0.72);
const shotgunBaseRot = new THREE.Euler(0.03, Math.PI * 0.98, -0.02);
const shotgunBaseScale = 0.45;
const magnumBaseScale = 0.42 * 4.5;
const magnumYawFix = 3 * Math.PI / 2;
const magnumBaseRot = new THREE.Euler(0.02, Math.PI * 0.99 + magnumYawFix, 0.01);
const axeBaseScale = 2.5;
const axeBaseRot = new THREE.Euler(-0.42, Math.PI * 1.0, 0.35);
weaponRig.position.copy(weaponBasePos);

const shotgunRoot = new THREE.Group();
const magnumRoot = new THREE.Group();
const axeRoot = new THREE.Group();
weaponRig.add(shotgunRoot);
weaponRig.add(magnumRoot);
weaponRig.add(axeRoot);

const muzzleLocalShotgun = new THREE.Vector3(0.4, 0.14, -2.12);
const muzzleLocalMagnum = new THREE.Vector3(0.32, -0.02, -1);

function makeMuzzlePair() {
  const mat = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.85, 0.85, 0.85);
  const light = new THREE.PointLight(0xffaa33, 0, 4);
  return { mat, sprite, light };
}

const mzS = makeMuzzlePair();
mzS.sprite.position.copy(muzzleLocalShotgun);
mzS.light.position.copy(muzzleLocalShotgun);
shotgunRoot.add(mzS.sprite);
shotgunRoot.add(mzS.light);

const mzM = makeMuzzlePair();
mzM.sprite.position.copy(muzzleLocalMagnum);
mzM.light.position.copy(muzzleLocalMagnum);
magnumRoot.add(mzM.sprite);
magnumRoot.add(mzM.light);

const fxTexLoader = new THREE.TextureLoader();
fxTexLoader.load(
  './assets/effects/muzzle.png',
  (texture) => {
    mzS.mat.map = texture;
    mzM.mat.map = texture;
    mzS.mat.needsUpdate = true;
    mzM.mat.needsUpdate = true;
  },
  undefined,
  () => {}
);

let shotgunModel = null;
let magnumModel = null;
let axeModel = null;
let recoilPose = 0;
let prevPlayerX = player.x;
let prevPlayerZ = player.z;
let reloadPose = 0;
let movedThisFrame = false;

let weaponSwitch = null;

const loader = new GLTFLoader();
loader.load(
  './assets/shotgun/scene.gltf',
  (gltf) => {
    const shotgun = gltf.scene;
    shotgun.scale.setScalar(shotgunBaseScale);
    shotgun.rotation.copy(shotgunBaseRot);
    shotgun.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
    shotgunRoot.add(shotgun);
    shotgunModel = shotgun;
    if (G.weapon === 'shotgun') weaponViewEl.style.display = 'none';
  },
  undefined,
  () => {
    shotgunModel = null;
    weaponViewEl.style.display = 'block';
  }
);

loader.load(
  './assets/magnum/scene.gltf',
  (gltf) => {
    const magnum = gltf.scene;
    magnum.scale.setScalar(magnumBaseScale);
    magnum.rotation.copy(magnumBaseRot);
    magnum.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const grayBasic = mats.map((m) => {
        const map = m.map || null;
        return new THREE.MeshBasicMaterial({
          map,
          color: map ? 0xd0d0d0 : 0x8a8a8a
        });
      });
      obj.material = grayBasic.length === 1 ? grayBasic[0] : grayBasic;
    });
    magnumRoot.add(magnum);
    magnumModel = magnum;
    if (G.weapon === 'magnum') weaponViewEl.style.display = 'none';
  },
  undefined,
  () => {
    magnumModel = null;
    if (G.weapon === 'magnum') weaponViewEl.style.display = 'block';
  }
);

loader.load(
  './assets/machado/scene.gltf',
  (gltf) => {
    const axe = gltf.scene;
    axe.scale.setScalar(axeBaseScale);
    axe.rotation.copy(axeBaseRot);
    axe.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const grayBasic = mats.map((m) => {
        const map = m.map || null;
        return new THREE.MeshBasicMaterial({
          map,
          color: map ? 0xd0d0d0 : 0x8a8a8a
        });
      });
      obj.material = grayBasic.length === 1 ? grayBasic[0] : grayBasic;
    });
    axeRoot.add(axe);
    axeModel = axe;
    if (G.weapon === 'axe') weaponViewEl.style.display = 'none';
  },
  undefined,
  () => {
    axeModel = null;
    if (G.weapon === 'axe') weaponViewEl.style.display = 'block';
  }
);

shotgunRoot.visible = true;
magnumRoot.visible = false;
axeRoot.visible = false;

function rootForWeapon(w) {
  if (w === 'shotgun') return shotgunRoot;
  if (w === 'magnum') return magnumRoot;
  return axeRoot;
}

function syncWeaponVisibility() {
  if (weaponSwitch) return;
  shotgunRoot.visible = G.weapon === 'shotgun';
  magnumRoot.visible = G.weapon === 'magnum';
  axeRoot.visible = G.weapon === 'axe';
}

function requestWeapon(weaponId) {
  if (!G.running || G.paused || G.reloading || weaponSwitch) return;
  if (G.weapon === weaponId) return;
  weaponSwitch = { t: 0, from: G.weapon, to: weaponId, swapped: false };
  G.weaponSwitching = true;
  shotgunRoot.visible = weaponSwitch.from === 'shotgun';
  magnumRoot.visible = weaponSwitch.from === 'magnum';
  axeRoot.visible = weaponSwitch.from === 'axe';
  const fr = rootForWeapon(weaponSwitch.from);
  fr.position.y = 0;
}

function takeDamage(amount) {
  if (G.armor > 0) {
    const absorbed = Math.min(G.armor, amount * 0.6);
    G.armor -= absorbed;
    amount -= absorbed;
  }
  G.health -= amount;
  audio.playDamage();
  hud.updateHUD();
  hud.showDamage();
  if (G.health <= 50) document.getElementById('healthVal').classList.add('low');
  if (G.health <= 0) {
    G.health = 0;
    die();
  }
}

function spawnNextWave(wave) {
  clearPickups(scene);
  spawnWave(scene, wave, hud.showWaveMsg, G);
}

const combat = createCombat({
  scene,
  state: G,
  camera: perspCam,
  setKillCount: hud.setKillCount,
  addKillMsg: hud.addKillMsg,
  updateHUD: hud.updateHUD,
  updateAmmoBar: hud.updateAmmoBar,
  spawnNextWave,
  showWaveMsg: hud.showWaveMsg,
  canShoot: () => !G.weaponSwitching && !weaponSwitch,
  onShoot: (weaponId) => {
    if (weaponId !== 'shotgun' && weaponId !== 'magnum') return;
    recoilPose = 1;
    const mz = weaponId === 'shotgun' ? mzS : mzM;
    mz.mat.opacity = 1;
    mz.sprite.scale.set(1.2, 1.2, 1.2);
    mz.light.intensity = 2.2;
    if (weaponId === 'shotgun') audio.playShotgunShot();
    else audio.playMagnumShot();
  },
  onAxeSwing: () => {
    axeSwingEnd = performance.now() + AXE_SWING_MS;
    audio.playAxeSwing();
  },
  onReloadStart: (weaponId) => {
    if (weaponId === 'shotgun') audio.playShotgunReload();
    else audio.playMagnumReload();
  },
  onReloadEnd: () => {},
  getMuzzleWorldPosition: () => {
    const local = G.weapon === 'shotgun' ? muzzleLocalShotgun : muzzleLocalMagnum;
    const root = G.weapon === 'shotgun' ? shotgunRoot : magnumRoot;
    const p = local.clone();
    return root.localToWorld(p);
  },
  onDryFire: () => audio.playDryFire()
});

function toggleCamera() {
  if (G.cameraMode === 'perspective') {
    G.cameraMode = 'ortho';
    orthoCam.position.set(MAP[0].length * CELL / 2, 40, MAP.length * CELL / 2);
    orthoCam.lookAt(MAP[0].length * CELL / 2, 0, MAP.length * CELL / 2);
    camera = orthoCam;
  } else {
    G.cameraMode = 'perspective';
    camera = perspCam;
  }
}

let lightToggleIndex = 0;
function toggleLight() {
  const lightTypes = ['ambient', 'directional', 'point'];
  const type = lightTypes[lightToggleIndex % 3];
  lightToggleIndex++;
  G.lightsEnabled[type] = !G.lightsEnabled[type];
  if (type === 'ambient') ambientLight.visible = G.lightsEnabled.ambient;
  if (type === 'directional') dirLight.visible = G.lightsEnabled.directional;
  if (type === 'point') pointLight.visible = G.lightsEnabled.point;
  hud.showWaveMsg(`LUZ ${type.toUpperCase()}: ${G.lightsEnabled[type] ? 'ON' : 'OFF'}`);
}

bindPlayerInput({
  state: G, player, canvas,
  toggleCamera, toggleLight,
  reload: combat.reload, shoot: combat.shoot,
  togglePause,
  selectWeapon: requestWeapon
});

function updateLights(t) {
  for (let i = 0; i < lampLights.length; i++) {
    lampLights[i].intensity = 1.5 + Math.sin(t * 7 + i * 1.3) * 0.3 + Math.random() * 0.1;
  }
}

const weaponClipRay = new THREE.Raycaster();
const weaponClipDir = new THREE.Vector3();
function isWeaponObject(obj) {
  let node = obj;
  while (node) {
    if (node === weaponRig || node === axeRoot) return true;
    node = node.parent;
  }
  return false;
}

function updateWeaponSwitch(dt) {
  if (!weaponSwitch) return;
  const SW = 0.55;
  weaponSwitch.t += dt;
  const p = weaponSwitch.t / SW;
  const fromRoot = rootForWeapon(weaponSwitch.from);
  const toRoot = rootForWeapon(weaponSwitch.to);

  if (p < 0.5) {
    const u = p * 2;
    shotgunRoot.visible = weaponSwitch.from === 'shotgun';
    magnumRoot.visible = weaponSwitch.from === 'magnum';
    axeRoot.visible = weaponSwitch.from === 'axe';
    fromRoot.position.y = -u * 0.65;
  } else {
    if (!weaponSwitch.swapped) {
      weaponSwitch.swapped = true;
      G.weapon = weaponSwitch.to;
      if (G.weapon === 'shotgun') {
        G.ammo = G.ammoShotgun;
        G.maxAmmo = 2;
      } else if (G.weapon === 'magnum') {
        G.ammo = G.ammoMagnum;
        G.maxAmmo = 6;
      } else {
        G.ammo = 0;
        G.maxAmmo = 0;
      }
      fromRoot.position.y = 0;
      fromRoot.visible = false;
      shotgunRoot.visible = weaponSwitch.to === 'shotgun';
      magnumRoot.visible = weaponSwitch.to === 'magnum';
      axeRoot.visible = weaponSwitch.to === 'axe';
      toRoot.visible = true;
      toRoot.position.y = -0.65;
      hud.updateAmmoBar();
      hud.updateHUD();
    }
    const u = (p - 0.5) * 2;
    toRoot.position.y = -0.65 + u * 0.65;
  }

  if (p >= 1) {
    toRoot.position.y = 0;
    weaponSwitch = null;
    G.weaponSwitching = false;
    shotgunRoot.position.y = 0;
    magnumRoot.position.y = 0;
    axeRoot.position.y = 0;
    syncWeaponVisibility();
    hud.updateAmmoBar();
    hud.updateHUD();
  }
}

function updateWeaponRig(t) {
  const dt = 0.016;
  updateWeaponSwitch(dt);

  const dx = player.x - prevPlayerX;
  const dz = player.z - prevPlayerZ;
  prevPlayerX = player.x;
  prevPlayerZ = player.z;
  movedThisFrame = Math.hypot(dx, dz) > 0.002;
  const moveAmount = Math.min(1, Math.hypot(dx, dz) * 35);

  const swayX = 0;
  const swayY = 0;
  const bobX = Math.sin(t * 10.5) * 0.02 * moveAmount;
  const bobY = Math.abs(Math.cos(t * 21.0)) * 0.016 * moveAmount;

  recoilPose += (0 - recoilPose) * 0.12;
  const recoilPush = recoilPose * 0.44;
  const recoilKick = recoilPose * 0.56;

  [mzS, mzM].forEach((mz) => {
    mz.mat.opacity = Math.max(0, mz.mat.opacity - 0.12);
    const flashScale = 0.8 + mz.mat.opacity * 1.6;
    mz.sprite.scale.set(flashScale, flashScale, flashScale);
    mz.light.intensity = Math.max(0, mz.light.intensity - 0.25);
  });

  const targetReload = G.reloading ? 1 : 0;
  reloadPose += (targetReload - reloadPose) * 0.12;
  weaponRig.rotation.set(reloadPose * 1.25, 0, -reloadPose * 0.18);

  weaponClipDir.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)).normalize();
  weaponClipRay.set(perspCam.position, weaponClipDir);
  weaponClipRay.far = 1.3;
  const hits = weaponClipRay.intersectObjects(scene.children, true);
  let clipFactor = 0;
  for (const hit of hits) {
    if (isWeaponObject(hit.object)) continue;
    if (hit.distance > 0.05) {
      clipFactor = 1 - Math.min(1, (hit.distance - 0.05) / 0.9);
      break;
    }
  }
  const antiClipBack = 0.45 * clipFactor;
  const antiClipDown = 0.12 * clipFactor;
  const antiClipTilt = 0.6 * clipFactor;

  weaponRig.position.set(
    weaponBasePos.x + swayX + bobX,
    weaponBasePos.y + swayY + bobY - antiClipDown + reloadPose * 0.14,
    weaponBasePos.z + recoilPush + antiClipBack + reloadPose * 0.08
  );

  const nowMs = performance.now();
  if (G.weapon === 'axe' && axeModel) {
    if (nowMs < axeSwingEnd) {
      const u = 1 - (axeSwingEnd - nowMs) / AXE_SWING_MS;
      let swing;
      if (u < 0.38) swing = u / 0.38;
      else swing = 1 - (u - 0.38) / 0.62;
      axeModel.rotation.set(
        axeBaseRot.x + swing * 1.32,
        axeBaseRot.y + swayX * 1.1,
        axeBaseRot.z - swing * 0.22 - swayX * 0.6
      );
    } else {
      axeModel.rotation.set(
        axeBaseRot.x + recoilKick * 0.2 + antiClipTilt * 0.25,
        axeBaseRot.y + swayX * 1.1,
        axeBaseRot.z - swayX * 0.6 + antiClipTilt * 0.08
      );
    }
    const scaleDown = 1 - clipFactor * 0.08;
    axeModel.scale.setScalar(axeBaseScale * scaleDown);
  } else {
    const activeModel = G.weapon === 'shotgun' ? shotgunModel : magnumModel;
    const baseRot = G.weapon === 'shotgun' ? shotgunBaseRot : magnumBaseRot;
    const baseScale = G.weapon === 'shotgun' ? shotgunBaseScale : magnumBaseScale;
    if (activeModel) {
      activeModel.rotation.set(
        baseRot.x + recoilKick + antiClipTilt * 0.35,
        baseRot.y + swayX * 1.3,
        baseRot.z - swayX * 0.8 + antiClipTilt * 0.12
      );
      const scaleDown = 1 - clipFactor * 0.08;
      activeModel.scale.setScalar(baseScale * scaleDown);
    }
  }
}

function die() {
  G.running = false;
  G.paused = false;
  audio.setPaused(true);
  document.exitPointerLock();
  pauseScreenEl.style.display = 'none';
  document.getElementById('deathScreen').style.display = 'flex';
  document.getElementById('finalScore').textContent = `MORTES: ${G.kills} · ONDA: ${G.wave}`;
}

let frameCount = 0;
function loop() {
  if (!G.running) return;
  requestAnimationFrame(loop);
  if (G.paused) {
    renderer.render(scene, camera);
    return;
  }
  frameCount++;
  const t = frameCount * 0.016;

  updatePlayer({
    state: G, player, camera: perspCam, pointLight, isWall: isPlayerBlocked, updateHUD: hud.updateHUD
  });
  updateEnemies(t, { player, isWall, takeDamage, state: G });
  updateBullets(isWall);
  updatePickups(scene, player, G, hud.showWaveMsg, hud.updateHUD, hud.updateAmmoBar, t);
  updateLights(t);
  try {
    updateWeaponRig(t);
  } catch (_) {}
  try {
    audio.updateSteps(0.016, movedThisFrame);
  } catch (_) {}
  minimap.drawMinimap();
  renderer.render(scene, camera);
}

function togglePause() {
  if (!G.running) return;
  G.paused = !G.paused;
  if (G.paused) {
    document.exitPointerLock();
    clearInputState();
    audio.setPaused(true);
    pauseScreenEl.style.display = 'flex';
  } else {
    pauseScreenEl.style.display = 'none';
    audio.setPaused(false);
    canvas.requestPointerLock();
  }
}

function resumeGame() {
  if (!G.running) return;
  G.paused = false;
  pauseScreenEl.style.display = 'none';
  audio.setPaused(false);
  canvas.requestPointerLock();
}

function backToMainMenu() {
  G.running = false;
  G.paused = false;
  clearEnemies(scene);
  clearBullets();
  clearPickups(scene);
  document.exitPointerLock();
  pauseScreenEl.style.display = 'none';
  document.getElementById('deathScreen').style.display = 'none';
  document.getElementById('overlay').style.display = 'flex';
  audio.setPaused(true);
}

window.startGame = function startGame() {
  const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'medium';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('deathScreen').style.display = 'none';
  pauseScreenEl.style.display = 'none';
  clearEnemies(scene);
  clearBullets();
  clearPickups(scene);
  resetState();
  applyDifficulty(selectedDifficulty);
  G.running = true;
  G.paused = false;
  weaponSwitch = null;
  G.weaponSwitching = false;
  shotgunRoot.position.y = 0;
  magnumRoot.position.y = 0;
  axeRoot.position.y = 0;
  syncWeaponVisibility();
  hud.updateHUD();
  hud.updateAmmoBar();
  spawnNextWave(1);
  loop();
};

window.restartGame = function restartGame() {
  resetState();
  applyDifficulty(G.difficultyKey);
  clearEnemies(scene);
  clearBullets();
  clearPickups(scene);
  document.getElementById('deathScreen').style.display = 'none';
  document.getElementById('healthVal').classList.remove('low');
  G.running = true;
  G.paused = false;
  pauseScreenEl.style.display = 'none';
  weaponSwitch = null;
  G.weaponSwitching = false;
  shotgunRoot.position.y = 0;
  magnumRoot.position.y = 0;
  axeRoot.position.y = 0;
  syncWeaponVisibility();
  audio.setPaused(false);
  hud.updateHUD();
  hud.updateAmmoBar();
  spawnNextWave(1);
  loop();
};

window.resumeGame = resumeGame;
window.backToMainMenu = backToMainMenu;

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight - 100;
  renderer.setSize(w, h);
  perspCam.aspect = w / h;
  perspCam.updateProjectionMatrix();
});
