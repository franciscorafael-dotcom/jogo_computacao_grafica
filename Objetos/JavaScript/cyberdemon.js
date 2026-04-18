import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Scene Setup ───────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0a0a);
scene.fog = new THREE.Fog(0x1a0a0a, 30, 80);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 6, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

// ─── Controls ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 5;
controls.maxDistance = 40;
controls.update();

// ─── Lighting ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x220808, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xff4400, 2.5);
dirLight.position.set(5, 15, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 60;
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -5;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x4400ff, 0.8);
rimLight.position.set(-8, 8, -5);
scene.add(rimLight);

// Glowing eye point lights
const eyeLightL = new THREE.PointLight(0xff0000, 3, 4);
const eyeLightR = new THREE.PointLight(0xff0000, 3, 4);

// Ground light
const groundLight = new THREE.PointLight(0xff2200, 1.5, 12);
groundLight.position.set(0, 0.5, 0);
scene.add(groundLight);

// ─── Materials ─────────────────────────────────────────────────────────────────
const skinMat = new THREE.MeshStandardMaterial({
    color: 0x7a4520,
    roughness: 0.85,
    metalness: 0.05,
});

const darkSkinMat = new THREE.MeshStandardMaterial({
    color: 0x5a3010,
    roughness: 0.9,
    metalness: 0.0,
});

const metalMat = new THREE.MeshStandardMaterial({
    color: 0x5a6070,
    roughness: 0.35,
    metalness: 0.85,
});

const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x303540,
    roughness: 0.4,
    metalness: 0.9,
});

const redMat = new THREE.MeshStandardMaterial({
    color: 0xcc1100,
    roughness: 0.6,
    metalness: 0.1,
    emissive: 0x440000,
    emissiveIntensity: 0.5,
});

const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff2200,
    emissiveIntensity: 3,
    roughness: 0.1,
    metalness: 0.0,
});

const hornMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a08,
    roughness: 0.95,
    metalness: 0.0,
});

// ── Dentes brancos brilhantes ─────────────────────────────────────────────────
const toothMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2ee,       // branco-marfim
    roughness: 0.12,        // superfície polida → reflexo nítido
    metalness: 0.05,
    emissive: 0x999988,
    emissiveIntensity: 0.10, // brilho subtil próprio
});

// ─── Helper ────────────────────────────────────────────────────────────────────
function shadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// ─── Cyberdemon Group ──────────────────────────────────────────────────────────
const cyberdemon = new THREE.Group();
scene.add(cyberdemon);

// ════════════════════════════════════════════════════════
//  LEGS — hierarquia: legRoot (anca) → lowerLeg (joelho)
// ════════════════════════════════════════════════════════

function buildLeg(side) {
    const legRoot = new THREE.Group(); // pivot na anca

    // Coxa
    const thighGeo = new THREE.CylinderGeometry(0.65, 0.5, 2.0, 10);
    const thigh = shadow(new THREE.Mesh(thighGeo, skinMat));
    thigh.position.y = -1.0;
    legRoot.add(thigh);

    // Esfera do joelho
    const kneeGeo = new THREE.SphereGeometry(0.55, 10, 8);
    const knee = shadow(new THREE.Mesh(kneeGeo, darkSkinMat));
    knee.position.y = -2.1;
    legRoot.add(knee);

    // ── lowerLeg — pivot no joelho ────────────────────────
    const lowerLeg = new THREE.Group();
    lowerLeg.position.y = -2.1; // coincide com o centro do joelho

    // Esfera de ligação (topo da perna inferior)
    const ligGeo = new THREE.SphereGeometry(0.52, 10, 8);
    const lig = shadow(new THREE.Mesh(ligGeo, darkSkinMat));
    lig.position.y = -0.05;
    lowerLeg.add(lig);

    // Canela
    const shinGeo = new THREE.CylinderGeometry(0.45, 0.4, 1.6, 10);
    const shin = shadow(new THREE.Mesh(shinGeo, skinMat));
    shin.position.y = -1.0;
    lowerLeg.add(shin);

    // Proteção metálica
    const braceGeo = new THREE.CylinderGeometry(0.5, 0.48, 0.9, 12);
    const brace = shadow(new THREE.Mesh(braceGeo, metalMat));
    brace.position.y = -1.7;
    lowerLeg.add(brace);

    // Bota
    const hoofGeo = new THREE.CylinderGeometry(0.55, 0.7, 0.5, 8);
    const hoof = shadow(new THREE.Mesh(hoofGeo, darkMetalMat));
    hoof.position.y = -2.45;
    lowerLeg.add(hoof);

    // Aro da bota
    const rimGeo = new THREE.TorusGeometry(0.62, 0.08, 8, 20);
    const rim = shadow(new THREE.Mesh(rimGeo, metalMat));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -2.25;
    lowerLeg.add(rim);

    legRoot.add(lowerLeg);
    legRoot.position.set(side * 0.95, 0, 0);
    legRoot.userData.lowerLeg = lowerLeg; // referência para animação
    return legRoot;
}

const legGroupL = buildLeg(-1);
const legGroupR = buildLeg(1);
cyberdemon.add(legGroupL);
cyberdemon.add(legGroupR);

const lowerLegL = legGroupL.userData.lowerLeg;
const lowerLegR = legGroupR.userData.lowerLeg;

// ════════════════════════════════════════════════════════
//  PELVIS / WAIST
// ════════════════════════════════════════════════════════

const pelvisGeo = new THREE.CylinderGeometry(1.1, 0.95, 0.8, 12);
const pelvis = shadow(new THREE.Mesh(pelvisGeo, skinMat));
pelvis.position.y = 0.4;
cyberdemon.add(pelvis);

const beltGeo = new THREE.BoxGeometry(2.0, 0.7, 0.7);
const belt = shadow(new THREE.Mesh(beltGeo, redMat));
belt.position.set(0, 0.2, 0.2);
cyberdemon.add(belt);

// ════════════════════════════════════════════════════════
//  TORSO
// ════════════════════════════════════════════════════════

const abdoGeo = new THREE.CylinderGeometry(1.05, 1.1, 1.0, 12);
const abdo = shadow(new THREE.Mesh(abdoGeo, skinMat));
abdo.position.y = 1.3;
cyberdemon.add(abdo);

const chestGeo = new THREE.CylinderGeometry(1.45, 1.05, 1.6, 12);
const chest = shadow(new THREE.Mesh(chestGeo, skinMat));
chest.position.y = 2.7;
cyberdemon.add(chest);

// ════════════════════════════════════════════════════════
//  SHOULDERS
// ════════════════════════════════════════════════════════

for (let s = -1; s <= 1; s += 2) {
    const shoulderGeo = new THREE.SphereGeometry(0.72, 10, 8);
    const shoulder = shadow(new THREE.Mesh(shoulderGeo, skinMat));
    shoulder.scale.set(1, 0.95, 0.9);
    shoulder.position.set(s * 1.85, 3.3, 0);
    cyberdemon.add(shoulder);
}

// ════════════════════════════════════════════════════════
//  LEFT ARM
// ════════════════════════════════════════════════════════

const leftArm = new THREE.Group();

const uArmGeo = new THREE.CylinderGeometry(0.42, 0.36, 1.6, 10);
const uArm = shadow(new THREE.Mesh(uArmGeo, skinMat));
uArm.rotation.z = -0.65;
uArm.position.set(-0.5, -0.9, 0);
leftArm.add(uArm);

const elbowGeo = new THREE.SphereGeometry(0.38, 8, 6);
const elbow = shadow(new THREE.Mesh(elbowGeo, darkSkinMat));
elbow.position.set(-0.95, -1.75, 0);
leftArm.add(elbow);

const fArmGeo = new THREE.CylinderGeometry(0.34, 0.28, 1.4, 10);
const fArm = shadow(new THREE.Mesh(fArmGeo, skinMat));
fArm.rotation.z = -0.4;
fArm.position.set(-1.4, -2.6, 0);
leftArm.add(fArm);

const fistGeo = new THREE.SphereGeometry(0.35, 8, 7);
const fist = shadow(new THREE.Mesh(fistGeo, skinMat));
fist.scale.set(1.2, 0.85, 1.0);
fist.position.set(-1.75, -3.3, 0);
leftArm.add(fist);

leftArm.position.set(-1.85, 3.3, 0);
cyberdemon.add(leftArm);

// ════════════════════════════════════════════════════════
//  RIGHT ARM (cybernetic rocket launcher)
// ════════════════════════════════════════════════════════

const rightArm = new THREE.Group();

const rUArmGeo = new THREE.CylinderGeometry(0.44, 0.38, 1.5, 10);
const rUArm = shadow(new THREE.Mesh(rUArmGeo, skinMat));
rUArm.rotation.z = 0.65;
rUArm.position.set(0.5, -0.9, 0);
rightArm.add(rUArm);

const rElbowGeo = new THREE.SphereGeometry(0.42, 10, 8);
const rElbow = shadow(new THREE.Mesh(rElbowGeo, metalMat));
rElbow.position.set(0.95, -1.75, 0);
rightArm.add(rElbow);

const rFArmGeo = new THREE.CylinderGeometry(0.38, 0.45, 1.5, 12);
const rFArm = shadow(new THREE.Mesh(rFArmGeo, darkMetalMat));
rFArm.rotation.z = 0.4;
rFArm.position.set(1.4, -2.6, 0);
rightArm.add(rFArm);

const barrelTipGeo = new THREE.CylinderGeometry(0.44, 0.3, 0.4, 12);
const barrelTip = shadow(new THREE.Mesh(barrelTipGeo, metalMat));
barrelTip.rotation.z = 0.4;
barrelTip.position.set(1.8, -3.5, 0);
rightArm.add(barrelTip);

// Rings à volta do rFArm (rotation.z = 0.4, posição central 1.4, -2.6).
// O eixo do cilindro aponta em (sin0.4, cos0.4) ≈ (0.389, 0.921).
// Cada anel tem a mesma rotation.z para ficar perpendicular ao cilindro.
const rFArmDirX = Math.sin(0.4);
const rFArmDirY = Math.cos(0.4);
for (let r = 0; r < 5; r++) {
    const t = (r - 1) * 0.42; // -0.42, 0, +0.42
    const ringGeo = new THREE.TorusGeometry(0.46, 0.07, 8, 24);
    const ring = shadow(new THREE.Mesh(ringGeo, metalMat));
    ring.rotation.z = 0.4; // paralela ao cilindro
    ring.rotation.x = Math.PI/2.5; // alinhada com o cilindro
    ring.rotation.y = - Math.PI / 0.1; // orientada para o lado
    ring.position.set(
        1.6 - t * rFArmDirX,
        -3 + t * rFArmDirY,
        0
    );
    rightArm.add(ring);
}

rightArm.position.set(1.85, 3.3, 0);
cyberdemon.add(rightArm);

// ════════════════════════════════════════════════════════
//  NECK
// ════════════════════════════════════════════════════════

const neckGeo = new THREE.CylinderGeometry(0.6, 0.75, 0.55, 10);
const neck = shadow(new THREE.Mesh(neckGeo, skinMat));
neck.position.y = 3.85;
cyberdemon.add(neck);

// ════════════════════════════════════════════════════════
//  HEAD — grupo independente para animação própria
// ════════════════════════════════════════════════════════

const headGroup = new THREE.Group();
headGroup.position.y = 5.0;

const skullGeo = new THREE.SphereGeometry(1.0, 14, 12);
const skull = shadow(new THREE.Mesh(skullGeo, skinMat));
skull.scale.set(1.05, 1.0, 0.95);
headGroup.add(skull);

const browGeo = new THREE.BoxGeometry(1.9, 0.28, 0.55);
const brow = shadow(new THREE.Mesh(browGeo, darkSkinMat));
brow.position.set(0, 0.4, 0.75);
brow.rotation.x = -0.15;
headGroup.add(brow);

const snoutGeo = new THREE.BoxGeometry(1.3, 0.65, 0.7);
const snout = shadow(new THREE.Mesh(snoutGeo, skinMat));
snout.position.set(0, -0.25, 1.05);
headGroup.add(snout);

const jawGeo = new THREE.BoxGeometry(1.2, 0.38, 0.65);
const jaw = shadow(new THREE.Mesh(jawGeo, darkSkinMat));
jaw.position.set(0, -0.6, 0.8);
headGroup.add(jaw);

// Presas — brancas e brilhantes
[-0.3, 0.3].forEach(x => {
    const tuskGeo = new THREE.ConeGeometry(0.09, 0.4, 5);
    const tusk = shadow(new THREE.Mesh(tuskGeo, toothMat));
    tusk.position.set(x, -0.75, 1.22);
    tusk.rotation.x = Math.PI;
    headGroup.add(tusk);
});

// Eyes
[-0.42, 0.42].forEach((x, i) => {
    const socketGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const socket = shadow(new THREE.Mesh(socketGeo, darkSkinMat));
    socket.position.set(x, 0.2, 0.85);
    headGroup.add(socket);

    const eyeGeo = new THREE.SphereGeometry(0.17, 10, 8);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.2, 0.95);
    headGroup.add(eye);

    const light = i === 0 ? eyeLightL : eyeLightR;
    light.position.set(x, headGroup.position.y + 0.2, 1.2);
});

// ─── Horns ─────────────────────────────────────────────────────────────────────
function buildHorn(side) {
    const hornGroup = new THREE.Group();

    const h1Geo = new THREE.CylinderGeometry(0.06, 0.2, 1.1, 8);
    const h1 = shadow(new THREE.Mesh(h1Geo, hornMat));
    hornGroup.add(h1);

    const h2Geo = new THREE.ConeGeometry(0.06, 0.5, 7);
    const h2 = shadow(new THREE.Mesh(h2Geo, hornMat));
    h2.position.y = 0.8;
    hornGroup.add(h2);

    hornGroup.position.set(side * 0.75, 0.7, -0.1);
    hornGroup.rotation.z = side * -0.1;
    hornGroup.rotation.x = -0.3;

    return hornGroup;
}

headGroup.add(buildHorn(-1));
headGroup.add(buildHorn(1));

cyberdemon.add(headGroup);

eyeLightL.position.set(-0.42, 5.2, 1.1);
eyeLightR.position.set(0.42, 5.2, 1.1);
cyberdemon.add(eyeLightL, eyeLightR);

// ════════════════════════════════════════════════════════
//  GROUND PLATFORM
// ════════════════════════════════════════════════════════

const groundGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.2, 32);
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1a0505,
    roughness: 0.95,
    metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -4.9;
ground.receiveShadow = true;
scene.add(ground);

const pentaMat = new THREE.LineBasicMaterial({ color: 0x880000 });
const pentaPoints = [];
for (let i = 0; i <= 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    pentaPoints.push(new THREE.Vector3(
        Math.cos(angle) * 3.2,
        -4.75,
        Math.sin(angle) * 3.2
    ));
}
const pentaGeo = new THREE.BufferGeometry().setFromPoints(pentaPoints);
const pentagram = new THREE.Line(pentaGeo, pentaMat);
scene.add(pentagram);

// ─── Posição inicial ───────────────────────────────────────────────────────────
cyberdemon.position.y = 0.35;

// ════════════════════════════════════════════════════════
//  ANIMAÇÃO DE MARCHA
//  - Anca + flexão/extensão do joelho
//  - Braços em contrafase
//  - Cabeça com bob, nod e yaw independentes
// ════════════════════════════════════════════════════════

const clock = new THREE.Clock();
let walkTime = 0;

// Amplitude de swing da anca (radianos)
const HIP_SWING   = 0.42;
// Flexão máxima do joelho quando a perna avança
const KNEE_FLEX   = 0.60;

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    walkTime += dt;

    const speed = 2.0;            // cadência
    const phase = walkTime * speed;

    // ── Bob vertical do corpo ──────────────────────────
    cyberdemon.position.y = 0.35 + Math.abs(Math.sin(phase)) * 0.16;

    // ── Tilt lateral do torso ──────────────────────────
    cyberdemon.rotation.z = Math.sin(phase) * 0.05;

    // ── PERNAS ─────────────────────────────────────────
    // Perna esquerda
    const hipL = Math.sin(phase) * HIP_SWING;
    legGroupL.rotation.x = hipL;
    // Joelho flecte apenas enquanto a perna avança (hipL > 0)
    lowerLegL.rotation.x = Math.max(0, hipL) * (KNEE_FLEX / HIP_SWING);

    // Perna direita (fase oposta)
    const hipR = -Math.sin(phase) * HIP_SWING;
    legGroupR.rotation.x = hipR;
    lowerLegR.rotation.x = Math.max(0, hipR) * (KNEE_FLEX / HIP_SWING);

    // ── BRAÇOS — contrafase com as pernas ──────────────
    leftArm.rotation.x  = -Math.sin(phase) * 0.50;
    rightArm.rotation.x =  Math.sin(phase) * 0.40;
    leftArm.rotation.z  =  Math.cos(phase) * 0.05;
    rightArm.rotation.z = -Math.cos(phase) * 0.05;

    // ── CABEÇA — animação independente ─────────────────
    // Fase ligeiramente atrasada em relação ao corpo
    // para simular inércia (a cabeça "chega depois")
    const headPhase = phase - 0.35;

    // Bob vertical próprio (sobe/desce com cada passada)
    headGroup.position.y = 5.0
        + Math.sin(headPhase)        * 0.10   // bob principal
        + Math.sin(headPhase * 2.0)  * 0.025; // harmónico subtil

    // Nod (pitch): leve inclinação frente/trás a cada passo
    headGroup.rotation.x = Math.sin(headPhase) * 0.27;

    // Yaw (lado a lado): olha levemente para o lado do pé que avança
    headGroup.rotation.y = Math.sin(phase * 0.5) * 0.30;

    // Roll (inclinação lateral): acompanha minimamente o tilt do torso
    headGroup.rotation.z = Math.sin(phase) * 0.04;

    // ── Eye flicker ────────────────────────────────────
    const flicker = 0.88 + Math.random() * 0.12;
    eyeLightL.intensity = 3.0 * flicker;
    eyeLightR.intensity = 3.0 * flicker;

    controls.update();
    renderer.render(scene, camera);
}

// ─── Resize Handler ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();