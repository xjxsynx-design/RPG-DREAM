// manager/newProject.js
// Finalizes project creation and redirects directly to editor

export function createNewProject({ name, gridSize, viewMode }) {
  const active = {
    id: Date.now(),
    name,
    data: {
      editor: {
        viewMode: viewMode || 'top',
        camera: { x: 0, y: 0, zoom: 1 },
        grid: { size: gridSize || 32 }
      },
      layers: {
        tiles: [],
        regions: [],
        objects: []
      }
    }
  };

  localStorage.setItem('rpgdream_active_project', JSON.stringify(active));
  window.location.href = '/editor/index.html';
}
