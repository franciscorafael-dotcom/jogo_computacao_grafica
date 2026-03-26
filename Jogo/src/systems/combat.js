import * as THREE from 'three';
import { enemies } from './enemies.js';
import { maybeSpawnPickup } from './pickups.js';

export const bullets = [];

const bulletGeom = new THREE.SphereGeometry(0.12, 6, 6);
const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

export function createCombat(ctx) {
  const { scene, state, camera, setKillCount, addKillMsg, updateHUD, updateAmmoBar, spawnNextWave, showWaveMsg } = ctx;

  function shoot() {
    if (state.ammo <= 0 || state.reloading || state.shootCooldown > 0) return;
    state.ammo--;
    state.shootCooldown = 8;
    updateAmmoBar();

    const weaponEl = document.getElementById('weaponView');
    weaponEl.style.transform = 'translateX(-50%) translateY(-10px) scale(1.2)';
    setTimeout(() => { weaponEl.style.transform = 'translateX(-50%)'; }, 80);

    const bullet = new THREE.Mesh(bulletGeom, bulletMat.clone());
    bullet.position.copy(camera.position);
    bullet.position.y -= 0.2;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    scene.add(bullet);
    bullets.push({ mesh: bullet, velocity: dir.clone().multiplyScalar(0.8), life: 60 });

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = new THREE.Vector3(enemy.x - camera.position.x, 0, enemy.z - camera.position.z).length();
      if (dist >= 20) continue;
      const hits = raycaster.intersectObject(enemy.mesh, true);
      if (!hits.length || hits[0].distance >= 18) continue;
      hitEnemy(enemy, (34 + Math.random() * 20) * state.playerDamageMult);
      break;
    }
  }

  function hitEnemy(enemy, dmg) {
    enemy.health -= dmg;
    enemy.hitFlash = 8;
    enemy.mesh.children.forEach((c) => c.material?.emissive?.setHex(0xff0000));
    if (enemy.health <= 0) killEnemy(enemy);
  }

  function killEnemy(enemy) {
    enemy.alive = false;
    scene.remove(enemy.mesh);
    state.kills++;
    setKillCount(state.kills);
    addKillMsg(enemy.isBoss);
    maybeSpawnPickup(scene, enemy.x, enemy.z, state.pickupChance);
    if (enemies.every((e) => !e.alive)) {
      state.wave++;
      state.ammo = state.maxAmmo;
      state.health = Math.min(100, state.health + 20);
      state.armor = Math.min(100, state.armor + 10);
      updateHUD();
      updateAmmoBar();
      showWaveMsg('ONDA LIMPA!');
      setTimeout(() => spawnNextWave(state.wave), 1600);
    }
  }

  function reload() {
    if (state.reloading || state.ammo === state.maxAmmo) return;
    state.reloading = true;
    showWaveMsg('A RECARREGAR...');
    setTimeout(() => {
      state.ammo = state.maxAmmo;
      state.reloading = false;
      updateAmmoBar();
      showWaveMsg('RECARREGADO!');
    }, 1500);
  }

  return { shoot, reload };
}

export function updateBullets(scene, isWall, state) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.mesh.position.add(b.velocity);
    b.life--;
    if (b.life <= 0 || isWall(b.mesh.position.x, b.mesh.position.z)) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }
  if (state.shootCooldown > 0) state.shootCooldown--;
}

export function clearBullets(scene) {
  for (const b of bullets) scene.remove(b.mesh);
  bullets.length = 0;
}
