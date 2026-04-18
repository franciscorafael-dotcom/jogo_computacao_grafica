import * as THREE from 'three';
import { createCyberdemonMob } from '../mobs/cyberdemonMob.js';
import { createCacodemonMob } from '../mobs/cacodemonMob.js';
import { createMarineMob } from '../mobs/marineMob.js';

function makeBase() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.45, 0.24, 32),
    new THREE.MeshStandardMaterial({
      color: 0x220707,
      roughness: 0.9,
      metalness: 0.1
    })
  );
  base.position.y = -0.12;
  base.receiveShadow = true;
  group.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.05, 8, 42),
    new THREE.MeshBasicMaterial({ color: 0xaa1111 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  return group;
}

export function createLoreViewer(opts) {
  const {
    canvas,
    cardTitleEl,
    cardTextEl,
    dotsEl,
    prevBtn,
    nextBtn,
    onIndexChanged
  } = opts;

  const loreEntries = [
    {
      id: 'marine',
      title: 'MARINE',
      modelY: 0.55,
      text:
        'Um estudante da UTAD que acordou no meio de uma invasão demoníaca. Armado apenas com coragem e uma arma, deve lutar pela sobrevivência contra as forças do inferno que aterrorizam a UTAD.'
    },
    {
      id: 'cacodemon',
      title: 'CACODEMON',
      modelY: 1.2,
      text:
        'Esferas vivas de pura maldade. Estas criaturas flutuantes patrulham os céus da ETC, cuspindo projéteis de plasma contra os sobreviventes. O seu olho tudo vê!'
    },
    {
      id: 'cyberdemon',
      title: 'CYBERDEMON',
      modelY: 1,
      text:
        'Gigante, brutal e implacável, o Cyberdemon é a personificação do caos que caiu sobre a UTAD. Metade máquina, metade pesadelo, um verdadeiro titã de destruição que espalha o terror.'
    }
  ];

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 2.2, 8.2);

  const ambient = new THREE.AmbientLight(0x442222, 1.1);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xff5533, 1.3);
  key.position.set(5, 8, 5);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x551111, 1.1);
  rim.position.set(-6, 3, -4);
  scene.add(rim);

  const base = makeBase();
  scene.add(base);

  let currentIndex = 0;
  let currentModel = null;
  let currentAnimator = null;
  let rafId = 0;
  let running = false;
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 320;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function disposeCurrentModel() {
    if (!currentModel) return;
    currentModel.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
    scene.remove(currentModel);
    currentModel = null;
    currentAnimator = null;
  }

  function buildModel(id) {
    if (id === 'cyberdemon') {
      const m = createCyberdemonMob();
      m.applyScale(0.4);
      return {
        root: m.root,
        animate: (dt) => {
          m.applyWalkPhase(performance.now() * 0.0018, true);
          m.root.rotation.y += dt * 0.42;
        }
      };
    }
    if (id === 'cacodemon') {
      const m = createCacodemonMob();
      m.applyScale(0.36);
      return {
        root: m.root,
        animate: (dt) => {
          m.applyFloatAnimation(dt, true);
          m.root.rotation.y += dt * 0.35;
        }
      };
    }
    const marine = createMarineMob();
    marine.applyScale(0.62);
    return {
      root: marine.root,
      animate: (dt) => {
        marine.animate(dt);
        marine.root.rotation.y += dt * 0.35;
      }
    };
  }

  function renderDots() {
    dotsEl.innerHTML = '';
    for (let i = 0; i < loreEntries.length; i++) {
      const dot = document.createElement('span');
      dot.className = `lore-dot${i === currentIndex ? ' active' : ''}`;
      dotsEl.appendChild(dot);
    }
  }

  function setEntry(index) {
    currentIndex = (index + loreEntries.length) % loreEntries.length;
    const entry = loreEntries[currentIndex];
    cardTitleEl.textContent = entry.title;
    cardTextEl.textContent = entry.text;

    disposeCurrentModel();
    const built = buildModel(entry.id);
    currentModel = built.root;
    currentAnimator = built.animate;
    // Ajuste fino da altura do modelo no display da LORE.
    currentModel.position.set(0, entry.modelY ?? 0, 0);
    scene.add(currentModel);

    renderDots();
    if (onIndexChanged) onIndexChanged(currentIndex);
  }

  function tick() {
    if (!running) return;
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(0.05, Math.max(0.001, clock.getDelta()));
    if (currentAnimator) currentAnimator(dt);
    renderer.render(scene, camera);
  }

  function show() {
    running = true;
    resize();
    clock.start();
    cancelAnimationFrame(rafId);
    tick();
  }

  function hide() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  prevBtn.addEventListener('click', () => setEntry(currentIndex - 1));
  nextBtn.addEventListener('click', () => setEntry(currentIndex + 1));
  window.addEventListener('resize', () => {
    if (running) resize();
  });

  setEntry(0);

  return {
    show,
    hide,
    setEntry,
    getCount: () => loreEntries.length
  };
}
