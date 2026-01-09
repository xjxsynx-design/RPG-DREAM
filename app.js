/* RPG DREAM — E1 Tile Painting (Fix)
   - Erase works (proper redraw)
   - Palette shows active selection
   - Paint by tap OR drag (touch-friendly)
*/

const TILE_COLORS = {
  grass: "#4caf50",
  dirt: "#8b5a2b",
  water: "#2196f3"
};

const EngineState = {
  mode: "terrain",
  activeMapId: null,
  activeTile: "grass",
  maps: [] // {id,name,w,h,tiles:{}}
};

const VIEW = { tileSize: 40 };

let isPainting = false;

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  load();
  // Ensure at least one map if none exists (optional convenience)
  render();
  resize();
  draw();
});

function bindUI(){
  // Mode buttons
  document.querySelectorAll("[data-mode]").forEach(b=>{
    b.addEventListener("click", ()=>{
      EngineState.mode = b.dataset.mode;
      render();
      draw();
    });
  });

  // Palette buttons
  document.querySelectorAll("[data-tile]").forEach(b=>{
    b.addEventListener("click", ()=>{
      EngineState.activeTile = b.dataset.tile;
      renderPaletteActive();
      renderDebug();
    });
  });

  document.getElementById("addMap").addEventListener("click", addMap);
  window.addEventListener("resize", ()=>{ resize(); draw(); });

  const vp = document.getElementById("mapViewport");

  // Tap + drag painting using pointer events
  vp.addEventListener("pointerdown", (e)=>{
    if(EngineState.mode!=="terrain") return;
    isPainting = true;
    vp.setPointerCapture(e.pointerId);
    paintAtEvent(e);
  });

  vp.addEventListener("pointermove", (e)=>{
    if(!isPainting) return;
    paintAtEvent(e);
  });

  vp.addEventListener("pointerup", (e)=>{
    isPainting = false;
    try{ vp.releasePointerCapture(e.pointerId); }catch(_){}
  });

  vp.addEventListener("pointercancel", ()=>{ isPainting = false; });
}

function addMap(){
  const id = "map_"+Date.now().toString(36);
  EngineState.maps.push({ id, name:"New Map", w:50, h:50, tiles:{} });
  EngineState.activeMapId = id;
  save();
  render();
  draw();
}

function activeMap(){
  return EngineState.maps.find(m=>m.id===EngineState.activeMapId) || null;
}

function paintAtEvent(e){
  const map = activeMap();
  if(!map) return;

  const vp = document.getElementById("mapViewport");
  const rect = vp.getBoundingClientRect();

  const x = Math.floor((e.clientX-rect.left)/VIEW.tileSize);
  const y = Math.floor((e.clientY-rect.top)/VIEW.tileSize);

  // outside viewport tile grid
  if(x < 0 || y < 0) return;

  const key = x+","+y;

  if(EngineState.activeTile==="erase") {
    if(map.tiles[key] !== undefined) delete map.tiles[key];
  } else {
    map.tiles[key] = EngineState.activeTile;
  }

  save();
  draw();
  renderDebug();
}

function resize(){
  const c = document.getElementById("mapCanvas");
  const vp = document.getElementById("mapViewport");
  const dpr = Math.max(1, window.devicePixelRatio||1);

  const w = Math.max(1, vp.clientWidth);
  const h = Math.max(1, vp.clientHeight);

  c.width = Math.floor(w*dpr);
  c.height = Math.floor(h*dpr);
  c.style.width = w+"px";
  c.style.height = h+"px";

  const ctx = c.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function draw(){
  const c = document.getElementById("mapCanvas");
  const ctx = c.getContext("2d");
  const map = activeMap();

  const vp = document.getElementById("mapViewport");
  const w = vp.clientWidth;
  const h = vp.clientHeight;

  // Clear full viewport each draw so erase is always visible
  ctx.clearRect(0,0,w,h);

  // Background
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0,0,w,h);

  if(!map) {
    // No map - draw grid anyway lightly for feedback
    ctx.strokeStyle="rgba(255,255,255,0.06)";
    for(let x=0;x<=w;x+=VIEW.tileSize){
      ctx.beginPath(); ctx.moveTo(x+0.5,0); ctx.lineTo(x+0.5,h); ctx.stroke();
    }
    for(let y=0;y<=h;y+=VIEW.tileSize){
      ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(w,y+0.5); ctx.stroke();
    }
    return;
  }

  // Tiles first (so grid overlays)
  for(const [k,t] of Object.entries(map.tiles)){
    const [x,y] = k.split(",").map(Number);
    const color = TILE_COLORS[t];
    if(!color) continue;
    ctx.fillStyle = color;
    ctx.fillRect(x*VIEW.tileSize, y*VIEW.tileSize, VIEW.tileSize, VIEW.tileSize);
  }

  // Grid overlay
  ctx.strokeStyle="rgba(255,255,255,0.12)";
  for(let x=0;x<=w;x+=VIEW.tileSize){
    ctx.beginPath(); ctx.moveTo(x+0.5,0); ctx.lineTo(x+0.5,h); ctx.stroke();
  }
  for(let y=0;y<=h;y+=VIEW.tileSize){
    ctx.beginPath(); ctx.moveTo(0,y+0.5); ctx.lineTo(w,y+0.5); ctx.stroke();
  }

  // Title label
  ctx.fillStyle="rgba(169,176,192,0.9)";
  ctx.font="12px system-ui, -apple-system, sans-serif";
  ctx.fillText(map.name + " • " + map.w + "×" + map.h, 10, 18);
}

function render(){
  // Mode active state
  document.querySelectorAll("[data-mode]").forEach(b=>{
    b.classList.toggle("active", b.dataset.mode === EngineState.mode);
  });

  // Map list
  const ml = document.getElementById("mapList");
  ml.innerHTML="";
  EngineState.maps.forEach(m=>{
    const d=document.createElement("div");
    d.className="map-item"+(m.id===EngineState.activeMapId?" active":"");
    d.textContent=m.name;
    d.addEventListener("click", ()=>{
      EngineState.activeMapId=m.id;
      save();
      render();
      draw();
    });
    ml.appendChild(d);
  });

  renderPaletteActive();
  renderDebug();
}

function renderPaletteActive(){
  document.querySelectorAll("[data-tile]").forEach(b=>{
    b.classList.toggle("active", b.dataset.tile === EngineState.activeTile);
  });
}

function renderDebug(){
  document.getElementById("debug").textContent=JSON.stringify(EngineState,null,2);
}

function save(){
  localStorage.setItem("RPG_DREAM_E1", JSON.stringify(EngineState));
}

function load(){
  const d = localStorage.getItem("RPG_DREAM_E1");
  if(!d) return;
  const parsed = JSON.parse(d);

  // Defensive merge
  EngineState.mode = parsed.mode || "terrain";
  EngineState.activeMapId = parsed.activeMapId || null;
  EngineState.activeTile = parsed.activeTile || "grass";
  EngineState.maps = Array.isArray(parsed.maps) ? parsed.maps : [];

  // Ensure tile objects exist
  EngineState.maps.forEach(m=>{
    if(!m.tiles || typeof m.tiles !== "object") m.tiles = {};
    if(!m.w) m.w = 50;
    if(!m.h) m.h = 50;
    if(!m.name) m.name = "Map";
  });
}
