// engine/render/projections/topDown.js
export const TopDownProjection = {
  beginFrame(ctx, canvas, camera){
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-canvas.width/2 - camera.x, -canvas.height/2 - camera.y);
  },

  drawGrid(ctx, grid, camera){
    const step = grid.size;
    ctx.strokeStyle = '#3a2b7a';
    for(let x=-2000;x<2000;x+=step){
      ctx.beginPath();
      ctx.moveTo(x,-2000);
      ctx.lineTo(x,2000);
      ctx.stroke();
    }
    for(let y=-2000;y<2000;y+=step){
      ctx.beginPath();
      ctx.moveTo(-2000,y);
      ctx.lineTo(2000,y);
      ctx.stroke();
    }
  },

  endFrame(ctx){}
};
