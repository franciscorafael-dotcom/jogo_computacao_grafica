import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Renderer ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

// ─── Cena ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080005);
scene.fog = new THREE.Fog(0x080005, 22, 65);

// ─── Câmara ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 3.5, 12);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 3;
controls.maxDistance = 30;
controls.update();

// ─── Iluminação ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x110008, 1.4));

const dirLight = new THREE.DirectionalLight(0xff3300, 2.8);
dirLight.position.set(5, 14, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 14;
dirLight.shadow.camera.bottom = -4;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x220066, 0.8);
rimLight.position.set(-8, 6, -5);
scene.add(rimLight);

const reaperGlow = new THREE.PointLight(0xff4400, 3.5, 8);
reaperGlow.position.set(0, 2.5, 1.5);
scene.add(reaperGlow);

const eyeGlow = new THREE.PointLight(0xffaa00, 2.5, 5);
eyeGlow.position.set(0, 3.0, 1.2);
scene.add(eyeGlow);

// ─── Chão ─────────────────────────────────────────────────────────────────────
const groundGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.2, 32);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x080003, roughness: 0.95, metalness: 0.1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

// Pentagrama no chão
const pentaMat = new THREE.LineBasicMaterial({ color: 0x440011 });
const pentaPoints = [];
for (let i = 0; i <= 5; i++) {
  const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
  pentaPoints.push(new THREE.Vector3(Math.cos(a) * 3.5, 0.01, Math.sin(a) * 3.5));
}
scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pentaPoints), pentaMat));

const ringGeo = new THREE.TorusGeometry(3.5, 0.04, 6, 40);
const ringMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.9 });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.02;
scene.add(ring);

// ─── Materiais ────────────────────────────────────────────────────────────────
function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const boneMat  = new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.75, metalness: 0.05 });
const darkMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9, metalness: 0.0 });
const bladeMat = new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.2, metalness: 0.9 });
const glowMat  = new THREE.MeshStandardMaterial({
  color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 1.8, roughness: 0.1, metalness: 0.0
});
const eyeMat   = new THREE.MeshStandardMaterial({
  color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 3.0, roughness: 0.05, metalness: 0.0
});

// ─── Modelo ───────────────────────────────────────────────────────────────────
const model = new THREE.Group();
scene.add(model);

// Pernas
function buildLeg(side) {
  const g = new THREE.Group();

  const thigh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.52, 7), boneMat));
  thigh.position.y = -0.26;
  g.add(thigh);

  const knee = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 7), boneMat));
  knee.position.y = -0.55;
  g.add(knee);

  const lowerLeg = new THREE.Group();
  lowerLeg.position.y = -0.55;

  const shin = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.5, 7), darkMat));
  shin.position.y = -0.27;
  lowerLeg.add(shin);

  const claw = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 5), boneMat));
  claw.position.set(0, -0.6, 0.1);
  claw.rotation.x = -0.7;
  lowerLeg.add(claw);

  g.add(lowerLeg);
  g.position.set(side * 0.16, 0, 0);
  g.userData.lowerLeg = lowerLeg;
  return g;
}

const legL = buildLeg(-1);
const legR = buildLeg(1);
model.add(legL, legR);

// Pelve
const pelvis = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.2), boneMat));
pelvis.position.y = 0.12;
model.add(pelvis);

// Torso
const torsoMesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.22), darkMat));
torsoMesh.position.y = 0.46;
model.add(torsoMesh);

for (let i = 0; i < 3; i++) {
  const rib = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.045, 0.08), glowMat));
  rib.position.set(0, 0.62 - i * 0.15, 0.1);
  model.add(rib);
}

for (let i = 0; i < 4; i++) {
  const v = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 5), boneMat));
  v.position.set(0, 0.68 - i * 0.14, -0.09);
  model.add(v);
}

// Pescoço
const neck = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.18, 7), boneMat));
neck.position.y = 0.84;
model.add(neck);

// Cabeça
const headGroup = new THREE.Group();
headGroup.position.y = 1.02;

const skull = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), boneMat));
skull.scale.set(1, 1.08, 0.95);
headGroup.add(skull);

const jaw = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.17), boneMat));
jaw.position.set(0, -0.14, 0.06);
headGroup.add(jaw);

[-0.08, 0.08].forEach((ox) => {
  const socket = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 7), eyeMat));
  socket.position.set(ox, 0.06, 0.17);
  headGroup.add(socket);
});

[-0.1, 0.1].forEach((ox) => {
  const horn = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 6), boneMat));
  horn.position.set(ox, 0.22, 0);
  horn.rotation.z = ox < 0 ? -0.3 : 0.3;
  headGroup.add(horn);
});

model.add(headGroup);

// Braços com foices
function buildScytheArm(side) {
  const g = new THREE.Group();

  const upper = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.42, 7), boneMat));
  upper.position.y = -0.21;
  g.add(upper);

  const lower = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.05, 0.36, 7), boneMat));
  lower.position.y = -0.52;
  lower.rotation.x = 0.3 * side;
  g.add(lower);

  const blade = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.55, 4), bladeMat));
  blade.position.set(0, -0.84, 0.12);
  blade.rotation.x = 0.55; blade.rotation.z = side * 0.28;
  blade.scale.set(0.38, 1, 1);
  g.add(blade);

  const glowLine = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.44, 0.018), glowMat));
  glowLine.position.set(0, -0.84, 0.12);
  glowLine.rotation.x = 0.55;
  g.add(glowLine);

  g.position.set(side * 0.24, 0.72, 0);
  g.rotation.z = side * 0.32;
  return g;
}

const leftArm  = buildScytheArm(-1);
const rightArm = buildScytheArm(1);
model.add(leftArm, rightArm);

model.scale.setScalar(3.2);
model.position.y = 0.1;

// ─── Animação ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let walkPhase = 0;
let _t = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  walkPhase += dt * 2.4;
  _t        += dt * 3.5;

  const swing = Math.sin(walkPhase) * 0.55;

  legL.rotation.x = swing;
  legL.userData.lowerLeg.rotation.x = Math.max(0, swing) * 0.5;
  legR.rotation.x = -swing;
  legR.userData.lowerLeg.rotation.x = Math.max(0, -swing) * 0.5;

  model.position.y = 0.1 + Math.abs(Math.sin(walkPhase)) * 0.16;
  model.rotation.z = Math.sin(walkPhase) * 0.04;

  torsoMesh.rotation.x = 0.18;
  headGroup.rotation.x = 0.14;

  leftArm.rotation.x  =  Math.sin(_t * 0.31) * 0.3;
  rightArm.rotation.x = -Math.sin(_t * 0.31) * 0.3;

  headGroup.position.y = 1.02 + Math.sin(walkPhase) * 0.04;
  headGroup.rotation.y = Math.sin(walkPhase * 0.5) * 0.2;

  glowMat.emissiveIntensity = 1.2 + Math.sin(_t * 1.14) * 0.8;
  eyeMat.emissiveIntensity  = 2.0 + Math.sin(_t * 1.57) * 1.2;

  reaperGlow.intensity = 2.5 + Math.sin(_t * 1.14) * 1.5;
  eyeGlow.intensity    = 2.0 + Math.sin(_t * 1.57) * 1.0;

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();