// engine/persistence.js
import { editorState, setViewMode } from './editorState.js';

export function saveProject() {
  const active = JSON.parse(localStorage.getItem('rpgdream_active_project') || '{}');
  active.data = active.data || {};
  active.data.editor = active.data.editor || {};

  active.data.editor.viewMode = editorState.viewMode;
  active.data.editor.camera = editorState.camera;
  active.data.editor.grid = editorState.grid;

  localStorage.setItem('rpgdream_active_project', JSON.stringify(active));
}

export function loadProject() {
  const active = JSON.parse(localStorage.getItem('rpgdream_active_project') || '{}');

  const view = active?.data?.editor?.viewMode;
  if (view) setViewMode(view);

  if (active?.data?.editor?.camera)
    Object.assign(editorState.camera, active.data.editor.camera);

  if (active?.data?.editor?.grid)
    Object.assign(editorState.grid, active.data.editor.grid);
}
