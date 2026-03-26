export const CELL = 4;

export const G = {
  health: 100,
  armor: 50,
  ammo: 30,
  maxAmmo: 30,
  kills: 0,
  wave: 1,
  running: false,
  paused: false,
  cameraMode: 'perspective',
  lightsEnabled: { ambient: true, directional: true, point: true },
  isPointerLocked: false,
  reloading: false,
  shootCooldown: 0,
  stamina: 100,
  maxStamina: 100,
  difficultyKey: 'medium',
  difficultyLabel: 'VIOLENCIA PATROCINADA',
  enemyHealthMult: 1,
  enemyDamageMult: 1,
  enemySpeedMult: 1,
  waveCountBonus: 0,
  pickupChance: 0.4,
  playerDamageMult: 1
};

export const player = {
  x: 5 * CELL,
  z: 5 * CELL,
  yaw: 0,
  pitch: 0,
  height: 1.6
};

export const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,1,0,0,0,1,1,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,1,0,0,0,1,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export function resetState() {
  G.health = 100;
  G.armor = 50;
  G.ammo = 30;
  G.kills = 0;
  G.wave = 1;
  G.reloading = false;
  G.shootCooldown = 0;
  G.stamina = G.maxStamina;
  player.x = 5 * CELL;
  player.z = 5 * CELL;
  player.yaw = 0;
  player.pitch = 0;
}

export function applyDifficulty(key) {
  const presets = {
    easy: {
      label: 'CARNE FRESCA',
      health: 125,
      armor: 80,
      ammo: 36,
      stamina: 130,
      enemyHealthMult: 0.85,
      enemyDamageMult: 0.75,
      enemySpeedMult: 0.9,
      waveCountBonus: -1,
      pickupChance: 0.55,
      playerDamageMult: 1.15
    },
    medium: {
      label: 'VIOLENCIA PATROCINADA',
      health: 100,
      armor: 50,
      ammo: 30,
      stamina: 100,
      enemyHealthMult: 1,
      enemyDamageMult: 1,
      enemySpeedMult: 1,
      waveCountBonus: 0,
      pickupChance: 0.4,
      playerDamageMult: 1
    },
    hard: {
      label: 'VAI CORRER MAL',
      health: 90,
      armor: 35,
      ammo: 26,
      stamina: 95,
      enemyHealthMult: 1.25,
      enemyDamageMult: 1.3,
      enemySpeedMult: 1.15,
      waveCountBonus: 1,
      pickupChance: 0.28,
      playerDamageMult: 0.92
    },
    nightmare: {
      label: 'ARREPENDIMENTO IMEDIATO',
      health: 80,
      armor: 20,
      ammo: 22,
      stamina: 85,
      enemyHealthMult: 1.55,
      enemyDamageMult: 1.6,
      enemySpeedMult: 1.25,
      waveCountBonus: 2,
      pickupChance: 0.18,
      playerDamageMult: 0.82
    }
  };

  const selected = presets[key] || presets.medium;
  G.difficultyKey = key in presets ? key : 'medium';
  G.difficultyLabel = selected.label;
  G.enemyHealthMult = selected.enemyHealthMult;
  G.enemyDamageMult = selected.enemyDamageMult;
  G.enemySpeedMult = selected.enemySpeedMult;
  G.waveCountBonus = selected.waveCountBonus;
  G.pickupChance = selected.pickupChance;
  G.playerDamageMult = selected.playerDamageMult;
  G.maxStamina = selected.stamina;

  G.health = selected.health;
  G.armor = selected.armor;
  G.maxAmmo = selected.ammo;
  G.ammo = selected.ammo;
  G.stamina = selected.stamina;
}
