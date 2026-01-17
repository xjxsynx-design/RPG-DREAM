// engine/render/renderer.js
import { editorState } from '../editorState.js';

export function render(ctx, canvas) {
  const { projection, camera, grid } = editorState;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  projection.beginFrame(ctx, canvas, camera);
  projection.drawGrid(ctx, grid, camera);
  projection.endFrame(ctx);
}
