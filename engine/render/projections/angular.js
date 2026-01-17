// engine/render/projections/angular.js
export const AngularProjection = {
  beginFrame(ctx, canvas, camera){
    ctx.translate(canvas.width/2, canvas.height/4);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  },

  drawGrid(ctx, grid, camera){
    const size = grid.size;
    ctx.strokeStyle = '#3a2b7a';
    const range = 40;
    for(let x=-range;x<=range;x++){
      for(let y=-range;y<=range;y++){
        const sx = (x - y) * (size/2);
        const sy = (x + y) * (size/4);
        ctx.beginPath();
        ctx.moveTo(sx, sy - size/4);
        ctx.lineTo(sx + size/2, sy);
        ctx.lineTo(sx, sy + size/4);
        ctx.lineTo(sx - size/2, sy);
        ctx.closePath();
        ctx.stroke();
      }
    }
  },

  endFrame(ctx){}
};
