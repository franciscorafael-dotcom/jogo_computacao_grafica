import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * BeamZombie — soldado corrompido com braço-canhão de plasma.
 * Materiais e geometria por instância (flash de dano não afeta outros inimigos).
 */
export function createBeamZombieMob() {
  // ── Materiais ──────────────────────────────────────────────────────
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x4a7a4a,
    roughness: 0.88,
    metalness: 0.0
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a35,
    roughness: 0.5,
    metalness: 0.7
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x556677,
    roughness: 0.35,
    metalness: 0.85
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: new THREE.Color(0xff2200),
    emissiveIntensity: 3.0,
    roughness: 0.1,
    metalness: 0.0
  });
  const plasmaMat = new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    emissive: new THREE.Color(0x00ffcc),
    emissiveIntensity: 2.0,
    roughness: 0.1,
    metalness: 0.1
  });

  const model = new THREE.Group();

  // ── Pernas ────────────────────────────────────────────────────────
  function buildLeg(side) {
    const g = new THREE.Group();

    const thighGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.55, 8);
    const thigh = shadow(new THREE.Mesh(thighGeo, armorMat));
    thigh.position.y = -0.28;
    g.add(thigh);

    const kneeGeo = new THREE.SphereGeometry(0.19, 8, 7);
    const knee = shadow(new THREE.Mesh(kneeGeo, metalMat));
    knee.position.y = -0.58;
    g.add(knee);

    const lowerLeg = new THREE.Group();
    lowerLeg.position.y = -0.58;

    const shinGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.52, 8);
    const shin = shadow(new THREE.Mesh(shinGeo, skinMat));
    shin.position.y = -0.3;
    lowerLeg.add(shin);

    const bootGeo = new THREE.BoxGeometry(0.22, 0.14, 0.3);
    const boot = shadow(new THREE.Mesh(bootGeo, armorMat));
    boot.position.set(0, -0.62, 0.06);
    lowerLeg.add(boot);

    g.add(lowerLeg);
    g.position.set(side * 0.22, 0, 0);
    g.userData.lowerLeg = lowerLeg;
    return g;
  }

  const legL = buildLeg(-1);
  const legR = buildLeg(1);
  model.add(legL);
  model.add(legR);

  // ── Pelve / cintura ───────────────────────────────────────────────
  const pelvisGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.26, 10);
  const pelvis = shadow(new THREE.Mesh(pelvisGeo, armorMat));
  pelvis.position.y = 0.14;
  model.add(pelvis);

  // ── Torso ─────────────────────────────────────────────────────────
  const abdoGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.3, 10);
  const abdo = shadow(new THREE.Mesh(abdoGeo, skinMat));
  abdo.position.y = 0.44;
  model.add(abdo);

  const chestGeo = new THREE.CylinderGeometry(0.36, 0.28, 0.42, 10);
  const chest = shadow(new THREE.Mesh(chestGeo, armorMat));
  chest.position.y = 0.77;
  model.add(chest);

  // Placa frontal
  const plateGeo = new THREE.BoxGeometry(0.44, 0.28, 0.1);
  const plate = shadow(new THREE.Mesh(plateGeo, metalMat));
  plate.position.set(0, 0.8, 0.3);
  model.add(plate);

  // ── Pescoço ───────────────────────────────────────────────────────
  const neckGeo = new THREE.CylinderGeometry(0.13, 0.18, 0.18, 8);
  const neck = shadow(new THREE.Mesh(neckGeo, skinMat));
  neck.position.y = 1.07;
  model.add(neck);

  // ── Cabeça ────────────────────────────────────────────────────────
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.28;

  const skullGeo = new THREE.SphereGeometry(0.24, 12, 10);
  const skull = shadow(new THREE.Mesh(skullGeo, skinMat));
  skull.scale.set(1, 1.05, 0.95);
  headGroup.add(skull);

  // Viseira do capacete
  const visorGeo = new THREE.BoxGeometry(0.38, 0.1, 0.12);
  const visor = shadow(new THREE.Mesh(visorGeo, armorMat));
  visor.position.set(0, 0.1, 0.2);
  headGroup.add(visor);

  // Olho/sensor brilhante
  const eyeGeo = new THREE.BoxGeometry(0.18, 0.05, 0.06);
  const eyeMesh = shadow(new THREE.Mesh(eyeGeo, eyeMat));
  eyeMesh.position.set(0, 0.1, 0.27);
  headGroup.add(eyeMesh);

  model.add(headGroup);

  // ── Braço esquerdo (normal) ───────────────────────────────────────
  const leftArm = new THREE.Group();

  const luArmGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.42, 8);
  const luArm = shadow(new THREE.Mesh(luArmGeo, skinMat));
  luArm.rotation.z = -0.5;
  luArm.position.set(-0.18, -0.22, 0);
  leftArm.add(luArm);

  const lfArmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8);
  const lfArm = shadow(new THREE.Mesh(lfArmGeo, skinMat));
  lfArm.rotation.z = -0.3;
  lfArm.rotation.x = 0.2;
  lfArm.position.set(-0.3, -0.6, 0.06);
  leftArm.add(lfArm);

  leftArm.position.set(-0.38, 0.94, 0);
  model.add(leftArm);

  // ── Braço direito — canhão de plasma ─────────────────────────────
  const rightArm = new THREE.Group();

  // Ombro metálico
  const rShoulderGeo = new THREE.SphereGeometry(0.16, 8, 7);
  const rShoulder = shadow(new THREE.Mesh(rShoulderGeo, metalMat));
  rShoulder.position.set(0.1, -0.06, 0);
  rightArm.add(rShoulder);

  // Cano principal do canhão
  const barrelGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.62, 10);
  const barrel = shadow(new THREE.Mesh(barrelGeo, metalMat));
  barrel.rotation.x = Math.PI / 2 - 0.25;
  barrel.rotation.z = 0.12;
  barrel.position.set(0.18, -0.38, 0.1);
  rightArm.add(barrel);

  // Bobinas de plasma à volta do canhão
  for (let i = 0; i < 3; i++) {
    const coilGeo = new THREE.TorusGeometry(0.11, 0.022, 6, 12);
    const coil = shadow(new THREE.Mesh(coilGeo, plasmaMat));
    coil.position.set(0.18, -0.22 - i * 0.14, 0.06);
    coil.rotation.x = Math.PI / 2 - 0.25;
    coil.rotation.z = 0.12;
    rightArm.add(coil);
  }

  // Bocal de plasma (glow na ponta)
  const muzzleGeo = new THREE.SphereGeometry(0.065, 8, 8);
  const muzzle = shadow(new THREE.Mesh(muzzleGeo, plasmaMat));
  muzzle.position.set(0.24, -0.72, 0.26);
  rightArm.add(muzzle);

  // Tanque de energia nas costas do braço
  const tankGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.28, 8);
  const tank = shadow(new THREE.Mesh(tankGeo, plasmaMat));
  tank.position.set(0.1, -0.18, -0.14);
  tank.rotation.x = 0.3;
  rightArm.add(tank);

  rightArm.position.set(0.38, 0.94, 0);
  model.add(rightArm);

  // ── Wrapper com alinhamento ao chão ──────────────────────────────
  const wrapper = new THREE.Group();
  wrapper.add(model);
  let alignOffset = 0;

  // ── Animação ─────────────────────────────────────────────────────
  let _glowT = 0;

  function applyScale(s) {
    wrapper.scale.setScalar(s);
    wrapper.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wrapper);
    alignOffset = -box.min.y;
    model.position.y = alignOffset;
  }

  function applyWalkPhase(phase, moving) {
    _glowT += 0.05;

    const swing = moving ? Math.sin(phase) * 0.45 : 0;

    // Pernas
    legL.rotation.x = swing;
    legL.userData.lowerLeg.rotation.x = Math.max(0, swing) * 0.5;
    legR.rotation.x = -swing;
    legR.userData.lowerLeg.rotation.x = Math.max(0, -swing) * 0.5;

    // Bob vertical
    model.position.y = alignOffset + Math.abs(Math.sin(phase)) * 0.05;

    // Braço esquerdo contrafase
    leftArm.rotation.x = -swing * 0.5;

    // Canhão aponta ligeiramente para a frente com bob
    barrel.rotation.z = 0.12 + Math.sin(_glowT * 1.1) * 0.04;

    // Cabeça
    headGroup.position.y = 1.28 + Math.sin(phase) * 0.04;
    headGroup.rotation.x = Math.sin(phase) * 0.12;

    // Pulso do plasma
    const pulse = 0.8 + Math.sin(_glowT * 3.0) * 0.5;
    plasmaMat.emissiveIntensity = Math.max(0.3, pulse);
    eyeMat.emissiveIntensity = 1.8 + Math.sin(_glowT * 4.5) * 0.8;
  }

  return { root: wrapper, applyScale, applyWalkPhase };
}