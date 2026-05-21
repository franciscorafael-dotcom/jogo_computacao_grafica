import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addTooth(angleRad, radius, yBase, yTipDir, scale, bodyMat, toothMat, cacodemon) {
  const toothGeo = new THREE.ConeGeometry(0.13 * scale, 0.65 * scale, 6);
  const tooth = shadow(new THREE.Mesh(toothGeo, toothMat));

  const x = Math.sin(angleRad) * radius;
  const z = Math.cos(angleRad) * radius + 2.6;

  tooth.position.set(x, yBase, z);

  tooth.rotation.z = -angleRad * 0.3;
  if (yTipDir < 0) {
    tooth.rotation.x = Math.PI - (0.2 + Math.abs(Math.sin(angleRad)) * 0.25);
  } else {
    tooth.rotation.x = 0.2 + Math.abs(Math.sin(angleRad)) * 0.25;
  }

  cacodemon.add(tooth);
}

function buildHorn(px, py, pz, rx, rz, heightScale, hornMat) {
  const hornGroup = new THREE.Group();

  const h1Geo = new THREE.CylinderGeometry(0.05, 0.22, 0.9 * heightScale, 8);
  const h1 = shadow(new THREE.Mesh(h1Geo, hornMat));
  hornGroup.add(h1);

  const h2Geo = new THREE.ConeGeometry(0.05, 0.5 * heightScale, 7);
  const h2 = shadow(new THREE.Mesh(h2Geo, hornMat));
  h2.position.y = 0.65 * heightScale;
  hornGroup.add(h2);

  hornGroup.position.set(px, py, pz);
  hornGroup.rotation.x = rx;
  hornGroup.rotation.z = rz;
  return hornGroup;
}

export function createCacodemonMob() {
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xcc4422,
    roughness: 0.88,
    metalness: 0.0
  });
  const toothMat = new THREE.MeshStandardMaterial({
    color: 0xeeeedd,
    roughness: 0.15,
    metalness: 0.05,
    emissive: 0x888866,
    emissiveIntensity: 0.1
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xddd8bb,
    roughness: 0.45,
    metalness: 0.0
  });
  const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xddaaaa,
    roughness: 0.5,
    metalness: 0.0
  });
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x00dd44,
    emissive: 0x00ff22,
    emissiveIntensity: 2.5,
    roughness: 0.1,
    metalness: 0.0
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.3,
    metalness: 0.0
  });
  const plasmaMat = new THREE.MeshStandardMaterial({
    color: 0x4400cc,
    emissive: 0x7700ff,
    emissiveIntensity: 3.0,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85
  });

  const model = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(3.0, 32, 24);
  const body = shadow(new THREE.Mesh(bodyGeo, bodyMat));
  body.scale.set(1.0, 0.92, 1.0);
  model.add(body);

  const upperLipGeo = new THREE.TorusGeometry(1.55, 0.55, 14, 40, Math.PI);
  const upperLip = shadow(new THREE.Mesh(upperLipGeo, bodyMat));
  upperLip.rotation.x = -Math.PI / 2;
  upperLip.rotation.z = Math.PI;
  upperLip.position.set(0, 0.1, 2.55);
  model.add(upperLip);

  const lowerLipGeo = new THREE.TorusGeometry(1.55, 0.52, 14, 40, Math.PI);
  const lowerLip = shadow(new THREE.Mesh(lowerLipGeo, bodyMat));
  lowerLip.rotation.x = Math.PI / 2;
  lowerLip.position.set(0, -0.55, 2.45);
  model.add(lowerLip);

  const plasmaGeo = new THREE.SphereGeometry(0.9, 16, 12);
  const plasma = new THREE.Mesh(plasmaGeo, plasmaMat);
  plasma.position.set(0, -0.2, 0.8);
  model.add(plasma);

  const upperTeethAngles = [-0.9, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9];
  upperTeethAngles.forEach((angle, i) => {
    const scale = i === 3 ? 1.15 : i === 1 || i === 5 ? 1.05 : 0.9;
    addTooth(angle, 1.45, 0.2, -1, scale, bodyMat, toothMat, model);
  });

  const lowerTeethAngles = [-1.0, -0.7, -0.42, -0.14, 0.14, 0.42, 0.7, 1.0];
  lowerTeethAngles.forEach((angle, i) => {
    const scale = i === 3 || i === 4 ? 1.1 : 0.88;
    addTooth(angle, 1.45, -0.75, 1, scale, bodyMat, toothMat, model);
  });

  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(-0.25, 1.85, 2.6);

  const scleraGeo = new THREE.SphereGeometry(0.55, 16, 12);
  const sclera = shadow(new THREE.Mesh(scleraGeo, scleraMat));
  eyeGroup.add(sclera);

  const irisGeo = new THREE.CircleGeometry(0.32, 20);
  const iris = new THREE.Mesh(irisGeo, irisMat);
  iris.position.set(0, 0, 0.52);
  eyeGroup.add(iris);

  const pupilGeo = new THREE.CircleGeometry(0.13, 16);
  const pupil = new THREE.Mesh(pupilGeo, pupilMat);
  pupil.scale.set(0.45, 1.0, 1.0);
  pupil.position.set(0, 0, 0.535);
  eyeGroup.add(pupil);

  model.add(eyeGroup);

  model.add(buildHorn(-0.7, 2.7, 0.8, -0.25, 0.18, 1.2, hornMat));
  model.add(buildHorn(0.7, 2.7, 0.8, -0.25, -0.18, 1.2, hornMat));
  model.add(buildHorn(-1.5, 2.2, 0.3, -0.15, 0.5, 0.75, hornMat));
  model.add(buildHorn(1.5, 2.2, 0.3, -0.15, -0.5, 0.75, hornMat));
  model.add(buildHorn(-2.2, 1.2, -0.2, -0.05, 0.5, 1.6, hornMat));
  model.add(buildHorn(2.2, 1.2, -0.2, -0.05, -0.5, 1.6, hornMat));

  const bumpPositions = [
    [2.2, 1.5, 1.2],
    [-2.0, 1.8, 0.8],
    [1.8, -1.2, 1.8],
    [-1.6, -1.5, 1.5],
    [2.5, 0.2, -0.5],
    [-2.4, -0.3, -0.8],
    [0.5, 2.8, 0.3],
    [-0.8, 2.5, -0.5],
    [1.2, -2.5, 0.8],
    [-1.0, -2.6, 0.5]
  ];

  bumpPositions.forEach(([x, y, z]) => {
    const r = 0.22 + Math.random() * 0.18;
    const bumpGeo = new THREE.SphereGeometry(r, 8, 6);
    const bump = shadow(new THREE.Mesh(bumpGeo, bodyMat));
    const len = Math.sqrt(x * x + y * y + z * z);
    const scale = (3.0 + r * 0.5) / len;
    bump.position.set(x * scale, y * scale * 0.92, z * scale);
    model.add(bump);
  });

  const wrapper = new THREE.Group();
  wrapper.add(model);

  let alignOffset = 0;

  function applyScale(s) {
    wrapper.scale.setScalar(s);
    wrapper.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wrapper);
    alignOffset = -box.min.y;
  }

  const upperLipBaseY = upperLip.position.y;
  const lowerLipBaseY = lowerLip.position.y;

  let animT = Math.random() * 10;

  function applyFloatAnimation(dt, moving) {
    const rate = moving ? 1.0 : 0.45;
    animT += dt * rate;

    model.position.y = alignOffset + 0.5 + Math.sin(animT * 0.8) * 0.35;
    model.rotation.y = Math.sin(animT * 0.3) * 0.15;
    model.rotation.z = Math.sin(animT * 0.5) * 0.06;
    model.rotation.x = Math.sin(animT * 0.4) * 0.05;

    const mouthCycle = Math.sin(animT * 0.7) * 0.4 + 0.5;
    const mouthOpen = mouthCycle * 1.8;

    upperLip.position.y = upperLipBaseY + mouthOpen * 0.4;
    lowerLip.position.y = lowerLipBaseY - mouthOpen * 0.55;

    const pulse = 0.75 + Math.sin(animT * 2.5) * 0.25;
    plasmaMat.emissiveIntensity = 3.0 * pulse;
    plasma.scale.setScalar(0.85 + pulse * 0.2);

    irisMat.emissiveIntensity = 2.5 + Math.sin(animT * 1.8) * 0.5;

    const blinkCycle = animT % 4.0;
    if (blinkCycle < 0.12) {
      const u = Math.min(1, blinkCycle / 0.06);
      eyeGroup.scale.y = 1.0 + (0.05 - 1.0) * u;
    } else if (blinkCycle < 0.24) {
      const u = Math.min(1, (blinkCycle - 0.12) / 0.12);
      eyeGroup.scale.y = 0.05 + (1.0 - 0.05) * u;
    } else {
      eyeGroup.scale.y = 1.0;
    }
  }

  return { root: wrapper, applyScale, applyFloatAnimation };
}
