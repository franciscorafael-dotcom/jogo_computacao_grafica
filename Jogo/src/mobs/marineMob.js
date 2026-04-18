import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createMarineMob() {
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x4a5e2a,
    roughness: 0.65,
    metalness: 0.25
  });
  const armorLightMat = new THREE.MeshStandardMaterial({
    color: 0x5a7232,
    roughness: 0.6,
    metalness: 0.3
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8a9090,
    roughness: 0.35,
    metalness: 0.85
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x404850,
    roughness: 0.4,
    metalness: 0.9
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x8a5c3a,
    roughness: 0.85,
    metalness: 0.0
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0x2e3d1e,
    roughness: 0.92,
    metalness: 0.0
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xddddff,
    emissiveIntensity: 1.5,
    roughness: 0.05,
    metalness: 0.1
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x252a28,
    roughness: 0.75,
    metalness: 0.15
  });

  const model = new THREE.Group();

  function buildLeg(side) {
    const legRoot = new THREE.Group();

    const thigh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 1.3, 10), clothMat));
    thigh.position.y = -0.65;
    legRoot.add(thigh);

    const knee = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 8), clothMat));
    knee.position.y = -1.35;
    legRoot.add(knee);

    const lowerLeg = new THREE.Group();
    lowerLeg.position.y = -1.35;

    const shin = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.27, 1.0, 10), clothMat));
    shin.position.y = -0.55;
    lowerLeg.add(shin);

    const bootFront = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.9, 0.22), armorMat));
    bootFront.position.set(0, -0.5, 0.22);
    lowerLeg.add(bootFront);

    const bootSideL = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.45), metalMat));
    bootSideL.position.set(-0.3, -0.55, 0.05);
    lowerLeg.add(bootSideL);

    const bootSideR = bootSideL.clone();
    bootSideR.position.x = 0.3;
    lowerLeg.add(bootSideR);

    const bootTop = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.5), metalMat));
    bootTop.position.set(0, -0.08, 0.05);
    lowerLeg.add(bootTop);

    const bootPanel = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.05), armorLightMat));
    bootPanel.position.set(0, -0.5, 0.34);
    lowerLeg.add(bootPanel);

    const bootBase = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.28, 10), darkMetalMat));
    bootBase.position.y = -1.12;
    lowerLeg.add(bootBase);

    const sole = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.85), darkMetalMat));
    sole.position.set(0, -1.28, 0.1);
    lowerLeg.add(sole);

    legRoot.add(lowerLeg);
    legRoot.position.set(side * 0.52, 0, 0);
    legRoot.userData.lowerLeg = lowerLeg;
    return legRoot;
  }

  const legGroupL = buildLeg(-1);
  const legGroupR = buildLeg(1);
  model.add(legGroupL, legGroupR);
  const lowerLegL = legGroupL.userData.lowerLeg;
  const lowerLegR = legGroupR.userData.lowerLeg;

  const waist = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.32, 12), clothMat));
  waist.position.y = 0.16;
  model.add(waist);

  const abdoPanel = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.18), darkMetalMat));
  abdoPanel.position.set(0, 0.28, 0.58);
  model.add(abdoPanel);

  const dotGeo = new THREE.SphereGeometry(0.045, 6, 5);
  const dotPositions = [
    [-0.18, 0.36], [-0.06, 0.36], [0.06, 0.36], [0.18, 0.36],
    [-0.18, 0.22], [-0.06, 0.22], [0.06, 0.22], [0.18, 0.22],
    [-0.09, 0.08], [0.09, 0.08]
  ];
  dotPositions.forEach(([dx, dy]) => {
    const dot = shadow(new THREE.Mesh(dotGeo, metalMat));
    dot.position.set(dx, dy, 0.68);
    model.add(dot);
  });

  [-1, 1].forEach((s) => {
    const pouch = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.25), armorMat));
    pouch.position.set(s * 0.62, 0.2, 0.38);
    model.add(pouch);
  });

  const cod = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.15), metalMat));
  cod.position.set(0, -0.08, 0.58);
  model.add(cod);

  const abdo = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.7, 12), clothMat));
  abdo.position.y = 0.75;
  model.add(abdo);

  const chest = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.62, 1.1, 12), armorMat));
  chest.position.y = 1.7;
  model.add(chest);

  const chestPlate = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 0.22), armorLightMat));
  chestPlate.position.set(0, 1.75, 0.68);
  chestPlate.rotation.x = -0.08;
  model.add(chestPlate);

  const lowerChest = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.38, 0.2), metalMat));
  lowerChest.position.set(0, 1.22, 0.68);
  model.add(lowerChest);

  const chestMod = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), darkMetalMat));
  chestMod.rotation.x = Math.PI / 2;
  chestMod.position.set(0, 1.75, 0.82);
  model.add(chestMod);

  const band = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.12, 14), metalMat));
  band.position.y = 1.28;
  model.add(band);

  for (let s = -1; s <= 1; s += 2) {
    const shoulderBase = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), armorMat));
    shoulderBase.scale.set(1.1, 0.9, 1.0);
    shoulderBase.position.set(s * 1.05, 2.15, 0);
    model.add(shoulderBase);

    const epaul = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.7), armorMat));
    epaul.position.set(s * 1.08, 2.48, 0);
    model.add(epaul);

    const epaulSide = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.58), metalMat));
    epaulSide.position.set(s * 1.42, 2.18, 0);
    model.add(epaulSide);

    const conn = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 8), darkMetalMat));
    conn.rotation.z = Math.PI / 2;
    conn.position.set(s * 0.88, 2.35, 0.15);
    model.add(conn);
  }

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();

  function buildArm(armGroup, side) {
    const uArm = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.73, 10), skinMat));
    uArm.rotation.z = side * 0.25;
    uArm.position.set(side * 0.22, -0.37, 0);
    armGroup.add(uArm);

    const elb = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), skinMat));
    elb.position.set(side * 0.34, -0.78, 0);
    armGroup.add(elb);

    const fArm = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.67, 10), skinMat));
    fArm.rotation.z = side * -0.15;
    fArm.position.set(side * 0.25, -1.2, 0);
    armGroup.add(fArm);

    const wrist = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 10), armorMat));
    wrist.rotation.z = side * -0.15;
    wrist.position.set(side * 0.2, -1.57, 0);
    armGroup.add(wrist);

    const glove = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 7), gloveMat));
    glove.scale.set(1.1, 0.85, 1.0);
    glove.position.set(side * 0.2, -1.76, 0);
    armGroup.add(glove);
  }

  buildArm(leftArm, -1);
  buildArm(rightArm, 1);
  leftArm.position.set(-1.05, 2.15, 0);
  rightArm.position.set(1.05, 2.15, 0);
  model.add(leftArm, rightArm);

  const neck = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.32, 10), darkMetalMat));
  neck.position.y = 2.42;
  model.add(neck);

  const collar = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.18, 12), armorMat));
  collar.position.y = 2.38;
  model.add(collar);

  const headGroup = new THREE.Group();
  headGroup.position.y = 2.9;

  const helmet = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), armorMat));
  helmet.scale.set(1.0, 0.92, 0.95);
  headGroup.add(helmet);

  const helmetTop = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 0.22, 12), armorLightMat));
  helmetTop.position.y = 0.5;
  headGroup.add(helmetTop);

  const visorBand = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.22, 0.22), metalMat));
  visorBand.position.set(0, 0.1, 0.5);
  headGroup.add(visorBand);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.08), visorMat);
  visor.position.set(0, 0.1, 0.6);
  headGroup.add(visor);

  const chin = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.28, 0.5), darkMetalMat));
  chin.position.set(0, -0.3, 0.28);
  headGroup.add(chin);

  [-1, 1].forEach((s) => {
    const sideMod = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.35), metalMat));
    sideMod.position.set(s * 0.62, 0.08, 0.15);
    headGroup.add(sideMod);
  });

  const antenna = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6), darkMetalMat));
  antenna.position.set(0.2, 0.65, -0.3);
  antenna.rotation.x = 0.3;
  headGroup.add(antenna);

  model.add(headGroup);

  const wrapper = new THREE.Group();
  wrapper.add(model);
  let alignOffset = 0;
  let phase = Math.random() * Math.PI * 2;

  function applyScale(s) {
    wrapper.scale.setScalar(s);
    wrapper.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wrapper);
    alignOffset = -box.min.y;
  }

  function animate(dt) {
    phase += dt * 2.2;
    model.position.y = alignOffset + 0.1 + Math.abs(Math.sin(phase)) * 0.1;
    model.rotation.z = Math.sin(phase) * 0.02;

    const hipL = Math.sin(phase) * 0.42;
    const hipR = -Math.sin(phase) * 0.42;
    legGroupL.rotation.x = hipL;
    legGroupR.rotation.x = hipR;
    lowerLegL.rotation.x = Math.max(0, hipL) * (0.6 / 0.42);
    lowerLegR.rotation.x = Math.max(0, hipR) * (0.6 / 0.42);

    leftArm.rotation.x = -Math.sin(phase) * 0.45;
    rightArm.rotation.x = Math.sin(phase) * 0.45;
    leftArm.rotation.z = Math.cos(phase) * 0.02;
    rightArm.rotation.z = -Math.cos(phase) * 0.02;

    const headPhase = phase - 0.35;
    headGroup.position.y = 2.9 + Math.sin(headPhase) * 0.06 + Math.sin(headPhase * 2.0) * 0.015;
    headGroup.rotation.x = Math.sin(headPhase) * 0.05;
    headGroup.rotation.y = Math.sin(phase * 0.5) * 0.08;
    headGroup.rotation.z = Math.sin(phase) * 0.03;
  }

  return { root: wrapper, applyScale, animate };
}
