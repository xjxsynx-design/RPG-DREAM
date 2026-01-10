console.log('app.js loaded');

const TILE = 40;
const GRID = 20;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const State = {
  mode: 'terrain',
  biome: 'plains',
  tile: 'grass',
  tiles: {}
};

function bindUI() {
  document.querySelectorAll('.mode').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.mode').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.mode = btn.id.replace('mode-', '');
    };
  });

  document.querySelectorAll('#biomes button').forEach(btn => {
    btn.onclick = () => State.biome = btn.dataset.biome;
  });

  document.querySelectorAll('#terrain button').forEach(btn => {
    btn.onclick = () => State.tile = btn.dataset.tile;
  });
}

function drawGrid() {
  ctx.strokeStyle = '#222';
  for (let x = 0; x <= GRID; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE, 0);
    ctx.lineTo(x * TILE, GRID * TILE);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE);
    ctx.lineTo(GRID * TILE, y * TILE);
    ctx.stroke();
  }
}

function drawTiles() {
  for (const key in State.tiles) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = '#3fa34d';
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  }
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);
  State.tiles[`${x},${y}`] = State.tile;
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTiles();
  drawGrid();
}

bindUI();
draw();
