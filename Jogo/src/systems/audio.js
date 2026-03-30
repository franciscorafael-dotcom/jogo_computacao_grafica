/**
 * Áudio: SFX, música em playlist, fallback Web Audio só quando todos os ficheiros falham a carregar.
 * A música só inicia após gesto real do utilizador (initAudioOnFirstUserGesture).
 */
export function createAudioSystem() {
  const originalTracks = [
    './assets/audio/music/music-track-1.mp3',
    './assets/audio/music/music-track-2.mp3',
    './assets/audio/music/music-track-3.mp3'
  ];
  let tracks = [...originalTracks];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  let trackIndex = 0;

  const MUSIC_VOL = 0.45;
  let musicMuted = localStorage.getItem('doom3jsMusicMuted') === '1';

  const music = new Audio();
  music.loop = false;
  music.volume = musicMuted ? 0 : MUSIC_VOL;
  music.preload = 'auto';
  music.setAttribute('playsinline', '');

  const sfx = {
    shotgunShot: new Audio('./assets/audio/shotgun-shot.wav'),
    shotgunReload: new Audio('./assets/audio/reload.wav'),
    magnumShot: new Audio('./assets/audio/magnum-shot.wav'),
    magnumReload: new Audio('./assets/audio/magnum-reload.wav'),
    dryFire: new Audio('./assets/audio/dry-fire.wav'),
    hit: new Audio('./assets/audio/player-hit.wav'),
    step1: new Audio('./assets/audio/step1.wav'),
    step2: new Audio('./assets/audio/step2.wav'),
    axeSwing: new Audio('./assets/audio/axe-swing.wav')
  };

  Object.values(sfx).forEach((a) => {
    a.preload = 'auto';
    a.setAttribute?.('playsinline', '');
  });

  sfx.shotgunShot.volume = 0.55;
  sfx.shotgunReload.volume = 0.5;
  sfx.magnumShot.volume = 0.55;
  sfx.magnumReload.volume = 0.5;
  sfx.dryFire.volume = 0.45;
  sfx.hit.volume = 0.55;
  sfx.step1.volume = 0.35;
  sfx.step2.volume = 0.35;
  sfx.axeSwing.volume = 0.55;

  let stepTimer = 0;
  let stepToggle = false;
  let pausedByGame = false;
  let musicFallbackActive = false;
  let audioCtx = null;
  let fallbackNodes = null;

  /** True depois de startMusic() ter sido chamado com sucesso (playlist ou fallback). */
  let musicPlayStarted = false;
  /** True quando todos os ficheiros de música falharam a carregar (erro de rede/decode). */
  let allMusicTracksFailed = false;

  function applyMusicMute() {
    music.volume = musicMuted ? 0 : MUSIC_VOL;
    if (fallbackNodes && fallbackNodes.master) {
      fallbackNodes.master.gain.value = musicMuted ? 0 : 0.08;
    }
  }

  function playFallbackAmbient() {
    if (musicFallbackActive) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const master = audioCtx.createGain();
      master.gain.value = musicMuted ? 0 : 0.08;
      master.connect(audioCtx.destination);

      const o1 = audioCtx.createOscillator();
      const o2 = audioCtx.createOscillator();
      const g1 = audioCtx.createGain();
      const g2 = audioCtx.createGain();
      o1.type = 'sawtooth';
      o2.type = 'sine';
      o1.frequency.value = 55;
      o2.frequency.value = 110;
      g1.gain.value = 0.4;
      g2.gain.value = 0.25;
      o1.connect(g1);
      o2.connect(g2);
      g1.connect(master);
      g2.connect(master);
      o1.start();
      o2.start();
      fallbackNodes = { o1, o2, master };
      musicFallbackActive = true;
    } catch (_) {}
  }

  function stopFallbackAmbient() {
    if (!musicFallbackActive || !fallbackNodes) return;
    try {
      fallbackNodes.o1.stop();
      fallbackNodes.o2.stop();
      fallbackNodes.master.disconnect();
    } catch (_) {}
    musicFallbackActive = false;
    fallbackNodes = null;
  }

  function playSfx(a) {
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  function playShotgunShot() { playSfx(sfx.shotgunShot); }
  function playMagnumShot() { playSfx(sfx.magnumShot); }
  function playShotgunReload() { playSfx(sfx.shotgunReload); }
  function playMagnumReload() { playSfx(sfx.magnumReload); }
  function playDryFire() { playSfx(sfx.dryFire); }
  function playAxeSwing() { playSfx(sfx.axeSwing); }
  function playDamage() { playSfx(sfx.hit); }

  function play(name) {
    const a = sfx[name];
    if (!a) return;
    playSfx(a);
  }

  function onMusicElementError() {
    if (!music.error) return;
    tryNextTrackAfterLoadFailure();
  }

  function tryNextTrackAfterLoadFailure() {
    trackIndex += 1;
    if (trackIndex >= tracks.length) {
      allMusicTracksFailed = true;
      playFallbackAmbient();
      if (audioCtx && audioCtx.state === 'suspended' && !musicMuted) {
        audioCtx.resume().catch(() => {});
      }
      return;
    }
    assignTrackAndPlay();
  }

  function assignTrackAndPlay() {
    stopFallbackAmbient();
    music.removeEventListener('error', onMusicElementError);
    music.addEventListener('error', onMusicElementError, { once: true });
    music.src = tracks[trackIndex];
    music.load();
    applyMusicMute();

    const p = music.play();
    if (p && typeof p.then === 'function') {
      p.catch(() => {
        if (music.error && music.error.code) {
          tryNextTrackAfterLoadFailure();
        }
      });
    }
  }

  /**
   * Inicia ou retoma a música. Só deve ser chamado a partir de um gesto do utilizador
   * (ex.: primeiro clique/tecla em initAudioOnFirstUserGesture, ou ao desativar mute).
   */
  function startMusic() {
    pausedByGame = false;
    musicPlayStarted = true;
    tracks = shuffle([...originalTracks]);
    trackIndex = 0;
    allMusicTracksFailed = false;
    assignTrackAndPlay();
  }

  function stopMusic() {
    music.pause();
    music.currentTime = 0;
    stopFallbackAmbient();
  }

  function setMusicMuted(m) {
    musicMuted = !!m;
    localStorage.setItem('doom3jsMusicMuted', musicMuted ? '1' : '0');
    applyMusicMute();
    if (musicMuted) {
      music.pause();
      if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend().catch(() => {});
      }
      return;
    }
    if (!musicPlayStarted) {
      startMusic();
      return;
    }
    if (!pausedByGame) {
      if (musicFallbackActive && audioCtx) {
        audioCtx.resume().catch(() => {});
      } else if (!allMusicTracksFailed) {
        const p = music.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => {});
        }
      }
    }
  }

  function getMusicMuted() {
    return musicMuted;
  }

  function setPaused(paused) {
    pausedByGame = paused;
    if (paused) {
      music.pause();
      if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend().catch(() => {});
      }
    } else if (!musicMuted) {
      if (musicFallbackActive && audioCtx) {
        audioCtx.resume().catch(() => {});
      } else if (musicPlayStarted && !allMusicTracksFailed) {
        const p = music.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => {});
        }
      }
    }
  }

  function updateSteps(deltaSeconds, isMoving) {
    if (pausedByGame || !isMoving) {
      stepTimer = 0;
      return;
    }
    stepTimer -= deltaSeconds;
    if (stepTimer > 0) return;
    stepTimer = 0.34;
    stepToggle = !stepToggle;
    play(stepToggle ? 'step1' : 'step2');
  }

  music.addEventListener('ended', () => {
    if (pausedByGame || musicFallbackActive || allMusicTracksFailed || musicMuted) return;
    trackIndex = (trackIndex + 1) % tracks.length;
    assignTrackAndPlay();
  });

  /**
   * Regista um listener único: no primeiro clique ou tecla, inicia a música (se não estiver mute).
   */
  function initAudioOnFirstUserGesture() {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      document.removeEventListener('click', run, true);
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => {
        musicMuted = localStorage.getItem('doom3jsMusicMuted') === '1';
        applyMusicMute();
        if (!musicMuted) startMusic();
      }, 0);
    };
    function onKey(e) {
      if (e.repeat) return;
      run();
    }
    document.addEventListener('click', run, true);
    document.addEventListener('keydown', onKey, true);
  }

  return {
    playShotgunShot,
    playMagnumShot,
    playShotgunReload,
    playMagnumReload,
    playDryFire,
    playAxeSwing,
    playDamage,
    initAudioOnFirstUserGesture,
    startMusic,
    stopMusic,
    setPaused,
    setMusicMuted,
    getMusicMuted,
    updateSteps
  };
}
