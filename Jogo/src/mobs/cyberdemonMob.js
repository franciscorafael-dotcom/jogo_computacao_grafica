import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildLeg(side, skinMat, darkSkinMat, metalMat, darkMetalMat) {
  const legRoot = new THREE.Group();

  const thighGeo = new THREE.CylinderGeometry(0.65, 0.5, 2.0, 10);
  const thigh = shadow(new THREE.Mesh(thighGeo, skinMat));
  thigh.position.y = -1.0;
  legRoot.add(thigh);

  const kneeGeo = new THREE.SphereGeometry(0.55, 10, 8);
  const knee = shadow(new THREE.Mesh(kneeGeo, darkSkinMat));
  knee.position.y = -2.1;
  legRoot.add(knee);

  const lowerLeg = new THREE.Group();
  lowerLeg.position.y = -2.1;

  const ligGeo = new THREE.SphereGeometry(0.52, 10, 8);
  const lig = shadow(new THREE.Mesh(ligGeo, darkSkinMat));
  lig.position.y = -0.05;
  lowerLeg.add(lig);

  const shinGeo = new THREE.CylinderGeometry(0.45, 0.4, 1.6, 10);
  const shin = shadow(new THREE.Mesh(shinGeo, skinMat));
  shin.position.y = -1.0;
  lowerLeg.add(shin);

  const braceGeo = new THREE.CylinderGeometry(0.5, 0.48, 0.9, 12);
  const brace = shadow(new THREE.Mesh(braceGeo, metalMat));
  brace.position.y = -1.7;
  lowerLeg.add(brace);

  const hoofGeo = new THREE.CylinderGeometry(0.55, 0.7, 0.5, 8);
  const hoof = shadow(new THREE.Mesh(hoofGeo, darkMetalMat));
  hoof.position.y = -2.45;
  lowerLeg.add(hoof);

  const rimGeo = new THREE.TorusGeometry(0.62, 0.08, 8, 20);
  const rim = shadow(new THREE.Mesh(rimGeo, metalMat));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -2.25;
  lowerLeg.add(rim);

  legRoot.add(lowerLeg);
  legRoot.position.set(side * 0.95, 0, 0);
  legRoot.userData.lowerLeg = lowerLeg;
  return legRoot;
}

function buildHorn(side, hornMat) {
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

/** Materiais e geometria por instância (flash de dano não afeta outros inimigos). */
export function createCyberdemonMob() {
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x7a4520,
    roughness: 0.85,
    metalness: 0.05
  });
  const darkSkinMat = new THREE.MeshStandardMaterial({
    color: 0x5a3010,
    roughness: 0.9,
    metalness: 0.0
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x5a6070,
    roughness: 0.35,
    metalness: 0.85
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x303540,
    roughness: 0.4,
    metalness: 0.9
  });
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xcc1100,
    roughness: 0.6,
    metalness: 0.1,
    emissive: 0x440000,
    emissiveIntensity: 0.5
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff2200,
    emissiveIntensity: 3,
    roughness: 0.1,
    metalness: 0.0
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a08,
    roughness: 0.95,
    metalness: 0.0
  });
  const toothMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2ee,
    roughness: 0.12,
    metalness: 0.05,
    emissive: 0x999988,
    emissiveIntensity: 0.1
  });

  const model = new THREE.Group();

  const legGroupL = buildLeg(-1, skinMat, darkSkinMat, metalMat, darkMetalMat);
  const legGroupR = buildLeg(1, skinMat, darkSkinMat, metalMat, darkMetalMat);
  model.add(legGroupL);
  model.add(legGroupR);

  const lowerLegL = legGroupL.userData.lowerLeg;
  const lowerLegR = legGroupR.userData.lowerLeg;

  const pelvisGeo = new THREE.CylinderGeometry(1.1, 0.95, 0.8, 12);
  const pelvis = shadow(new THREE.Mesh(pelvisGeo, skinMat));
  pelvis.position.y = 0.4;
  model.add(pelvis);

  const beltGeo = new THREE.BoxGeometry(2.0, 0.7, 0.7);
  const belt = shadow(new THREE.Mesh(beltGeo, redMat));
  belt.position.set(0, 0.2, 0.2);
  model.add(belt);

  const abdoGeo = new THREE.CylinderGeometry(1.05, 1.1, 1.0, 12);
  const abdo = shadow(new THREE.Mesh(abdoGeo, skinMat));
  abdo.position.y = 1.3;
  model.add(abdo);

  const chestGeo = new THREE.CylinderGeometry(1.45, 1.05, 1.6, 12);
  const chest = shadow(new THREE.Mesh(chestGeo, skinMat));
  chest.position.y = 2.7;
  model.add(chest);

  for (let s = -1; s <= 1; s += 2) {
    const shoulderGeo = new THREE.SphereGeometry(0.72, 10, 8);
    const shoulder = shadow(new THREE.Mesh(shoulderGeo, skinMat));
    shoulder.scale.set(1, 0.95, 0.9);
    shoulder.position.set(s * 1.85, 3.3, 0);
    model.add(shoulder);
  }

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
  model.add(leftArm);

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

  const rFArmDirX = Math.sin(0.4);
  const rFArmDirY = Math.cos(0.4);
  for (let r = 0; r < 5; r++) {
    const t = (r - 1) * 0.42;
    const ringGeo = new THREE.TorusGeometry(0.46, 0.07, 8, 24);
    const ring = shadow(new THREE.Mesh(ringGeo, metalMat));
    ring.rotation.z = 0.4;
    ring.rotation.x = Math.PI / 2.5;
    ring.rotation.y = -Math.PI / 0.1;
    ring.position.set(1.6 - t * rFArmDirX, -3 + t * rFArmDirY, 0);
    rightArm.add(ring);
  }

  rightArm.position.set(1.85, 3.3, 0);
  model.add(rightArm);

  const neckGeo = new THREE.CylinderGeometry(0.6, 0.75, 0.55, 10);
  const neck = shadow(new THREE.Mesh(neckGeo, skinMat));
  neck.position.y = 3.85;
  model.add(neck);

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

  [-0.3, 0.3].forEach((x) => {
    const tuskGeo = new THREE.ConeGeometry(0.09, 0.4, 5);
    const tusk = shadow(new THREE.Mesh(tuskGeo, toothMat));
    tusk.position.set(x, -0.75, 1.22);
    tusk.rotation.x = Math.PI;
    headGroup.add(tusk);
  });

  [-0.42, 0.42].forEach((x) => {
    const socketGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const socket = shadow(new THREE.Mesh(socketGeo, darkSkinMat));
    socket.position.set(x, 0.2, 0.85);
    headGroup.add(socket);

    const eyeGeo = new THREE.SphereGeometry(0.17, 10, 8);
    const eye = shadow(new THREE.Mesh(eyeGeo, eyeMat));
    eye.position.set(x, 0.2, 0.95);
    headGroup.add(eye);
  });

  headGroup.add(buildHorn(-1, hornMat));
  headGroup.add(buildHorn(1, hornMat));

  model.add(headGroup);

  const wrapper = new THREE.Group();
  wrapper.add(model);

  let alignOffset = 0;

  const HIP_SWING = 0.42;
  const KNEE_FLEX = 0.6;
  const HEAD_Y_BASE = 5.0;

  function applyScale(s) {
    wrapper.scale.setScalar(s);
    wrapper.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wrapper);
    alignOffset = -box.min.y;
  }

  function applyWalkPhase(phase, moving) {
    const speed = moving ? 2.0 : 0.65;
    const p = phase * speed;

    model.position.y = alignOffset + 0.35 + Math.abs(Math.sin(p)) * 0.16;
    model.rotation.z = Math.sin(p) * 0.05;

    const hipL = Math.sin(p) * HIP_SWING;
    legGroupL.rotation.x = hipL;
    lowerLegL.rotation.x = Math.max(0, hipL) * (KNEE_FLEX / HIP_SWING);

    const hipR = -Math.sin(p) * HIP_SWING;
    legGroupR.rotation.x = hipR;
    lowerLegR.rotation.x = Math.max(0, hipR) * (KNEE_FLEX / HIP_SWING);

    leftArm.rotation.x = -Math.sin(p) * 0.5;
    rightArm.rotation.x = Math.sin(p) * 0.4;
    leftArm.rotation.z = Math.cos(p) * 0.05;
    rightArm.rotation.z = -Math.cos(p) * 0.05;

    const headPhase = p - 0.35;
    headGroup.position.y =
      HEAD_Y_BASE + Math.sin(headPhase) * 0.1 + Math.sin(headPhase * 2.0) * 0.025;
    headGroup.rotation.x = Math.sin(headPhase) * 0.27;
    headGroup.rotation.y = Math.sin(p * 0.5) * 0.3;
    headGroup.rotation.z = Math.sin(p) * 0.04;
  }

  return { root: wrapper, applyScale, applyWalkPhase };
}
