/*
  RPG DREAM - Camera Aware Baseline (Phase A)
  - Camera exists but does NOT move yet
  - Drawing is camera-aware (Camera.x/Camera.y offsets)
  - Pointer math is camera-aware (pointerToGrid adds Camera offsets)
  - Grid is camera-aware (grid lines use Camera modulo)
  - No scroll / zoom yet (we'll add after this is stable)
*/

const TILE = 40;

// --- Camera (does not move yet)
const Camera = { x: 0, y: 0 };

// --- Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  drawAll();
}
window.addEventListener('resize', resize);

// --- State (minimal, safe defaults)
const State = {
  mode: 'terrain', // 'terrain' | 'collision' | 'characters'
  maps: [{
    id: 'map_0',
    w: 50,
    h: 50,
    tiles: {},      // "x,y" -> color
    collision: {},  // "x,y" -> true
    entities: []    // {x,y}
  }],
  activeMap: 0,
  activeTile: 'Grass'
};

function activeMap() {
  return State.maps[State.activeMap];
}

// --- Pointer helpers
function pointerPos(e, el) {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function pointerToGrid(e, el) {
  const p = pointerPos(e, el);
  const worldX = p.x + Camera.x;
  const worldY = p.y + Camera.y;
  return { x: Math.floor(worldX / TILE), y: Math.floor(worldY / TILE) };
}

// --- Drawing
function drawGrid() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = -(Camera.x % TILE); x < w; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  // Horizontal lines
  for (let y = -(Camera.y % TILE); y < h; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
}

function drawTiles() {
  const map = activeMap();
  for (const key in map.tiles) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = map.tiles[key];
    ctx.fillRect(x * TILE - Camera.x, y * TILE - Camera.y, TILE, TILE);
  }
}

function drawCollision() {
  const map = activeMap();
  ctx.fillStyle = 'rgba(0,255,0,0.28)';
  for (const key in map.collision) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillRect(x * TILE - Camera.x, y * TILE - Camera.y, TILE, TILE);
  }
}

function drawEntities() {
  const map = activeMap();
  ctx.fillStyle = '#4aa3ff';
  for (const ent of map.entities) {
    const px = ent.x * TILE - Camera.x;
    const py = ent.y * TILE - Camera.y;
    ctx.fillRect(px, py, TILE, TILE);
  }
}

function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawTiles();
  if (State.mode === 'collision') drawCollision();
  drawEntities();
}

// --- Input (minimal test: tap paints / collision / drops a block)
canvas.addEventListener('pointerdown', (e) => {
  const map = activeMap();
  const g = pointerToGrid(e, canvas);

  // bounds guard (optional)
  if (g.x < 0 || g.y < 0 || g.x >= map.w || g.y >= map.h) return;

  const key = g.x + ',' + g.y;

  if (State.mode === 'terrain') {
    map.tiles[key] = (State.activeTile === 'Grass') ? '#4caf50' : '#777';
  } else if (State.mode === 'collision') {
    map.collision[key] = true;
  } else if (State.mode === 'characters') {
    map.entities.push({ x: g.x, y: g.y });
  }

  drawAll();
});

// --- Boot
resize();
