const STATUS_FACE_DIR = './assets/status face/';

function healthToFaceIndex(health) {
  const h = Math.max(0, Math.min(100, health));
  if (h > 70) return 1;
  if (h >= 40) return 2;
  return 3;
}

export function createHUD(state) {
  const els = {
    health: document.getElementById('healthVal'),
    armor: document.getElementById('armorVal'),
    kills: document.getElementById('killVal'),
    faceImg: document.getElementById('statusFaceImg'),
    ammoBar: document.getElementById('ammoBar'),
    waveMsg: document.getElementById('waveMsg'),
    damageOverlay: document.getElementById('damageOverlay'),
    staminaBar: document.getElementById('staminaBar'),
    difficulty: document.getElementById('difficultyVal'),
    weaponName: document.getElementById('weaponNameVal')
  };

  let lastFaceIndex = -1;

  function updateFaceImage() {
    if (!els.faceImg) return;
    const idx = healthToFaceIndex(state.health);
    if (idx === lastFaceIndex) return;
    lastFaceIndex = idx;
    const url = `${STATUS_FACE_DIR}${idx}.png`;
    els.faceImg.onerror = () => {
      els.faceImg.onerror = null;
      els.faceImg.src = `${STATUS_FACE_DIR}1.png`;
    };
    els.faceImg.src = url;
  }

  function updateHUD() {
    els.health.textContent = Math.max(0, Math.round(state.health));
    els.armor.textContent = Math.max(0, Math.round(state.armor));
    const sPct = Math.max(0, (state.stamina / state.maxStamina) * 100);
    els.staminaBar.style.width = `${sPct}%`;
    els.difficulty.textContent = state.difficultyLabel;
    const w =
      state.weapon === 'magnum' ? 'MAGNUM' : state.weapon === 'axe' ? 'MACHADO' : 'SHOTGUN';
    if (els.weaponName) els.weaponName.textContent = w;
    updateFaceImage();
  }

  function setKillCount(value) {
    els.kills.textContent = value;
  }

  function updateAmmoBar() {
    els.ammoBar.innerHTML = '';
    if (state.weapon === 'axe') {
      const line = document.createElement('div');
      line.className = 'ammo-fraction ammo-melee';
      line.textContent = 'CORPO A CORPO';
      els.ammoBar.appendChild(line);
      return;
    }
    const mag = state.weapon === 'shotgun' ? state.ammoShotgun : state.ammoMagnum;
    const res = state.weapon === 'shotgun' ? state.reserveShotgun : state.reserveMagnum;
    const maxMag = state.weapon === 'shotgun' ? 2 : 6;
    const row = document.createElement('div');
    row.className = 'ammo-pips-row';
    for (let i = 0; i < maxMag; i++) {
      const pip = document.createElement('div');
      pip.className = `ammo-pip${i < mag ? '' : ' empty'}`;
      row.appendChild(pip);
    }
    const frac = document.createElement('div');
    frac.className = 'ammo-fraction';
    frac.textContent = `${mag} / ${res}`;
    els.ammoBar.appendChild(row);
    els.ammoBar.appendChild(frac);
  }

  function showWaveMsg(text) {
    els.waveMsg.textContent = text;
    els.waveMsg.style.opacity = 1;
    setTimeout(() => {
      els.waveMsg.style.opacity = 0;
    }, 1800);
  }

  function showDamage() {
    els.damageOverlay.style.opacity = 0.8;
    setTimeout(() => {
      els.damageOverlay.style.opacity = 0;
    }, 180);
  }

  function addKillMsg(isBoss = false) {
    const messages = isBoss
      ? ['BOSS ELIMINADO!', 'REI DEMONIO CAIU!']
      : ['MORTO!', 'EXTERMINADO!', 'ELIMINADO!', 'AO INFERNO!', 'DESTRUIDO!'];
    const div = document.createElement('div');
    div.className = 'kill-msg';
    div.textContent = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('killFeed').appendChild(div);
    setTimeout(() => div.remove(), 2000);
  }

  return { updateHUD, setKillCount, updateAmmoBar, showWaveMsg, showDamage, addKillMsg };
}
