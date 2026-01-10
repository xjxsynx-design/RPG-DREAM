/* =========================
   RPG DREAM — E3 BASE LOCK
   app.js
   ========================= */

console.log("✅ app.js loaded");

/* ---------- CONSTANTS ---------- */
const TILE_SIZE = 32;
const GRID_COLS = 12;
const GRID_ROWS = 12;

/* ---------- STATE ---------- */
const state = {
  mode: "terrain",          // terrain | collision | characters
  biome: "plains",
  tile: "grass",
  map: [],
  characters: []
};

/* ---------- ELEMENTS ---------- */
const canvas = document.getElementById("editor");
const ctx = canvas.getContext("2d");

canvas.width = GRID_COLS * TILE_SIZE;
canvas.height = GRID_ROWS * TILE_SIZE;

/* ---------- INIT MAP ---------- */
function createEmptyMap() {
  const map = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = [];
    for (let x = 0; x < GRID_COLS; x++) {
      row.push(null);
    }
    map.push(row);
  }
  return map;
}

state.map = createEmptyMap();

/* ---------- UI BINDING ---------- */
function bindUI() {
  /* Mode buttons */
  document.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      updateActiveButtons("[data-mode]", btn);
    });
  });

  /* Biome buttons */
  document.querySelectorAll("[data-biome]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.biome = btn.dataset.biome;
      updateActiveButtons("[data-biome]", btn);
    });
  });

  /* Tile buttons */
  document.querySelectorAll("[data-tile]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.tile = btn.dataset.tile;
      updateActiveButtons("[data-tile]", btn);
    });
  });

  /* Map add */
  const addMapBtn = document.getElementById("add-map");
  if (addMapBtn) {
    addMapBtn.addEventListener("click", () => {
      state.map = createEmptyMap();
      draw();
    });
  }

  /* Character add */
  const addCharBtn = document.getElementById("add-character");
  if (addCharBtn) {
    addCharBtn.addEventListener("click", () => {
      state.characters.push({ x: 0, y: 0 });
      alert("Character added (placeholder)");
    });
  }

  console.log("✅ UI bound");
}

/* ---------- HELPERS ---------- */
function updateActiveButtons(selector, activeBtn) {
  document.querySelectorAll(selector).forEach(b => {
    b.classList.remove("active");
  });
  activeBtn.classList.add("active");
}

function getTileColor(tile) {
  switch (tile) {
    case "grass": return "#2ecc71";
    case "water": return "#3498db";
    case "dirt": return "#a0522d";
    case "stone": return "#7f8c8d";
    default: return null;
  }
}

/* ---------- DRAWING ---------- */
function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let x = 0; x <= GRID_COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(canvas.width, y * TILE_SIZE);
    ctx.stroke();
  }
}

function drawTiles() {
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const tile = state.map[y][x];
      if (!tile) continue;
      ctx.fillStyle = getTileColor(tile);
      ctx.fillRect(
        x * TILE_SIZE,
        y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTiles();
  drawGrid();
}

/* ---------- INPUT ---------- */
canvas.addEventListener("click", e => {
  if (state.mode !== "terrain") return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
  const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

  if (x < 0 || y < 0 || x >= GRID_COLS || y >= GRID_ROWS) return;

  state.map[y][x] = state.tile;
  draw();
});

/* ---------- BOOT ---------- */
bindUI();
draw();
