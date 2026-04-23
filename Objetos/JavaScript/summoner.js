import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Scene Setup ───────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x110d0d);
scene.fog = new THREE.Fog(0x110d0d, 30, 80);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 6, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
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
const ambientLight = new THREE.AmbientLight(0x1a1210, 1.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffe0c8, 1.8);
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

const rimLight = new THREE.DirectionalLight(0x6688bb, 0.6);
rimLight.position.set(-8, 8, -5);
scene.add(rimLight);

// Eye glow lights
const eyeLightL = new THREE.PointLight(0xff3300, 1.5, 5);
const eyeLightR = new THREE.PointLight(0xff3300, 1.5, 5);

// Ground ambient
const groundLight = new THREE.PointLight(0xcc3300, 0.8, 14);

// Fill light — luz frontal neutra para revelar as cores reais da pele
const fillLight = new THREE.DirectionalLight(0xf5e8d8, 1.2);
fillLight.position.set(0, 8, 12);
scene.add(fillLight);

// Top light — suave e frio, ilumina o topo do anel e ombros
const topLight = new THREE.DirectionalLight(0xc8d8e8, 0.5);
topLight.position.set(0, 20, 0);
scene.add(topLight);
groundLight.position.set(0, 0.5, 0);
scene.add(groundLight);

// ─── Materials ─────────────────────────────────────────────────────────────────

// Pele branca-acinzentada com subtom azulado (base do corpo)
const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc8,
    roughness: 0.72,
    metalness: 0.04,
    emissive: 0x3a2010,
    emissiveIntensity: 0.06,  // subtom quente mínimo — pele não fica cinza
});

// Pele mais escura — zonas de sombra, ventrales, musculares
const skinDarkMat = new THREE.MeshStandardMaterial({
    color: 0x9a7060,
    roughness: 0.85,
    metalness: 0.0,
    emissive: 0x2a1008,
    emissiveIntensity: 0.08,
});

// Zona avermelhada/castanha — interior, musculatura exposta
const fleshMat = new THREE.MeshStandardMaterial({
    color: 0x8b3a20,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x2a0800,
    emissiveIntensity: 0.3,
});

// Exoesqueleto — placas ósseas esbranquiçadas
const boneMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0d5,
    roughness: 0.50,
    metalness: 0.06,
    emissive: 0x887755,
    emissiveIntensity: 0.12,  // osso com leve brilho próprio — mais visível
});

// Exoesqueleto escuro — bordas, articulações
const boneDarkMat = new THREE.MeshStandardMaterial({
    color: 0xb0a090,
    roughness: 0.65,
    metalness: 0.05,
});

// Olhos — brilho laranja-avermelhado
const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff3300,
    emissiveIntensity: 3,
    roughness: 0.1,
    metalness: 0.0,
});

// ─── Helper ────────────────────────────────────────────────────────────────────
function shadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// ─── Summoner Group ────────────────────────────────────────────────────────────
const summoner = new THREE.Group();
scene.add(summoner);

// ════════════════════════════════════════════════════════
//  PERNAS — curvatura em S como na imagem
//
//  Forma lida na imagem (vista lateral):
//   • Anca:  o fémur sai da anca quase VERTICAL, desce com leve inclinação à frente
//   • Joelho: ponto mais AVANÇADO — protrui para a frente
//   • Canela: depois do joelho vai para TRÁS e para baixo
//   • Tornozelo: curva de novo para a frente
//   • Ponta: termina num esporão/ponta fina apontada para baixo
//
//  Implementação: grupos encadeados com ângulos fixos,
//  cada segmento posicionado na ponta do anterior.
//  O pivot de animação é legRoot (anca).
//  O pivot do joelho é kneeGroup (para dobrar na marcha).
// ════════════════════════════════════════════════════════

function buildLeg(side) {
    // legRoot — pivot na ANCA, tudo dentro daqui
    const legRoot = new THREE.Group();
    legRoot.position.set(side * 0.58, 0, 0);

    // ── helpers para segmento cilíndrico orientado num eixo arbitrário ──
    // Cria um cilindro entre dois pontos 3D
    function seg(ax, ay, az, bx, by, bz, rTop, rBot, mat) {
        const start = new THREE.Vector3(ax, ay, az);
        const end   = new THREE.Vector3(bx, by, bz);
        const dir   = new THREE.Vector3().subVectors(end, start);
        const len   = dir.length();
        const geo   = new THREE.CylinderGeometry(rTop, rBot, len, 10);
        const mesh  = shadow(new THREE.Mesh(geo, mat));
        const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mesh.position.copy(mid);
        mesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            dir.normalize()
        );
        return mesh;
    }

    function ball(x, y, z, r, mat) {
        const m = shadow(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat));
        m.position.set(x, y, z);
        return m;
    }

    // ── Pontos-chave da perna (coordenadas locais ao legRoot)
    //    Y cresce para cima; Z positivo = frente do personagem
    //
    //    P0 = anca      (0,  0,    0)
    //    P1 = joelho    (0, -1.6,  0.55)   ← protrui para a frente
    //    P2 = tornozelo (0, -3.2, -0.40)   ← recua para trás
    //    P3 = ponta     (0, -4.5,  0.30)   ← desce e avança ligeiramente

    const P0 = { x:0, y: 0.0,  z:  0.00 };
    const P1 = { x:0, y:-1.65, z:  0.58 }; // joelho
    const P2 = { x:0, y:-3.25, z: -0.38 }; // tornozelo
    const P3 = { x:0, y:-4.55, z:  0.28 }; // esporão/ponta

    // ── COXA (anca → joelho)
    legRoot.add(seg(P0.x,P0.y,P0.z, P1.x,P1.y,P1.z, 0.28, 0.20, skinMat));

    // Placa óssea lateral da coxa
    const tplatGeo = new THREE.BoxGeometry(0.24, 0.82, 0.13);
    const tplat = shadow(new THREE.Mesh(tplatGeo, boneMat));
    tplat.position.set(side * 0.26, -0.82, 0.28);
    tplat.rotation.z = side * 0.10;
    tplat.rotation.x = -0.5; // acompanha inclinação da coxa
    legRoot.add(tplat);

    // ── JOELHO — esfera saliente
    legRoot.add(ball(P1.x, P1.y, P1.z, 0.26, boneMat));
    // Saliência óssea do joelho
    const kspGeo = new THREE.ConeGeometry(0.10, 0.30, 6);
    const ksp = shadow(new THREE.Mesh(kspGeo, boneMat));
    ksp.position.set(P1.x, P1.y, P1.z + 0.28);
    ksp.rotation.x = -Math.PI * 0.5; // aponta para a frente
    legRoot.add(ksp);

    // ── kneeGroup: pivot no joelho para animação de marcha
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(P1.x, P1.y, P1.z);

    // ── CANELA (joelho → tornozelo) — coordenadas relativas ao kneeGroup
    const S1 = { x:0, y: 0,              z: 0              };
    const S2 = { x:0, y: P2.y - P1.y,   z: P2.z - P1.z    };
    const S3 = { x:0, y: P3.y - P1.y,   z: P3.z - P1.z    };

    kneeGroup.add(seg(S1.x,S1.y,S1.z, S2.x,S2.y,S2.z, 0.18, 0.12, skinMat));

    // Placa óssea frontal da canela
    const sboneGeo = new THREE.BoxGeometry(0.17, 0.80, 0.11);
    const sbone = shadow(new THREE.Mesh(sboneGeo, boneMat));
    // posiciona no meio da canela, ligeiramente à frente
    sbone.position.set(0, S2.y * 0.45, S2.z * 0.45 - 0.08);
    sbone.rotation.x = Math.atan2(S2.z, -S2.y) - 0.1;
    kneeGroup.add(sbone);

    // ── TORNOZELO — esfera
    kneeGroup.add(ball(S2.x, S2.y, S2.z, 0.18, boneDarkMat));

    // ── ESPORÃO / PONTA (tornozelo → ponta)
    kneeGroup.add(seg(S2.x,S2.y,S2.z, S3.x,S3.y,S3.z, 0.12, 0.04, boneMat));

    // Ponta cônica terminal
    const tipGeo = new THREE.ConeGeometry(0.05, 0.22, 7);
    const tip = shadow(new THREE.Mesh(tipGeo, boneDarkMat));
    tip.position.set(S3.x, S3.y - 0.12, S3.z);
    tip.rotation.x = Math.atan2(S3.z - S2.z, -(S3.y - S2.y));
    kneeGroup.add(tip);

    legRoot.add(kneeGroup);

    legRoot.userData.kneeGroup = kneeGroup;
    return legRoot;
}

const legGroupL = buildLeg(-1);
const legGroupR = buildLeg(1);
summoner.add(legGroupL, legGroupR);

const lowerLegL = legGroupL.userData.kneeGroup;
const lowerLegR = legGroupR.userData.kneeGroup;

// ════════════════════════════════════════════════════════
//  PÉLVIS / CINTURA
// ════════════════════════════════════════════════════════

const pelvisGeo = new THREE.CylinderGeometry(0.65, 0.55, 0.6, 12);
const pelvis = shadow(new THREE.Mesh(pelvisGeo, skinMat));
pelvis.position.y = 0.3;
summoner.add(pelvis);

// Placa pélvica frontal
const pelvisPlatGeo = new THREE.BoxGeometry(0.9, 0.45, 0.15);
const pelvisPlat = shadow(new THREE.Mesh(pelvisPlatGeo, boneMat));
pelvisPlat.position.set(0, 0.3, 0.6);
summoner.add(pelvisPlat);

// Cauda vestigial — cone descendo atrás
const tailGeo = new THREE.ConeGeometry(0.12, 0.9, 8);
const tail = shadow(new THREE.Mesh(tailGeo, skinDarkMat));
tail.rotation.x = Math.PI; // aponta para baixo
tail.position.set(0, -0.2, -0.55);
summoner.add(tail);

// ════════════════════════════════════════════════════════
//  ABDÓMEN / TORSO
//  Esguio, com costelas visíveis e musculatura exposta
// ════════════════════════════════════════════════════════

const abdoGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.1, 12);
const abdo = shadow(new THREE.Mesh(abdoGeo, skinMat));
abdo.position.y = 1.25;
summoner.add(abdo);

// Costelas — pares de arcos laterais
for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
        const ribGeo = new THREE.TorusGeometry(0.55, 0.04, 6, 16, Math.PI * 0.65);
        const rib = shadow(new THREE.Mesh(ribGeo, boneMat));
        rib.position.set(s * 0.05, 0.75 + i * 0.22, 0);
        rib.rotation.y = s * (Math.PI * 0.5 + 0.3);
        rib.rotation.z = s * (-0.2 - i * 0.04);
        summoner.add(rib);
    }
}

// Músculo ventral exposto
const fleshStripGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 8);
const fleshStrip = shadow(new THREE.Mesh(fleshStripGeo, fleshMat));
fleshStrip.position.set(0, 1.15, 0.48);
summoner.add(fleshStrip);

// ── Peito
const chestGeo = new THREE.CylinderGeometry(0.75, 0.55, 1.3, 12);
const chest = shadow(new THREE.Mesh(chestGeo, skinMat));
chest.position.y = 2.55;
summoner.add(chest);

// Placa esternal frontal
const sternumGeo = new THREE.BoxGeometry(0.55, 1.1, 0.15);
const sternum = shadow(new THREE.Mesh(sternumGeo, boneMat));
sternum.position.set(0, 2.6, 0.7);
summoner.add(sternum);

// ════════════════════════════════════════════════════════
//  OMBROS — placas ósseas salientes
// ════════════════════════════════════════════════════════

for (const s of [-1, 1]) {
    const shGeo = new THREE.SphereGeometry(0.38, 10, 8);
    const sh = shadow(new THREE.Mesh(shGeo, skinMat));
    sh.position.set(s * 1.0, 3.35, 0);
    summoner.add(sh);

    // Placa óssea de ombro (pauldron)
    const paulGeo = new THREE.BoxGeometry(0.50, 0.22, 0.38);
    const paul = shadow(new THREE.Mesh(paulGeo, boneMat));
    paul.position.set(s * 1.15, 3.55, 0);
    paul.rotation.z = s * 0.3;
    summoner.add(paul);
}

// ════════════════════════════════════════════════════════
//  BRAÇOS — longos, esguios, ligeiramente curvados
//  Braço esquerdo: descaído/curvado para fora
//  Braço direito: ligeiramente levantado, mão aberta
// ════════════════════════════════════════════════════════

function buildArm(side, raiseAngle) {
    const armGroup = new THREE.Group();

    // ── Braço superior — esguio, inclinado para fora
    const uArmGeo = new THREE.CylinderGeometry(0.15, 0.11, 1.8, 8);
    const uArm = shadow(new THREE.Mesh(uArmGeo, skinMat));
    uArm.rotation.z = side * 0.65;
    uArm.position.set(side * 0.58, -0.9, 0);
    armGroup.add(uArm);

    // Cotovelo
    const elbGeo = new THREE.SphereGeometry(0.15, 8, 6);
    const elb = shadow(new THREE.Mesh(elbGeo, boneMat));
    elb.position.set(side * 1.1, -1.8, 0);
    armGroup.add(elb);

    // ── Antebraço — mais longo, desce quase vertical
    const fArmGeo = new THREE.CylinderGeometry(0.12, 0.09, 2.0, 8);
    const fArm = shadow(new THREE.Mesh(fArmGeo, skinMat));
    fArm.rotation.z = side * 0.18;
    fArm.position.set(side * 1.22, -2.85, 0);
    armGroup.add(fArm);

    // Placa óssea no antebraço
    const fplatGeo = new THREE.BoxGeometry(0.16, 0.9, 0.10);
    const fplat = shadow(new THREE.Mesh(fplatGeo, boneMat));
    fplat.rotation.z = side * 0.18;
    fplat.position.set(side * 1.32, -2.80, 0.10);
    armGroup.add(fplat);

    // ── Pulso — nó ósseo
    const wristGeo = new THREE.SphereGeometry(0.16, 8, 6);
    const wrist = shadow(new THREE.Mesh(wristGeo, boneDarkMat));
    wrist.position.set(side * 1.35, -3.88, 0);
    armGroup.add(wrist);

    // ══════════════════════════════════════════
    //  GARRAS ENORMES — chegam ao nível do joelho
    //  Cada garra tem 2 falanges + ponta cônica
    //  Base da garra: y = -3.88 (pulso)
    //  Ponta da garra: y ≈ -7.5 (ao nível do joelho)
    // ══════════════════════════════════════════

    // 4 garras principais + 1 polegar
    // Disposição em leque: espaçadas em Z e com inclinações diferentes
    const clawDefs = [
        // { offsetZ, spreadX, curveMid, length, thick }
        { fz: -0.22, fx: 0.08, len: 2.8, thick: 0.07, curveX: side*0.05, curveY: -0.5 }, // traseira
        { fz: -0.07, fx: 0.04, len: 3.2, thick: 0.08, curveX: side*0.02, curveY: -0.4 }, // meio-trás
        { fz:  0.07, fx: 0.04, len: 3.2, thick: 0.08, curveX: side*0.02, curveY: -0.4 }, // meio-frente
        { fz:  0.22, fx: 0.08, len: 2.8, thick: 0.07, curveX: side*0.05, curveY: -0.5 }, // frente
    ];

    const wristPos = new THREE.Vector3(side * 1.35, -3.88, 0);

    clawDefs.forEach((def, ci) => {
        // Falange 1 — sai do pulso, quase vertical com leve curva
        const f1Start = new THREE.Vector3(
            wristPos.x + side * def.fx,
            wristPos.y,
            wristPos.z + def.fz
        );
        const f1End = new THREE.Vector3(
            f1Start.x + def.curveX,
            f1Start.y - def.len * 0.55,
            f1Start.z
        );
        const f1Dir = new THREE.Vector3().subVectors(f1End, f1Start).normalize();
        const f1Len = f1Start.distanceTo(f1End);
        const f1Geo = new THREE.CylinderGeometry(def.thick, def.thick * 0.7, f1Len, 6);
        const f1 = shadow(new THREE.Mesh(f1Geo, skinDarkMat));
        f1.position.copy(new THREE.Vector3().addVectors(f1Start, f1End).multiplyScalar(0.5));
        f1.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), f1Dir);
        armGroup.add(f1);

        // Nó da falange (articulação)
        const knuckleGeo = new THREE.SphereGeometry(def.thick * 0.9, 7, 5);
        const knuckle = shadow(new THREE.Mesh(knuckleGeo, boneMat));
        knuckle.position.copy(f1End);
        armGroup.add(knuckle);

        // Falange 2 — curva para dentro (garra curva)
        const f2End = new THREE.Vector3(
            f1End.x - side * def.len * 0.18,  // curva para o centro
            f1End.y - def.len * 0.42,
            f1End.z + def.fz * 0.1
        );
        const f2Dir = new THREE.Vector3().subVectors(f2End, f1End).normalize();
        const f2Len = f1End.distanceTo(f2End);
        const f2Geo = new THREE.CylinderGeometry(def.thick * 0.65, def.thick * 0.35, f2Len, 6);
        const f2 = shadow(new THREE.Mesh(f2Geo, skinMat));
        f2.position.copy(new THREE.Vector3().addVectors(f1End, f2End).multiplyScalar(0.5));
        f2.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), f2Dir);
        armGroup.add(f2);

        // Ponta cônica afiada
        const tipLen = 0.55 + ci * 0.04;
        const tipGeo = new THREE.ConeGeometry(def.thick * 0.32, tipLen, 5);
        const tipMesh = shadow(new THREE.Mesh(tipGeo, boneMat));
        const tipDir = new THREE.Vector3().subVectors(f2End, f1End).normalize();
        tipMesh.position.copy(f2End.clone().add(tipDir.clone().multiplyScalar(tipLen * 0.5)));
        tipMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tipDir);
        armGroup.add(tipMesh);
    });

    // ── Polegar / garra lateral — sai do lado do pulso, curva para dentro
    const thumbBase = new THREE.Vector3(side * 1.55, -3.75, 0);
    const thumbMid  = new THREE.Vector3(side * 1.72, -4.55, 0.08);
    const thumbTip  = new THREE.Vector3(side * 1.55, -5.20, 0.05);

    // Segmento 1
    const tb1Dir = new THREE.Vector3().subVectors(thumbMid, thumbBase).normalize();
    const tb1Len = thumbBase.distanceTo(thumbMid);
    const tb1Geo = new THREE.CylinderGeometry(0.06, 0.045, tb1Len, 6);
    const tb1 = shadow(new THREE.Mesh(tb1Geo, skinDarkMat));
    tb1.position.copy(new THREE.Vector3().addVectors(thumbBase, thumbMid).multiplyScalar(0.5));
    tb1.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tb1Dir);
    armGroup.add(tb1);

    // Articulação polegar
    const tknGeo = new THREE.SphereGeometry(0.055, 6, 5);
    const tkn = shadow(new THREE.Mesh(tknGeo, boneMat));
    tkn.position.copy(thumbMid);
    armGroup.add(tkn);

    // Segmento 2
    const tb2Dir = new THREE.Vector3().subVectors(thumbTip, thumbMid).normalize();
    const tb2Len = thumbMid.distanceTo(thumbTip);
    const tb2Geo = new THREE.CylinderGeometry(0.044, 0.025, tb2Len, 6);
    const tb2 = shadow(new THREE.Mesh(tb2Geo, skinMat));
    tb2.position.copy(new THREE.Vector3().addVectors(thumbMid, thumbTip).multiplyScalar(0.5));
    tb2.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tb2Dir);
    armGroup.add(tb2);

    // Ponta do polegar
    const ttGeo = new THREE.ConeGeometry(0.025, 0.40, 5);
    const tt = shadow(new THREE.Mesh(ttGeo, boneMat));
    tt.position.copy(thumbTip.clone().add(tb2Dir.clone().multiplyScalar(0.22)));
    tt.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), tb2Dir);
    armGroup.add(tt);

    armGroup.position.set(side * 1.0, 3.35, 0);
    armGroup.rotation.x = raiseAngle;
    return armGroup;
}

const leftArm  = buildArm(-1, 0.15);
const rightArm = buildArm(1, -0.30);
summoner.add(leftArm, rightArm);

// ════════════════════════════════════════════════════════
//  ASAS — hierarquia de ossos + membrana em BufferGeometry
//
//  Estrutura (por asa):
//    wingRoot (pivot no ombro das costas)
//      └─ bone1  (osso principal — sai do ombro para fora/cima)
//           └─ elbowGroup (pivot no cotovelo)
//                └─ bone2  (antebraço da asa)
//                     └─ fingers[3] (dedos — apontam para baixo/fora)
//    membrane — BufferGeometry de quads/triângulos
//               ligando shoulder → bone1tip → elbowPt → bone2tip → fingers
//
//  A membrana é recalculada em cada frame para acompanhar os ossos.
// ════════════════════════════════════════════════════════

const membraneMat = new THREE.MeshStandardMaterial({
    color: 0x7a2810,       // carne escura avermelhada — como veias/pele interna
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
    roughness: 0.80,
    metalness: 0.0,
    emissive: 0x3a0a00,
    emissiveIntensity: 0.25,
});

// Osso — cilindro entre dois Vector3 (world-space relativo ao wingRoot)
function wingBone(start, end, r, mat) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(r * 0.6, r, len, 8);
    const m   = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    m.position.copy(mid);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
    return m;
}

function buildWing(side) {
    const wingRoot = new THREE.Group();
    // pivot nas costas, ao nível do peito, ligeiramente atrás
    wingRoot.position.set(side * 0.6, 3.1, -0.55);

    // ── OMBRO DA ASA
    const shoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), boneMat);
    shoulderMesh.castShadow = true;
    wingRoot.add(shoulderMesh);

    // ── OSSO 1: sai do ombro em diagonal para fora e para cima
    //    ponta em coordenadas locais ao wingRoot
    const b1End = new THREE.Vector3(side * 2.8, 1.4, -0.5);

    const bone1Group = new THREE.Group(); // pivot no ombro
    wingRoot.add(bone1Group);
    bone1Group.add(wingBone(new THREE.Vector3(0,0,0), b1End, 0.09, boneMat));

    // Esfera no cotovelo
    const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), boneDarkMat);
    elbowMesh.castShadow = true;
    elbowMesh.position.copy(b1End);
    bone1Group.add(elbowMesh);

    // ── OSSO 2: do cotovelo para fora e ligeiramente para baixo
    const b2End = new THREE.Vector3(side * 2.2, -1.0, -0.3); // relativo ao cotovelo

    const bone2Group = new THREE.Group(); // pivot no cotovelo
    bone2Group.position.copy(b1End);
    bone1Group.add(bone2Group);
    bone2Group.add(wingBone(new THREE.Vector3(0,0,0), b2End, 0.07, boneMat));

    // Esfera no pulso
    const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), boneDarkMat);
    wristMesh.castShadow = true;
    wristMesh.position.copy(b2End);
    bone2Group.add(wristMesh);

    // ── DEDOS (3) — a partir do pulso, apontam para baixo/fora
    const fingers = [];
    const fingerDirs = [
        new THREE.Vector3(side * 1.8,  0.2, -0.1),   // superior
        new THREE.Vector3(side * 1.5, -1.4, -0.15),  // meio
        new THREE.Vector3(side * 1.1, -2.8, -0.1),   // inferior
    ];
    const fingerBase = new THREE.Vector3().copy(b2End);

    const fingerGroup = new THREE.Group();
    fingerGroup.position.copy(b2End);
    bone2Group.add(fingerGroup);

    fingerDirs.forEach((dir) => {
        const fMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.015, dir.length(), 6),
            boneMat
        );
        fMesh.castShadow = true;
        const fDir = dir.clone().normalize();
        fMesh.position.copy(dir.clone().multiplyScalar(0.5));
        fMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), fDir);
        fingerGroup.add(fMesh);
        fingers.push(fMesh);
    });

    // ── MEMBRANA — BufferGeometry dinâmica
    // Vamos criar uma malha de triângulos ligando os pontos-chave.
    // Os pontos são definidos no espaço local do wingRoot e serão
    // actualizados a cada frame após resolver a posição mundial dos ossos.
    const memGeo = new THREE.BufferGeometry();
    // 4 patches de 2 triângulos cada = 8 triângulos = 24 vértices
    const memPositions = new Float32Array(24 * 3);
    memGeo.setAttribute('position', new THREE.BufferAttribute(memPositions, 3));
    // normais e uvs básicos
    const memNormals = new Float32Array(24 * 3);
    for (let i = 2; i < 24*3; i+=3) memNormals[i] = 1;
    memGeo.setAttribute('normal', new THREE.BufferAttribute(memNormals, 3));
    const membrane = new THREE.Mesh(memGeo, membraneMat);
    membrane.castShadow = true;
    membrane.frustumCulled = false;
    wingRoot.add(membrane);

    // Helpers para escrever triângulo na posição buffer
    function setTri(buf, idx, ax,ay,az, bx,by,bz, cx,cy,cz) {
        const o = idx * 9;
        buf[o  ]=ax; buf[o+1]=ay; buf[o+2]=az;
        buf[o+3]=bx; buf[o+4]=by; buf[o+5]=bz;
        buf[o+6]=cx; buf[o+7]=cy; buf[o+8]=cz;
    }

    // Função que actualiza a membrana — chamada em cada frame
    // Resolve posições mundiais e converte para local do wingRoot
    const wInv = new THREE.Matrix4();

    function updateMembrane() {
        wInv.copy(wingRoot.matrixWorld).invert();

        function wp(obj, localPt) {
            const w = localPt ? localPt.clone() : new THREE.Vector3();
            obj.localToWorld(w);
            return w.applyMatrix4(wInv);
        }

        // Pontos-chave em espaço local do wingRoot
        const shoulder = wp(wingRoot, new THREE.Vector3(0,0,0));
        const elbow    = wp(bone1Group, b1End.clone());
        const wrist    = wp(bone2Group, b2End.clone());

        // Ponta de cada dedo (local do fingerGroup + dir)
        const fTips = fingerDirs.map(dir => wp(fingerGroup, dir.clone()));

        const body0 = new THREE.Vector3(0,  0.2, 0.4); // ponto corpo superior
        const body1 = new THREE.Vector3(0, -1.2, 0.3); // ponto corpo inferior

        const pos = memGeo.attributes.position.array;

        // Patch 0: corpo → ombro → cotovelo (triângulo superior)
        setTri(pos, 0,
            body0.x,body0.y,body0.z,
            shoulder.x,shoulder.y,shoulder.z,
            elbow.x,elbow.y,elbow.z);

        // Patch 1: corpo → cotovelo → pulso
        setTri(pos, 1,
            body0.x,body0.y,body0.z,
            elbow.x,elbow.y,elbow.z,
            wrist.x,wrist.y,wrist.z);

        // Patch 2: corpo → pulso → dedo superior
        setTri(pos, 2,
            body0.x,body0.y,body0.z,
            wrist.x,wrist.y,wrist.z,
            fTips[0].x,fTips[0].y,fTips[0].z);

        // Patch 3: pulso → dedo superior → dedo meio (quad → 2 tris)
        setTri(pos, 3,
            wrist.x,wrist.y,wrist.z,
            fTips[0].x,fTips[0].y,fTips[0].z,
            fTips[1].x,fTips[1].y,fTips[1].z);

        // Patch 4: pulso → dedo meio → dedo inferior
        setTri(pos, 4,
            wrist.x,wrist.y,wrist.z,
            fTips[1].x,fTips[1].y,fTips[1].z,
            fTips[2].x,fTips[2].y,fTips[2].z);

        // Patch 5: corpo → pulso → dedo inferior
        setTri(pos, 5,
            body1.x,body1.y,body1.z,
            wrist.x,wrist.y,wrist.z,
            fTips[2].x,fTips[2].y,fTips[2].z);

        // Patch 6: corpo inferior → ombro → cotovelo
        setTri(pos, 6,
            body1.x,body1.y,body1.z,
            shoulder.x,shoulder.y,shoulder.z,
            elbow.x,elbow.y,elbow.z);

        // Patch 7: corpo inferior → cotovelo → pulso
        setTri(pos, 7,
            body1.x,body1.y,body1.z,
            elbow.x,elbow.y,elbow.z,
            wrist.x,wrist.y,wrist.z);

        memGeo.attributes.position.needsUpdate = true;
        memGeo.computeVertexNormals();
    }

    wingRoot.userData = { bone1Group, bone2Group, fingerGroup, fingerDirs, updateMembrane };
    return wingRoot;
}

const wingL = buildWing(-1);
const wingR = buildWing(1);
summoner.add(wingL, wingR);

// ════════════════════════════════════════════════════════
//  ASAS INFERIORES — 2 asas menores apontadas para baixo
//  Saem do abdómen/cintura, abertura para baixo e para fora
//  Estrutura mais simples: 2 ossos + membrana estática
// ════════════════════════════════════════════════════════

function buildLowerWing(side) {
    const wRoot = new THREE.Group();
    // pivot nas costas, ao nível do abdómen
    wRoot.position.set(side * 0.45, 1.2, -0.5);
    // rotação base: asa aponta para baixo e para fora
    wRoot.rotation.z = side * 0.25;
    wRoot.rotation.x = 0.3;

    // Material membrana inferior (igual ao superior)
    // usa membraneMat já definido

    // Osso 1 — sai do pivot para fora e PARA BAIXO
    const lb1End = new THREE.Vector3(side * 1.6, -2.0, -0.4);
    const lb1Geo = new THREE.CylinderGeometry(0.07, 0.04, lb1End.length(), 7);
    const lb1 = new THREE.Mesh(lb1Geo, boneMat);
    lb1.castShadow = true;
    const lb1Mid = lb1End.clone().multiplyScalar(0.5);
    lb1.position.copy(lb1Mid);
    lb1.quaternion.setFromUnitVectors(
        new THREE.Vector3(0,1,0), lb1End.clone().normalize()
    );
    wRoot.add(lb1);

    // Esfera no joelho inferior
    const lkGeo = new THREE.SphereGeometry(0.10, 8, 6);
    const lk = new THREE.Mesh(lkGeo, boneDarkMat);
    lk.castShadow = true;
    lk.position.copy(lb1End);
    wRoot.add(lk);

    // Osso 2 — do joelho continua para fora e mais para baixo
    const lb2Offset = new THREE.Vector3(side * 1.2, -1.6, -0.2);
    const lb2End = new THREE.Vector3().addVectors(lb1End, lb2Offset);
    const lb2Geo = new THREE.CylinderGeometry(0.05, 0.02, lb2Offset.length(), 7);
    const lb2 = new THREE.Mesh(lb2Geo, boneMat);
    lb2.castShadow = true;
    lb2.position.copy(new THREE.Vector3().addVectors(lb1End, lb2Offset.clone().multiplyScalar(0.5)));
    lb2.quaternion.setFromUnitVectors(
        new THREE.Vector3(0,1,0), lb2Offset.clone().normalize()
    );
    wRoot.add(lb2);

    // Esfera na ponta
    const ltGeo = new THREE.SphereGeometry(0.07, 7, 5);
    const lt = new THREE.Mesh(ltGeo, boneDarkMat);
    lt.castShadow = true;
    lt.position.copy(lb2End);
    wRoot.add(lt);

    // 2 dedos inferiores a partir da ponta
    const lFingerDirs = [
        new THREE.Vector3(side * 0.9, -1.4, 0.0),
        new THREE.Vector3(side * 0.3, -1.7, -0.1),
    ];
    lFingerDirs.forEach(dir => {
        const fGeo = new THREE.CylinderGeometry(0.03, 0.01, dir.length(), 5);
        const fMesh = new THREE.Mesh(fGeo, boneMat);
        fMesh.castShadow = true;
        fMesh.position.copy(new THREE.Vector3().addVectors(lb2End, dir.clone().multiplyScalar(0.5)));
        fMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
        wRoot.add(fMesh);
    });

    // ── Membrana inferior — Shape simples (estática, não precisa de recalculo)
    const lMemShape = new THREE.Shape();
    lMemShape.moveTo(0, 0);
    lMemShape.lineTo(lb1End.x * 0.5, lb1End.y * 0.5);
    lMemShape.lineTo(lb2End.x, lb2End.y * 0.85);
    lMemShape.lineTo(lb2End.x + lFingerDirs[0].x, lb2End.y + lFingerDirs[0].y * 0.7);
    lMemShape.lineTo(lb2End.x + lFingerDirs[1].x * 0.5, lb2End.y + lFingerDirs[1].y * 0.8);
    lMemShape.lineTo(lb1End.x * 0.2, lb1End.y * 1.1);
    lMemShape.lineTo(0, -0.5);

    const lMemGeo = new THREE.ShapeGeometry(lMemShape);
    const lMem = new THREE.Mesh(lMemGeo, membraneMat);
    lMem.castShadow = true;
    lMem.position.z = -0.05;
    wRoot.add(lMem);

    wRoot.userData = { lb1End, lb2End };
    return wRoot;
}

const wingLoL = buildLowerWing(-1);
const wingLoR = buildLowerWing(1);
summoner.add(wingLoL, wingLoR);

// ════════════════════════════════════════════════════════
//  PESCOÇO
// ════════════════════════════════════════════════════════

const neckGeo = new THREE.CylinderGeometry(0.28, 0.42, 0.65, 10);
const neck = shadow(new THREE.Mesh(neckGeo, skinMat));
neck.position.y = 3.6;
summoner.add(neck);

// ════════════════════════════════════════════════════════
//  CABEÇA
//  Crânio alongado para trás, crista óssea horizontal,
//  rosto estreito com olhos profundos e mandíbula fechada
// ════════════════════════════════════════════════════════

const headGroup = new THREE.Group();
headGroup.position.y = 5.0;

// Crânio base — oval, comprido sagitalmente
const skullGeo = new THREE.SphereGeometry(0.72, 14, 12);
const skull = shadow(new THREE.Mesh(skullGeo, skinMat));
skull.scale.set(0.75, 0.95, 1.25); // estreito em X, comprido em Z (frente-trás)
headGroup.add(skull);

// ── ANEL / HALO ÓSSEO — coroa plana elevada sobre o crânio (como na imagem)
const haloGeo = new THREE.TorusGeometry(0.82, 0.07, 8, 48);
const halo = shadow(new THREE.Mesh(haloGeo, boneMat));
halo.position.set(0, 0.78, 0);
halo.rotation.x = Math.PI * 0.06;
headGroup.add(halo);

// Anel exterior mais fino e escuro
const haloRimGeo = new THREE.TorusGeometry(0.84, 0.03, 6, 48);
const haloRim = shadow(new THREE.Mesh(haloRimGeo, boneDarkMat));
haloRim.position.set(0, 0.78, 0);
haloRim.rotation.x = Math.PI * 0.06;
headGroup.add(haloRim);

// 6 espinhas ósseas equidistantes no anel
for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const r = 0.82;
    const spineGeo = new THREE.ConeGeometry(0.04, 0.26, 5);
    const hSpine = shadow(new THREE.Mesh(spineGeo, boneMat));
    // posição no anel
    hSpine.position.set(Math.cos(angle) * r, 0.78, Math.sin(angle) * r);
    // orienta radialmente para fora (no plano XZ)
    hSpine.rotation.order = 'YXZ';
    hSpine.rotation.y = -angle;
    hSpine.rotation.z = -Math.PI * 0.5;
    headGroup.add(hSpine);
}

// Conectores verticais finos (crânio → anel)
for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const r = 0.60;
    const connGeo = new THREE.CylinderGeometry(0.022, 0.015, 0.40, 5);
    const conn = shadow(new THREE.Mesh(connGeo, boneDarkMat));
    conn.position.set(Math.cos(angle) * r, 0.52, Math.sin(angle) * r);
    headGroup.add(conn);
}

// Sobrancelha óssea — arco acima dos olhos
const browGeo = new THREE.BoxGeometry(1.0, 0.14, 0.22);
const brow = shadow(new THREE.Mesh(browGeo, boneMat));
brow.position.set(0, 0.22, 0.62);
brow.rotation.x = -0.25;
headGroup.add(brow);

// Órbitas — côncavas escuras
for (const x of [-0.30, 0.30]) {
    const orbitGeo = new THREE.SphereGeometry(0.17, 10, 8);
    const orbit = shadow(new THREE.Mesh(orbitGeo, skinDarkMat));
    orbit.position.set(x, 0.1, 0.62);
    orbit.scale.set(1, 0.9, 0.7);
    headGroup.add(orbit);

    // Olho
    const eyeGeo = new THREE.SphereGeometry(0.11, 10, 8);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.1, 0.72);
    headGroup.add(eye);
}

// Nariz vestigial / abertura nasal
const nasalGeo = new THREE.BoxGeometry(0.22, 0.1, 0.08);
const nasal = shadow(new THREE.Mesh(nasalGeo, skinDarkMat));
nasal.position.set(0, -0.1, 0.72);
headGroup.add(nasal);

// Mandíbula inferior estreita
const jawGeo = new THREE.BoxGeometry(0.55, 0.22, 0.5);
const jaw = shadow(new THREE.Mesh(jawGeo, skinMat));
jaw.position.set(0, -0.42, 0.38);
jaw.scale.set(1, 1, 0.85);
headGroup.add(jaw);

// Mento pontiagudo
const chinGeo = new THREE.ConeGeometry(0.12, 0.28, 7);
const chin = shadow(new THREE.Mesh(chinGeo, boneMat));
chin.rotation.x = Math.PI * 0.85;
chin.position.set(0, -0.55, 0.55);
headGroup.add(chin);

// ── Garganta — tendões visíveis
for (const x of [-0.15, 0.15]) {
    const tendonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6);
    const tendon = shadow(new THREE.Mesh(tendonGeo, skinDarkMat));
    tendon.position.set(x, -0.3, 0.35);
    tendon.rotation.x = 0.3;
    headGroup.add(tendon);
}

summoner.add(headGroup);

// Eye point lights — posição relativa à cabeça
eyeLightL.position.set(-0.30, 5.1, 1.0);
eyeLightR.position.set(0.30, 5.1, 1.0);
summoner.add(eyeLightL, eyeLightR);

// ════════════════════════════════════════════════════════
//  GROUND PLATFORM  (igual ao cyberdemon)
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
// O Summoner é mais alto que o Cyberdemon mas mais esguio
// Ajustamos para os pés tocarem a plataforma
summoner.position.y = 0.2;

// ════════════════════════════════════════════════════════
//  ANIMAÇÃO DE MARCHA FLUTUANTE
//  O Summoner move-se de forma mais etérea/fantasmagórica
//  - Passos lentos e deliberados
//  - Oscilação vertical suave (quase a flutuar)
//  - Cabeça com movimento independente e altivo
//  - Braços oscilam com amplitude baixa, graciosos
// ════════════════════════════════════════════════════════

const clock = new THREE.Clock();
let walkTime = 0;

// Amplitude de swing da anca
const HIP_SWING  = 0.30;

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    walkTime += dt;

    const t = walkTime;

    // ══════════════════════════════════════════════════════
    //  FLUTUAÇÃO IDLE — sem andar, movimento etéreo puro
    //  Corpo sobe e desce suavemente, rotações orgânicas
    // ══════════════════════════════════════════════════════

    // Bob vertical principal — respiração lenta
    summoner.position.y = 2.2
        + Math.sin(t * 0.9) * 0.28
        + Math.sin(t * 1.8) * 0.06;

    // Drift horizontal muito subtil — "flutua no ar"
    summoner.position.x = Math.sin(t * 0.4) * 0.12;
    summoner.position.z = Math.cos(t * 0.3) * 0.08;

    // Rotação corporal lenta — olha ligeiramente para os lados
    summoner.rotation.y = Math.sin(t * 0.25) * 0.18;

    // Tilt lateral mínimo — equilíbrio flutuante
    summoner.rotation.z = Math.sin(t * 0.6) * 0.025;

    // Inclinação frontal quase nula
    summoner.rotation.x = 0.04 + Math.sin(t * 0.35) * 0.015;

    // ── PERNAS — penduradas, oscilam passivamente como se flutuassem
    // Não há passo — as pernas balançam suavemente com inércia
    legGroupL.rotation.x = -0.15 + Math.sin(t * 0.7 + 0.4) * 0.08;
    legGroupR.rotation.x = -0.15 + Math.sin(t * 0.7 - 0.4) * 0.08;
    legGroupL.rotation.z =  Math.sin(t * 0.5) * 0.04;
    legGroupR.rotation.z = -Math.sin(t * 0.5) * 0.04;

    // ── BRAÇOS — pose de invocador: abertos, garras para baixo
    // Braço esquerdo: ligeiramente elevado, aberto para o lado
    leftArm.rotation.x  = -0.10 + Math.sin(t * 0.8) * 0.08;
    leftArm.rotation.z  =  Math.cos(t * 0.6) * 0.06;
    // Braço direito: espelhado
    rightArm.rotation.x = -0.10 + Math.sin(t * 0.8 + 0.5) * 0.08;
    rightArm.rotation.z = -Math.cos(t * 0.6) * 0.06;

    // ── CABEÇA — fase atrasada, movimento altivo e lento
    const headPhase = t - 0.5;

    // Bob independente — muito suave
    headGroup.position.y = 5.0
        + Math.sin(headPhase)       * 0.05
        + Math.sin(headPhase * 2.0) * 0.012;

    // Pitch: levemente inclinado para cima (postura altiva)
    headGroup.rotation.x = -0.10 + Math.sin(headPhase * 0.7) * 0.08;

    // Yaw: olha subtilmente de um lado para o outro
    headGroup.rotation.y = Math.sin(t * 0.28) * 0.14;

    // Roll: quase inexistente — movimento muito contido
    headGroup.rotation.z = Math.sin(t * 0.55) * 0.02;

    // ── Eye glow — pulso lento e hipnótico (diferente do flicker do Cyberdemon)
    const pulse = 0.6 + Math.sin(t * 2.2) * 0.4;
    eyeLightL.intensity = 2.0 * pulse;
    eyeLightR.intensity = 2.0 * pulse;

    // ── ASAS — bater suave com atraso nos dedos
    const flap = Math.sin(t * 1.3);

    // Osso principal (abertura/fecho da asa)
    wingL.userData.bone1Group.rotation.z = -0.55 + flap * 0.45;
    wingR.userData.bone1Group.rotation.z =  0.55 - flap * 0.45;

    // Osso 2 (antebraço — reage com pequeno atraso)
    wingL.userData.bone2Group.rotation.z = -0.35 + flap * 0.25;
    wingR.userData.bone2Group.rotation.z =  0.35 - flap * 0.25;

    // Inclinação frente/trás — dá profundidade e volume
    wingL.userData.bone1Group.rotation.x = 0.15 + Math.sin(t * 0.55) * 0.18;
    wingR.userData.bone1Group.rotation.x = 0.15 + Math.sin(t * 0.55) * 0.18;

    // Torção leve
    wingL.rotation.y = -0.18 + Math.sin(t * 0.65) * 0.12;
    wingR.rotation.y =  0.18 - Math.sin(t * 0.65) * 0.12;

    // Dedos — atraso orgânico individual (cada dedo com fase ligeiramente diferente)
    const fGrpL = wingL.userData.fingerGroup;
    const fGrpR = wingR.userData.fingerGroup;
    fGrpL.children.forEach((f, i) => {
        const delay = i * 0.18;
        f.rotation.z = -0.18 + Math.sin(t * 1.3 + delay) * 0.38;
    });
    fGrpR.children.forEach((f, i) => {
        const delay = i * 0.18;
        f.rotation.z =  0.18 - Math.sin(t * 1.3 + delay) * 0.38;
    });

    // Actualiza membrana dinâmica (precisa de matrices actualizadas)
    summoner.updateMatrixWorld(true);
    wingL.userData.updateMembrane();
    wingR.userData.updateMembrane();

    // ── ASAS INFERIORES — batem em contrafase leve com as superiores
    // Quando as superiores sobem, as inferiores abrem ligeiramente para fora
    const lFlap = Math.sin(t * 1.3 + Math.PI * 0.4); // fase ligeiramente adiantada

    wingLoL.rotation.z =  0.25 + lFlap * 0.18;
    wingLoR.rotation.z = -0.25 - lFlap * 0.18;

    // Inclinação frente/trás subtil
    wingLoL.rotation.x = 0.3 + Math.sin(t * 0.65) * 0.10;
    wingLoR.rotation.x = 0.3 + Math.sin(t * 0.65) * 0.10;

    // Torção leve
    wingLoL.rotation.y = -0.1 + Math.sin(t * 0.5) * 0.08;
    wingLoR.rotation.y =  0.1 - Math.sin(t * 0.5) * 0.08;

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