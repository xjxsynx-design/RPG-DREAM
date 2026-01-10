console.log("app.js loaded");

const TILE = 40;

document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("panel");
  const editor = document.getElementById("editor");

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  editor.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    for (let x = 0; x <= canvas.width; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += TILE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function showTerrainPanel() {
    panel.innerHTML = `
      <strong>Biome</strong><br/>
      <button>Plains</button>
      <button>Desert</button>
      <button>Tropical</button>
      <button>Volcanic</button>
      <button>Wetlands</button>
      <br/><br/>
      <strong>Terrain</strong><br/>
      <button>Grass</button>
      <button>Water</button>
      <button>Dirt</button>
      <button>Stone</button>
    `;
  }

  function showCollisionPanel() {
    panel.innerHTML = "<strong>Collision mode</strong>";
  }

  function showCharactersPanel() {
    panel.innerHTML = "<strong>Characters</strong><br/><button>+ Add Character</button>";
  }

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.dataset.tab;
      if (tab === "terrain") showTerrainPanel();
      if (tab === "collision") showCollisionPanel();
      if (tab === "characters") showCharactersPanel();
    });
  });

  showTerrainPanel();
  drawGrid();
});
