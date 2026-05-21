import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Summoner simplificado para o nível 2 (hangar).
 * Modelo completo em Objetos/JavaScript/summoner.js.
 */
export function createSummonerMob() {
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc8,
    roughness: 0.72,
    emissive: 0x3a2010,
    emissiveIntensity: 0.08
  });
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0d5,
    roughness: 0.5,
    emissive: 0x887755,
    emissiveIntensity: 0.12
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x7a2810,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.78,
    emissive: 0x3a0a00,
    emissiveIntensity: 0.3
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff3300,
    emissiveIntensity: 2.5,
    roughness: 0.1
  });

  const root = new THREE.Group();
  const anim = new THREE.Group();
  root.add(anim);

  const torso = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 2.2, 10), skinMat));
  torso.position.y = 2.4;
  anim.add(torso);

  const chestPlate = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.35), boneMat));
  chestPlate.position.set(0, 2.85, 0.12);
  anim.add(chestPlate);

  const head = new THREE.Group();
  head.position.y = 3.75;
  const skull = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), skinMat));
  head.add(skull);
  const eyeL = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat));
  eyeL.position.set(-0.16, 0.05, 0.32);
  head.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.16;
  head.add(eyeR);
  anim.add(head);

  function buildWing(side) {
    const wing = new THREE.Group();
    wing.position.set(side * 0.85, 3.0, -0.2);
    const bone = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 2.4, 8), boneMat));
    bone.rotation.z = side * -0.9;
    bone.position.set(side * 0.9, 0.5, 0);
    wing.add(bone);
    const membrane = shadow(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), wingMat));
    membrane.rotation.y = side * 0.35;
    membrane.position.set(side * 1.1, -0.1, 0);
    wing.add(membrane);
    return wing;
  }

  const wingL = buildWing(-1);
  const wingR = buildWing(1);
  anim.add(wingL, wingR);

  function buildLeg(side) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.35, 1.2, 0);
    const thigh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 1.1, 8), skinMat));
    thigh.position.y = -0.55;
    leg.add(thigh);
    const shin = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 1.0, 8), skinMat));
    shin.position.y = -1.35;
    leg.add(shin);
    return leg;
  }

  const legL = buildLeg(-1);
  const legR = buildLeg(1);
  anim.add(legL, legR);

  let walkTime = 0;

  function tickAnimation(dt, moving) {
    walkTime += dt;
    const t = walkTime;
    const bob = moving ? Math.sin(t * 4.5) * 0.12 : Math.sin(t * 1.2) * 0.18;
    anim.position.y = bob;
    head.rotation.y = Math.sin(t * 0.9) * 0.12;
    head.rotation.x = -0.08 + Math.sin(t * 1.1) * 0.06;
    wingL.rotation.z = -0.4 + Math.sin(t * 1.6) * (moving ? 0.35 : 0.2);
    wingR.rotation.z = 0.4 - Math.sin(t * 1.6) * (moving ? 0.35 : 0.2);
    legL.rotation.x = moving ? Math.sin(t * 4.5) * 0.35 : -0.12;
    legR.rotation.x = moving ? Math.sin(t * 4.5 + Math.PI) * 0.35 : -0.12;
    eyeMat.emissiveIntensity = 2 + Math.sin(t * 3) * 0.8;
  }

  return {
    root,
    applyWalkPhase: null,
    applyFloatAnimation: null,
    tickAnimation
  };
}
