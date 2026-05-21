import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Reaper — demônio esquelético de melee rápido com lâminas de foice.
 * Materiais e geometria por instância (flash de dano não afeta outros inimigos).
 */
export function createReaperMob() {
  // ── Materiais ──────────────────────────────────────────────────────
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xc8b89a,
    roughness: 0.75,
    metalness: 0.05
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.9,
    metalness: 0.0
  });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x778899,
    roughness: 0.2,
    metalness: 0.9
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: new THREE.Color(0xff4400),
    emissiveIntensity: 1.8,
    roughness: 0.1,
    metalness: 0.0
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: new THREE.Color(0xffaa00),
    emissiveIntensity: 3.0,
    roughness: 0.05,
    metalness: 0.0
  });

  const model = new THREE.Group();

  // ── Pernas esqueléticas ──────────────────────────────────────────
  function buildLeg(side) {
    const g = new THREE.Group();

    const thighGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.52, 7);
    const thigh = shadow(new THREE.Mesh(thighGeo, boneMat));
    thigh.position.y = -0.26;
    g.add(thigh);

    const kneeGeo = new THREE.SphereGeometry(0.08, 7, 7);
    const knee = shadow(new THREE.Mesh(kneeGeo, boneMat));
    knee.position.y = -0.55;
    g.add(knee);

    const lowerLeg = new THREE.Group();
    lowerLeg.position.y = -0.55;

    const shinGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.5, 7);
    const shin = shadow(new THREE.Mesh(shinGeo, darkMat));
    shin.position.y = -0.27;
    lowerLeg.add(shin);

    // Garra do pé
    const clawGeo = new THREE.ConeGeometry(0.045, 0.18, 5);
    const claw = shadow(new THREE.Mesh(clawGeo, boneMat));
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
  model.add(legL);
  model.add(legR);

  // ── Pelve — osso ──────────────────────────────────────────────────
  const pelvisGeo = new THREE.BoxGeometry(0.36, 0.16, 0.2);
  const pelvis = shadow(new THREE.Mesh(pelvisGeo, boneMat));
  pelvis.position.y = 0.12;
  model.add(pelvis);

  // ── Caixa torácica brilhante ──────────────────────────────────────
  const torsoGeo = new THREE.BoxGeometry(0.38, 0.48, 0.22);
  const torsoMesh = shadow(new THREE.Mesh(torsoGeo, darkMat));
  torsoMesh.position.y = 0.46;
  model.add(torsoMesh);

  // Costelas (glow laranja)
  for (let i = 0; i < 3; i++) {
    const ribGeo = new THREE.BoxGeometry(0.36, 0.045, 0.08);
    const rib = shadow(new THREE.Mesh(ribGeo, glowMat));
    rib.position.set(0, 0.62 - i * 0.15, 0.1);
    model.add(rib);
  }

  // Vértebras
  for (let i = 0; i < 4; i++) {
    const vGeo = new THREE.SphereGeometry(0.038, 6, 5);
    const v = shadow(new THREE.Mesh(vGeo, boneMat));
    v.position.set(0, 0.68 - i * 0.14, -0.09);
    model.add(v);
  }

  // ── Pescoço ───────────────────────────────────────────────────────
  const neckGeo = new THREE.CylinderGeometry(0.055, 0.08, 0.18, 7);
  const neck = shadow(new THREE.Mesh(neckGeo, boneMat));
  neck.position.y = 0.84;
  model.add(neck);

  // ── Cabeça — crânio ───────────────────────────────────────────────
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.02;

  const skullGeo = new THREE.SphereGeometry(0.2, 10, 8);
  const skull = shadow(new THREE.Mesh(skullGeo, boneMat));
  skull.scale.set(1, 1.08, 0.95);
  headGroup.add(skull);

  // Mandíbula
  const jawGeo = new THREE.BoxGeometry(0.24, 0.08, 0.17);
  const jaw = shadow(new THREE.Mesh(jawGeo, boneMat));
  jaw.position.set(0, -0.14, 0.06);
  headGroup.add(jaw);

  // Orbitas oculares brilhantes
  [-0.08, 0.08].forEach((ox) => {
    const socketGeo = new THREE.SphereGeometry(0.05, 8, 7);
    const socket = shadow(new THREE.Mesh(socketGeo, eyeMat));
    socket.position.set(ox, 0.06, 0.17);
    headGroup.add(socket);
  });

  // Chifres
  [-0.1, 0.1].forEach((ox) => {
    const hornGeo = new THREE.ConeGeometry(0.035, 0.2, 6);
    const horn = shadow(new THREE.Mesh(hornGeo, boneMat));
    horn.position.set(ox, 0.22, 0);
    horn.rotation.z = ox < 0 ? -0.3 : 0.3;
    headGroup.add(horn);
  });

  model.add(headGroup);

  // ── Braços — foices ───────────────────────────────────────────────
  function buildScytheArm(side) {
    const g = new THREE.Group();

    // Osso superior do braço
    const upperGeo = new THREE.CylinderGeometry(0.05, 0.065, 0.42, 7);
    const upper = shadow(new THREE.Mesh(upperGeo, boneMat));
    upper.position.y = -0.21;
    g.add(upper);

    // Osso inferior
    const lowerGeo = new THREE.CylinderGeometry(0.038, 0.05, 0.36, 7);
    const lower = shadow(new THREE.Mesh(lowerGeo, boneMat));
    lower.position.y = -0.52;
    lower.rotation.x = 0.3 * side;
    g.add(lower);

    // Lâmina da foice — cone achatado
    const bladeGeo = new THREE.ConeGeometry(0.06, 0.55, 4);
    const blade = shadow(new THREE.Mesh(bladeGeo, bladeMat));
    blade.position.set(0, -0.84, 0.12);
    blade.rotation.x = 0.55;
    blade.rotation.z = side * 0.28;
    blade.scale.set(0.38, 1, 1);
    g.add(blade);

    // Linha de brilho na lâmina
    const glowLineGeo = new THREE.BoxGeometry(0.018, 0.44, 0.018);
    const glowLine = shadow(new THREE.Mesh(glowLineGeo, glowMat));
    glowLine.position.set(0, -0.84, 0.12);
    glowLine.rotation.x = 0.55;
    g.add(glowLine);

    g.position.set(side * 0.24, 0.72, 0);
    g.rotation.z = side * 0.32;
    return g;
  }

  const leftArm = buildScytheArm(-1);
  const rightArm = buildScytheArm(1);
  model.add(leftArm);
  model.add(rightArm);

  // ── Wrapper ───────────────────────────────────────────────────────
  const wrapper = new THREE.Group();
  wrapper.add(model);
  let alignOffset = 0;
  let _t = 0;

  function applyScale(s) {
    wrapper.scale.setScalar(s);
    wrapper.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wrapper);
    alignOffset = -box.min.y;
    model.position.y = alignOffset;
  }

  function applyWalkPhase(phase, moving) {
    _t += 0.06;

    const swing = moving ? Math.sin(phase) * 0.55 : 0;

    // Pernas rápidas e agressivas
    legL.rotation.x = swing;
    legL.userData.lowerLeg.rotation.x = Math.max(0, swing) * 0.5;
    legR.rotation.x = -swing;
    legR.userData.lowerLeg.rotation.x = Math.max(0, -swing) * 0.5;

    // Bob
    model.position.y = alignOffset + Math.abs(Math.sin(phase)) * 0.06;

    // Inclinar torso para a frente ao correr
    torsoMesh.rotation.x = moving ? 0.22 : 0.04;
    headGroup.rotation.x = moving ? 0.18 : 0.02;

    // Braços oscilam de forma ameaçadora
    leftArm.rotation.x  =  Math.sin(_t * 1.1) * (moving ? 0.3 : 0.12);
    rightArm.rotation.x = -Math.sin(_t * 1.1) * (moving ? 0.3 : 0.12);

    // Bob da cabeça
    headGroup.position.y = 1.02 + Math.sin(phase) * 0.04;
    headGroup.rotation.y = Math.sin(phase * 0.5) * 0.2;

    // Pulso do brilho
    glowMat.emissiveIntensity = 1.2 + Math.sin(_t * 4.0) * 0.8;
    eyeMat.emissiveIntensity  = 2.0 + Math.sin(_t * 5.5) * 1.2;
  }

  return { root: wrapper, applyScale, applyWalkPhase };
}