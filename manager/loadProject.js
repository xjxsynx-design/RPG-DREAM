// manager/loadProject.js
// Ensures editor viewMode persists when loading from Manager

export function loadProjectToEditor(project) {
  const active = {
    id: project.id,
    name: project.name,
    data: {
      ...project.data,
      editor: {
        ...(project.data?.editor || {}),
        viewMode: project.data?.editor?.viewMode || project.data?.view || 'top'
      }
    }
  };

  localStorage.setItem('rpgdream_active_project', JSON.stringify(active));
  window.location.href = '/editor/index.html';
}
