
/* =====================================================
   RPG DREAM — Engine Skeleton (Refactor A)
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
  loadProject();
  render();
});

function setMode(mode) {
  EngineState.mode = mode;
  render();
}

function bindModeButtons() {
  document.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
}

function getActiveCharacter() {
  return EngineState.characters.find(c => c.id === EngineState.activeCharacterId);
}

function render() {
  const debug = document.getElementById("debug");
  if (debug) debug.textContent = JSON.stringify(EngineState, null, 2);
}

function commitCollisionAnchor(collision, anchor) {
  const char = getActiveCharacter();
  if (!char) return;
  char.collision = collision;
  char.anchor = anchor;
  EngineState.dirty = true;
  saveProject();
}

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
