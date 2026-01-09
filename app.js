
/* =====================================================
   RPG DREAM — Character Placement v1 (Touch-first DOM)
   - Place selected character onto active map by tapping.
   - Drag placed characters to reposition.
   ===================================================== */

function makeId(prefix) {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.floor(Math.random()*1e6).toString(36);
}

const EngineState = {
  mode: "terrain",          // terrain | characters | collision
  activeMapId: null,
  activeCharacterId: null,
  maps: [],
  characters: [],
  dirty: false
};

let drag = {
  active: false,
  entityId: null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0
};

document.addEventListener("DOMContentLoaded", () => {
  bindModeButtons();
  bindMapUI();
  bindCharacterUI();
  bindViewportUI();
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

/* ---------------- HELPERS ---------------- */

function getActiveMap() {
  return EngineState.maps.find(m => m.id === EngineState.activeMapId) || null;
}

function getActiveCharacter() {
  return EngineState.characters.find(c => c.id === EngineState.activeCharacterId) || null;
}

function getCharacterById(id) {
  return EngineState.characters.find(c => c.id === id) || null;
}

/* ---------------- MAPS ---------------- */

function bindMapUI() {
  document.getElementById("addMap").onclick = addMap;
}

function addMap() {
  const id = makeId("map");
  EngineState.maps.push({
    id,
    name: "New Map",
    width: 50,
    height: 50,
    tiles: [],
    entities: [] // [{id, charId, x, y}]
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
    if (map.id === EngineState.activeMapId) div.classList.add("active");
    div.textContent = map.name;
    div.onclick = () => selectMap(map.id);
    list.appendChild(div);
  });
}

/* ---------------- CHARACTERS ---------------- */

function bindCharacterUI() {
  document.getElementById("addChar").onclick = addCharacter;
}

function addCharacter() {
  const id = makeId("char");
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
    if (char.id === EngineState.activeCharacterId) div.classList.add("active");
    div.textContent = char.name;
    div.onclick = () => selectCharacter(char.id);
    list.appendChild(div);
  });
}

/* ---------------- VIEWPORT / PLACEMENT ---------------- */

function bindViewportUI() {
  const vp = document.getElementById("mapViewport");

  // tap-to-place
  vp.addEventListener("pointerdown", (e) => {
    // if pointerdown started on an entity, entity handler will stopPropagation
    if (EngineState.mode !== "terrain") return;

    const map = getActiveMap();
    const char = getActiveCharacter();
    if (!map || !char) return;

    const rect = vp.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const ent = { id: makeId("ent"), charId: char.id, x, y };
    map.entities = map.entities || [];
    map.entities.push(ent);

    EngineState.dirty = true;
    saveProject();
    renderMapViewport(); // fast refresh
    renderDebug();
  });

  // drag move (global)
  window.addEventListener("pointermove", (e) => {
    if (!drag.active) return;
    const vp = document.getElementById("mapViewport");
    const rect = vp.getBoundingClientRect();

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    const nx = Math.max(0, Math.min(rect.width, drag.originX + dx));
    const ny = Math.max(0, Math.min(rect.height, drag.originY + dy));

    const map = getActiveMap();
    if (!map) return;
    const ent = (map.entities || []).find(en => en.id === drag.entityId);
    if (!ent) return;

    ent.x = nx;
    ent.y = ny;

    positionEntityElement(drag.entityId, nx, ny);
    EngineState.dirty = true;
    renderDebug(true);
  });

  window.addEventListener("pointerup", () => {
    if (!drag.active) return;
    drag.active = false;
    drag.entityId = null;
    saveProject();
  });
}

function positionEntityElement(entityId, x, y) {
  const el = document.querySelector(`[data-entity-id="${entityId}"]`);
  if (!el) return;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

function renderMapViewport() {
  const vp = document.getElementById("mapViewport");
  const hint = document.getElementById("hint");
  const map = getActiveMap();
  const char = getActiveCharacter();

  // hint text
  if (!map) {
    hint.textContent = "Add/select a map to begin.";
  } else if (!char) {
    hint.textContent = "Select a character, then tap to place on the map.";
  } else {
    hint.textContent = `Tap to place: ${char.name}`;
  }

  // clear old entities
  vp.querySelectorAll(".entity").forEach(n => n.remove());

  if (!map) return;
  map.entities = map.entities || [];

  map.entities.forEach(ent => {
    const c = getCharacterById(ent.charId);
    const label = c ? c.name : "Character";
    const token = label.trim().slice(0, 2).toUpperCase();

    const div = document.createElement("div");
    div.className = "entity";
    div.dataset.entityId = ent.id;
    div.title = label;
    div.textContent = token;

    div.style.left = `${ent.x}px`;
    div.style.top = `${ent.y}px`;

    // drag start
    div.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); // prevent tap-to-place
      if (EngineState.mode !== "terrain") return;

      drag.active = true;
      drag.entityId = ent.id;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.originX = ent.x;
      drag.originY = ent.y;
    });

    vp.appendChild(div);
  });
}

/* ---------------- RENDER ---------------- */

function render() {
  // Panels
  document.getElementById("mapPanel").style.display =
    EngineState.mode === "terrain" ? "block" : "none";
  document.getElementById("viewportPanel").style.display =
    EngineState.mode === "terrain" ? "block" : "none";

  document.getElementById("charPanel").style.display =
    EngineState.mode === "characters" ? "block" : "none";

  if (EngineState.mode === "terrain") {
    renderMaps();
    renderMapViewport();
  }

  if (EngineState.mode === "characters") {
    renderCharacters();
  }

  renderDebug();
}

function renderDebug(light=false) {
  const debug = document.getElementById("debug");
  if (!debug) return;
  // If light update, avoid heavy stringify formatting cost? Still fine for small state.
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
  EngineState.maps = (data.maps || []).map(m => ({
    ...m,
    entities: m.entities || []
  }));
  EngineState.characters = data.characters || [];

  // keep active selections if still exist
  if (EngineState.maps.length && !EngineState.activeMapId) {
    EngineState.activeMapId = EngineState.maps[0].id;
  }
  if (EngineState.characters.length && !EngineState.activeCharacterId) {
    EngineState.activeCharacterId = EngineState.characters[0].id;
  }
}
