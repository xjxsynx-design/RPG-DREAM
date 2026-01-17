// editor/main.js
import { editorState, setViewMode } from '../engine/editorState.js';
import { render } from '../engine/render/renderer.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 120;
}
window.addEventListener('resize', resize);
resize();

// Restore view mode from project if present
const active = JSON.parse(localStorage.getItem('rpgdream_active_project')||'null');
if(active?.data?.view){
  setViewMode(active.data.view);
}

// Simple loop
function loop(){
  render(ctx, canvas);
  requestAnimationFrame(loop);
}
loop();

// Expose switch for UI (temporary)
window.setViewTop = ()=>setViewMode('top');
window.setViewAngular = ()=>setViewMode('angular');
