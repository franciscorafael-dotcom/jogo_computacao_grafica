import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Scene Setup ───────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0a0a);
scene.fog = new THREE.Fog(0x1a0a0a, 30, 80);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 3, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

// ─── Controls ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 4;
controls.maxDistance = 30;
controls.update();

// ─── Lighting ──────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x223322, 1.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
dirLight.position.set(5, 12, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left  = -10;
dirLight.shadow.camera.right =  10;
dirLight.shadow.camera.top   =  15;
dirLight.shadow.camera.bottom = -5;
scene.add(dirLight);

const rimLight = new THREE.DirectionalLight(0x4466ff, 0.6);
rimLight.position.set(-6, 6, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0x334422, 0.8);
fillLight.position.set(0, -3, 6);
scene.add(fillLight);

// Visor glow
const visorLight = new THREE.PointLight(0xffffff, 1.5, 3);
visorLight.position.set(0, 4.55, 0.9);
scene.add(visorLight);

// ─── Materials ─────────────────────────────────────────────────────────────────

// Armadura verde principal
const armorMat = new THREE.MeshStandardMaterial({
    color: 0x4a5e2a,
    roughness: 0.65,
    metalness: 0.25,
});

// Armadura verde clara (detalhes/painel frontal)
const armorLightMat = new THREE.MeshStandardMaterial({
    color: 0x5a7232,
    roughness: 0.6,
    metalness: 0.3,
});

// Metal cinza (junções, placas laterais, botas)
const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8a9090,
    roughness: 0.35,
    metalness: 0.85,
});

// Metal escuro (parafusos, conectores)
const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x404850,
    roughness: 0.4,
    metalness: 0.9,
});

// Pele dos braços
const skinMat = new THREE.MeshStandardMaterial({
    color: 0x8a5c3a,
    roughness: 0.85,
    metalness: 0.0,
});

// Roupa/calças verde-escuro
const clothMat = new THREE.MeshStandardMaterial({
    color: 0x2e3d1e,
    roughness: 0.92,
    metalness: 0.0,
});

// Visor branco brilhante
const visorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xddddff,
    emissiveIntensity: 1.5,
    roughness: 0.05,
    metalness: 0.1,
});

// Luvas pretas/cinza escuro
const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x252a28,
    roughness: 0.75,
    metalness: 0.15,
});

// Dedos das luvas (metal articulado)
const knuckleMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0b0,
    roughness: 0.3,
    metalness: 0.8,
});

// ─── Helper ────────────────────────────────────────────────────────────────────
function shadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// ─── Marine Group ──────────────────────────────────────────────────────────────
// Escala geral: ~62% do cyberdemon
// Cyberdemon vai de y≈-4.9 (botas) a y≈6 (chifres) → ~11 unidades
// Marine terá ~6.8 unidades de altura
const marine = new THREE.Group();
scene.add(marine);

// ════════════════════════════════════════════════════════
//  PERNAS — calças verde-escuro + botas metálicas
//  Hierarquia: legRoot (anca) → lowerLeg (joelho)
// ════════════════════════════════════════════════════════

function buildLeg(side) {
    const legRoot = new THREE.Group();

    // Coxa — cilindro de roupa
    const thighGeo = new THREE.CylinderGeometry(0.38, 0.32, 1.3, 10);
    const thigh = shadow(new THREE.Mesh(thighGeo, clothMat));
    thigh.position.y = -0.65;
    legRoot.add(thigh);

    // Joelho
    const kneeGeo = new THREE.SphereGeometry(0.33, 10, 8);
    const knee = shadow(new THREE.Mesh(kneeGeo, clothMat));
    knee.position.y = -1.35;
    legRoot.add(knee);

    // ── lowerLeg — pivot no joelho ────────────────────
    const lowerLeg = new THREE.Group();
    lowerLeg.position.y = -1.35;

    // Canela (roupa)
    const shinGeo = new THREE.CylinderGeometry(0.3, 0.27, 1.0, 10);
    const shin = shadow(new THREE.Mesh(shinGeo, clothMat));
    shin.position.y = -0.55;
    lowerLeg.add(shin);

    // ── Bota metálica (4 placas + base) ──────────────

    // Placa frontal da bota — caixa verde sobre o shin
    const bootFrontGeo = new THREE.BoxGeometry(0.52, 0.9, 0.22);
    const bootFront = shadow(new THREE.Mesh(bootFrontGeo, armorMat));
    bootFront.position.set(0, -0.5, 0.22);
    lowerLeg.add(bootFront);

    // Placa lateral esquerda
    const bootSideGeo = new THREE.BoxGeometry(0.18, 0.7, 0.45);
    const bootSideL = shadow(new THREE.Mesh(bootSideGeo, metalMat));
    bootSideL.position.set(-0.3, -0.55, 0.05);
    lowerLeg.add(bootSideL);

    // Placa lateral direita
    const bootSideR = shadow(new THREE.Mesh(bootSideGeo, metalMat));
    bootSideR.position.set(0.3, -0.55, 0.05);
    lowerLeg.add(bootSideR);

    // Topo da bota (caixa metálica superior)
    const bootTopGeo = new THREE.BoxGeometry(0.58, 0.22, 0.5);
    const bootTop = shadow(new THREE.Mesh(bootTopGeo, metalMat));
    bootTop.position.set(0, -0.08, 0.05);
    lowerLeg.add(bootTop);

    // Detalhe verde na placa frontal (painel central)
    const bootPanelGeo = new THREE.BoxGeometry(0.22, 0.35, 0.05);
    const bootPanel = shadow(new THREE.Mesh(bootPanelGeo, armorLightMat));
    bootPanel.position.set(0, -0.5, 0.34);
    lowerLeg.add(bootPanel);

    // Base da bota
    const bootBaseGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.28, 10);
    const bootBase = shadow(new THREE.Mesh(bootBaseGeo, darkMetalMat));
    bootBase.position.y = -1.12;
    lowerLeg.add(bootBase);

    // Sola
    const soleGeo = new THREE.BoxGeometry(0.7, 0.1, 0.85);
    const sole = shadow(new THREE.Mesh(soleGeo, darkMetalMat));
    sole.position.set(0, -1.28, 0.1);
    lowerLeg.add(sole);

    legRoot.add(lowerLeg);
    legRoot.position.set(side * 0.52, 0, 0);
    legRoot.userData.lowerLeg = lowerLeg;
    return legRoot;
}

const legGroupL = buildLeg(-1);
const legGroupR = buildLeg( 1);
marine.add(legGroupL);
marine.add(legGroupR);
const lowerLegL = legGroupL.userData.lowerLeg;
const lowerLegR = legGroupR.userData.lowerLeg;

// ════════════════════════════════════════════════════════
//  CINTURA / BELT — painéis táticos
// ════════════════════════════════════════════════════════

// Base da cintura
const waistGeo = new THREE.CylinderGeometry(0.62, 0.55, 0.32, 12);
const waist = shadow(new THREE.Mesh(waistGeo, clothMat));
waist.position.y = 0.16;
marine.add(waist);

// Painel abdominal frontal (placa com botões)
const abdoPanelGeo = new THREE.BoxGeometry(0.75, 0.55, 0.18);
const abdoPanel = shadow(new THREE.Mesh(abdoPanelGeo, darkMetalMat));
abdoPanel.position.set(0, 0.28, 0.58);
marine.add(abdoPanel);

// Botões do painel abdominal
const dotGeo = new THREE.SphereGeometry(0.045, 6, 5);
const dotPositions = [
    [-0.18, 0.36], [-0.06, 0.36], [0.06, 0.36], [0.18, 0.36],
    [-0.18, 0.22], [-0.06, 0.22], [0.06, 0.22], [0.18, 0.22],
    [-0.09, 0.08], [0.09, 0.08],
];
dotPositions.forEach(([dx, dy]) => {
    const dot = shadow(new THREE.Mesh(dotGeo, metalMat));
    dot.position.set(dx, dy, 0.68);
    marine.add(dot);
});

// Bolsos laterais da cintura
[-1, 1].forEach(s => {
    const pouchGeo = new THREE.BoxGeometry(0.28, 0.32, 0.25);
    const pouch = shadow(new THREE.Mesh(pouchGeo, armorMat));
    pouch.position.set(s * 0.62, 0.2, 0.38);
    marine.add(pouch);
});

// Pendente frontal inferior (cod piece)
const codGeo = new THREE.BoxGeometry(0.35, 0.28, 0.15);
const cod = shadow(new THREE.Mesh(codGeo, metalMat));
cod.position.set(0, -0.08, 0.58);
marine.add(cod);

// ════════════════════════════════════════════════════════
//  TORSO — colete de armadura verde + placas metálicas
// ════════════════════════════════════════════════════════

// Abdómen (roupa por baixo)
const abdoGeo = new THREE.CylinderGeometry(0.58, 0.62, 0.7, 12);
const abdo = shadow(new THREE.Mesh(abdoGeo, clothMat));
abdo.position.y = 0.75;
marine.add(abdo);

// Peito principal — colete verde
const chestGeo = new THREE.CylinderGeometry(0.78, 0.62, 1.1, 12);
const chest = shadow(new THREE.Mesh(chestGeo, armorMat));
chest.position.y = 1.7;
marine.add(chest);

// Placa frontal do peito (painel central com relevo)
const chestPlateGeo = new THREE.BoxGeometry(1.0, 0.85, 0.22);
const chestPlate = shadow(new THREE.Mesh(chestPlateGeo, armorLightMat));
chestPlate.position.set(0, 1.75, 0.68);
chestPlate.rotation.x = -0.08;
marine.add(chestPlate);

// Placa inferior do peito (metal cinza)
const lowerChestGeo = new THREE.BoxGeometry(1.05, 0.38, 0.2);
const lowerChest = shadow(new THREE.Mesh(lowerChestGeo, metalMat));
lowerChest.position.set(0, 1.22, 0.68);
marine.add(lowerChest);

// Detalhe central do peito — pequeno módulo circular
const chestModGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10);
const chestMod = shadow(new THREE.Mesh(chestModGeo, darkMetalMat));
chestMod.rotation.x = Math.PI / 2;
chestMod.position.set(0, 1.75, 0.82);
marine.add(chestMod);

// Faixa metálica divisória (peito/abdómen)
const bandGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.12, 14);
const band = shadow(new THREE.Mesh(bandGeo, metalMat));
band.position.y = 1.28;
marine.add(band);

// ── Ombros ───────────────────────────────────────────────

for (let s = -1; s <= 1; s += 2) {
    // Esfera do ombro (base)
    const shoulderBaseGeo = new THREE.SphereGeometry(0.42, 10, 8);
    const shoulderBase = shadow(new THREE.Mesh(shoulderBaseGeo, armorMat));
    shoulderBase.scale.set(1.1, 0.9, 1.0);
    shoulderBase.position.set(s * 1.05, 2.15, 0);
    marine.add(shoulderBase);

    // Placa do ombro — caixa achatada sobre o ombro
    const epaulGeo = new THREE.BoxGeometry(0.62, 0.28, 0.7);
    const epaul = shadow(new THREE.Mesh(epaulGeo, armorMat));
    epaul.position.set(s * 1.08, 2.48, 0);
    marine.add(epaul);

    // Placa lateral do ombro (metal)
    const epaulSideGeo = new THREE.BoxGeometry(0.18, 0.55, 0.58);
    const epaulSide = shadow(new THREE.Mesh(epaulSideGeo, metalMat));
    epaulSide.position.set(s * 1.42, 2.18, 0);
    marine.add(epaulSide);

    // Conector cilíndrico ombro→tórax
    const connGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 8);
    const conn = shadow(new THREE.Mesh(connGeo, darkMetalMat));
    conn.rotation.z = Math.PI / 2;
    conn.position.set(s * 0.88, 2.35, 0.15);
    marine.add(conn);
}

// ════════════════════════════════════════════════════════
//  BRAÇOS — pele exposta + luvas com articulações
// ════════════════════════════════════════════════════════

const leftArm  = new THREE.Group();
const rightArm = new THREE.Group();

function buildArm(armGroup, side) {
    // Braço superior (pele) — comprimento 0.73 (≈1.1 × 2/3)
    const uArmGeo = new THREE.CylinderGeometry(0.22, 0.19, 0.73, 10);
    const uArm = shadow(new THREE.Mesh(uArmGeo, skinMat));
    uArm.rotation.z = side * 0.25; // menos aberto
    uArm.position.set(side * 0.22, -0.37, 0);
    armGroup.add(uArm);

    // Cotovelo
    const elbGeo = new THREE.SphereGeometry(0.20, 8, 6);
    const elb = shadow(new THREE.Mesh(elbGeo, skinMat));
    elb.position.set(side * 0.34, -0.78, 0);
    armGroup.add(elb);

    // Antebraço (pele) — comprimento 0.67 (≈1.0 × 2/3)
    const fArmGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.67, 10);
    const fArm = shadow(new THREE.Mesh(fArmGeo, skinMat));
    fArm.rotation.z = side * -0.15; // menos aberto
    fArm.position.set(side * 0.25, -1.20, 0);
    armGroup.add(fArm);

    // Pulso — bracelete de armadura
    const wristGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.14, 10);
    const wrist = shadow(new THREE.Mesh(wristGeo, armorMat));
    wrist.rotation.z = side * -0.15;
    wrist.position.set(side * 0.20, -1.57, 0);
    armGroup.add(wrist);

    // Luva base
    const gloveGeo = new THREE.SphereGeometry(0.19, 8, 7);
    const glove = shadow(new THREE.Mesh(gloveGeo, gloveMat));
    glove.scale.set(1.1, 0.85, 1.0);
    glove.position.set(side * 0.20, -1.76, 0);
    armGroup.add(glove);


}

buildArm(leftArm,  -1);
buildArm(rightArm,  1);

leftArm.position.set(-1.05, 2.15, 0);
rightArm.position.set( 1.05, 2.15, 0);
marine.add(leftArm);
marine.add(rightArm);

// ════════════════════════════════════════════════════════
//  PESCOÇO
// ════════════════════════════════════════════════════════

const neckGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.32, 10);
const neck = shadow(new THREE.Mesh(neckGeo, darkMetalMat));
neck.position.y = 2.42;
marine.add(neck);

// Gola/pauldron frontal (peça de pescoço da armadura)
const collarGeo = new THREE.CylinderGeometry(0.42, 0.38, 0.18, 12);
const collar = shadow(new THREE.Mesh(collarGeo, armorMat));
collar.position.y = 2.38;
marine.add(collar);

// ════════════════════════════════════════════════════════
//  CAPACETE — inspirado no Doom Slayer
// ════════════════════════════════════════════════════════

const headGroup = new THREE.Group();
headGroup.position.y = 2.9;

// Crânio do capacete — esfera achatada verde
const helmetGeo = new THREE.SphereGeometry(0.62, 16, 12);
const helmet = shadow(new THREE.Mesh(helmetGeo, armorMat));
helmet.scale.set(1.0, 0.92, 0.95);
headGroup.add(helmet);

// Topo do capacete — placa superior ligeiramente mais alta
const helmetTopGeo = new THREE.CylinderGeometry(0.38, 0.55, 0.22, 12);
const helmetTop = shadow(new THREE.Mesh(helmetTopGeo, armorLightMat));
helmetTop.position.y = 0.5;
headGroup.add(helmetTop);

// Borda/visor — faixa metálica horizontal
const visorBandGeo = new THREE.BoxGeometry(1.08, 0.22, 0.22);
const visorBand = shadow(new THREE.Mesh(visorBandGeo, metalMat));
visorBand.position.set(0, 0.1, 0.5);
headGroup.add(visorBand);

// Visor (lente) — retângulo branco emissivo
const visorGeo = new THREE.BoxGeometry(0.82, 0.16, 0.08);
const visor = new THREE.Mesh(visorGeo, visorMat);
visor.position.set(0, 0.1, 0.6);
headGroup.add(visor);

// Parte inferior do capacete / maxilar (metal escuro)
const chinGeo = new THREE.BoxGeometry(0.88, 0.28, 0.5);
const chin = shadow(new THREE.Mesh(chinGeo, darkMetalMat));
chin.position.set(0, -0.3, 0.28);
headGroup.add(chin);

// Módulo do lado esquerdo do capacete
const sideModGeo = new THREE.BoxGeometry(0.15, 0.25, 0.35);
[-1, 1].forEach(s => {
    const sideMod = shadow(new THREE.Mesh(sideModGeo, metalMat));
    sideMod.position.set(s * 0.62, 0.08, 0.15);
    headGroup.add(sideMod);
});

// Antena/detalhe traseiro do capacete
const antennaGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6);
const antenna = shadow(new THREE.Mesh(antennaGeo, darkMetalMat));
antenna.position.set(0.2, 0.65, -0.3);
antenna.rotation.x = 0.3;
headGroup.add(antenna);

marine.add(headGroup);

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
ground.position.y = -3.2;
ground.receiveShadow = true;
scene.add(ground);

const pentaMat = new THREE.LineBasicMaterial({ color: 0x880000 });
const pentaPoints = [];
for (let i = 0; i <= 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    pentaPoints.push(new THREE.Vector3(
        Math.cos(angle) * 3.2,
        -3.08,
        Math.sin(angle) * 3.2
    ));
}
const pentaGeo = new THREE.BufferGeometry().setFromPoints(pentaPoints);
const pentagram = new THREE.Line(pentaGeo, pentaMat);
scene.add(pentagram);

// ─── Posição inicial ───────────────────────────────────────────────────────────
marine.position.y = 0.1;

// ════════════════════════════════════════════════════════
//  ANIMAÇÃO DE MARCHA — igual ao cyberdemon
// ════════════════════════════════════════════════════════

const clock = new THREE.Clock();
let walkTime = 0;

const HIP_SWING = 0.42;
const KNEE_FLEX = 0.60;

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    walkTime += dt;

    const speed = 2.2; // ligeiramente mais rápido que o cyberdemon
    const phase = walkTime * speed;

    // Bob vertical
    marine.position.y = 0.1 + Math.abs(Math.sin(phase)) * 0.10;

    // Tilt lateral — reduzido
    marine.rotation.z = Math.sin(phase) * 0.02;

    // ── Pernas ─────────────────────────────────────────
    const hipL = Math.sin(phase) * HIP_SWING;
    legGroupL.rotation.x = hipL;
    lowerLegL.rotation.x = Math.max(0, hipL) * (KNEE_FLEX / HIP_SWING);

    const hipR = -Math.sin(phase) * HIP_SWING;
    legGroupR.rotation.x = hipR;
    lowerLegR.rotation.x = Math.max(0, hipR) * (KNEE_FLEX / HIP_SWING);

    // ── Braços — contrafase com as pernas ──────────────
    leftArm.rotation.x  = -Math.sin(phase) * 0.45;
    rightArm.rotation.x =  Math.sin(phase) * 0.45;
    leftArm.rotation.z  =  Math.cos(phase) * 0.02;
    rightArm.rotation.z = -Math.cos(phase) * 0.02;

    // ── Cabeça — inércia independente ──────────────────
    const headPhase = phase - 0.35;
    headGroup.position.y = 2.9
        + Math.sin(headPhase)       * 0.06
        + Math.sin(headPhase * 2.0) * 0.015;
    headGroup.rotation.x = Math.sin(headPhase) * 0.05;
    headGroup.rotation.y = Math.sin(phase * 0.5) * 0.08;
    headGroup.rotation.z = Math.sin(phase) * 0.03;

    // ── Visor flicker suave ────────────────────────────
    visorLight.intensity = 1.5 + Math.sin(walkTime * 3.0) * 0.1;

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();