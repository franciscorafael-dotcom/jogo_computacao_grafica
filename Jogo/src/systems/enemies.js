import * as THREE from 'three';
import { CELL, MAP } from '../core/state.js';

let enemySkinTexture = null;
let enemyDarkTexture = null;

// Carregar texturas para inimigos
const texLoader = new THREE.TextureLoader();
texLoader.load(
  './assets/enemy_skin.png', // Assumindo que existe
  (tex) => {
    enemySkinTexture = tex;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  },
  undefined,
  () => {}
);
texLoader.load(
  './assets/enemy_dark.png', // Assumindo
  (tex) => {
    enemyDarkTexture = tex;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  },
  undefined,
  () => {}
);

export const enemies = [];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Células de chão (sem parede), longe do spawn do jogador (~célula 5,5). */
function collectFloorSpawnTiles() {
  const cells = [];
  for (let row = 0; row < MAP.length; row++) {
    for (let col = 0; col < MAP[row].length; col++) {
      if (MAP[row][col] !== 0) continue;
      if (col >= 4 && col <= 6 && row >= 4 && row <= 6) continue;
      cells.push([col, row]);
    }
  }
  return cells;
}

function limbMesh(geom, mat, x, y, z, sx, sy, sz, rx = 0, rz = 0) {
  const m = new THREE.Mesh(geom, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.x = rx;
  m.rotation.z = rz;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function createEnemyMesh(isBoss = false) {
  const group = new THREE.Group();
  const s = isBoss ? 1.65 : 1;

  const skin = enemySkinTexture ? new THREE.MeshLambertMaterial({ map: enemySkinTexture }) : new THREE.MeshLambertMaterial({ color: isBoss ? 0x4a1520 : 0x7a2028 });
  const dark = enemyDarkTexture ? new THREE.MeshLambertMaterial({ map: enemyDarkTexture }) : new THREE.MeshLambertMaterial({ color: isBoss ? 0x2a0a12 : 0x4a1818 });
  const joint = new THREE.MeshLambertMaterial({ color: isBoss ? 0x1a0808 : 0x2a1010 });

  const torso = limbMesh(
    new THREE.BoxGeometry(0.55, 0.75, 0.28),
    skin,
    0, 1.05 * s, 0,
    s, s, s
  );
  group.add(torso);

  const pelvis = limbMesh(
    new THREE.BoxGeometry(0.45, 0.25, 0.24),
    dark,
    0, 0.58 * s, 0,
    s, s, s
  );
  group.add(pelvis);

  const head = limbMesh(
    new THREE.SphereGeometry(0.28, 10, 10),
    skin,
    0, 1.58 * s, 0.06 * s,
    s, s, s
  );
  group.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
  const eyeG = new THREE.SphereGeometry(0.06 * s, 6, 6);
  const eyeL = limbMesh(eyeG, eyeMat, -0.1 * s, 1.62 * s, 0.32 * s, 1, 1, 1);
  const eyeR = limbMesh(eyeG, eyeMat, 0.1 * s, 1.62 * s, 0.32 * s, 1, 1, 1);
  group.add(eyeL);
  group.add(eyeR);

  const upperArmG = new THREE.CylinderGeometry(0.09 * s, 0.1 * s, 0.42 * s, 8);
  const foreArmG = new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 0.38 * s, 8);
  const thighG = new THREE.CylinderGeometry(0.12 * s, 0.11 * s, 0.45 * s, 8);
  const shinG = new THREE.CylinderGeometry(0.1 * s, 0.09 * s, 0.42 * s, 8);

  const armLX = -0.38 * s;
  const armRX = 0.38 * s;
  const shoulderY = 1.28 * s;
  group.add(limbMesh(upperArmG, skin, armLX, shoulderY, 0, 1, 1, 1, 0.15, 0));
  group.add(limbMesh(upperArmG, skin, armRX, shoulderY, 0, 1, 1, 1, 0.15, 0));
  group.add(limbMesh(foreArmG, joint, armLX, 0.92 * s, 0.05 * s, 1, 1, 1, 0.1, 0));
  group.add(limbMesh(foreArmG, joint, armRX, 0.92 * s, 0.05 * s, 1, 1, 1, 0.1, 0));

  const hipY = 0.42 * s;
  const legX = 0.14 * s;
  group.add(limbMesh(thighG, dark, -legX, hipY, 0, 1, 1, 1, -0.08, 0));
  group.add(limbMesh(thighG, dark, legX, hipY, 0, 1, 1, 1, -0.08, 0));
  group.add(limbMesh(shinG, joint, -legX, 0.08 * s, 0.02 * s, 1, 1, 1, 0.05, 0));
  group.add(limbMesh(shinG, joint, legX, 0.08 * s, 0.02 * s, 1, 1, 1, 0.05, 0));

  const footG = new THREE.BoxGeometry(0.16 * s, 0.1 * s, 0.28 * s);
  group.add(limbMesh(footG, dark, -legX, -0.12 * s, 0.1 * s, 1, 1, 1));
  group.add(limbMesh(footG, dark, legX, -0.12 * s, 0.1 * s, 1, 1, 1));

  return group;
}

export function spawnWave(scene, wave, showMessage, state) {
  // Limpar inimigos e pickups restantes da onda anterior para manter leve
  clearEnemies(scene);
  // Nota: pickups são limpos em outro lugar, mas podemos garantir aqui se necessário

  const count = Math.max(2, 3 + wave * 2 + state.waveCountBonus);
  const shouldSpawnBoss = wave > 1 && wave % 3 === 0;

  const floorTiles = collectFloorSpawnTiles();
  const pool = shuffle(floorTiles);
  const used = new Set();
  const key = (c, r) => `${c},${r}`;

  function takeTile(preferredNear = null) {
    const tryList = [];
    if (preferredNear) {
      const [pc, pr] = preferredNear;
      for (const [c, r] of pool) {
        if (Math.hypot(c - pc, r - pr) <= 4) tryList.push([c, r]);
      }
    }
    const order = tryList.length ? shuffle(tryList).concat(shuffle(pool)) : pool;
    for (const [c, r] of order) {
      if (MAP[r][c] !== 0) continue;
      const k = key(c, r);
      if (used.has(k)) continue;
      used.add(k);
      return [c, r];
    }
    return null;
  }

  const nSpawn = Math.min(count, pool.length);
  for (let i = 0; i < nSpawn; i++) {
    const tile = takeTile();
    if (!tile) break;
    const [col, row] = tile;
    const x = col * CELL + CELL / 2;
    const z = row * CELL + CELL / 2;
    const mesh = createEnemyMesh(false);
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    enemies.push({
      mesh, x, z, alive: true, isBoss: false,
      health: (100 + wave * 10) * state.enemyHealthMult,
      speed: (0.03 + Math.random() * 0.02) * state.enemySpeedMult,
      attackCooldown: 0,
      phase: Math.random() * Math.PI * 2,
      hitFlash: 0
    });
  }

  if (shouldSpawnBoss) {
    let bossTile = takeTile([10, 10]);
    if (!bossTile) {
      for (const [c, r] of shuffle(floorTiles)) {
        const k = key(c, r);
        if (used.has(k) || MAP[r][c] !== 0) continue;
        used.add(k);
        bossTile = [c, r];
        break;
      }
    }
    if (bossTile) {
      const [col, row] = bossTile;
      const x = col * CELL + CELL / 2;
      const z = row * CELL + CELL / 2;
      const mesh = createEnemyMesh(true);
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      enemies.push({
        mesh, x, z, alive: true, isBoss: true,
        health: (420 + wave * 40) * state.enemyHealthMult,
        speed: 0.02 * state.enemySpeedMult,
        attackCooldown: 0,
        phase: Math.random() * Math.PI * 2,
        hitFlash: 0
      });
      showMessage(`ONDA ${wave} · BOSS`);
      return;
    }
  }
  showMessage(`ONDA ${wave}`);
}

export function updateEnemies(t, ctx) {
  const { player, isWall, takeDamage, state } = ctx;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = player.x - enemy.x;
    const dz = player.z - enemy.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 1.5) {
      const nx = enemy.x + (dx / dist) * enemy.speed;
      const nz = enemy.z + (dz / dist) * enemy.speed;
      if (!isWall(nx, enemy.z)) enemy.x = nx;
      if (!isWall(enemy.x, nz)) enemy.z = nz;
    }
    enemy.mesh.position.set(enemy.x, Math.sin(t * 3 + enemy.phase) * 0.1, enemy.z);
    enemy.mesh.lookAt(player.x, 0, player.z);

    if (dist < (enemy.isBoss ? 3.1 : 2.5)) {
      enemy.attackCooldown--;
      if (enemy.attackCooldown <= 0) {
        enemy.attackCooldown = enemy.isBoss ? 60 : 90;
        takeDamage((enemy.isBoss ? 22 : 12) * state.enemyDamageMult);
      }
    }
    if (enemy.hitFlash > 0) {
      enemy.hitFlash--;
      if (enemy.hitFlash === 0) enemy.mesh.children.forEach(c => c.material?.emissive?.setHex(0x000000));
    }
  }
}

export function clearEnemies(scene) {
  for (const enemy of enemies) {
    enemy.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    scene.remove(enemy.mesh);
  }
  enemies.length = 0;
}
