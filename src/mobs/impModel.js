import * as THREE from 'three';

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createImpRig() {
  const WALK_SPEED = 4.2;
// ── PROCEDURAL TEXTURES ──
function makeSkinTexture(w, h, baseHex, darkHex) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1800; i++) {
    const x = Math.random()*w, y = Math.random()*h, r = Math.random()*18+2;
    const alpha = Math.random()*0.18;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = Math.random()>0.5 ? `rgba(${hexRgb(darkHex)},${alpha})` : `rgba(${hexRgb(baseHex)},${alpha*0.5})`;
    ctx.fill();
  }
  for (let v = 0; v < 25; v++) {
    ctx.beginPath(); ctx.strokeStyle = `rgba(${hexRgb(darkHex)},0.25)`; ctx.lineWidth = Math.random()*2+0.5;
    let cx = Math.random()*w, cy = Math.random()*h; ctx.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) { cx+=(Math.random()-0.5)*60; cy+=(Math.random()-0.5)*60; ctx.lineTo(cx,cy); }
    ctx.stroke();
  }
  for (let i = 0; i < 300; i++) {
    const x = Math.random()*w, y = Math.random()*h;
    ctx.beginPath(); ctx.ellipse(x, y, Math.random()*6+2, Math.random()*4+1, Math.random()*Math.PI, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(${hexRgb(darkHex)},0.12)`; ctx.lineWidth = 0.5; ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function makeRoughnessMap(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#888'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2000; i++) {
    const x=Math.random()*w, y=Math.random()*h, r=Math.random()*12+1, v=Math.floor(Math.random()*80+100);
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=`rgb(${v},${v},${v})`; ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

function makeNormalMap(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8080ff'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) {
    const x=Math.random()*w, y=Math.random()*h, r=Math.random()*10+2;
    const grd = ctx.createRadialGradient(x-r*0.3, y-r*0.3, 0, x, y, r);
    grd.addColorStop(0,'#a0a0ff'); grd.addColorStop(1,'#7070ef');
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

function hexRgb(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

const skinTex  = makeSkinTexture(512,512,'#7a3d1c','#3d1a08');
const darkTex  = makeSkinTexture(512,512,'#3e1c0a','#1e0a02');
const bellyTex = makeSkinTexture(512,512,'#9a5530','#5a2810');
const roughMap = makeRoughnessMap(256,256);
const normalMap= makeNormalMap(256,256);

// ── MATERIALS ──
function mat(color, rough, metal, emissive, emissInt, map, nMap, rMap) {
  return new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal,
    emissive: emissive||0x000000, emissiveIntensity: emissInt||0,
    map: map||null,
    normalMap: nMap||null, normalScale: new THREE.Vector2(0.6,0.6),
    roughnessMap: rMap||null,
  });
}

const skinMat  = mat(0x7a3d1c, 0.88, 0.04, 0x1a0800, 0.12, skinTex,  normalMap, roughMap);
const darkMat  = mat(0x2e1208, 0.92, 0.06, 0x080200, 0.08, darkTex,  normalMap, roughMap);
const bellyMat = mat(0x9a5530, 0.80, 0.04, 0x200a00, 0.15, bellyTex, normalMap, roughMap);
const hornMat  = mat(0xb89050, 0.55, 0.25, 0x100800, 0.10);
const clawMat  = mat(0x1e0e06, 0.45, 0.50, 0x050100, 0.05);
const eyeMat   = new THREE.MeshStandardMaterial({ color:0xff1800, emissive:0xff3300, emissiveIntensity:5, roughness:0.05, metalness:0.6 });
const eyeGlowM = new THREE.MeshBasicMaterial({ color:0xff5500, transparent:true, opacity:0.2, side:THREE.BackSide });
const teethMat = mat(0xd4c8a0, 0.5,  0.1,  0x080600, 0.05);
const spineMat = mat(0xa88040, 0.50, 0.30, 0x0a0600, 0.08);
const muscleMat= mat(0x5a2810, 0.85, 0.03, 0x0e0400, 0.10, darkTex, normalMap);

const model = new THREE.Group();
const root = new THREE.Group();
root.add(model);
let alignOffset = 0;

function mesh(geo, m) {
  const o = new THREE.Mesh(geo, m);
  o.castShadow = true; o.receiveShadow = true;
  return o;
}

// PELVIS
const pelvis = mesh(new THREE.SphereGeometry(0.44,14,10), darkMat);
pelvis.scale.set(1.05,0.72,0.88); pelvis.position.y = 0.62; model.add(pelvis);

// TORSO
const torso = mesh(new THREE.SphereGeometry(0.58,16,12), skinMat);
torso.scale.set(1.0,1.22,0.88); torso.position.y = 1.28; model.add(torso);

[-0.22,0.22].forEach(x => {
  const pec = mesh(new THREE.SphereGeometry(0.27,10,8), muscleMat);
  pec.scale.set(1,0.75,0.65); pec.position.set(x,1.45,0.32); model.add(pec);
});

const belly = mesh(new THREE.SphereGeometry(0.4,12,9), bellyMat);
belly.scale.set(0.92,1.35,0.62); belly.position.set(0,1.15,0.32); model.add(belly);

for (let i = 0; i < 4; i++) {
  const rib = mesh(new THREE.TorusGeometry(0.3-i*0.02,0.018,6,14,Math.PI), darkMat);
  rib.position.set(0,0.88+i*0.17,0.3); rib.rotation.x = -0.25; model.add(rib);
}

for (let i = 0; i < 6; i++) {
  const sp = mesh(new THREE.SphereGeometry(0.055-i*0.004,8,6), spineMat);
  sp.scale.set(1,1.8,1); sp.position.set(0,0.72+i*0.2,-0.44+i*0.01); model.add(sp);
  if (i < 4) {
    const spPt = mesh(new THREE.ConeGeometry(0.035,0.16,6), spineMat);
    spPt.position.set(0,0.78+i*0.2,-0.5+i*0.01); spPt.rotation.x = -0.35; model.add(spPt);
  }
}

[-1,1].forEach(s => {
  [[0.62,1.72,0,0,0,-s*0.72,0.42],[0.54,1.58,0.12,0.35,0,-s*0.52,0.26],[0.5,1.65,-0.12,-0.2,0,-s*0.6,0.18]].forEach(([x,y,z,rx,ry,rz,h]) => {
    const spk = mesh(new THREE.ConeGeometry(0.065,h,6), hornMat);
    spk.position.set(s*x,y,z); spk.rotation.set(rx,ry,rz); model.add(spk);
  });
});

// NECK
const neck = mesh(new THREE.CylinderGeometry(0.21,0.3,0.35,10), darkMat);
neck.position.y = 1.83; model.add(neck);
[-0.12,0.12].forEach(x => {
  const cord = mesh(new THREE.CylinderGeometry(0.04,0.06,0.35,6), muscleMat);
  cord.position.set(x,1.83,0.08); cord.rotation.z = x*-1.2; model.add(cord);
});

// HEAD
const headGrp = new THREE.Group();
headGrp.position.y = 2.17; model.add(headGrp);

const skull = mesh(new THREE.SphereGeometry(0.44,14,12), skinMat);
skull.scale.set(1.0,0.95,0.92); headGrp.add(skull);

[[-0.18,0.2,0.24],[0.18,0.2,0.24]].forEach(([x,y,z]) => {
  const bw = mesh(new THREE.SphereGeometry(0.16,8,6), darkMat);
  bw.scale.set(0.9,0.35,0.55); bw.position.set(x,y,z); headGrp.add(bw);
});
const browC = mesh(new THREE.SphereGeometry(0.1,8,6), darkMat);
browC.scale.set(0.6,0.3,0.7); browC.position.set(0,0.24,0.3); headGrp.add(browC);

[-0.3,0.3].forEach(x => {
  const ck = mesh(new THREE.SphereGeometry(0.14,8,6), darkMat);
  ck.scale.set(0.8,0.55,0.6); ck.position.set(x,-0.04,0.28); headGrp.add(ck);
});

const snout = mesh(new THREE.SphereGeometry(0.22,10,8), darkMat);
snout.scale.set(0.9,0.7,1.1); snout.position.set(0,-0.12,0.36); headGrp.add(snout);

[-0.07,0.07].forEach(x => {
  const nos = mesh(new THREE.SphereGeometry(0.04,6,5), clawMat);
  nos.scale.set(1,0.5,1); nos.position.set(x,-0.07,0.54); headGrp.add(nos);
});

// EYES
[-0.18,0.18].forEach(x => {
  const socket = mesh(new THREE.SphereGeometry(0.085,8,8), clawMat);
  socket.position.set(x,0.1,0.37); headGrp.add(socket);
  const eye = mesh(new THREE.SphereGeometry(0.068,10,8), eyeMat);
  eye.position.set(x,0.1,0.38); headGrp.add(eye);
  const pupil = mesh(new THREE.SphereGeometry(0.03,6,6), new THREE.MeshBasicMaterial({color:0x000000}));
  pupil.scale.set(0.4,1,0.3); pupil.position.set(x,0.1,0.442); headGrp.add(pupil);
  const glow = mesh(new THREE.SphereGeometry(0.1,8,8), eyeGlowM);
  glow.position.set(x,0.1,0.36); headGrp.add(glow);
});

// HORNS
[
  {p:[0.27,0.38,-0.05],  r:[0.15, 0.15, 0.38],  h:0.55, rb:0.062},
  {p:[-0.27,0.38,-0.05], r:[0.15,-0.15,-0.38],   h:0.55, rb:0.062},
  {p:[0.13,0.41,-0.1],   r:[0.25, 0.1,  0.18],   h:0.32, rb:0.048},
  {p:[-0.13,0.41,-0.1],  r:[0.25,-0.1, -0.18],   h:0.32, rb:0.048},
  {p:[0.0, 0.44,-0.15],  r:[-0.22,0,    0],       h:0.24, rb:0.04},
  {p:[0.08,0.36,-0.12],  r:[0.1,  0.2,  0.25],   h:0.18, rb:0.032},
  {p:[-0.08,0.36,-0.12], r:[0.1, -0.2, -0.25],   h:0.18, rb:0.032},
].forEach(({p,r,h,rb}) => {
  const base = mesh(new THREE.SphereGeometry(rb*1.3,8,6), hornMat);
  base.position.set(...p); headGrp.add(base);
  const horn = mesh(new THREE.ConeGeometry(rb,h,8), hornMat);
  horn.position.set(...p); horn.rotation.set(...r); headGrp.add(horn);
});

// JAW
const jaw = mesh(new THREE.SphereGeometry(0.3,10,8), darkMat);
jaw.scale.set(1,0.5,0.9); jaw.position.set(0,-0.25,0.22); headGrp.add(jaw);

const gumU = mesh(new THREE.BoxGeometry(0.36,0.05,0.07), darkMat);
gumU.position.set(0,-0.08,0.41); headGrp.add(gumU);
const gumL = mesh(new THREE.BoxGeometry(0.3,0.05,0.07), darkMat);
gumL.position.set(0,-0.19,0.4); headGrp.add(gumL);

[{x:-0.14,y:-0.08,h:0.10},{x:-0.07,y:-0.06,h:0.13},{x:0,y:-0.05,h:0.14},{x:0.07,y:-0.06,h:0.13},{x:0.14,y:-0.08,h:0.10}]
.forEach(({x,y,h}) => {
  const t = mesh(new THREE.ConeGeometry(0.025,h,5), teethMat);
  t.position.set(x,y,0.41); t.rotation.x = 0.3; headGrp.add(t);
  const tl = mesh(new THREE.ConeGeometry(0.02,h*0.7,5), teethMat);
  tl.position.set(x*0.85,y-0.12,0.4); tl.rotation.x = Math.PI+0.35; headGrp.add(tl);
});

// ARMS
const leftArmGrp  = new THREE.Group(); leftArmGrp.position.set(-0.65,1.42,0.05);  model.add(leftArmGrp);
const rightArmGrp = new THREE.Group(); rightArmGrp.position.set( 0.65,1.42,0.05); model.add(rightArmGrp);

function buildArm(grp, s) {
  const sball = mesh(new THREE.SphereGeometry(0.17,10,8), darkMat);
  sball.position.set(s*0.04,0,0); grp.add(sball);
  const ua = mesh(new THREE.CylinderGeometry(0.13,0.1,0.52,10), skinMat);
  ua.position.set(s*0.12,-0.22,0.04); ua.rotation.z = s*0.22; grp.add(ua);
  const bic = mesh(new THREE.SphereGeometry(0.11,8,6), muscleMat);
  bic.scale.set(0.8,1.4,0.7); bic.position.set(s*0.14,-0.15,0.06); grp.add(bic);
  const elb = mesh(new THREE.SphereGeometry(0.1,8,6), darkMat);
  elb.position.set(s*0.24,-0.48,0.09); grp.add(elb);
  const esp = mesh(new THREE.ConeGeometry(0.035,0.16,5), hornMat);
  esp.position.set(s*0.24,-0.48,-0.06); esp.rotation.x = -0.6; grp.add(esp);
  const fa = mesh(new THREE.CylinderGeometry(0.09,0.075,0.48,10), darkMat);
  fa.position.set(s*0.34,-0.74,0.12); fa.rotation.z = s*0.35; grp.add(fa);
  for (let i = 0; i < 3; i++) {
    const ten = mesh(new THREE.CylinderGeometry(0.014,0.014,0.35,5), muscleMat);
    ten.position.set(s*0.34+(i-1)*s*0.03,-0.74,0.16+i*0.01); ten.rotation.z = s*0.35; grp.add(ten);
  }
  const wr = mesh(new THREE.SphereGeometry(0.085,8,6), darkMat);
  wr.position.set(s*0.44,-1.0,0.16); grp.add(wr);
  const hand = mesh(new THREE.SphereGeometry(0.1,8,6), darkMat);
  hand.scale.set(1.1,0.8,0.9); hand.position.set(s*0.48,-1.08,0.18); grp.add(hand);
  [-0.32,-0.1,0.12,0.34].forEach((fa2,fi) => {
    const fx = s*0.48+Math.sin(fa2)*0.1, fy=-1.08, fz=0.22;
    const kn = mesh(new THREE.SphereGeometry(0.024,6,5), darkMat);
    kn.position.set(fx,fy+0.02,fz+0.04); grp.add(kn);
    const fb = mesh(new THREE.CylinderGeometry(0.016,0.013,0.1,5), darkMat);
    fb.position.set(fx,fy-0.06,fz+0.1); fb.rotation.x = 0.5; grp.add(fb);
    const cl = mesh(new THREE.ConeGeometry(0.022,0.2,5), clawMat);
    cl.position.set(fx,fy-0.17,fz+0.2); cl.rotation.x = 0.6; grp.add(cl);
  });
  const tcl = mesh(new THREE.ConeGeometry(0.025,0.18,5), clawMat);
  tcl.position.set(s*0.41,-1.0,0.28); tcl.rotation.x = 0.8; tcl.rotation.z = s*0.5; grp.add(tcl);
}
buildArm(leftArmGrp, -1);
buildArm(rightArmGrp, 1);

// LEGS
const leftLegGrp  = new THREE.Group(); leftLegGrp.position.set(-0.3,0.58,0);  model.add(leftLegGrp);
const rightLegGrp = new THREE.Group(); rightLegGrp.position.set( 0.3,0.58,0); model.add(rightLegGrp);

function buildLeg(grp, s) {
  const hb = mesh(new THREE.SphereGeometry(0.18,10,8), darkMat);
  hb.position.set(s*0.04,0,0); grp.add(hb);
  const th = mesh(new THREE.CylinderGeometry(0.18,0.13,0.58,10), skinMat);
  th.position.y = -0.22; th.rotation.z = s*0.08; grp.add(th);
  const quad = mesh(new THREE.SphereGeometry(0.15,8,6), muscleMat);
  quad.scale.set(0.9,1.5,0.7); quad.position.set(s*0.02,-0.18,0.06); grp.add(quad);
  const kn = mesh(new THREE.SphereGeometry(0.13,10,8), darkMat);
  kn.position.y = -0.52; grp.add(kn);
  const ksp = mesh(new THREE.ConeGeometry(0.04,0.14,5), hornMat);
  ksp.position.set(s*0.01,-0.52,0.12); ksp.rotation.x = 0.5; grp.add(ksp);
  const ll = mesh(new THREE.CylinderGeometry(0.11,0.085,0.5,10), darkMat);
  ll.position.set(s*0.02,-0.78,0.08); ll.rotation.x = 0.18; grp.add(ll);
  const calf = mesh(new THREE.SphereGeometry(0.1,8,6), muscleMat);
  calf.scale.set(0.8,1.3,0.7); calf.position.set(s*0.02,-0.68,-0.04); grp.add(calf);
  const ank = mesh(new THREE.SphereGeometry(0.085,8,6), darkMat);
  ank.position.set(0,-1.04,0.12); grp.add(ank);
  const foot = mesh(new THREE.SphereGeometry(0.1,8,6), darkMat);
  foot.scale.set(1.1,0.6,1.4); foot.position.set(s*0.02,-1.12,0.22); grp.add(foot);
  [-0.09,0,0.09].forEach(ox => {
    const tc = mesh(new THREE.ConeGeometry(0.028,0.18,5), clawMat);
    tc.position.set(s*0.02+ox,-1.19,0.35); tc.rotation.x = 0.65; grp.add(tc);
  });
  const hs = mesh(new THREE.ConeGeometry(0.035,0.18,5), hornMat);
  hs.position.set(s*0.02,-1.08,-0.08); hs.rotation.x = -0.55; grp.add(hs);
}
buildLeg(leftLegGrp, -1);
buildLeg(rightLegGrp, 1);

// TAIL
const tailCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,0.68,-0.42), new THREE.Vector3(0.15,0.38,-0.72),
  new THREE.Vector3(0.32,0.05,-0.68), new THREE.Vector3(0.42,-0.3,-0.42),
  new THREE.Vector3(0.28,-0.5,-0.18),
]);
const tail = mesh(new THREE.TubeGeometry(tailCurve,18,0.065,8,false), darkMat); model.add(tail);
const barb = mesh(new THREE.ConeGeometry(0.09,0.28,6), hornMat);
barb.position.set(0.28,-0.5,-0.18); barb.rotation.z = 0.55; model.add(barb);

function applyWalkCycle(t, blend) {
  const phase = t * WALK_SPEED;

  const legSwing = Math.sin(phase) * 0.52 * blend;
  leftLegGrp.rotation.x  =  legSwing;
  rightLegGrp.rotation.x = -legSwing;
  leftLegGrp.rotation.z  = -Math.abs(Math.sin(phase)) * 0.06 * blend;
  rightLegGrp.rotation.z  =  Math.abs(Math.sin(phase)) * 0.06 * blend;

  const armSwing = Math.sin(phase + Math.PI) * 0.38 * blend;
  leftArmGrp.rotation.x  =  armSwing;
  rightArmGrp.rotation.x = -armSwing;
  leftArmGrp.rotation.z  =  0.12 + Math.sin(phase * 0.5) * 0.04 * blend;
  rightArmGrp.rotation.z = -0.12 - Math.sin(phase * 0.5) * 0.04 * blend;

  model.rotation.z     = Math.sin(phase) * 0.04 * blend;
  torso.rotation.z   = -Math.sin(phase) * 0.03 * blend;
  headGrp.rotation.y = Math.sin(phase * 0.5) * 0.06 * blend;
  headGrp.rotation.x = -0.04 + Math.sin(phase * 2) * 0.02 * blend;
  model.position.y     = alignOffset + Math.abs(Math.sin(phase)) * 0.07 * blend;
  tail.rotation.y    = Math.sin(phase * 0.8) * 0.22 * blend;
}

// ── IDLE POSE ──
function applyIdle(t, blend) {
  leftArmGrp.rotation.z  += (0.12 + Math.sin(t * 1.2) * 0.07)  * blend;
  rightArmGrp.rotation.z += (-0.12 - Math.sin(t * 1.2) * 0.07) * blend;
  leftArmGrp.rotation.x  += Math.sin(t * 0.85) * 0.05           * blend;
  rightArmGrp.rotation.x += Math.sin(t * 0.85 + 1.1) * 0.05     * blend;
  leftLegGrp.rotation.x  += Math.sin(t * 0.75) * 0.04           * blend;
  rightLegGrp.rotation.x += Math.sin(t * 0.75 + 0.6) * 0.04     * blend;
  headGrp.rotation.y     += Math.sin(t * 0.55) * 0.1             * blend;
  headGrp.rotation.x     += (Math.sin(t * 0.38) * 0.04 - 0.04)  * blend;
  model.position.y         = alignOffset + Math.sin(t * 1.6) * 0.04 * blend;
  tail.rotation.y        += Math.sin(t * 0.9) * 0.15             * blend;
}


  function applyScale(s) {
    root.scale.setScalar(s);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    alignOffset = -box.min.y;
    model.position.y = alignOffset;
  }

  let walkTime = 0;
  function update(dt, moving) {
    walkTime += dt;
    const t = walkTime;
    const blend = moving ? 1 : 0.35;
    model.rotation.set(0, 0, 0);
    leftArmGrp.rotation.set(0, 0, 0);
    rightArmGrp.rotation.set(0, 0, 0);
    leftLegGrp.rotation.set(0, 0, 0);
    rightLegGrp.rotation.set(0, 0, 0);
    headGrp.rotation.set(0, 0, 0);
    torso.rotation.set(0, 0, 0);
    tail.rotation.set(0, 0, 0);
    applyWalkCycle(t, blend);
    applyIdle(t, 1 - blend * 0.5);
  }
  return { root, update, applyScale };
}
