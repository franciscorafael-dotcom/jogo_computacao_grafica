import { CELL, getCurrentMap } from '../core/state.js';
import { createCyberdemonMob } from '../mobs/cyberdemonMob.js';
import { createCacodemonMob } from '../mobs/cacodemonMob.js';

export const enemies = [];

/**
 * Ajustes visuais dos mobs (podes alterar aqui):
 * - MOB_GROUND_LIFT: sobe o pivô em relação ao chão (Y). Aumenta se os pés enterrarem.
 * - MOB_YAW_OFFSET: rotação extra em radianos no eixo Y se o modelo ficar de costas (ex.: Math.PI).
 * - CYBER_SCALE / CACO_SCALE / BOSS_CYBER_SCALE: tamanho dos modelos.
 */
export const MOB_GROUND_LIFT = 0.72;
export const MOB_YAW_OFFSET = 0;

const CYBER_SCALE = 0.34;
const CACO_SCALE = 0.3;
const BOSS_CYBER_SCALE = CYBER_SCALE * 1.58;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stashFlashOriginals(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    child.userData.flashOrig = mats.map((m) =>
      m && m.emissive
        ? { hex: m.emissive.getHex(), intensity: m.emissiveIntensity }
        : null
    );
  });
}

function restoreFlashMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh || !child.userData.flashOrig) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    child.userData.flashOrig.forEach((o, i) => {
      const m = mats[i];
      if (!m || !m.emissive || !o) return;
      m.emissive.setHex(o.hex);
      if (o.intensity !== undefined) m.emissiveIntensity = o.intensity;
    });
  });
}

/** Células de chão (sem parede), longe do spawn do jogador (~célula 5,5). */
function collectFloorSpawnTiles() {
  const map = getCurrentMap();
  const cells = [];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] !== 0) continue;
      if (col >= 4 && col <= 6 && row >= 4 && row <= 6) continue;
      cells.push([col, row]);
    }
  }
  return cells;
}

function makeCyberEnemy(isBoss) {
  const mob = createCyberdemonMob();
  mob.applyScale(isBoss ? BOSS_CYBER_SCALE : CYBER_SCALE);
  stashFlashOriginals(mob.root);
  return {
    mesh: mob.root,
    kind: 'cyber',
    walkPhase: Math.random() * Math.PI * 2,
    applyWalkPhase: mob.applyWalkPhase,
    applyFloatAnimation: null
  };
}

function makeCacoEnemy() {
  const mob = createCacodemonMob();
  mob.applyScale(CACO_SCALE);
  stashFlashOriginals(mob.root);
  return {
    mesh: mob.root,
    kind: 'caco',
    walkPhase: 0,
    applyWalkPhase: null,
    applyFloatAnimation: mob.applyFloatAnimation
  };
}

export function spawnWave(scene, wave, showMessage, state) {
  clearEnemies(scene);
  const map = getCurrentMap();

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
      if (map[r][c] !== 0) continue;
      const k = key(c, r);
      if (used.has(k)) continue;
      used.add(k);
      return [c, r];
    }
    return null;
  }

  if (shouldSpawnBoss) {
    let bossTile = takeTile([10, 10]);
    if (!bossTile) {
      for (const [c, r] of shuffle(floorTiles)) {
        const k = key(c, r);
        if (used.has(k) || map[r][c] !== 0) continue;
        used.add(k);
        bossTile = [c, r];
        break;
      }
    }
    if (bossTile) {
      const [col, row] = bossTile;
      const x = col * CELL + CELL / 2;
      const z = row * CELL + CELL / 2;
      const built = makeCyberEnemy(true);
      built.mesh.position.set(x, MOB_GROUND_LIFT, z);
      scene.add(built.mesh);
      enemies.push({
        mesh: built.mesh,
        x,
        z,
        alive: true,
        isBoss: true,
        kind: built.kind,
        health: (420 + wave * 40) * state.enemyHealthMult,
        speed: 0.02 * state.enemySpeedMult,
        attackCooldown: 0,
        phase: Math.random() * Math.PI * 2,
        hitFlash: 0,
        walkPhase: built.walkPhase,
        applyWalkPhase: built.applyWalkPhase,
        applyFloatAnimation: built.applyFloatAnimation
      });
      showMessage(`ONDA ${wave} · BOSS`);
      return;
    }
  }

  const nSpawn = Math.min(count, pool.length);
  let nCyber = Math.floor(nSpawn / 2);
  let nCaco = nSpawn - nCyber;
  if (nSpawn % 2 === 1 && Math.random() < 0.5) {
    nCyber++;
    nCaco--;
  }
  const kinds = shuffle([...Array(nCyber).fill('cyber'), ...Array(nCaco).fill('caco')]);

  for (let i = 0; i < nSpawn; i++) {
    const tile = takeTile();
    if (!tile) break;
    const [col, row] = tile;
    const x = col * CELL + CELL / 2;
    const z = row * CELL + CELL / 2;
    const kind = kinds[i];
    const built = kind === 'cyber' ? makeCyberEnemy(false) : makeCacoEnemy();
    built.mesh.position.set(x, MOB_GROUND_LIFT, z);
    scene.add(built.mesh);
    enemies.push({
      mesh: built.mesh,
      x,
      z,
      alive: true,
      isBoss: false,
      kind: built.kind,
      health: (100 + wave * 10) * state.enemyHealthMult,
      speed: (0.03 + Math.random() * 0.02) * state.enemySpeedMult,
      attackCooldown: 0,
      phase: Math.random() * Math.PI * 2,
      hitFlash: 0,
      walkPhase: built.walkPhase,
      applyWalkPhase: built.applyWalkPhase,
      applyFloatAnimation: built.applyFloatAnimation
    });
  }

  showMessage(`ONDA ${wave}`);
}

export function updateEnemies(_t, ctx, dt = 0.016) {
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

    const moving = dist > 1.5;
    if (enemy.kind === 'cyber' && enemy.applyWalkPhase) {
      enemy.walkPhase += dt * (moving ? 1.85 : 0.6);
      enemy.applyWalkPhase(enemy.walkPhase, moving);
    } else if (enemy.kind === 'caco' && enemy.applyFloatAnimation) {
      enemy.applyFloatAnimation(dt, moving);
    }

    enemy.mesh.position.set(enemy.x, MOB_GROUND_LIFT, enemy.z);
    // Só rotação em Y: lookAt inclinava o modelo para o jogador e enterrava os pés no chão.
    const yaw = Math.atan2(dx, dz) + MOB_YAW_OFFSET;
    enemy.mesh.rotation.set(0, yaw, 0);

    if (dist < (enemy.isBoss ? 3.1 : 2.5)) {
      enemy.attackCooldown--;
      if (enemy.attackCooldown <= 0) {
        enemy.attackCooldown = enemy.isBoss ? 60 : 90;
        takeDamage((enemy.isBoss ? 22 : 12) * state.enemyDamageMult);
      }
    }
    if (enemy.hitFlash > 0) {
      enemy.hitFlash--;
      if (enemy.hitFlash === 0) restoreFlashMaterials(enemy.mesh);
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
