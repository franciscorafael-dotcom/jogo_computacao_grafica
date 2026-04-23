import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Renderer ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
document.body.appendChild(renderer.domElement);

// ─── Cena ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050008);
scene.fog = new THREE.Fog(0x050008, 30, 80);

// ─── Câmara ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 5, 20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 5;
controls.maxDistance = 45;
controls.update();

// ─── Iluminação ───────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x110014, 1.5));

const dirLight = new THREE.DirectionalLight(0xff3300, 2.2);
dirLight.position.set(8, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 70;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -6;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x440088, 1.0);
rimLight.position.set(-10, 8, -6);
scene.add(rimLight);

const brainGlow = new THREE.PointLight(0x00ffff, 5.0, 12);
brainGlow.position.set(0, 5.5, 1.5);
scene.add(brainGlow);

const veinGlow = new THREE.PointLight(0xff0044, 2.5, 8);
veinGlow.position.set(0, 4.5, 0);
scene.add(veinGlow);

const groundLight = new THREE.PointLight(0x220033, 1.5, 14);
groundLight.position.set(0, 0.5, 0);
scene.add(groundLight);

// ─── Chão ─────────────────────────────────────────────────────────────────────
const groundGeo = new THREE.CylinderGeometry(6.5, 6.5, 0.2, 40);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x060005, roughness: 0.95, metalness: 0.15 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

// Pentagrama duplo
[4.5, 5.8].forEach((r) => {
  const mat = new THREE.LineBasicMaterial({ color: 0x330044 });
  const pts = [];
  for (let i = 0; i <= 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0.01, Math.sin(a) * r));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
});

const ringGeo = new THREE.TorusGeometry(5.5, 0.05, 6, 48);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.7 });
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

const chassisMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.45, metalness: 0.85 });
const legMat     = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.5,  metalness: 0.75 });
const jointMat   = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.3,  metalness: 0.9  });
const brainMat   = new THREE.MeshStandardMaterial({
  color: 0xff6688, emissive: 0x880022, emissiveIntensity: 0.5, roughness: 0.75, metalness: 0.0
});
const veinMat    = new THREE.MeshStandardMaterial({
  color: 0xff2244, emissive: 0xff0022, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.0
});
const eyeMat     = new THREE.MeshStandardMaterial({
  color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3.0, roughness: 0.05, metalness: 0.0
});
const chaingunMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.85 });
const muzzleMat   = new THREE.MeshStandardMaterial({
  color: 0xff8800, emissive: 0xff8800, emissiveIntensity: 1.5, roughness: 0.1, metalness: 0.0
});
const techMat     = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.4, metalness: 0.8 });

// ─── Modelo ───────────────────────────────────────────────────────────────────
const model = new THREE.Group();
scene.add(model);

// Chassis
const chassis = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.7), chassisMat));
chassis.position.y = 1.2;
model.add(chassis);

[-1, 1].forEach((s) => {
  const side = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 1.5), legMat));
  side.position.set(s * 1.15, 1.2, 0);
  model.add(side);
});

[[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]].forEach(([px, pz]) => {
  const panel = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.38), jointMat));
  panel.position.set(px, 1.5, pz);
  model.add(panel);
});

const spine = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.85, 10), techMat));
spine.position.set(0, 1.88, 0);
model.add(spine);

// Pernas de aranha
const legGroups = [];
function buildSpiderLeg(side, zOff) {
  const g = new THREE.Group();
  g.position.set(side * 1.0, 1.2, zOff);

  g.add(shadow(new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 7), jointMat)));

  const seg1 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.88, 7), legMat));
  seg1.position.set(side * 0.44, -0.22, 0.12 * Math.sign(zOff + 0.001));
  seg1.rotation.z = side * 0.55; seg1.rotation.x = -0.3;
  g.add(seg1);

  const knee = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 7), jointMat));
  knee.position.set(side * 0.78, -0.46, 0.18 * Math.sign(zOff + 0.001));
  g.add(knee);

  const seg2 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.065, 0.95, 7), legMat));
  seg2.position.set(side * 1.06, -0.86, 0.22 * Math.sign(zOff + 0.001));
  seg2.rotation.z = side * 1.0; seg2.rotation.x = 0.58;
  g.add(seg2);

  const claw = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.24, 6), jointMat));
  claw.position.set(side * 1.28, -1.22, 0.28 * Math.sign(zOff + 0.001));
  claw.rotation.z = side * 1.4; claw.rotation.x = 1.1;
  g.add(claw);

  model.add(g);
  return g;
}

[-0.62, -0.21, 0.21, 0.62].forEach((z) => {
  legGroups.push(buildSpiderLeg( 1, z));
  legGroups.push(buildSpiderLeg(-1, z));
});

// Cérebro
const brainGroup = new THREE.Group();
brainGroup.position.set(0, 2.6, 0);
model.add(brainGroup);

const brainMesh = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 14), brainMat));
brainMesh.scale.set(1, 0.82, 0.92);
brainGroup.add(brainMesh);

const gyriData = [
  [0, 0, 0], [0.55, 0.28, 0], [-0.48, 0.38, 0],
  [0, 0.48, 0.48], [0, -0.38, 0.42],
  [0, 0, 0.58], [0, 0, -0.52], [0.28, -0.48, 0]
];
gyriData.forEach(([rx, ry, rz]) => {
  const fold = shadow(new THREE.Mesh(
    new THREE.TorusGeometry(0.38 + Math.random() * 0.14, 0.042 + Math.random() * 0.018, 6, 14),
    veinMat
  ));
  fold.rotation.set(rx, ry, rz);
  fold.scale.set(0.88 + Math.random() * 0.22, 0.48 + Math.random() * 0.32, 0.9);
  brainGroup.add(fold);
});

for (let i = 0; i < 7; i++) {
  const angle = (i / 7) * Math.PI * 2;
  const t = shadow(new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.008, 0.55 + Math.random() * 0.35, 5),
    veinMat
  ));
  t.position.set(Math.cos(angle) * 0.36, -0.52, Math.sin(angle) * 0.32);
  t.rotation.x = (Math.random() - 0.5) * 0.5;
  t.rotation.z = (Math.random() - 0.5) * 0.35;
  brainGroup.add(t);
}

const bossEye = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), eyeMat));
bossEye.position.set(0, 0.06, 0.66);
brainGroup.add(bossEye);

const eyeRim = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.04, 8, 16), techMat));
eyeRim.position.set(0, 0.06, 0.62);
brainGroup.add(eyeRim);

[[-0.33, 0.22, 0.58], [0.33, 0.22, 0.58]].forEach(([x, y, z]) => {
  const sEye = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 7), eyeMat));
  sEye.position.set(x, y, z);
  brainGroup.add(sEye);
});

const crown = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.72, 0.2, 14, 1, true), techMat));
crown.position.y = -0.14;
brainGroup.add(crown);

// Chaingun
const mount = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), techMat));
mount.position.set(1.14, 1.42, -0.24);
model.add(mount);

[{ dx: 0, dy: 0.1 }, { dx: 0.09, dy: -0.05 }, { dx: -0.09, dy: -0.05 }].forEach(({ dx, dy }) => {
  const b = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.82, 8), chaingunMat));
  b.rotation.x = Math.PI / 2;
  b.position.set(1.14 + dx, 1.42 + dy, -0.65);
  model.add(b);
});

const muzzle = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), muzzleMat));
muzzle.position.set(1.14, 1.42, -1.08);
model.add(muzzle);

model.scale.setScalar(1.2);
model.position.y = 0.5;

// ─── Animação ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let walkPhase = 0;
let _t = 0;

const chassisBaseY  = 1.2;
const spineBaseY    = 1.88;
const brainBaseY    = 2.6;
const mountBaseY    = 1.42;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  walkPhase += dt * 1.4;
  _t        += dt * 2.5;

  const bob = Math.sin(_t * 1.6) * 0.15;
  chassis.position.y    = chassisBaseY + bob;
  spine.position.y      = spineBaseY   + bob;
  brainGroup.position.y = brainBaseY   + bob;
  mount.position.y      = mountBaseY   + bob;

  legGroups.forEach((leg, i) => {
    const offset = (i % 2 === 0) ? 0 : Math.PI;
    leg.rotation.x = Math.sin(walkPhase * 1.4 + offset) * 0.3;
    leg.position.y = chassisBaseY + bob;
  });

  brainGroup.rotation.x = Math.sin(_t * 0.34) * 0.045;
  brainGroup.rotation.z = Math.sin(_t * 0.26 + 1.0) * 0.04;

  brainMat.emissiveIntensity  = 0.3 + Math.sin(_t * 1.0) * 0.2;
  veinMat.emissiveIntensity   = 1.0 + Math.sin(_t * 1.4) * 0.6;
  eyeMat.emissiveIntensity    = 2.0 + Math.sin(_t * 2.0) * 1.2;
  muzzleMat.emissiveIntensity = 0.8 + Math.sin(_t * 2.6) * 0.5;

  brainGlow.intensity = 3.5 + Math.sin(_t * 2.0) * 2.0;
  veinGlow.intensity  = 1.5 + Math.sin(_t * 1.4) * 1.0;

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();