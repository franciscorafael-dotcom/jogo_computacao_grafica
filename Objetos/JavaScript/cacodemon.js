import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Scene Setup ───────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0a0a);
scene.fog = new THREE.Fog(0x1a0a0a, 30, 80);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.body.appendChild(renderer.domElement);

// ─── Controls ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 5;
controls.maxDistance = 35;
controls.update();

// ─── Lighting ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x220808, 1.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xff5500, 2.0);
dirLight.position.set(6, 10, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 60;
dirLight.shadow.camera.left = -12;
dirLight.shadow.camera.right = 12;
dirLight.shadow.camera.top = 12;
dirLight.shadow.camera.bottom = -12;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x440088, 1.0);
rimLight.position.set(-6, 4, -6);
scene.add(rimLight);

// Interior mouth glow — purple/blue pulsing
const mouthGlow = new THREE.PointLight(0x6600ff, 6, 7);
mouthGlow.position.set(0, -0.3, 1.5);
scene.add(mouthGlow);

// Eye glow — green
const eyeGlow = new THREE.PointLight(0x00ff44, 2.5, 4);
eyeGlow.position.set(-0.3, 1.85, 3.2);
scene.add(eyeGlow);

// ─── Materials ─────────────────────────────────────────────────────────────────

// Corpo exterior — vermelho-laranja carnudo
const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xcc4422,
    roughness: 0.88,
    metalness: 0.0,
});

// Interior da boca — rosa-violáceo mais claro
const mouthInteriorMat = new THREE.MeshStandardMaterial({
    color: 0xcc7788,
    roughness: 0.75,
    metalness: 0.0,
    emissive: 0x330044,
    emissiveIntensity: 0.4,
    side: THREE.BackSide,
});

// Dentes — marfim brilhante
const toothMat = new THREE.MeshStandardMaterial({
    color: 0xeeeedd,
    roughness: 0.15,
    metalness: 0.05,
    emissive: 0x888866,
    emissiveIntensity: 0.10,
});

// Chifres — osso/marfim
const hornMat = new THREE.MeshStandardMaterial({
    color: 0xddd8bb,
    roughness: 0.45,
    metalness: 0.0,
});

// Olho — esclera rosada
const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xddaaaa,
    roughness: 0.5,
    metalness: 0.0,
});

// Íris verde brilhante
const irisMat = new THREE.MeshStandardMaterial({
    color: 0x00dd44,
    emissive: 0x00ff22,
    emissiveIntensity: 2.5,
    roughness: 0.1,
    metalness: 0.0,
});

// Pupila
const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.3,
    metalness: 0.0,
});

// Bola de plasma interior (visível pela boca)
const plasmaMat = new THREE.MeshStandardMaterial({
    color: 0x4400cc,
    emissive: 0x7700ff,
    emissiveIntensity: 3.0,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
});

// ─── Helper ────────────────────────────────────────────────────────────────────
function shadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// ─── Cacodemon Group ───────────────────────────────────────────────────────────
const cacodemon = new THREE.Group();
scene.add(cacodemon);

// ════════════════════════════════════════════════════════
//  CORPO PRINCIPAL — esfera achatada ligeiramente
// ════════════════════════════════════════════════════════

const bodyGeo = new THREE.SphereGeometry(3.0, 32, 24);
const body = shadow(new THREE.Mesh(bodyGeo, bodyMat));
body.scale.set(1.0, 0.92, 1.0);
cacodemon.add(body);

// ════════════════════════════════════════════════════════
//  BOCA — abertura frontal enorme
//  Criada com um toroide achatado + esfera interior
// ════════════════════════════════════════════════════════

// Lábio superior — anel carnudo que forma a abertura
const upperLipGeo = new THREE.TorusGeometry(1.55, 0.55, 14, 40, Math.PI);
const upperLip = shadow(new THREE.Mesh(upperLipGeo, bodyMat));
upperLip.rotation.x = -Math.PI / 2;
upperLip.rotation.z = Math.PI;
upperLip.position.set(0, 0.1, 2.55);
cacodemon.add(upperLip);

// Lábio inferior — mais largo e caído
const lowerLipGeo = new THREE.TorusGeometry(1.55, 0.52, 14, 40, Math.PI);
const lowerLip = shadow(new THREE.Mesh(lowerLipGeo, bodyMat));
lowerLip.rotation.x = Math.PI / 2;
lowerLip.position.set(0, -0.55, 2.45);
cacodemon.add(lowerLip);



// Plasma interior — orbe luminoso roxo visível dentro da boca
const plasmaGeo = new THREE.SphereGeometry(0.9, 16, 12);
const plasma = new THREE.Mesh(plasmaGeo, plasmaMat);
plasma.position.set(0, -0.2, 0.8);
cacodemon.add(plasma);

// ════════════════════════════════════════════════════════
//  DENTES
//  Fila superior + fila inferior ao redor da abertura
// ════════════════════════════════════════════════════════

function addTooth(angleRad, radius, yBase, yTipDir, scale = 1.0) {
    const toothGeo = new THREE.ConeGeometry(0.13 * scale, 0.65 * scale, 6);
    const tooth = shadow(new THREE.Mesh(toothGeo, toothMat));

    const x = Math.sin(angleRad) * radius;
    const z = Math.cos(angleRad) * radius + 2.6;

    // Orientar o dente para apontar para fora do centro da boca
    tooth.position.set(x, yBase, z);

    // Rodar para apontar para dentro da boca (para o centro)
    tooth.rotation.z = -angleRad * 0.3;
    if (yTipDir < 0) {
        tooth.rotation.x = Math.PI - (
            0.2 + Math.abs(Math.sin(angleRad)) * 0.25
        );
    } else {
        tooth.rotation.x = 0.2 + Math.abs(Math.sin(angleRad)) * 0.25;
    }

    return tooth;
}

// Dentes superiores — 7 dentes ao longo do semicírculo superior
const upperTeethAngles = [-0.9, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9];
upperTeethAngles.forEach((angle, i) => {
    const scale = i === 3 ? 1.15 : (i === 1 || i === 5 ? 1.05 : 0.9);
    const t = addTooth(angle, 1.45, 0.2, -1, scale);
    cacodemon.add(t);
});

// Dentes inferiores — 8 dentes ao longo do semicírculo inferior
const lowerTeethAngles = [-1.0, -0.7, -0.42, -0.14, 0.14, 0.42, 0.7, 1.0];
lowerTeethAngles.forEach((angle, i) => {
    const scale = (i === 3 || i === 4) ? 1.1 : 0.88;
    const t = addTooth(angle, 1.45, -0.75, 1, scale);
    cacodemon.add(t);
});

// ════════════════════════════════════════════════════════
//  OLHO ÚNICO — saliente, no centro-topo frontal
// ════════════════════════════════════════════════════════

const eyeGroup = new THREE.Group();
eyeGroup.position.set(-0.25, 1.85, 2.6);

// Esclera (globo ocular)
const scleraGeo = new THREE.SphereGeometry(0.55, 16, 12);
const sclera = shadow(new THREE.Mesh(scleraGeo, scleraMat));
eyeGroup.add(sclera);


// Íris verde
const irisGeo = new THREE.CircleGeometry(0.32, 20);
const iris = new THREE.Mesh(irisGeo, irisMat);
iris.position.set(0, 0, 0.52);
eyeGroup.add(iris);

// Pupila vertical (elipse achatada)
const pupilGeo = new THREE.CircleGeometry(0.13, 16);
const pupil = new THREE.Mesh(pupilGeo, pupilMat);
pupil.scale.set(0.45, 1.0, 1.0);
pupil.position.set(0, 0, 0.535);
eyeGroup.add(pupil);



cacodemon.add(eyeGroup);

// ════════════════════════════════════════════════════════
//  CHIFRES — 2 principais no topo + 4 laterais menores
// ════════════════════════════════════════════════════════

function buildHorn(px, py, pz, rx, rz, heightScale = 1.0) {
    const hornGroup = new THREE.Group();

    // Base cónica
    const h1Geo = new THREE.CylinderGeometry(0.05, 0.22, 0.9 * heightScale, 8);
    const h1 = shadow(new THREE.Mesh(h1Geo, hornMat));
    hornGroup.add(h1);

    // Ponta
    const h2Geo = new THREE.ConeGeometry(0.05, 0.5 * heightScale, 7);
    const h2 = shadow(new THREE.Mesh(h2Geo, hornMat));
    h2.position.y = 0.65 * heightScale;
    hornGroup.add(h2);

    hornGroup.position.set(px, py, pz);
    hornGroup.rotation.x = rx;
    hornGroup.rotation.z = rz;
    return hornGroup;
}

// 2 chifres principais no topo
cacodemon.add(buildHorn(-0.7, 2.7,  0.8, -0.25, 0.18, 1.2));
cacodemon.add(buildHorn( 0.7, 2.7,  0.8, -0.25,  -0.18, 1.2));

// 4 chifres laterais menores
cacodemon.add(buildHorn(-1.5, 2.2,  0.3, -0.15, 0.5, 0.75));// ( , , , , inclinação lateral, escala de altura)
cacodemon.add(buildHorn( 1.5, 2.2,  0.3, -0.15,  -0.5, 0.75));
cacodemon.add(buildHorn(-2.2, 1.2, -0.2, -0.05, 0.5, 1.6));
cacodemon.add(buildHorn( 2.2, 1.2, -0.2, -0.05,  -0.5, 1.6));

// ════════════════════════════════════════════════════════
//  SALIÊNCIAS CARNUDAS na superfície (boils/bumps)
// ════════════════════════════════════════════════════════

const bumpPositions = [
    [ 2.2,  1.5,  1.2], [-2.0,  1.8,  0.8],
    [ 1.8, -1.2,  1.8], [-1.6, -1.5,  1.5],
    [ 2.5,  0.2, -0.5], [-2.4, -0.3, -0.8],
    [ 0.5,  2.8,  0.3], [-0.8,  2.5, -0.5],
    [ 1.2, -2.5,  0.8], [-1.0, -2.6,  0.5],
];

bumpPositions.forEach(([x, y, z]) => {
    const r = 0.22 + Math.random() * 0.18;
    const bumpGeo = new THREE.SphereGeometry(r, 8, 6);
    const bump = shadow(new THREE.Mesh(bumpGeo, bodyMat));
    // Posicionar ligeiramente acima da superfície da esfera (raio ≈ 3)
    const len = Math.sqrt(x * x + y * y + z * z);
    const scale = (3.0 + r * 0.5) / len;
    bump.position.set(x * scale, y * scale * 0.92, z * scale);
    cacodemon.add(bump);
});

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
ground.position.y = -5.5;
ground.receiveShadow = true;
scene.add(ground);

// Pentagram
const pentaMat = new THREE.LineBasicMaterial({ color: 0x880000 });
const pentaPoints = [];
for (let i = 0; i <= 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    pentaPoints.push(new THREE.Vector3(
        Math.cos(angle) * 3.2,
        -5.38,
        Math.sin(angle) * 3.2
    ));
}
const pentaGeo = new THREE.BufferGeometry().setFromPoints(pentaPoints);
const pentagram = new THREE.Line(pentaGeo, pentaMat);
scene.add(pentagram);

// ─── Posição inicial ───────────────────────────────────────────────────────────
cacodemon.position.y = 0.5;

// ════════════════════════════════════════════════════════
//  ANIMAÇÃO — flutuação suave + abertura/fecho da boca
//              + oscilação lateral lenta
// ════════════════════════════════════════════════════════

const clock = new THREE.Clock();
let t = 0;

// Posições de referência dos lábios e dentes
const upperLipBaseY = upperLip.position.y;
const lowerLipBaseY = lowerLip.position.y;

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    t += dt;

    // ── Flutuação vertical suave ────────────────────────
    cacodemon.position.y = 0.5 + Math.sin(t * 0.8) * 0.35;

    // ── Oscilação lateral muito lenta ──────────────────
    cacodemon.rotation.y = Math.sin(t * 0.3) * 0.15;

    // ── Inclinação ligeira (olha em volta) ─────────────
    cacodemon.rotation.z = Math.sin(t * 0.5) * 0.06;
    cacodemon.rotation.x = Math.sin(t * 0.4) * 0.05;

    // ── Abertura/fecho da boca ─────────────────────────
    // Ciclo lento — boca abre e fecha de forma orgânica
    const mouthCycle = Math.sin(t * 0.7) * 0.4 + 0.5; // 0..1
    const mouthOpen  = mouthCycle * 1.8; // amplitude máxima de abertura

    upperLip.position.y = upperLipBaseY + mouthOpen * 0.4;
    lowerLip.position.y = lowerLipBaseY - mouthOpen * 0.55;

    // Dentes acompanham lábios (deslocar todos os filhos tooth)
    // Os dentes superiores estão nos índices após lips e cavity
    // Mais simples: mover o grupo inteiro não é prático, por isso
    // fazemos apenas a abertura por scaling do corpo na vertical da boca
    // — o efeito visual já é dado pelo lábio

    // ── Pulsar da luz interior (plasma) ────────────────
    const pulse = 0.75 + Math.sin(t * 2.5) * 0.25;
    mouthGlow.intensity = 6 * pulse;
    plasma.scale.setScalar(0.85 + pulse * 0.2);

    // ── Piscar do olho (ocasional) ─────────────────────
    const blinkCycle = (t % 4.0); // pisca cada ~4s
    if (blinkCycle < 0.12) {
        eyeGroup.scale.y = THREE.MathUtils.lerp(1.0, 0.05, blinkCycle / 0.06);
    } else if (blinkCycle < 0.24) {
        eyeGroup.scale.y = THREE.MathUtils.lerp(0.05, 1.0, (blinkCycle - 0.12) / 0.12);
    } else {
        eyeGroup.scale.y = 1.0;
    }

    // ── Glow do olho ───────────────────────────────────
    eyeGlow.intensity = 2.5 + Math.sin(t * 1.8) * 0.5;

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