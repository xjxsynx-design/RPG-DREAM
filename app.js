const State = {
  mode: "terrain",
  characters: [],
  activeCharacterId: null
};

const tabs = document.querySelectorAll(".tab");
tabs.forEach(btn => {
  btn.onclick = () => setMode(btn.dataset.mode);
});

function setMode(mode) {
  State.mode = mode;
  tabs.forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  document.getElementById("terrainPanel").classList.toggle("hidden", mode !== "terrain");
  document.getElementById("charactersPanel").classList.toggle("hidden", mode !== "characters");
}

document.getElementById("addCharacterBtn").onclick = () => {
  const id = "char_" + Math.random().toString(36).slice(2, 6);
  State.characters.push({ id, name: "New Character" });
  State.activeCharacterId = id;
  renderCharacters();
};

function renderCharacters() {
  const list = document.getElementById("characterList");
  list.innerHTML = "";
  State.characters.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "pill";
    btn.textContent = c.name;
    btn.onclick = () => State.activeCharacterId = c.id;
    list.appendChild(btn);
  });
}

// simple grid render
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const TILE = 40;

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#1f2937";
  for (let x = 0; x < canvas.width; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

drawGrid();
