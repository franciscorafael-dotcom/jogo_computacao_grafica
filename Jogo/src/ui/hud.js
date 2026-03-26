export function createHUD(state) {
  const els = {
    health: document.getElementById('healthVal'),
    armor: document.getElementById('armorVal'),
    kills: document.getElementById('killVal'),
    face: document.getElementById('faceDisplay'),
    ammoBar: document.getElementById('ammoBar'),
    waveMsg: document.getElementById('waveMsg'),
    damageOverlay: document.getElementById('damageOverlay'),
    staminaBar: document.getElementById('staminaBar'),
    difficulty: document.getElementById('difficultyVal')
  };

  function updateHUD() {
    els.health.textContent = Math.max(0, Math.round(state.health));
    els.armor.textContent = Math.max(0, Math.round(state.armor));
    const sPct = Math.max(0, (state.stamina / state.maxStamina) * 100);
    els.staminaBar.style.width = `${sPct}%`;
    els.difficulty.textContent = state.difficultyLabel;
    if (state.health > 75) els.face.textContent = '>:|';
    else if (state.health > 50) els.face.textContent = '>:/';
    else if (state.health > 25) els.face.textContent = 'D:';
    else els.face.textContent = 'X_X';
  }

  function setKillCount(value) { els.kills.textContent = value; }

  function updateAmmoBar() {
    els.ammoBar.innerHTML = '';
    for (let i = 0; i < state.maxAmmo; i++) {
      const pip = document.createElement('div');
      pip.className = `ammo-pip${i < state.ammo ? '' : ' empty'}`;
      els.ammoBar.appendChild(pip);
    }
  }

  function showWaveMsg(text) {
    els.waveMsg.textContent = text;
    els.waveMsg.style.opacity = 1;
    setTimeout(() => { els.waveMsg.style.opacity = 0; }, 1800);
  }

  function showDamage() {
    els.damageOverlay.style.opacity = 0.8;
    setTimeout(() => { els.damageOverlay.style.opacity = 0; }, 180);
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
