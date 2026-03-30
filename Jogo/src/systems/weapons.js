/** Configuração das armas (munição, cadência, dano, reload, projétil / melee) */
export const AMMO_RESERVE_CAP = {
  shotgun: 20,
  magnum: 60
};

export const WEAPON_CONFIG = {
  shotgun: {
    id: 'shotgun',
    label: 'SHOTGUN',
    maxAmmo: 2,
    fireRateMs: 1000,
    reloadMs: 1500,
    bulletSpeed: 0.85,
    damageMin: 34,
    damageMax: 54
  },
  magnum: {
    id: 'magnum',
    label: 'MAGNUM',
    maxAmmo: 6,
    fireRateMs: 480,
    reloadMs: 1800,
    bulletSpeed: 1.15,
    damageMin: 48,
    damageMax: 72
  },
  axe: {
    id: 'axe',
    label: 'MACHADO',
    maxAmmo: 0,
    fireRateMs: 550,
    reloadMs: 0,
    meleeRange: 2.15,
    damageMin: 208,
    damageMax: 352
  }
};

export function isGunWeapon(weaponId) {
  return weaponId === 'shotgun' || weaponId === 'magnum';
}

export function getWeaponConfig(weaponId) {
  return WEAPON_CONFIG[weaponId] || WEAPON_CONFIG.shotgun;
}

export function getCurrentAmmo(state) {
  if (state.weapon === 'shotgun') return state.ammoShotgun;
  if (state.weapon === 'magnum') return state.ammoMagnum;
  return 0;
}

export function setCurrentAmmo(state, value) {
  if (state.weapon === 'shotgun') state.ammoShotgun = value;
  else if (state.weapon === 'magnum') state.ammoMagnum = value;
}

export function getMaxAmmoForWeapon(weaponId) {
  return getWeaponConfig(weaponId).maxAmmo;
}

export function getReserveAmmo(state) {
  return state.weapon === 'shotgun' ? state.reserveShotgun : state.reserveMagnum;
}

export function setReserveAmmoForWeapon(state, weaponId, value) {
  const cap = AMMO_RESERVE_CAP[weaponId] ?? AMMO_RESERVE_CAP.shotgun;
  const v = Math.max(0, Math.min(cap, value));
  if (weaponId === 'shotgun') state.reserveShotgun = v;
  else state.reserveMagnum = v;
}

export function addReserveAmmo(state, weaponId, amount) {
  const cur = weaponId === 'shotgun' ? state.reserveShotgun : state.reserveMagnum;
  setReserveAmmoForWeapon(state, weaponId, cur + amount);
}
