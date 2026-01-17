// engine/persistence.js (patched excerpt)
// Read editor.viewMode first (manager-safe)
import { editorState, setViewMode } from './editorState.js';

export function loadProject() {
  const active = JSON.parse(localStorage.getItem('rpgdream_active_project') || '{}');
  const view =
    active?.data?.editor?.viewMode ||
    active?.data?.view;

  if (view) setViewMode(view);

  if (active?.data?.camera) Object.assign(editorState.camera, active.data.camera);
  if (active?.data?.grid) Object.assign(editorState.grid, active.data.grid);
}
