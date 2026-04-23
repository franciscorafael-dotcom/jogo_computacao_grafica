export function createMinimap(mapOrGetter, cell, enemies, player) {
  const minimapCanvas = document.getElementById('minimap');
  const mmCtx = minimapCanvas.getContext('2d');
  const getMap = typeof mapOrGetter === 'function' ? mapOrGetter : () => mapOrGetter;

  function drawMinimap() {
    const map = getMap();
    if (!map || !map.length || !map[0] || !map[0].length) return;
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    const cw = w / map[0].length;
    const ch = h / map.length;
    mmCtx.fillStyle = 'rgba(0,0,0,0.8)';
    mmCtx.fillRect(0, 0, w, h);
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] !== 1) continue;
        mmCtx.fillStyle = '#663300';
        mmCtx.fillRect(col * cw, row * ch, cw - 1, ch - 1);
      }
    }
    for (const e of enemies) {
      if (!e.alive) continue;
      mmCtx.fillStyle = e.isBoss ? '#ff44ff' : '#ff0000';
      mmCtx.fillRect((e.x / cell) * cw - 2, (e.z / cell) * ch - 2, e.isBoss ? 6 : 4, e.isBoss ? 6 : 4);
    }
    const px = (player.x / cell) * cw;
    const pz = (player.z / cell) * ch;
    mmCtx.fillStyle = '#00ff88';
    mmCtx.beginPath();
    mmCtx.arc(px, pz, 3, 0, Math.PI * 2);
    mmCtx.fill();
    mmCtx.strokeStyle = '#00ff88';
    mmCtx.beginPath();
    mmCtx.moveTo(px, pz);
    mmCtx.lineTo(px - Math.sin(player.yaw) * 8, pz - Math.cos(player.yaw) * 8);
    mmCtx.stroke();
  }
  return { drawMinimap };
}
