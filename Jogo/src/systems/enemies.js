import * as THREE from 'three';
import { CELL } from '../core/state.js';

export const enemies = [];

function createEnemyMesh(isBoss = false) {
  const group = new THREE.Group();
  const scale = isBoss ? 1.8 : 1;

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4 * scale, 0.4 * scale, 1.2 * scale, 10),
    new THREE.MeshLambertMaterial({ color: isBoss ? 0x3b0010 : 0x8b0000 })
  );
  body.position.y = 0.6 * scale;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35 * scale, 10, 10),
    new THREE.MeshLambertMaterial({ color: isBoss ? 0x260008 : 0x6b0000 })
  );
  head.position.y = 1.5 * scale;
  group.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const eyeG = new THREE.SphereGeometry(0.08 * scale, 6, 6);
  const eyeL = new THREE.Mesh(eyeG, eyeMat);
  eyeL.position.set(-0.15 * scale, 1.55 * scale, 0.3 * scale);
  group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeG, eyeMat);
  eyeR.position.set(0.15 * scale, 1.55 * scale, 0.3 * scale);
  group.add(eyeR);
  return group;
}

export function spawnWave(scene, wave, showMessage, state) {
  const count = Math.max(2, 3 + wave * 2 + state.waveCountBonus);
  const spawnPoints = [[3,3],[16,3],[3,16],[16,16],[9,9],[3,9],[16,9],[9,3],[9,16]];
  const shouldSpawnBoss = wave > 1 && wave % 3 === 0;

  for (let i = 0; i < Math.min(count, spawnPoints.length); i++) {
    const [col, row] = spawnPoints[i];
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
    const x = 10 * CELL;
    const z = 10 * CELL;
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
  for (const enemy of enemies) scene.remove(enemy.mesh);
  enemies.length = 0;
}
