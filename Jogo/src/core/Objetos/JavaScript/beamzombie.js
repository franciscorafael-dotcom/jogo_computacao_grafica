import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Scene Setup ───────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);
scene.fog = new THREE.Fog(0x0a0a0f, 25, 70);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.body.appendChild(renderer.domElement);

// ─── Controls ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 4;
controls.maxDistance = 35;
controls.update();

// ─── Lighting ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x223344, 2.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xff5500, 3.5);
dirLight.position.set(5, 15, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 60;
dirLight.shadow.camera.left = -12;
dirLight.shadow.camera.right = 12;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -5;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x0044ff, 1.5);
rimLight.position.set(-8, 6, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0x224433, 1.2);
fillLight.position.set(0, -3, 6);
scene.add(fillLight);

const plasmaGlow = new THREE.PointLight(0x00ffcc, 4.5, 10);
plasmaGlow.position.set(0.6, 2.5, 1.5);
scene.add(plasmaGlow);

const eyeGlow = new THREE.PointLight(0xff2200, 3.0, 7);
eyeGlow.position.set(0, 3.2, 1.2);
scene.add(eyeGlow);

// ─── Ground Platform ──────────────────────────────────────────────────────────
const groundGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.2, 32);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x050510, roughness: 0.95, metalness: 0.1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -5.5;
ground.receiveShadow = true;
scene.add(ground);

const pentaMat = new THREE.LineBasicMaterial({ color: 0x003322 });
const pentaPoints = [];
for (let i = 0; i <= 5; i++) {
  const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
  pentaPoints.push(new THREE.Vector3(Math.cos(angle) * 3.2, -5.38, Math.sin(angle) * 3.2));
}
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pentaPoints), pentaMat));

const ringGeo = new THREE.TorusGeometry(3.5, 0.045, 6, 40);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1.0 });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = -5.38;
scene.add(ring);

// ─── Materiais ────────────────────────────────────────────────────────────────
function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const skinMat  = new THREE.MeshStandardMaterial({ color: 0x4a7a4a, roughness: 0.88, metalness: 0.0 });
const armorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.5,  metalness: 0.7  });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.35, metalness: 0.85 });
const eyeMat   = new THREE.MeshStandardMaterial({
  color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 3.0, roughness: 0.1, metalness: 0.0
});
const plasmaMat = new THREE.MeshStandardMaterial({
  color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 2.0, roughness: 0.1, metalness: 0.1
});

// ─── Modelo ───────────────────────────────────────────────────────────────────
const model = new THREE.Group();
scene.add(model);

function buildLeg(side) {
  const g = new THREE.Group();
  const thigh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.55, 8), armorMat));
  thigh.position.y = -0.28;
  g.add(thigh);
  const knee = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 7), metalMat));
  knee.position.y = -0.58;
  g.add(knee);
  const lowerLeg = new THREE.Group();
  lowerLeg.position.y = -0.58;
  const shin = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.52, 8), skinMat));
  shin.position.y = -0.3;
  lowerLeg.add(shin);
  const boot = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.3), armorMat));
  boot.position.set(0, -0.62, 0.06);
  lowerLeg.add(boot);
  g.add(lowerLeg);
  g.position.set(side * 0.22, 0, 0);
  g.userData.lowerLeg = lowerLeg;
  return g;
}

const legL = buildLeg(-1);
const legR = buildLeg(1);
model.add(legL, legR);

const pelvis = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.26, 10), armorMat));
pelvis.position.y = 0.14;
model.add(pelvis);

const abdo = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.3, 10), skinMat));
abdo.position.y = 0.44;
model.add(abdo);

const chest = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.42, 10), armorMat));
chest.position.y = 0.77;
model.add(chest);

const plate = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.1), metalMat));
plate.position.set(0, 0.8, 0.3);
model.add(plate);

const neck = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.18, 8), skinMat));
neck.position.y = 1.07;
model.add(neck);

const headGroup = new THREE.Group();
headGroup.position.y = 1.28;
const skull = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skinMat));
skull.scale.set(1, 1.05, 0.95);
headGroup.add(skull);
const visor = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.12), armorMat));
visor.position.set(0, 0.1, 0.2);
headGroup.add(visor);
const eyeMesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.06), eyeMat));
eyeMesh.position.set(0, 0.1, 0.27);
headGroup.add(eyeMesh);
model.add(headGroup);

const leftArm = new THREE.Group();
const luArm = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.42, 8), skinMat));
luArm.rotation.z = -0.5; luArm.position.set(-0.18, -0.22, 0);
leftArm.add(luArm);
const lfArm = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8), skinMat));
lfArm.rotation.z = -0.3; lfArm.rotation.x = 0.2; lfArm.position.set(-0.3, -0.6, 0.06);
leftArm.add(lfArm);
leftArm.position.set(-0.38, 0.94, 0);
model.add(leftArm);

const rightArm = new THREE.Group();
const rShoulder = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 7), metalMat));
rShoulder.position.set(0.1, -0.06, 0);
rightArm.add(rShoulder);
const barrel = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.62, 10), metalMat));
barrel.rotation.x = Math.PI / 2 - 0.25; barrel.rotation.z = 0.12;
barrel.position.set(0.18, -0.38, 0.1);
rightArm.add(barrel);
for (let i = 0; i < 3; i++) {
  const coil = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 6, 12), plasmaMat));
  coil.position.set(0.18, -0.22 - i * 0.14, 0.06);
  coil.rotation.x = Math.PI / 2 - 0.25; coil.rotation.z = 0.12;
  rightArm.add(coil);
}
const muzzle = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), plasmaMat));
muzzle.position.set(0.24, -0.72, 0.26);
rightArm.add(muzzle);
const tank = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.28, 8), plasmaMat));
tank.position.set(0.1, -0.18, -0.14); tank.rotation.x = 0.3;
rightArm.add(tank);
rightArm.position.set(0.38, 0.94, 0);
model.add(rightArm);

model.scale.setScalar(3.2);
model.position.y = 0.5;

// ─── Animação ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let walkPhase = 0;
let _glowT = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  walkPhase += dt * 2.2;
  _glowT    += dt * 3.0;

  const swing = Math.sin(walkPhase) * 0.45;
  legL.rotation.x = swing;
  legL.userData.lowerLeg.rotation.x = Math.max(0, swing) * 0.5;
  legR.rotation.x = -swing;
  legR.userData.lowerLeg.rotation.x = Math.max(0, -swing) * 0.5;

  model.position.y = 0.5 + Math.abs(Math.sin(walkPhase)) * 0.14;
  model.rotation.z = Math.sin(walkPhase) * 0.03;

  leftArm.rotation.x = -swing * 0.5;
  barrel.rotation.z = 0.12 + Math.sin(_glowT * 0.4) * 0.04;

  headGroup.position.y = 1.28 + Math.sin(walkPhase) * 0.04;
  headGroup.rotation.x = Math.sin(walkPhase) * 0.12;
  headGroup.rotation.y = Math.sin(walkPhase * 0.5) * 0.2;

  const pulse = 0.8 + Math.sin(_glowT * 1.0) * 0.5;
  plasmaMat.emissiveIntensity = Math.max(0.3, pulse);
  eyeMat.emissiveIntensity = 1.8 + Math.sin(_glowT * 1.5) * 0.8;

  plasmaGlow.intensity = 3.5 + Math.sin(_glowT * 1.0) * 1.5;
  eyeGlow.intensity    = 2.0 + Math.sin(_glowT * 1.5) * 0.8;

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();