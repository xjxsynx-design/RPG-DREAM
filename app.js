// E2.1 — Restore Mode bar without changing core biome paint logic

const BIOMES = {
  grassland: { tiles: ["grass","dirt","water","erase"] },
  desert: { tiles: ["sand","rock","water","erase"] },
  snow: { tiles: ["snow","ice","water","erase"] },
  volcanic: { tiles: ["lava","basalt","ash","erase"] },
  wetlands: { tiles: ["mud","grass","water","erase"] }
};

const TILE_COLORS = {
  grass:"#4caf50",
  dirt:"#8b5a2b",
  water:"#2196f3",
  sand:"#d2b48c",
  rock:"#777",
  snow:"#e0f2ff",
  ice:"#9fd3ff",
  lava:"#ff5722",
  basalt:"#444",
  ash:"#666",
  mud:"#5a4a3a"
};

const VIEW={tileSize:40};

const EngineState={
  mode:"terrain",
  activeBiome:"grassland",
  activeTile:"grass",
  maps:[],
  activeMapId:null,
  characters:[]
};

let painting=false;

document.addEventListener("DOMContentLoaded",()=>{
  bindUI();
  load();

  if(!EngineState.maps.length) addMap();
  if(!EngineState.activeMapId) EngineState.activeMapId = EngineState.maps[0].id;

  // Ensure active tile exists in current biome
  ensureTileValidForBiome();

  rebuildPalette();
  render();
  resize(); draw();
});

function bindUI(){
  // Mode switching
  document.querySelectorAll("[data-mode]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      EngineState.mode = btn.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("active", x===btn));
      renderModeUI();
      renderDebug();
    });
  });

  // Biomes
  document.querySelectorAll("[data-biome]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      EngineState.activeBiome = btn.dataset.biome;
      document.querySelectorAll("[data-biome]").forEach(x=>x.classList.toggle("active", x===btn));
      ensureTileValidForBiome();
      rebuildPalette();
      renderDebug();
    });
  });

  document.getElementById("addMap").addEventListener("click", ()=>{
    addMap();
    render();
    draw();
  });

  // Character stub
  document.getElementById("addChar").addEventListener("click", ()=>{
    EngineState.characters.push({ id:"char_"+Date.now().toString(36), name:"New Character" });
    save();
    renderCharactersList();
    renderDebug();
  });

  // Paint input (only in terrain mode)
  const vp=document.getElementById("mapViewport");
  vp.addEventListener("pointerdown", e=>{
    if(EngineState.mode!=="terrain") return;
    painting=true;
    vp.setPointerCapture(e.pointerId);
    paint(e);
  });
  vp.addEventListener("pointermove", e=>{ if(painting) paint(e); });
  vp.addEventListener("pointerup", ()=> painting=false);
  vp.addEventListener("pointercancel", ()=> painting=false);

  window.addEventListener("resize", ()=>{ resize(); draw(); });
}

function renderModeUI(){
  const terrainUI = document.getElementById("terrainUI");
  const charactersUI = document.getElementById("charactersUI");
  const collisionUI = document.getElementById("collisionUI");

  terrainUI.classList.toggle("hidden", EngineState.mode!=="terrain");
  charactersUI.classList.toggle("hidden", EngineState.mode!=="characters");
  collisionUI.classList.toggle("hidden", EngineState.mode!=="collision");

  const hint = document.getElementById("hint");
  if(EngineState.mode==="terrain") hint.textContent = "Terrain mode: select biome → paint tiles";
  if(EngineState.mode==="characters") hint.textContent = "Characters mode: (stub) will be expanded next";
  if(EngineState.mode==="collision") hint.textContent = "Collision mode: returns with Layers (E3)";
}

function ensureTileValidForBiome(){
  const allowed = BIOMES[EngineState.activeBiome].tiles;
  if(!allowed.includes(EngineState.activeTile)){
    // Pick first non-erase as default
    EngineState.activeTile = allowed.find(t=>t!=="erase") || allowed[0];
  }
}

function rebuildPalette(){
  const pal=document.getElementById("palette");
  pal.innerHTML="";
  const tiles=BIOMES[EngineState.activeBiome].tiles;

  tiles.forEach(t=>{
    const b=document.createElement("button");
    b.className="tile-btn"+(t===EngineState.activeTile?" active":"");
    b.textContent=t;
    b.addEventListener("click", ()=>{
      EngineState.activeTile=t;
      rebuildPalette();
      renderDebug();
    });
    pal.appendChild(b);
  });
}

function addMap(){
  const id="map_"+Date.now().toString(36);
  EngineState.maps.push({id,name:"New Map",w:50,h:50,tiles:{}});
  EngineState.activeMapId=id;
  save();
}

function activeMap(){ return EngineState.maps.find(m=>m.id===EngineState.activeMapId) || null; }

function paint(e){
  const map=activeMap(); if(!map) return;
  const r=e.currentTarget.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/VIEW.tileSize);
  const y=Math.floor((e.clientY-r.top)/VIEW.tileSize);
  if(x<0||y<0) return;

  const k=x+","+y;
  if(EngineState.activeTile==="erase") delete map.tiles[k];
  else map.tiles[k]=EngineState.activeTile;

  save();
  draw();
  renderDebug();
}

function resize(){
  const c=document.getElementById("mapCanvas"), vp=document.getElementById("mapViewport");
  const dpr=window.devicePixelRatio||1;
  c.width = Math.floor(vp.clientWidth*dpr);
  c.height = Math.floor(vp.clientHeight*dpr);
  c.style.width = vp.clientWidth+"px";
  c.style.height = vp.clientHeight+"px";
  c.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
}

function draw(){
  const c=document.getElementById("mapCanvas"), ctx=c.getContext("2d");
  const vp=document.getElementById("mapViewport");
  const w=vp.clientWidth, h=vp.clientHeight;
  ctx.clearRect(0,0,w,h);

  // background
  ctx.fillStyle="#0b0e14";
  ctx.fillRect(0,0,w,h);

  const map=activeMap(); if(!map){ grid(w,h,ctx); return; }

  // tiles
  for(const [k,t] of Object.entries(map.tiles)){
    const [x,y]=k.split(",").map(Number);
    ctx.fillStyle = TILE_COLORS[t] || "#000";
    ctx.fillRect(x*VIEW.tileSize, y*VIEW.tileSize, VIEW.tileSize, VIEW.tileSize);
  }

  // grid overlay
  grid(w,h,ctx);
}

function grid(w,h,ctx){
  ctx.strokeStyle="rgba(255,255,255,.15)";
  for(let x=0;x<=w;x+=VIEW.tileSize){
    ctx.beginPath(); ctx.moveTo(x+.5,0); ctx.lineTo(x+.5,h); ctx.stroke();
  }
  for(let y=0;y<=h;y+=VIEW.tileSize){
    ctx.beginPath(); ctx.moveTo(0,y+.5); ctx.lineTo(w,y+.5); ctx.stroke();
  }
}

function render(){
  // maps list
  const ml=document.getElementById("mapList"); ml.innerHTML="";
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

  renderModeUI();
  renderCharactersList();
  renderDebug();
}

function renderCharactersList(){
  const cl=document.getElementById("charList");
  if(!cl) return;
  cl.innerHTML="";
  EngineState.characters.forEach(ch=>{
    const d=document.createElement("div");
    d.className="map-item";
    d.textContent=ch.name;
    cl.appendChild(d);
  });
}

function renderDebug(){
  document.getElementById("debug").textContent = JSON.stringify(EngineState,null,2);
}

function save(){ localStorage.setItem("RPG_DREAM_E2", JSON.stringify(EngineState)); }
function load(){
  const d=localStorage.getItem("RPG_DREAM_E2");
  if(!d) return;
  const parsed=JSON.parse(d);

  // Merge defensively
  EngineState.mode = parsed.mode || "terrain";
  EngineState.activeBiome = parsed.activeBiome || "grassland";
  EngineState.activeTile = parsed.activeTile || "grass";
  EngineState.activeMapId = parsed.activeMapId || null;
  EngineState.maps = Array.isArray(parsed.maps) ? parsed.maps : [];
  EngineState.characters = Array.isArray(parsed.characters) ? parsed.characters : [];

  // Ensure map shape
  EngineState.maps.forEach(m=>{
    if(!m.tiles || typeof m.tiles!=="object") m.tiles = {};
    if(!m.w) m.w=50; if(!m.h) m.h=50;
    if(!m.name) m.name="Map";
  });
}
