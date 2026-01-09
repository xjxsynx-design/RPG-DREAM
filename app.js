// RPG DREAM — E3.2 Collision & Anchor Finalize (Option A: grid-snapped collision)
// Touch-first, engine-first. No sprites yet; placeholders only.

const TILE = 40;
const STORE_KEY = "RPG_DREAM_E3_2";
const MIGRATE_KEYS = [
  "RPG_DREAM_E3_1_1",
  "RPG_DREAM_E3_1",
  "RPG_DREAM_E3",
  "RPG_DREAM_E2_1",
  "RPG_DREAM_E2",
  "RPG_DREAM_E1"
];

const State = {
  mode: "terrain",
  maps: [],
  activeMapId: null,
  characters: [],
  activeCharId: null,

  // collision painting
  painting: false,
  paintValue: true,

  // collision/anchor editor drag state
  caDrag: null
};

const $ = (id)=>document.getElementById(id);

document.addEventListener("DOMContentLoaded", ()=>{
  migrateLoad();
  if(!State.maps.length) addMap();
  if(!State.activeMapId) State.activeMapId = State.maps[0].id;

  bindUI();
  renderAll();
  resizeAll();
  drawAll();

  window.addEventListener("resize", ()=>{ resizeAll(); drawAll(); });
});

function bindUI(){
  document.querySelectorAll("[data-mode]").forEach(btn=>{
    btn.addEventListener("click", ()=> setMode(btn.dataset.mode));
  });

  $("addMap").addEventListener("click", ()=>{
    addMap(); renderMaps(); drawAll(); renderDebug();
  });

  $("addChar").addEventListener("click", ()=>{
    addCharacter(); renderCharacters(); renderCAHeader(); renderDebug();
  });

  $("renameChar").addEventListener("click", ()=>{
    const ch = activeCharacter(); if(!ch) return;
    const name = prompt("Character name:", ch.name || "Character");
    if(name && name.trim()){
      ch.name = name.trim();
      save(); renderCharacters(); renderCAHeader(); renderDebug(); drawAll();
    }
  });

  $("caDone").addEventListener("click", ()=>{
    // HARD DONE: persist + exit to Characters mode, keep selection
    ensureCharDefaults();
    save();
    setMode("characters");
  });

  // Map interactions
  const vp = $("mapViewport");
  vp.addEventListener("pointerdown", (e)=>{
    if(State.mode === "collision"){
      State.painting = true;
      vp.setPointerCapture(e.pointerId);
      const map = activeMap(); if(!map) return;
      const {x,y} = pointerToGrid(e, vp);
      const k = `${x},${y}`;
      State.paintValue = !Boolean(map.collision[k]); // start toggle: if filled => erase drag; else paint drag
      applyCollisionAt(e);
    } else if(State.mode === "characters"){
      placeCharacterAt(e);
    }
  });
  vp.addEventListener("pointermove", (e)=>{
    if(State.mode === "collision" && State.painting) applyCollisionAt(e);
  });
  vp.addEventListener("pointerup", ()=>{ State.painting=false; });
  vp.addEventListener("pointercancel", ()=>{ State.painting=false; });

  // Collision & Anchor editor interactions
  const caVp = $("caViewport");
  caVp.addEventListener("pointerdown", caPointerDown);
  caVp.addEventListener("pointermove", caPointerMove);
  caVp.addEventListener("pointerup", caPointerUp);
  caVp.addEventListener("pointercancel", caPointerUp);
}

// ---------- Mode + Panels ----------
function setMode(mode){
  State.mode = mode;
  document.querySelectorAll("[data-mode]").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  renderPanels();
  drawAll();
  renderDebug();
  save();
}

function renderPanels(){
  $("charactersUI").classList.toggle("hidden", State.mode !== "characters");
  $("charCollisionUI").classList.toggle("hidden", State.mode !== "charCollision");

  const hint = $("hint");
  if(State.mode==="terrain") hint.textContent="Terrain: visual only (engine-first).";
  if(State.mode==="collision") hint.textContent="Collision: tap/drag to paint or erase blocked tiles.";
  if(State.mode==="characters") hint.textContent="Characters: add/select, then tap map to place.";
  if(State.mode==="charCollision") hint.textContent="Collision & Anchor: edit selected character template.";

  renderCAHeader();
}

function renderAll(){
  renderPanels();
  renderMaps();
  renderCharacters();
  renderCAHeader();
  renderDebug();
}

// ---------- Lists ----------
function renderMaps(){
  const ml = $("mapList");
  ml.innerHTML = "";
  State.maps.forEach(m=>{
    const d = document.createElement("div");
    d.className = "map-item" + (m.id === State.activeMapId ? " active" : "");
    d.textContent = m.name || "Map";
    d.addEventListener("click", ()=>{
      State.activeMapId = m.id;
      save(); renderMaps(); drawAll(); renderDebug();
    });
    ml.appendChild(d);
  });
}

function renderCharacters(){
  const cl = $("charList");
  cl.innerHTML = "";
  State.characters.forEach(ch=>{
    const d = document.createElement("div");
    d.className = "char-item" + (ch.id === State.activeCharId ? " active" : "");
    d.textContent = ch.name || "Character";
    d.addEventListener("click", ()=>{
      State.activeCharId = ch.id;
      ensureCharDefaults();
      save();
      renderCharacters();
      renderCAHeader();
      drawAll();
      drawCA();
      renderDebug();
    });
    cl.appendChild(d);
  });
}

function renderCAHeader(){
  const ch = activeCharacter();
  $("caCharName").textContent = ch ? `Editing: ${ch.name}` : "No character selected";
}

// ---------- Data ----------
function addMap(){
  const id = "map_" + Date.now().toString(36);
  State.maps.push({ id, name:"New Map", w:50, h:50, tiles:{}, collision:{}, entities:[] });
  State.activeMapId = id;
  save();
}

function addCharacter(){
  const id = "char_" + Date.now().toString(36);
  State.characters.push({
    id,
    name: `Character ${State.characters.length}`,
    // Option A: collision box in whole TILE units (grid snapped)
    collision: { x:0, y:0, w:1, h:1 },
    // Anchor normalized within the base tile (0..1)
    anchor: { x:0.5, y:1.0 }
  });
  State.activeCharId = id;
  save();
}

function activeMap(){
  return State.maps.find(m=>m.id===State.activeMapId) || null;
}
function activeCharacter(){
  return State.characters.find(c=>c.id===State.activeCharId) || null;
}

function ensureCharDefaults(){
  const ch = activeCharacter();
  if(!ch) return;
  if(!ch.collision) ch.collision = { x:0, y:0, w:1, h:1 };
  if(!ch.anchor) ch.anchor = { x:0.5, y:1.0 };

  // sanitize
  ch.collision.x = Math.max(0, Math.round(ch.collision.x||0));
  ch.collision.y = Math.max(0, Math.round(ch.collision.y||0));
  ch.collision.w = Math.max(1, Math.round(ch.collision.w||1));
  ch.collision.h = Math.max(1, Math.round(ch.collision.h||1));

  ch.anchor.x = clamp(Number(ch.anchor.x ?? 0.5), 0, 1);
  ch.anchor.y = clamp(Number(ch.anchor.y ?? 1.0), 0, 1);
}

// ---------- Collision painting ----------
function applyCollisionAt(e){
  const map = activeMap(); if(!map) return;
  const vp = $("mapViewport");
  const {x,y} = pointerToGrid(e, vp);
  if(x<0||y<0) return;
  const k = `${x},${y}`;
  if(State.paintValue){
    map.collision[k] = true;
  } else {
    delete map.collision[k];
  }
  save();
  drawAll();
  renderDebug();
}

// ---------- Character placement ----------
function placeCharacterAt(e){
  const map = activeMap(); if(!map) return;
  const ch = activeCharacter();
  if(!ch){ alert("Add/select a character first."); return; }
  const vp = $("mapViewport");
  const {x,y} = pointerToGrid(e, vp);
  if(x<0||y<0) return;
  const k = `${x},${y}`;
  if(map.collision[k]) return; // blocked tile
  map.entities.push({ id:"ent_"+Date.now().toString(36), charId: ch.id, x, y });
  save();
  drawAll();
  renderDebug();
}

// ---------- Canvas sizing ----------
function resizeAll(){
  resizeCanvas($("mapCanvas"), $("mapViewport"));
  resizeCanvas($("caCanvas"), $("caViewport"));
}
function resizeCanvas(canvas, viewport){
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.clientWidth * dpr);
  canvas.height = Math.floor(viewport.clientHeight * dpr);
  canvas.style.width = viewport.clientWidth + "px";
  canvas.style.height = viewport.clientHeight + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

// ---------- Drawing ----------
function drawAll(){
  drawMap();
  if(State.mode==="charCollision") drawCA();
}

function drawMap(){
  const canvas = $("mapCanvas");
  const ctx = canvas.getContext("2d");
  const vp = $("mapViewport");
  const w = vp.clientWidth, h = vp.clientHeight;

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0,0,w,h);

  // grid
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  for(let x=0;x<=w;x+=TILE){ ctx.beginPath(); ctx.moveTo(x+.5,0); ctx.lineTo(x+.5,h); ctx.stroke(); }
  for(let y=0;y<=h;y+=TILE){ ctx.beginPath(); ctx.moveTo(0,y+.5); ctx.lineTo(w,y+.5); ctx.stroke(); }

  const map = activeMap(); if(!map) return;

  // collision overlay
  ctx.fillStyle = "rgba(255,0,0,.28)";
  for(const k of Object.keys(map.collision||{})){
    const [x,y] = k.split(",").map(Number);
    ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
  }

  // entities
  for(const ent of (map.entities||[])){
    const ch = State.characters.find(c=>c.id===ent.charId);
    const px = ent.x*TILE;
    const py = ent.y*TILE;

    // placeholder body
    ctx.fillStyle = "#4da6ff";
    ctx.globalAlpha = 0.95;
    ctx.fillRect(px+8, py+6, TILE-16, TILE-12);
    ctx.globalAlpha = 1;

    if(ch){
      ensureCharDefaultsFor(ch);

      // collision box (green) in tile units from placement tile
      const cb = ch.collision;
      ctx.strokeStyle = "rgba(86,211,100,.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(px + cb.x*TILE, py + cb.y*TILE, cb.w*TILE, cb.h*TILE);

      // anchor (red dot) normalized within base tile
      const an = ch.anchor;
      ctx.fillStyle = "rgba(255,90,90,.95)";
      ctx.beginPath();
      ctx.arc(px + an.x*TILE, py + an.y*TILE, 4, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

// helper to avoid mutating when drawing
function ensureCharDefaultsFor(ch){
  if(!ch.collision) ch.collision = {x:0,y:0,w:1,h:1};
  if(!ch.anchor) ch.anchor = {x:0.5,y:1.0};
  ch.collision.x = Math.max(0, Math.round(ch.collision.x||0));
  ch.collision.y = Math.max(0, Math.round(ch.collision.y||0));
  ch.collision.w = Math.max(1, Math.round(ch.collision.w||1));
  ch.collision.h = Math.max(1, Math.round(ch.collision.h||1));
  ch.anchor.x = clamp(Number(ch.anchor.x ?? 0.5),0,1);
  ch.anchor.y = clamp(Number(ch.anchor.y ?? 1.0),0,1);
}


// --- E3.2.1 VISUAL FIX ---
// Force CA grid origin to remain inside visible canvas on iOS Safari
// (no logic/data changes)

// ---------- Collision & Anchor editor ----------
// We show a 4x4 tile preview grid. Collision box is snapped to whole tiles.
function caView(){
  const vp = $("caViewport");
  const w = vp.clientWidth, h = vp.clientHeight;
  const tilesWide = 4, tilesHigh = 4;
  const cell = Math.floor(Math.min((w-24)/tilesWide, (h-24)/tilesHigh));
  const viewW = cell*tilesWide, viewH = cell*tilesHigh;
  const ox = Math.floor((w - viewW)/2);
  const oy = Math.floor((h - viewH)/2);
  // origin tile (0,0) for template placement inside this view: use tile (1,1) as "base tile"
  const baseTx = 1, baseTy = 1;
  const baseX = ox + baseTx*cell;
  const baseY = oy + baseTy*cell;
  return {w,h,cell,ox,oy,tilesWide,tilesHigh,baseX,baseY,baseTx,baseTy};
}

function drawCA(){
  const canvas = $("caCanvas");
  const ctx = canvas.getContext("2d");
  const vp = $("caViewport");
  const w = vp.clientWidth, h = vp.clientHeight;

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0,0,w,h);

  const V = caView();

  // grid
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  for(let i=0;i<=V.tilesWide;i++){
    const x = V.ox + i*V.cell;
    ctx.beginPath(); ctx.moveTo(x+.5, V.oy); ctx.lineTo(x+.5, V.oy+V.cell*V.tilesHigh); ctx.stroke();
  }
  for(let j=0;j<=V.tilesHigh;j++){
    const y = V.oy + j*V.cell;
    ctx.beginPath(); ctx.moveTo(V.ox, y+.5); ctx.lineTo(V.ox+V.cell*V.tilesWide, y+.5); ctx.stroke();
  }

  // base tile highlight
  ctx.fillStyle = "rgba(77,166,255,.12)";
  ctx.fillRect(V.baseX, V.baseY, V.cell, V.cell);

  const ch = activeCharacter();
  if(!ch){
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "14px system-ui";
    ctx.fillText("Select a character in Characters mode.", 12, 20);
    return;
  }
  ensureCharDefaults();

  // placeholder body in base tile
  ctx.fillStyle = "rgba(77,166,255,.35)";
  ctx.fillRect(V.baseX + V.cell*0.2, V.baseY + V.cell*0.15, V.cell*0.6, V.cell*0.7);

  // collision box (snapped tiles)
  const cb = ch.collision;
  const cbX = V.baseX + cb.x*V.cell;
  const cbY = V.baseY + cb.y*V.cell;
  const cbW = cb.w*V.cell;
  const cbH = cb.h*V.cell;

  ctx.strokeStyle = "rgba(86,211,100,.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(cbX, cbY, cbW, cbH);

  // draw corner handles
  const hs = Math.max(10, Math.floor(V.cell*0.18));
  ctx.fillStyle = "rgba(86,211,100,.95)";
  drawHandle(ctx, cbX, cbY, hs);
  drawHandle(ctx, cbX+cbW, cbY, hs);
  drawHandle(ctx, cbX, cbY+cbH, hs);
  drawHandle(ctx, cbX+cbW, cbY+cbH, hs);

  // anchor dot normalized within base tile
  const an = ch.anchor;
  const ax = V.baseX + an.x*V.cell;
  const ay = V.baseY + an.y*V.cell;
  ctx.fillStyle = "rgba(255,90,90,.95)";
  ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI*2); ctx.fill();
}

function drawHandle(ctx, x, y, s){
  ctx.beginPath();
  ctx.rect(x - s/2, y - s/2, s, s);
  ctx.fill();
}

function caPointerDown(e){
  if(State.mode !== "charCollision") return;
  const ch = activeCharacter();
  if(!ch){ alert("Select a character first."); return; }
  ensureCharDefaults();

  const vp = $("caViewport");
  vp.setPointerCapture(e.pointerId);

  const V = caView();
  const p = pointerPos(e, vp);

  const cb = ch.collision;
  const cbX = V.baseX + cb.x*V.cell;
  const cbY = V.baseY + cb.y*V.cell;
  const cbW = cb.w*V.cell;
  const cbH = cb.h*V.cell;

  const an = ch.anchor;
  const ax = V.baseX + an.x*V.cell;
  const ay = V.baseY + an.y*V.cell;

  // hit test anchor first
  if(dist(p.x,p.y, ax,ay) <= 14){
    State.caDrag = { type:"anchor" };
    return;
  }

  // corners
  const corners = [
    {name:"tl", x:cbX, y:cbY},
    {name:"tr", x:cbX+cbW, y:cbY},
    {name:"bl", x:cbX, y:cbY+cbH},
    {name:"br", x:cbX+cbW, y:cbY+cbH},
  ];
  for(const c of corners){
    if(dist(p.x,p.y,c.x,c.y) <= 16){
      State.caDrag = { type:"corner", corner:c.name, start:{...cb} };
      return;
    }
  }

  // inside rect => move (snapped)
  if(p.x>=cbX && p.x<=cbX+cbW && p.y>=cbY && p.y<=cbY+cbH){
    const startTile = pixelToTemplateTile(p.x, p.y, V);
    State.caDrag = {
      type:"move",
      start:{...cb},
      startTile,
      pointerStart:{x:p.x,y:p.y}
    };
    return;
  }

  State.caDrag = null;
}

function caPointerMove(e){
  if(State.mode !== "charCollision") return;
  if(!State.caDrag) return;
  const ch = activeCharacter(); if(!ch) return;

  const vp = $("caViewport");
  const V = caView();
  const p = pointerPos(e, vp);

  if(State.caDrag.type === "anchor"){
    // anchor normalized within base tile
    const nx = (p.x - V.baseX) / V.cell;
    const ny = (p.y - V.baseY) / V.cell;
    ch.anchor.x = clamp(nx, 0, 1);
    ch.anchor.y = clamp(ny, 0, 1);
    save(); drawCA(); renderDebug();
    return;
  }

  if(State.caDrag.type === "corner"){
    const start = State.caDrag.start;
    const t = pixelToTemplateTile(p.x, p.y, V); // snapped to integer tile coords relative to base tile
    // We resize by setting opposite corner fixed.
    let x=start.x, y=start.y, w=start.w, h=start.h;

    const opp = oppositeCorner(start, State.caDrag.corner);

    // new rect corners in tile space (relative to base tile)
    let left = opp.left, top = opp.top, right = opp.right, bottom = opp.bottom;

    // update dragged corner to t (in tile space)
    if(State.caDrag.corner.includes("l")) left = t.x;
    if(State.caDrag.corner.includes("r")) right = t.x;
    if(State.caDrag.corner.includes("t")) top = t.y;
    if(State.caDrag.corner.includes("b")) bottom = t.y;

    // normalize
    const nl = Math.min(left, right);
    const nr = Math.max(left, right);
    const nt = Math.min(top, bottom);
    const nb = Math.max(top, bottom);

    x = clampInt(nl, 0, 3);
    y = clampInt(nt, 0, 3);
    w = clampInt(nr - nl, 1, 4 - x);
    h = clampInt(nb - nt, 1, 4 - y);

    ch.collision = {x,y,w,h};
    save(); drawCA(); renderDebug();
    return;
  }

  if(State.caDrag.type === "move"){
    const start = State.caDrag.start;
    // compute delta in tile units, snapped
    const curTile = pixelToTemplateTile(p.x, p.y, V);
    const dx = curTile.x - State.caDrag.startTile.x;
    const dy = curTile.y - State.caDrag.startTile.y;
    const nx = clampInt(start.x + dx, 0, 3);
    const ny = clampInt(start.y + dy, 0, 3);
    // keep within 4x4 with current size
    const x = clampInt(nx, 0, 4 - start.w);
    const y = clampInt(ny, 0, 4 - start.h);
    ch.collision = {x, y, w:start.w, h:start.h};
    save(); drawCA(); renderDebug();
    return;
  }
}

function caPointerUp(){
  State.caDrag = null;
}

// tile coords relative to base tile, snapped to integer
function pixelToTemplateTile(px, py, V){
  const x = Math.round((px - V.baseX) / V.cell);
  const y = Math.round((py - V.baseY) / V.cell);
  return { x, y };
}

function oppositeCorner(cb, corner){
  // in tile space: rect covers [x, x+w] edges; same as handles
  const left = cb.x;
  const top = cb.y;
  const right = cb.x + cb.w;
  const bottom = cb.y + cb.h;

  if(corner==="tl") return {left:right, top:bottom, right:right, bottom:bottom};
  if(corner==="tr") return {left:left, top:bottom, right:left, bottom:bottom};
  if(corner==="bl") return {left:right, top:top, right:right, bottom:top};
  return {left:left, top:top, right:left, bottom:top}; // br
}

// ---------- Geometry helpers ----------
function pointerPos(e, el){
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function pointerToGrid(e, el){
  const p = pointerPos(e, el);
  return { x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) };
}
function dist(x1,y1,x2,y2){
  const dx=x1-x2, dy=y1-y2;
  return Math.sqrt(dx*dx+dy*dy);
}
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function clampInt(v,min,max){ return Math.max(min, Math.min(max, Math.round(v))); }

// ---------- Debug + Storage ----------
function renderDebug(){
  $("debug").textContent = JSON.stringify({
    mode: State.mode,
    activeMapId: State.activeMapId,
    activeCharId: State.activeCharId,
    maps: State.maps.map(m=>({
      id:m.id, name:m.name, collisionCount:Object.keys(m.collision||{}).length,
      entities:(m.entities||[]).length
    })),
    characters: State.characters.map(c=>({id:c.id,name:c.name,collision:c.collision,anchor:c.anchor}))
  }, null, 2);
}

function save(){
  localStorage.setItem(STORE_KEY, JSON.stringify(State));
}

function migrateLoad(){
  // prefer current key
  const cur = localStorage.getItem(STORE_KEY);
  if(cur){
    safeAssign(JSON.parse(cur));
    normalize();
    return;
  }
  // try older keys
  for(const k of MIGRATE_KEYS){
    const v = localStorage.getItem(k);
    if(v){
      safeAssign(JSON.parse(v));
      normalize();
      // write into new key
      save();
      return;
    }
  }
  normalize();
}

function safeAssign(obj){
  try{
    if(obj && typeof obj === "object"){
      // shallow assign only known keys
      for(const k of ["mode","maps","activeMapId","characters","activeCharId"]){
        if(k in obj) State[k] = obj[k];
      }
    }
  }catch(e){}
}

function normalize(){
  if(!Array.isArray(State.maps)) State.maps = [];
  if(!Array.isArray(State.characters)) State.characters = [];

  // normalize maps
  State.maps.forEach(m=>{
    if(!m.tiles) m.tiles = {};
    if(!m.collision) m.collision = {};
    if(!m.entities) m.entities = [];
    if(!m.w) m.w = 50;
    if(!m.h) m.h = 50;
  });

  // normalize characters
  State.characters.forEach(c=>{
    if(!c.name) c.name = "Character";
    if(!c.collision) c.collision = {x:0,y:0,w:1,h:1};
    if(!c.anchor) c.anchor = {x:0.5,y:1.0};
    c.collision.x = Math.max(0, Math.round(c.collision.x||0));
    c.collision.y = Math.max(0, Math.round(c.collision.y||0));
    c.collision.w = Math.max(1, Math.round(c.collision.w||1));
    c.collision.h = Math.max(1, Math.round(c.collision.h||1));
    c.anchor.x = clamp(Number(c.anchor.x ?? 0.5), 0, 1);
    c.anchor.y = clamp(Number(c.anchor.y ?? 1.0), 0, 1);
  });

  // ensure selection
  if(!State.activeMapId && State.maps.length) State.activeMapId = State.maps[0].id;
  if(!State.activeCharId && State.characters.length) State.activeCharId = State.characters[0].id;

  renderPanels();
}
