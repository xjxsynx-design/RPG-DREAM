// editor/main.js
import { editorState, setViewMode } from '../engine/editorState.js';
import { render } from '../engine/render/renderer.js';
import { saveProject, loadProject } from '../engine/persistence.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight - 100;
}
window.addEventListener('resize', resize);
resize();

loadProject();

function loop(){
  render(ctx, canvas);
  requestAnimationFrame(loop);
}
loop();

window.setViewTop = ()=>{ setViewMode('top'); saveProject(); };
window.setViewAngular = ()=>{ setViewMode('angular'); saveProject(); };
window.saveNow = saveProject;
