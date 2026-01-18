/* ================================
   LOAD PROJECT — CANONICAL FLOW
================================ */

function loadProject(projectId) {
  const projects =
    JSON.parse(
      localStorage.getItem("rpgdream_projects") || "[]"
    );

  const project =
    projects.find(p => p.id === projectId);

  if (!project) {
    alert("Project not found.");
    return;
  }

  /* >>> GUARANTEE ACTIVE MAP <<< */
  if (
    !project.editor ||
    !project.editor.activeMapId ||
    !project.maps.find(
      m => m.id === project.editor.activeMapId
    )
  ) {
    project.editor = {
      activeMapId: project.maps[0].id
    };
  }

  localStorage.setItem(
    "rpgdream_active_project",
    JSON.stringify(project)
  );

  window.location.href = "../editor/index.html";
}
