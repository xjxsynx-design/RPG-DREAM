/* ================================
   NEW PROJECT — CANONICAL CREATION
================================ */

function createProject() {
  const name =
    document.getElementById("projectName")?.value ||
    "Untitled Project";

  const viewMode =
    document.getElementById("viewMode")?.value || "top";

  const gridPreset =
    document.getElementById("gridPreset")?.value || "medium";

  const tileSize =
    parseInt(
      document.getElementById("tileSize")?.value || "32",
      10
    );

  const mapId = "map_1";

  const project = {
    id: "p_" + Date.now(),
    name,
    tileSize,
    gridPreset,

    /* >>> MAPS ARE REQUIRED <<< */
    maps: [
      {
        id: mapId,
        name: "Map 1",
        viewMode,                 // ✅ MAP-LEVEL VIEW
        grid: { preset: gridPreset },
        layers: {
          tiles: [],
          regions: [],
          objects: []
        }
      }
    ],

    editor: {
      activeMapId: mapId
    }
  };

  /* >>> SINGLE SOURCE OF TRUTH <<< */
  localStorage.setItem(
    "rpgdream_active_project",
    JSON.stringify(project)
  );

  const allProjects =
    JSON.parse(
      localStorage.getItem("rpgdream_projects") || "[]"
    );

  allProjects.unshift(project);

  localStorage.setItem(
    "rpgdream_projects",
    JSON.stringify(allProjects)
  );

  /* >>> DIRECT HANDOFF <<< */
  window.location.href = "../editor/index.html";
}
