import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createDemolisherMob() {
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.45, metalness: 0.85 });
  const legMat     = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.5,  metalness: 0.75 });
  const jointMat   = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.3,  metalness: 0.9  });
  const brainMat   = new THREE.MeshStandardMaterial({ color: 0xff6688, emissive: 0x880022, emissiveIntensity: 0.5, roughness: 0.75, metalness: 0.0 });
  const veinMat    = new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff0022, emissiveIntensity: 1.2, roughness: 0.2,  metalness: 0.0 });
  const eyeMat     = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.5, roughness: 0.05, metalness: 0.0 });
  const chaingunMat= new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.4, metalness: 0.85 });
  const muzzleMat  = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff8800, emissiveIntensity: 1.2, roughness: 0.1, metalness: 0.0 });
  const techMat    = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.4, metalness: 0.8 });

  const model = new THREE.Group();

  const chassis = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.7), chassisMat));
  chassis.position.y = 1.2;
  model.add(chassis);

  [-1, 1].forEach((s) => {
    const side = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 1.5), legMat));
    side.position.set(s * 1.15, 1.2, 0);
    model.add(side);
  });

  [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]].forEach(([px, pz]) => {
    const panel = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.38), jointMat));
    panel.position.set(px, 1.5, pz);
    model.add(panel);
  });

  const spine = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.85, 10), techMat));
  spine.position.set(0, 1.88, 0);
  model.add(spine);

  const legGroups = [];
  function buildSpiderLeg(side, zOff) {
    const g = new THREE.Group();
    g.position.set(side * 1.0, 1.2, zOff);
    g.add(shadow(new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 7), jointMat)));
    const seg1 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.88, 7), legMat));
    seg1.position.set(side * 0.44, -0.22, 0.12 * Math.sign(zOff + 0.001));
    seg1.rotation.z = side * 0.55; seg1.rotation.x = -0.3;
    g.add(seg1);
    const knee = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 7), jointMat));
    knee.position.set(side * 0.78, -0.46, 0.18 * Math.sign(zOff + 0.001));
    g.add(knee);
    const seg2 = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.065, 0.95, 7), legMat));
    seg2.position.set(side * 1.06, -0.86, 0.22 * Math.sign(zOff + 0.001));
    seg2.rotation.z = side * 1.0; seg2.rotation.x = 0.58;
    g.add(seg2);
    const claw = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.24, 6), jointMat));
    claw.position.set(side * 1.28, -1.22, 0.28 * Math.sign(zOff + 0.001));
    claw.rotation.z = side * 1.4; claw.rotation.x = 1.1;
    g.add(claw);
    model.add(g);
    return g;
  }
  [-0.62, -0.21, 0.21, 0.62].forEach((z) => {
    legGroups.push(buildSpiderLeg( 1, z));
    legGroups.push(buildSpiderLeg(-1, z));
  });

  const brainGroup = new THREE.Group();
  brainGroup.position.set(0, 2.6, 0);
  model.add(brainGroup);

  const brainMesh = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 14), brainMat));
  brainMesh.scale.set(1, 0.82, 0.92);
  brainGroup.add(brainMesh);

  [[0,0,0],[0.55,0.28,0],[-0.48,0.38,0],[0,0.48,0.48],[0,-0.38,0.42],[0,0,0.58],[0,0,-0.52],[0.28,-0.48,0]].forEach(([rx,ry,rz]) => {
    const fold = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.042, 6, 14), veinMat));
    fold.rotation.set(rx, ry, rz);
    fold.scale.set(0.9, 0.52, 0.9);
    brainGroup.add(fold);
  });

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const t = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.008, 0.65, 5), veinMat));
    t.position.set(Math.cos(a) * 0.36, -0.52, Math.sin(a) * 0.32);
    brainGroup.add(t);
  }

  const bossEye = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), eyeMat));
  bossEye.position.set(0, 0.06, 0.66);
  brainGroup.add(bossEye);

  const eyeRim = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.04, 8, 16), techMat));
  eyeRim.position.set(0, 0.06, 0.62);
  brainGroup.add(eyeRim);

  [[-0.33, 0.22, 0.58], [0.33, 0.22, 0.58]].forEach(([x, y, z]) => {
    const sEye = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 7), eyeMat));
    sEye.position.set(x, y, z);
    brainGroup.add(sEye);
  });

  const crown = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.72, 0.2, 14, 1, true), techMat));
  crown.position.y = -0.14;
  brainGroup.add(crown);

  const mount = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), techMat));
  mount.position.set(1.14, 1.42, -0.24);
  model.add(mount);

  [{ dx: 0, dy: 0.1 }, { dx: 0.09, dy: -0.05 }, { dx: -0.09, dy: -0.05 }].forEach(({ dx, dy }) => {
    const b = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.82, 8), chaingunMat));
    b.rotation.x = Math.PI / 2;
    b.position.set(1.14 + dx, 1.42 + dy, -0.65);
    model.add(b);
  });

  const muzzle = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), muzzleMat));
  muzzle.position.set(1.14, 1.42, -1.08);
  model.add(muzzle);

  const wrapper = new THREE.Group();
  wrapper.add(model);

  const tempBox = new THREE.Box3().setFromObject(model);
  const alignOffset = -tempBox.min.y;
  model.position.y = alignOffset;

  function applyScale(s) { wrapper.scale.setScalar(s); }

  const chassisBaseY = 1.2 + alignOffset;
  const spineBaseY   = 1.88 + alignOffset;
  const brainBaseY   = 2.6 + alignOffset;
  const mountBaseY   = 1.42 + alignOffset;
  let _t = 0;

  function applyWalkPhase(phase, moving) {
    _t += moving ? 0.016 : 0.008;
    const bob = Math.sin(_t * 1.6) * 0.15;
    chassis.position.y    = chassisBaseY + bob;
    spine.position.y      = spineBaseY   + bob;
    brainGroup.position.y = brainBaseY   + bob;
    mount.position.y      = mountBaseY   + bob;
    legGroups.forEach((leg, i) => {
      leg.rotation.x = Math.sin(phase * 1.4 + (i % 2 === 0 ? 0 : Math.PI)) * 0.3;
      leg.position.y = chassisBaseY + bob;
    });
    brainGroup.rotation.x = Math.sin(_t * 0.34) * 0.045;
    brainGroup.rotation.z = Math.sin(_t * 0.26 + 1.0) * 0.04;
    veinMat.emissiveIntensity   = 1.0 + Math.sin(_t * 1.4) * 0.5;
    eyeMat.emissiveIntensity    = 2.0 + Math.sin(_t * 2.0) * 1.0;
    muzzleMat.emissiveIntensity = 0.8 + Math.sin(_t * 2.6) * 0.4;
  }

  return { root: wrapper, applyScale, applyWalkPhase };
}