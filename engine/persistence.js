// engine/persistence.js
import { editorState, setViewMode } from './editorState.js';

export function saveProject() {
  const active = JSON.parse(localStorage.getItem('rpgdream_active_project') || '{}');
  active.data = active.data || {};
  active.data.view = editorState.viewMode;
  active.data.camera = editorState.camera;
  active.data.grid = editorState.grid;
  localStorage.setItem('rpgdream_active_project', JSON.stringify(active));
}

export function loadProject() {
  const active = JSON.parse(localStorage.getItem('rpgdream_active_project') || '{}');
  if (active?.data?.view) setViewMode(active.data.view);
  if (active?.data?.camera) Object.assign(editorState.camera, active.data.camera);
  if (active?.data?.grid) Object.assign(editorState.grid, active.data.grid);
}
