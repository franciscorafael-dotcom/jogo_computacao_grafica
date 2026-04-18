import * as THREE from 'three';
import { enemies } from './enemies.js';
import { maybeSpawnPickup } from './pickups.js';
import {
  getWeaponConfig,
  getCurrentAmmo,
  setCurrentAmmo,
  getReserveAmmo,
  setReserveAmmoForWeapon
} from './weapons.js';

export function createCombat(ctx) {
  const {
    scene, state, camera, setKillCount, addKillMsg, updateHUD, updateAmmoBar, spawnNextWave, showWaveMsg,
    onShoot, onReloadStart, onReloadEnd, getMuzzleWorldPosition, canShoot, onDryFire, onAxeSwing
  } = ctx;

  function shoot() {
    if (canShoot && !canShoot()) return;
    if (state.reloading) return;
    const nowMs = performance.now();
    const cfg = getWeaponConfig(state.weapon);

    if (state.weapon === 'axe') {
      if (nowMs < state.nextShotAtMs) return;
      if (onAxeSwing) onAxeSwing();
      state.nextShotAtMs = nowMs + cfg.fireRateMs;

      const weaponEl = document.getElementById('weaponView');
      weaponEl.style.transform = 'translateX(-50%) translateY(-10px) scale(1.2)';
      setTimeout(() => { weaponEl.style.transform = 'translateX(-50%)'; }, 80);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      raycaster.far = cfg.meleeRange;
      const dmg =
        (cfg.damageMin + Math.random() * (cfg.damageMax - cfg.damageMin)) * state.playerDamageMult;

      let closest = null;
      let closestD = Infinity;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = new THREE.Vector3(enemy.x - camera.position.x, 0, enemy.z - camera.position.z).length();
        if (dist > cfg.meleeRange + 0.6) continue;
        const hits = raycaster.intersectObject(enemy.mesh, true);
        if (!hits.length) continue;
        const d = hits[0].distance;
        if (d > cfg.meleeRange) continue;
        if (d < closestD) {
          closestD = d;
          closest = enemy;
        }
      }
      if (closest) hitEnemy(closest, dmg);
      return;
    }

    const ammo = getCurrentAmmo(state);
    if (ammo <= 0) {
      if (onDryFire) onDryFire();
      return;
    }
    if (nowMs < state.nextShotAtMs) return;

    if (onShoot) onShoot(state.weapon);
    setCurrentAmmo(state, ammo - 1);
    state.ammo = getCurrentAmmo(state);
    state.nextShotAtMs = nowMs + cfg.fireRateMs;
    updateAmmoBar();

    const weaponEl = document.getElementById('weaponView');
    weaponEl.style.transform = 'translateX(-50%) translateY(-10px) scale(1.2)';
    setTimeout(() => { weaponEl.style.transform = 'translateX(-50%)'; }, 80);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const dmg =
      (cfg.damageMin + Math.random() * (cfg.damageMax - cfg.damageMin)) * state.playerDamageMult;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = new THREE.Vector3(enemy.x - camera.position.x, 0, enemy.z - camera.position.z).length();
      if (dist >= 20) continue;
      const hits = raycaster.intersectObject(enemy.mesh, true);
      if (!hits.length || hits[0].distance >= 18) continue;
      hitEnemy(enemy, dmg);
      break;
    }
  }

  function hitEnemy(enemy, dmg) {
    enemy.health -= dmg;
    enemy.hitFlash = 8;
    enemy.mesh.traverse((c) => {
      if (!c.isMesh) return;
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      for (const m of mats) {
        if (m && m.emissive) m.emissive.setHex(0xff0000);
      }
    });
    if (enemy.health <= 0) killEnemy(enemy);
  }

  function disposeObject3D(obj) {
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  function killEnemy(enemy) {
    enemy.alive = false;
    disposeObject3D(enemy.mesh);
    scene.remove(enemy.mesh);
    state.kills++;
    setKillCount(state.kills);
    addKillMsg(enemy.isBoss);
    maybeSpawnPickup(scene, enemy.x, enemy.z, state.pickupChance);
    if (enemies.every((e) => !e.alive)) {
      state.wave++;
      state.ammoShotgun = 2;
      state.ammoMagnum = 6;
      state.reserveShotgun = Math.min(20, state.reserveShotgun + 10);
      state.reserveMagnum = Math.min(60, state.reserveMagnum + 30);
      if (state.weapon === 'shotgun') {
        state.ammo = state.ammoShotgun;
        state.maxAmmo = 2;
      } else if (state.weapon === 'magnum') {
        state.ammo = state.ammoMagnum;
        state.maxAmmo = 6;
      } else {
        state.ammo = 0;
        state.maxAmmo = 0;
      }
      state.health = Math.min(100, state.health + 20);
      state.armor = Math.min(100, state.armor + 10);
      updateHUD();
      updateAmmoBar();
      showWaveMsg('ONDA LIMPA!');
      setTimeout(() => spawnNextWave(state.wave), 1600);
    }
  }

  function reload() {
    if (state.weapon === 'axe') return;
    const cfg = getWeaponConfig(state.weapon);
    const loaded = getCurrentAmmo(state);
    const reserve = getReserveAmmo(state);
    if (state.reloading || loaded >= cfg.maxAmmo) return;
    if (reserve <= 0) {
      showWaveMsg('SEM MUNICAO DE RESERVA!');
      return;
    }
    state.reloading = true;
    if (onReloadStart) onReloadStart(state.weapon);
    showWaveMsg('A RECARREGAR...');
    setTimeout(() => {
      const need = cfg.maxAmmo - loaded;
      const take = Math.min(need, reserve);
      setCurrentAmmo(state, loaded + take);
      setReserveAmmoForWeapon(state, state.weapon, reserve - take);
      state.ammo = getCurrentAmmo(state);
      state.reloading = false;
      if (onReloadEnd) onReloadEnd();
      updateAmmoBar();
      showWaveMsg('RECARREGADO!');
    }, cfg.reloadMs);
  }

  return { shoot, reload };
}

export function updateBullets(_isWall) {}

export function clearBullets() {}
