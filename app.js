
/* =====================================================
   RPG DREAM — Map Manager v1 (Simple List)
   ===================================================== */

const EngineState = {
  mode: "terrain",
  activeMapId: null,
  activeCharacterId: null,
  maps: [],
  characters: [],
  dirty: false
};

document.addEventListener("DOMContentLoaded", () => {
  bindModeButtons();
  bindMapUI();
  bindCharacterUI();
  loadProject();
  render();
});

/* ---------------- MODE ---------------- */

function setMode(mode) {
  EngineState.mode = mode;
  render();
}

function bindModeButtons() {
  document.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
}

/* ---------------- MAPS ---------------- */

function bindMapUI() {
  document.getElementById("addMap").onclick = addMap;
}

function addMap() {
  const id = "map_" + Date.now().toString(36);
  EngineState.maps.push({
    id,
    name: "New Map",
    width: 50,
    height: 50,
    tiles: []
  });
  EngineState.activeMapId = id;
  EngineState.dirty = true;
  saveProject();
  render();
}

function selectMap(id) {
  EngineState.activeMapId = id;
  render();
}

function renderMaps() {
  const list = document.getElementById("mapList");
  list.innerHTML = "";

  EngineState.maps.forEach(map => {
    const div = document.createElement("div");
    div.className = "map-item";
    if (map.id === EngineState.activeMapId) {
      div.classList.add("active");
    }
    div.textContent = map.name;
    div.onclick = () => selectMap(map.id);
    list.appendChild(div);
  });
}

/* ---------------- CHARACTERS (v1 passthrough) ---------------- */

function bindCharacterUI() {
  document.getElementById("addChar").onclick = addCharacter;
}

function addCharacter() {
  const id = "char_" + crypto.randomUUID().slice(0, 8);
  EngineState.characters.push({
    id,
    name: "New Character",
    type: "npc",
    collision: null,
    anchor: null
  });
  EngineState.activeCharacterId = id;
  EngineState.dirty = true;
  saveProject();
  render();
}

function selectCharacter(id) {
  EngineState.activeCharacterId = id;
  render();
}

function renderCharacters() {
  const list = document.getElementById("charList");
  list.innerHTML = "";

  EngineState.characters.forEach(char => {
    const div = document.createElement("div");
    div.className = "char-item";
    if (char.id === EngineState.activeCharacterId) {
      div.classList.add("active");
    }
    div.textContent = char.name;
    div.onclick = () => selectCharacter(char.id);
    list.appendChild(div);
  });
}

/* ---------------- RENDER ---------------- */

function render() {
  document.getElementById("mapPanel").style.display =
    EngineState.mode === "terrain" ? "block" : "none";

  document.getElementById("charPanel").style.display =
    EngineState.mode === "characters" ? "block" : "none";

  if (EngineState.mode === "terrain") {
    renderMaps();
  }

  if (EngineState.mode === "characters") {
    renderCharacters();
  }

  const debug = document.getElementById("debug");
  debug.textContent = JSON.stringify(EngineState, null, 2);
}

/* ---------------- STORAGE ---------------- */

function saveProject() {
  localStorage.setItem("RPG_DREAM_PROJECT", JSON.stringify({
    maps: EngineState.maps,
    characters: EngineState.characters
  }));
}

function loadProject() {
  const raw = localStorage.getItem("RPG_DREAM_PROJECT");
  if (!raw) return;
  const data = JSON.parse(raw);
  EngineState.maps = data.maps || [];
  EngineState.characters = data.characters || [];
}
