console.log("app.js loaded");

const TILE = 40;
const GRID_W = 20;
const GRID_H = 20;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = GRID_W * TILE;
canvas.height = GRID_H * TILE;

/* STATE */
let currentMode = "terrain";
let currentBiome = "Plains";
let currentTerrain = "Grass";

/* DATA */
const BIOMES = ["Plains", "Desert", "Tropical", "Volcanic", "Wetlands"];
const TERRAINS = ["Grass", "Water", "Dirt", "Stone"];

const COLORS = {
  Grass: "#4caf50",
  Water: "#2196f3",
  Dirt: "#8b5a2b",
  Stone: "#777"
};

/* MAP DATA */
const map = Array.from({ length: GRID_H }, () =>
  Array.from({ length: GRID_W }, () => null)
);

/* BUILD PALETTES */
function buildPalette(containerId, items, onSelect) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";

  items.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "palette-btn";
    btn.textContent = item;

    btn.onclick = () => {
      [...el.children].forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(item);
    };

    el.appendChild(btn);
  });

  el.children[0].classList.add("active");
}

buildPalette("biomePalette", BIOMES, v => currentBiome = v);
buildPalette("terrainPalette", TERRAINS, v => currentTerrain = v);

/* MODE BUTTONS */
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
  };
});

/* DRAW */
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (map[y][x]) {
        ctx.fillStyle = COLORS[map[y][x]];
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  for (let x = 0; x <= GRID_W; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE, 0);
    ctx.lineTo(x * TILE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_H; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE);
    ctx.lineTo(canvas.width, y * TILE);
    ctx.stroke();
  }
}

drawGrid();

/* PAINT */
canvas.addEventListener("click", e => {
  if (currentMode !== "terrain") return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);

  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return;

  map[y][x] = currentTerrain;
  drawGrid();
});
