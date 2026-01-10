console.log("✅ app.js loaded");

const canvas = document.getElementById("mapCanvas");
if (!canvas) {
  alert("Canvas not found");
  throw new Error("Canvas not found");
}

const ctx = canvas.getContext("2d");

// 🔒 CRITICAL: SET CANVAS SIZE
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const TILE = 40;
const GRID_W = 20;
const GRID_H = 15;

let currentTile = "#4caf50";

const grid = Array.from({ length: GRID_H }, () =>
  Array.from({ length: GRID_W }, () => null)
);

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const px = x * TILE;
      const py = y * TILE;

      if (grid[y][x]) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(px, py, TILE, TILE);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.strokeRect(px, py, TILE, TILE);
    }
  }
}

canvas.addEventListener("pointerdown", e => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);

  if (x >= 0 && y >= 0 && x < GRID_W && y < GRID_H) {
    grid[y][x] = currentTile;
    drawGrid();
  }
});

document.querySelectorAll("[data-tile]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentTile = btn.dataset.tile;
  });
});

drawGrid();
console.log("✅ grid drawn");
