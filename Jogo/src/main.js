import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { G, player, MAP, CELL, resetState, applyDifficulty } from './core/state.js';
import { createWorld, isWall } from './core/world.js';
import { createHUD } from './ui/hud.js';
import { createMinimap } from './ui/minimap.js';
import { enemies, spawnWave, updateEnemies, clearEnemies } from './systems/enemies.js';
import { createCombat, updateBullets, clearBullets } from './systems/combat.js';
import { updatePickups, clearPickups } from './systems/pickups.js';
import { bindPlayerInput, updatePlayer, clearInputState } from './systems/player.js';

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
perspCam.position.set(player.x, player.height, player.z);

const hud = createHUD(G);
const minimap = createMinimap(MAP, CELL, enemies, player);
const weaponViewEl = document.getElementById('weaponView');
const pauseScreenEl = document.getElementById('pauseScreen');

const weaponRig = new THREE.Group();
weaponRig.position.set(0.32, -0.35, -0.75);
perspCam.add(weaponRig);
scene.add(perspCam);

const loader = new GLTFLoader();
loader.load(
  './assets/shotgun/scene.gltf',
  (gltf) => {
    const shotgun = gltf.scene;
    shotgun.scale.set(0.4, 0.4, 0.4);
    shotgun.rotation.set(0, Math.PI, 0);
    shotgun.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });
    weaponRig.add(shotgun);
    weaponViewEl.style.display = 'none';
  },
  undefined,
  () => {
    weaponViewEl.style.display = 'block';
  }
);

function takeDamage(amount) {
  if (G.armor > 0) {
    const absorbed = Math.min(G.armor, amount * 0.6);
    G.armor -= absorbed;
    amount -= absorbed;
  }
  G.health -= amount;
  hud.updateHUD();
  hud.showDamage();
  if (G.health <= 50) document.getElementById('healthVal').classList.add('low');
  if (G.health <= 0) {
    G.health = 0;
    die();
  }
}

function spawnNextWave(wave) {
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
  showWaveMsg: hud.showWaveMsg
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
  togglePause
});

function updateLights(t) {
  for (let i = 0; i < lampLights.length; i++) {
    lampLights[i].intensity = 1.5 + Math.sin(t * 7 + i * 1.3) * 0.3 + Math.random() * 0.1;
  }
}

function die() {
  G.running = false;
  G.paused = false;
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
    state: G, player, camera: perspCam, pointLight, isWall, updateHUD: hud.updateHUD
  });
  updateEnemies(t, { player, isWall, takeDamage, state: G });
  updateBullets(scene, isWall, G);
  updatePickups(scene, player, G, hud.showWaveMsg, hud.updateHUD, hud.updateAmmoBar, t);
  updateLights(t);
  minimap.drawMinimap();
  renderer.render(scene, camera);
}

function togglePause() {
  if (!G.running) return;
  G.paused = !G.paused;
  if (G.paused) {
    document.exitPointerLock();
    clearInputState();
    pauseScreenEl.style.display = 'flex';
  } else {
    pauseScreenEl.style.display = 'none';
    canvas.requestPointerLock();
  }
}

function resumeGame() {
  if (!G.running) return;
  G.paused = false;
  pauseScreenEl.style.display = 'none';
  canvas.requestPointerLock();
}

function backToMainMenu() {
  G.running = false;
  G.paused = false;
  clearEnemies(scene);
  clearBullets(scene);
  clearPickups(scene);
  document.exitPointerLock();
  pauseScreenEl.style.display = 'none';
  document.getElementById('deathScreen').style.display = 'none';
  document.getElementById('overlay').style.display = 'flex';
}

window.startGame = function startGame() {
  const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'medium';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('deathScreen').style.display = 'none';
  pauseScreenEl.style.display = 'none';
  clearEnemies(scene);
  clearBullets(scene);
  clearPickups(scene);
  resetState();
  applyDifficulty(selectedDifficulty);
  G.running = true;
  G.paused = false;
  hud.updateHUD();
  hud.updateAmmoBar();
  spawnNextWave(1);
  loop();
};

window.restartGame = function restartGame() {
  resetState();
  applyDifficulty(G.difficultyKey);
  clearEnemies(scene);
  clearBullets(scene);
  clearPickups(scene);
  document.getElementById('deathScreen').style.display = 'none';
  document.getElementById('healthVal').classList.remove('low');
  G.running = true;
  G.paused = false;
  pauseScreenEl.style.display = 'none';
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
