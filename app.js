// E3 LOCK BASELINE — single init, no camera, no zoom
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');

const TILE = 40;
const W = 20;
const H = 15;

let mode = 'terrain';
let terrain = {};

function init() {
  bindUI();
  resize();
  draw();
}

function bindUI() {
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
    };
  });

  canvas.addEventListener('click', onCanvasClick);
}

function onCanvasClick(e) {
  if (mode !== 'terrain') return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);
  terrain[`${x},${y}`] = true;
  draw();
}

function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#222';
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
      if (terrain[`${x},${y}`]) {
        ctx.fillStyle = '#4da6ff';
        ctx.fillRect(x * TILE + 4, y * TILE + 4, TILE - 8, TILE - 8);
      }
    }
  }
}

window.addEventListener('resize', resize);
init();
