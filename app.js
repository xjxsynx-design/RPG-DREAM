// 2B2_3 — Collision panel integrated with REAL character library (IndexedDB) + Done works

const TILE = 48;
const TAP_THRESHOLD = 6;

// ===== IndexedDB (same as 2B.1) =====
const DB_NAME = 'rpgwb_db';
const DB_VER = 1;
const STORE_PROJECT = 'project';
const STORE_FRAMES  = 'frames';

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(STORE_PROJECT)) db.createObjectStore(STORE_PROJECT);
      if(!db.objectStoreNames.contains(STORE_FRAMES))  db.createObjectStore(STORE_FRAMES);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(store, key){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const rq = tx.objectStore(store).get(key);
    rq.onsuccess = () => { const v = rq.result; db.close(); resolve(v); };
    rq.onerror = () => { db.close(); reject(rq.error); };
  });
}
async function idbPut(store, key, value){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// Frame -> objectURL
const blobUrlCache = new Map(); // frameKey -> objectURL
async function frameKeyToObjectURL(frameKey){
  if(!frameKey) return null;
  if(blobUrlCache.has(frameKey)) return blobUrlCache.get(frameKey);
  const blob = await idbGet(STORE_FRAMES, frameKey);
  if(!blob) return null;
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(frameKey, url);
  return url;
}

// ===== DOM refs =====
const map = document.getElementById('map');
const ctx = map.getContext('2d');

const modeBtn = document.getElementById('modeBtn');
const modeMenu = document.getElementById('modeMenu');

const palettePanel = document.getElementById('palettePanel');
const charsPanel   = document.getElementById('charsPanel');

const playtestToggle = null; // (we keep playtest via mode menu)
const hud = document.getElementById('hud');
const dpad = document.getElementById('dpad');

const collisionPanel = document.getElementById('collisionPanel');
const collisionCanvas = document.getElementById('collisionCanvas');
const cctx = collisionCanvas.getContext('2d');
const charSelect = document.getElementById('charSelect');
const doneCollision = document.getElementById('doneCollision');

// Character UI
const charsToggle = document.getElementById('charsToggle'); // may be null (mode menu handles)
const closeChars = document.getElementById('closeChars');
const addCharBtn = document.getElementById('addCharBtn');
const placeCharBtn = document.getElementById('placeCharBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const charModal = document.getElementById('charModal');
const closeModal = document.getElementById('closeModal');
const createCharBtn = document.getElementById('createChar');
const charList = document.getElementById('charList');

// Save / export
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');

// ===== Canvas resize =====
function resize(){
  const cssW = window.innerWidth;
  const cssH = window.innerHeight - 132; // topbar + dock spacing
  map.style.width = cssW + 'px';
  map.style.height = cssH + 'px';
  const dpr = window.devicePixelRatio || 1;
  map.width = Math.floor(cssW * dpr);
  map.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}
window.addEventListener('resize', resize);
resize();

// ===== World =====
const cols = 120, rows = 120;
let camX = 0, camY = 0;

const tiles = [
  { id:'grassland', name:'Grassland', color:'#4caf50', desc:'Lush grassland ground'},
  { id:'plains',    name:'Plains',    color:'#7cb342', desc:'Open plains ground'},
  { id:'desert',    name:'Desert',    color:'#d7b56d', desc:'Sandy desert ground'},
  { id:'tropical',  name:'Tropical',  color:'#2ecc71', desc:'Tropical ground'},
  { id:'wetlands',  name:'Wetlands',  color:'#5d8c6a', desc:'Wetlands / swamp ground'},
  { id:'volcanic',  name:'Volcanic',  color:'#b03a2e', desc:'Volcanic ground'}
];
let currentTile = tiles[0];
let grid = Array.from({length: rows}, () => Array.from({length: cols}, () => null));

// ===== Entities / Characters =====
let characterLibrary = []; // metadata + collision + anchor live here
let placedEntities = [];
let placeMode = false;
let selectedCharId = null;

// Playtest
let playtest = false;
let player = { charId:null, x:TILE*10+TILE/2, y:TILE*10+TILE/2, dir:'south', moving:false, frame:0, t:0 };

// Project payload
let project = null;

// ===== Defaults for collision/anchor =====
function ensureCollisionAndAnchor(c){
  if(!c.collision) c.collision = { x:12, y:28, w:24, h:16 };
  if(!c.anchor)    c.anchor    = { x:24, y:48 };
}

// ===== Load / Save project =====
async function loadProject(){
  project = await idbGet(STORE_PROJECT, 'default') || {};
  if(project.grid) grid = project.grid;
  if(typeof project.camX === 'number') camX = project.camX;
  if(typeof project.camY === 'number') camY = project.camY;
  if(project.characterLibrary) characterLibrary = project.characterLibrary;
  if(project.placedEntities) placedEntities = project.placedEntities;
  if(project.player) player = project.player;

  // Ensure at least one character exists (so collision selector is never empty)
  if(!characterLibrary.length){
    const id = 'default_char';
    const c = { id, name:'Default', fps:8, frames:{north:[],south:[],west:[],east:[]}, thumbKey:null };
    ensureCollisionAndAnchor(c);
    characterLibrary = [c];
    project.characterLibrary = characterLibrary;
    if(!player.charId) player.charId = id;
  }

  characterLibrary.forEach(ensureCollisionAndAnchor);
  selectedCharId = characterLibrary[0]?.id || null;
}
async function saveProject(){
  project = project || {};
  project.grid = grid;
  project.camX = camX; project.camY = camY;
  project.characterLibrary = characterLibrary;
  project.placedEntities = placedEntities;
  project.player = player;
  await idbPut(STORE_PROJECT, 'default', project);
}
await loadProject();

// ===== Palette UI =====
function buildPalette(){
  palettePanel.innerHTML = '';
  tiles.forEach(t => {
    const d = document.createElement('div');
    d.className = 'tile';
    d.style.width = '64px';
    d.style.height = '64px';
    d.style.borderRadius = '10px';
    d.style.border = '2px solid #333';
    d.style.background = t.color;
    d.title = `${t.name}: ${t.desc}`;
    d.onclick = () => {
      palettePanel.querySelectorAll('.tile').forEach(x => x.classList.remove('selected'));
      d.classList.add('selected');
      currentTile = t;
    };
    palettePanel.appendChild(d);
  });
  const first = palettePanel.querySelector('.tile');
  if(first){ first.classList.add('selected'); first.style.borderColor = '#4caf50'; }
}
buildPalette();

// ===== MODE menu wiring (iOS-safe) =====
function closeAllPanels(){
  stopCollisionInput();
  palettePanel.classList.add('hidden');
  charsPanel.classList.add('hidden');
  collisionPanel.classList.add('hidden');
  hud.classList.add('hidden');
}
modeBtn.addEventListener('click', (e)=>{
  // If collision canvas captured a pointer, release it so MODE always works
  stopCollisionInput();
  e.stopPropagation();
  modeMenu.classList.toggle('hidden');
});
document.addEventListener('click', ()=> modeMenu.classList.add('hidden'));

modeMenu.querySelectorAll('button').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    const m = btn.dataset.mode;
    stopCollisionInput();
    modeMenu.classList.add('hidden');

    if(m === 'terrain'){
      closeAllPanels();
      palettePanel.classList.remove('hidden');
      playtest = false; // stop playtest
      draw();
      return;
    }
    if(m === 'characters'){
      closeAllPanels();
      charsPanel.classList.remove('hidden');
      playtest = false;
      renderCharList();
      draw();
      return;
    }
    if(m === 'collision'){
      closeAllPanels();
      playtest = false;
      await openCollisionPanel();
      draw();
      return;
    }
    if(m === 'playtest'){
      closeAllPanels();
      playtest = true;
      hud.classList.remove('hidden');
      // ensure player char
      if(!player.charId && characterLibrary[0]) player.charId = characterLibrary[0].id;
      await saveProject();
      draw();
      return;
    }
  });
});

// ===== Characters panel =====
if(closeChars) closeChars.onclick = () => charsPanel.classList.add('hidden');

function countFrames(c){
  const f = c.frames || {};
  return (f.north?.length||0)+(f.south?.length||0)+(f.west?.length||0)+(f.east?.length||0);
}

async function renderCharList(){
  charList.innerHTML = '';
  for(const c of characterLibrary){
    const item = document.createElement('div');
    item.className = 'item';

    const left = document.createElement('div');
    left.className = 'itemLeft';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.alt = c.name;

    // thumb from thumbKey or first frame key
    const thumbKey = c.thumbKey || c.frames?.south?.[0] || c.frames?.north?.[0] || c.frames?.west?.[0] || c.frames?.east?.[0];
    if(thumbKey){
      const url = await frameKeyToObjectURL(thumbKey);
      if(url) img.src = url;
    }

    const text = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = c.name;
    title.style.fontWeight = '900';
    const meta = document.createElement('div');
    meta.className = 'badge';
    meta.textContent = `${c.fps||8} FPS • ${countFrames(c)} frames`;
    text.appendChild(title);
    text.appendChild(meta);

    left.appendChild(img);
    left.appendChild(text);

    const right = document.createElement('div');
    right.className = 'row';

    const selectBtn = document.createElement('button');
    selectBtn.className = 'smallBtn';
    selectBtn.textContent = (selectedCharId === c.id) ? 'Selected' : 'Select';
    selectBtn.onclick = async ()=>{
      selectedCharId = c.id;
      await saveProject();
      renderCharList();
    };

    const setPlayerBtn = document.createElement('button');
    setPlayerBtn.className = 'smallBtn';
    setPlayerBtn.textContent = (player.charId === c.id) ? 'Player ✓' : 'Set Player';
    setPlayerBtn.onclick = async ()=>{
      player.charId = c.id;
      await saveProject();
      renderCharList();
    };

    right.appendChild(selectBtn);
    right.appendChild(setPlayerBtn);

    item.appendChild(left);
    item.appendChild(right);
    charList.appendChild(item);
  }
}

// Place mode toggle
if(placeCharBtn){
  placeCharBtn.onclick = () => {
    placeMode = !placeMode;
    placeCharBtn.textContent = `Place Mode: ${placeMode ? 'On' : 'Off'}`;
    if(placeMode && !selectedCharId && characterLibrary[0]) selectedCharId = characterLibrary[0].id;
  };
}

// Add Character modal (kept from 2B.1, stored in IndexedDB frames store)
function openModal(){ modalBackdrop.classList.remove('hidden'); charModal.classList.remove('hidden'); }
function closeModalFn(){ modalBackdrop.classList.add('hidden'); charModal.classList.add('hidden'); }
if(addCharBtn) addCharBtn.onclick = openModal;
if(closeModal) closeModal.onclick = closeModalFn;
if(modalBackdrop) modalBackdrop.onclick = closeModalFn;

function cryptoRandomId(){
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return (a[0].toString(16) + a[1].toString(16)).slice(0, 12);
}

async function idbPutFrame(key, blob){
  await idbPut(STORE_FRAMES, key, blob);
}
async function storeFilesAsKeys(charId, dir, fileList){
  const files = Array.from(fileList||[]);
  const keys = [];
  for(let i=0;i<files.length;i++){
    const f = files[i];
    const key = `${charId}:${dir}:${i}:${Date.now()}`;
    await idbPutFrame(key, f);
    keys.push(key);
  }
  return keys;
}

if(createCharBtn){
  createCharBtn.onclick = async ()=>{
    const name = (document.getElementById('charName').value||'').trim();
    const fps = Math.max(1, Math.min(24, parseInt(document.getElementById('charFps').value||'8',10)));
    if(!name){ alert('Please name the character.'); return; }

    const northFiles = document.getElementById('northFiles').files;
    const southFiles = document.getElementById('southFiles').files;
    const westFiles  = document.getElementById('westFiles').files;
    const eastFiles  = document.getElementById('eastFiles').files;
    const total = (northFiles?.length||0)+(southFiles?.length||0)+(westFiles?.length||0)+(eastFiles?.length||0);
    if(total===0){ alert('Upload at least one frame.'); return; }

    createCharBtn.disabled = true;
    createCharBtn.textContent = 'Creating...';
    try{
      const charId = 'char_' + cryptoRandomId();
      const frames = {
        north: await storeFilesAsKeys(charId,'north',northFiles),
        south: await storeFilesAsKeys(charId,'south',southFiles),
        west:  await storeFilesAsKeys(charId,'west',westFiles),
        east:  await storeFilesAsKeys(charId,'east',eastFiles),
      };
      const anyKey = frames.south[0] || frames.north[0] || frames.west[0] || frames.east[0];
      ['north','south','west','east'].forEach(dir => { if(!frames[dir].length && anyKey) frames[dir]=[anyKey]; });

      const c = { id:charId, name, fps, frames, thumbKey:anyKey };
      ensureCollisionAndAnchor(c);
      characterLibrary.push(c);
      selectedCharId = charId;
      if(!player.charId) player.charId = charId;

      await saveProject();
      await renderCharList();
      closeModalFn();

      document.getElementById('charName').value='';
      document.getElementById('northFiles').value='';
      document.getElementById('southFiles').value='';
      document.getElementById('westFiles').value='';
      document.getElementById('eastFiles').value='';
    }catch(e){
      console.error(e);
      alert('Could not create character.');
    }finally{
      createCharBtn.disabled = false;
      createCharBtn.textContent = 'Create';
    }
  };
}

// ===== Terrain/Place input =====
let startX=0, startY=0, moved=false;
map.addEventListener('pointerdown', (e)=>{ startX=e.clientX; startY=e.clientY; moved=false; });
map.addEventListener('pointermove', (e)=>{
  const dx=Math.abs(e.clientX-startX), dy=Math.abs(e.clientY-startY);
  if(dx>TAP_THRESHOLD||dy>TAP_THRESHOLD){
    moved=true;
    camX += startX - e.clientX;
    camY += startY - e.clientY;
    startX=e.clientX; startY=e.clientY;
    draw();
  }
});
map.addEventListener('pointerup', async (e)=>{
  if(moved) return;
  // ignore taps if collision panel open
  if(!collisionPanel.classList.contains('hidden')) return;

  const wp = screenToWorld(e.clientX, e.clientY);

  if(placeMode && selectedCharId){
    const snapped = snapToTileCenter(wp.x, wp.y);
    placedEntities.push({ charId:selectedCharId, x:snapped.x, y:snapped.y });
    await saveProject();
    draw();
    return;
  }

  const x=Math.floor(wp.x/TILE), y=Math.floor(wp.y/TILE);
  if(x>=0&&y>=0&&x<cols&&y<rows){
    grid[y][x]=currentTile.id;
    await saveProject();
    draw();
  }
});

function screenToWorld(sx, sy){
  const canvasTop = 56;
  return { x:sx+camX, y:(sy-canvasTop)+camY };
}
function snapToTileCenter(wx, wy){
  const tx=Math.floor(wx/TILE), ty=Math.floor(wy/TILE);
  return { x:tx*TILE+TILE/2, y:ty*TILE+TILE/2 };
}

// ===== Playtest loop =====
let dpadDir=null;
dpad?.querySelectorAll('.dpad-btn')?.forEach(btn=>{
  btn.addEventListener('pointerdown', ()=>{ dpadDir=btn.dataset.dir; });
  btn.addEventListener('pointerup', ()=>{ dpadDir=null; });
  btn.addEventListener('pointercancel', ()=>{ dpadDir=null; });
});
const keys={};
window.addEventListener('keydown',(e)=>keys[e.key]=true);
window.addEventListener('keyup',(e)=>keys[e.key]=false);

function getChar(id){ return characterLibrary.find(c=>c.id===id); }
function getFrameKeys(ch, dir){
  const frames = ch?.frames?.[dir] || [];
  return frames.length ? frames : (ch?.frames?.south || []);
}
const imgCache = new Map(); // objectURL -> HTMLImageElement
function loadImage(url){
  if(imgCache.has(url)) return Promise.resolve(imgCache.get(url));
  return new Promise(res=>{
    const im=new Image();
    im.onload=()=>{ imgCache.set(url, im); res(im); };
    im.src=url;
  });
}

async function tick(ts){
  if(playtest){
    const speed=2.0;
    let vx=0, vy=0;
    if(keys['ArrowUp']||dpadDir==='north'){ vy-=speed; player.dir='north'; }
    if(keys['ArrowDown']||dpadDir==='south'){ vy+=speed; player.dir='south'; }
    if(keys['ArrowLeft']||dpadDir==='west'){ vx-=speed; player.dir='west'; }
    if(keys['ArrowRight']||dpadDir==='east'){ vx+=speed; player.dir='east'; }

    player.moving = (vx!==0||vy!==0);
    player.x = Math.max(TILE/2, Math.min(cols*TILE-TILE/2, player.x+vx));
    player.y = Math.max(TILE/2, Math.min(rows*TILE-TILE/2, player.y+vy));

    const viewW=window.innerWidth, viewH=window.innerHeight-132;
    camX = player.x - viewW/2;
    camY = player.y - viewH/2;

    const ch = getChar(player.charId);
    if(ch){
      const fps = ch.fps || 8;
      const dt = (ts - (player.t||ts)) / 1000;
      player.t = ts;
      const len = Math.max(1, getFrameKeys(ch, player.dir).length);
      if(player.moving) player.frame = (player.frame + dt*fps) % len;
      else player.frame = 0;
    }
    draw();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ===== Render =====
async function drawEntity(ch, x, y, dir, frameIndex){
  const keys = getFrameKeys(ch, dir);
  if(!keys.length) return;
  const key = keys[Math.floor(frameIndex) % keys.length];
  const url = await frameKeyToObjectURL(key);
  if(!url) return;
  const img = await loadImage(url);
  const drawX = (x - img.width/2) - camX;
  const drawY = (y - img.height) - camY;
  ctx.drawImage(img, drawX, drawY);
}

async function draw(){
  ctx.clearRect(0,0,map.width,map.height);
  const viewW=window.innerWidth, viewH=window.innerHeight-132;
  const startCol=Math.max(0,Math.floor(camX/TILE)-1);
  const startRow=Math.max(0,Math.floor(camY/TILE)-1);
  const endCol=Math.min(cols,Math.ceil((camX+viewW)/TILE)+1);
  const endRow=Math.min(rows,Math.ceil((camY+viewH)/TILE)+1);

  for(let y=startRow;y<endRow;y++){
    for(let x=startCol;x<endCol;x++){
      const id=grid[y][x]||null;
      const px=x*TILE-camX, py=y*TILE-camY;
      if(id){
        const t=tiles.find(tt=>tt.id===id)||tiles[0];
        ctx.fillStyle=t.color;
        ctx.fillRect(px,py,TILE,TILE);
      }
      ctx.strokeStyle='#222';
      ctx.strokeRect(px,py,TILE,TILE);
    }
  }

  const ents = placedEntities.slice().sort((a,b)=>a.y-b.y);
  for(const e of ents){
    const ch=getChar(e.charId);
    if(!ch) continue;
    await drawEntity(ch, e.x, e.y, 'south', 0);
  }

  if(playtest && player.charId){
    const ch=getChar(player.charId);
    if(ch) await drawEntity(ch, player.x, player.y, player.dir, player.frame);
  }
}

// Initial draw
await draw();

// ===== Save/Export =====
saveBtn.onclick = async ()=>{ await saveProject(); alert('Saved'); };

async function blobToDataURL(blob){
  return await new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=()=>rej(new Error('read error'));
    r.readAsDataURL(blob);
  });
}
async function frameKeyToDataURL(key){
  const blob = await idbGet(STORE_FRAMES, key);
  if(!blob) return null;
  return await blobToDataURL(blob);
}

exportBtn.onclick = async ()=>{
  const charsOut=[];
  for(const c of characterLibrary){
    const framesOut={north:[],south:[],west:[],east:[]};
    for(const dir of ['north','south','west','east']){
      for(const key of (c.frames?.[dir]||[])){
        const durl = await frameKeyToDataURL(key);
        if(durl) framesOut[dir].push(durl);
      }
    }
    charsOut.push({ id:c.id, name:c.name, fps:c.fps, frames:framesOut, collision:c.collision, anchor:c.anchor });
  }
  const data={ version:'2B2_3', tileSize:TILE, tiles, grid, characters:charsOut, entities:placedEntities, player };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='project.mk';
  a.click();
};

// ===== Collision Panel (REAL integration) =====
let colActiveId = null;
let colSpriteImg = null;
let colSpriteUrl = null;

// Editor state: rect in sprite-space (0..spriteW/H) using activeChar.collision/anchor.
function getActiveCharForCollision(){
  const id = charSelect.value;
  return characterLibrary.find(c=>c.id===id) || characterLibrary[0];
}

async function openCollisionPanel(){
  // Build selector from real library
  charSelect.innerHTML = '';
  characterLibrary.forEach(c=>{
    const o=document.createElement('option');
    o.value=c.id; o.textContent=c.name;
    charSelect.appendChild(o);
  });
  // keep previous selection if possible
  const prefer = selectedCharId || characterLibrary[0]?.id;
  if(prefer) charSelect.value = prefer;
  collisionPanel.classList.remove('hidden');
  await resizeCollisionCanvas();
  await loadCollisionSprite();
  drawCollision();
}

async function resizeCollisionCanvas(){
  const dpr = window.devicePixelRatio || 1;
  const cssW = window.innerWidth;
  const cssH = collisionPanel.clientHeight - 44 - 28; // header + hint
  collisionCanvas.style.width = cssW + 'px';
  collisionCanvas.style.height = cssH + 'px';
  collisionCanvas.width = Math.floor(cssW * dpr);
  collisionCanvas.height = Math.floor(cssH * dpr);
  cctx.setTransform(dpr,0,0,dpr,0,0);
}

window.addEventListener('resize', async ()=>{
  if(!collisionPanel.classList.contains('hidden')){
    await resizeCollisionCanvas();
    drawCollision();
  }
});

async function loadCollisionSprite(){
  const ch = getActiveCharForCollision();
  ensureCollisionAndAnchor(ch);
  // pick a representative frame
  const key = ch.thumbKey || ch.frames?.south?.[0] || ch.frames?.north?.[0] || ch.frames?.west?.[0] || ch.frames?.east?.[0];
  colSpriteImg = null;

  if(key){
    colSpriteUrl = await frameKeyToObjectURL(key);
    if(colSpriteUrl){
      colSpriteImg = await loadImage(colSpriteUrl);
    }
  }
}

charSelect.addEventListener('change', async ()=>{
  selectedCharId = charSelect.value;
  await loadCollisionSprite();
  drawCollision();
});

doneCollision.onclick = async ()=>{
  stopCollisionInput();
  // Save changes already applied to characterLibrary objects
  await saveProject();
  collisionPanel.classList.add('hidden'); // exits collision mode
  draw();
};

// Drag handles logic
let drag = { active:false, kind:null, startX:0, startY:0 };
function hitTestHandles(rect, scale, originX, originY){
  // rect in sprite space; draw rect = origin + rect*scale
  const x = originX + rect.x*scale;
  const y = originY + rect.y*scale;
  const w = rect.w*scale;
  const h = rect.h*scale;
  const s = 14; // handle size px
  return {
    tl:{x:x-s/2,y:y-s/2,w:s,h:s},
    tr:{x:x+w-s/2,y:y-s/2,w:s,h:s},
    bl:{x:x-s/2,y:y+h-s/2,w:s,h:s},
    br:{x:x+w-s/2,y:y+h-s/2,w:s,h:s},
  };
}
function pointIn(p, r){ return p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h; }

function drawCollision(){
  cctx.clearRect(0,0,collisionCanvas.width,collisionCanvas.height);
  const w = collisionCanvas.width/(window.devicePixelRatio||1);
  const h = collisionCanvas.height/(window.devicePixelRatio||1);

  // Dim background for context
  cctx.fillStyle = '#000';
  cctx.fillRect(0,0,w,h);
  cctx.strokeStyle = '#222';
  // subtle grid
  for(let gx=0; gx<w; gx+=48){ cctx.beginPath(); cctx.moveTo(gx,0); cctx.lineTo(gx,h); cctx.stroke(); }
  for(let gy=0; gy<h; gy+=48){ cctx.beginPath(); cctx.moveTo(0,gy); cctx.lineTo(w,gy); cctx.stroke(); }

  const ch = getActiveCharForCollision();
  ensureCollisionAndAnchor(ch);

  // Determine sprite draw scale to fit
  let spriteW = 48, spriteH = 48;
  if(colSpriteImg){ spriteW = colSpriteImg.width; spriteH = colSpriteImg.height; }

  const maxW = w * 0.7;
  const maxH = h * 0.75;
  const scale = Math.max(1, Math.floor(Math.min(maxW/spriteW, maxH/spriteH) * 10) / 10); // keep simple

  const originX = (w - spriteW*scale) / 2;
  const originY = (h - spriteH*scale) / 2;

  // Draw sprite
  if(colSpriteImg){
    cctx.imageSmoothingEnabled = false;
    cctx.drawImage(colSpriteImg, originX, originY, spriteW*scale, spriteH*scale);
  } else {
    // placeholder
    cctx.strokeStyle = '#555';
    cctx.strokeRect(originX, originY, spriteW*scale, spriteH*scale);
    cctx.fillStyle = '#aaa';
    cctx.font = '14px system-ui';
    cctx.fillText('No sprite frame found', originX+10, originY+24);
  }

  // Draw collision box
  cctx.strokeStyle = '#00ff6a';
  cctx.lineWidth = 2;
  const rect = ch.collision;
  cctx.strokeRect(originX + rect.x*scale, originY + rect.y*scale, rect.w*scale, rect.h*scale);

  // Handles
  const handles = hitTestHandles(rect, scale, originX, originY);
  cctx.fillStyle = '#00ff6a';
  Object.values(handles).forEach(r=>{ cctx.fillRect(r.x, r.y, r.w, r.h); });

  // Anchor
  const ax = originX + ch.anchor.x*scale;
  const ay = originY + ch.anchor.y*scale;
  cctx.fillStyle = '#ff2d2d';
  cctx.beginPath(); cctx.arc(ax, ay, 6, 0, Math.PI*2); cctx.fill();

  // Store draw params for hit testing
  collisionCanvas._drawState = { scale, originX, originY, spriteW, spriteH, handles, anchor:{x:ax,y:ay} };
}

collisionCanvas.addEventListener('pointerdown', (e)=>{
  const rect = collisionCanvas.getBoundingClientRect();
  const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const st = collisionCanvas._drawState;
  if(!st) return;

  const ch = getActiveCharForCollision();
  ensureCollisionAndAnchor(ch);

  // Anchor hit
  const dx = p.x - st.anchor.x;
  const dy = p.y - st.anchor.y;
  if(Math.hypot(dx,dy) <= 10){
    drag = { active:true, kind:'anchor', startX:p.x, startY:p.y };
    activePointerId = e.pointerId;
    collisionCanvas.setPointerCapture(e.pointerId);
    return;
  }

  // Handle hit
  const handleNames = Object.keys(st.handles);
  for(const name of handleNames){
    if(pointIn(p, st.handles[name])){
      drag = { active:true, kind:name, startX:p.x, startY:p.y };
      activePointerId = e.pointerId;
    collisionCanvas.setPointerCapture(e.pointerId);
      return;
    }
  }

  // Inside rect -> move box
  const boxX = st.originX + ch.collision.x*st.scale;
  const boxY = st.originY + ch.collision.y*st.scale;
  const boxW = ch.collision.w*st.scale;
  const boxH = ch.collision.h*st.scale;
  if(p.x>=boxX && p.x<=boxX+boxW && p.y>=boxY && p.y<=boxY+boxH){
    drag = { active:true, kind:'move', startX:p.x, startY:p.y };
    activePointerId = e.pointerId;
    collisionCanvas.setPointerCapture(e.pointerId);
  }
});

collisionCanvas.addEventListener('pointermove', (e)=>{
  if(!drag.active) return;
  const rect = collisionCanvas.getBoundingClientRect();
  const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const st = collisionCanvas._drawState;
  if(!st) return;

  const ch = getActiveCharForCollision();
  ensureCollisionAndAnchor(ch);

  const dx = (p.x - drag.startX) / st.scale;
  const dy = (p.y - drag.startY) / st.scale;
  drag.startX = p.x; drag.startY = p.y;

  const minSize = 4;

  if(drag.kind === 'anchor'){
    ch.anchor.x = clamp(ch.anchor.x + dx, 0, st.spriteW);
    ch.anchor.y = clamp(ch.anchor.y + dy, 0, st.spriteH);
    drawCollision();
    return;
  }

  if(drag.kind === 'move'){
    ch.collision.x = clamp(ch.collision.x + dx, 0, st.spriteW - ch.collision.w);
    ch.collision.y = clamp(ch.collision.y + dy, 0, st.spriteH - ch.collision.h);
    drawCollision();
    return;
  }

  // Resize via corner handles
  const r = ch.collision;
  if(drag.kind === 'br'){
    r.w = clamp(r.w + dx, minSize, st.spriteW - r.x);
    r.h = clamp(r.h + dy, minSize, st.spriteH - r.y);
  } else if(drag.kind === 'tr'){
    r.w = clamp(r.w + dx, minSize, st.spriteW - r.x);
    const newY = clamp(r.y + dy, 0, r.y + r.h - minSize);
    r.h = clamp(r.h - (newY - r.y), minSize, st.spriteH - newY);
    r.y = newY;
  } else if(drag.kind === 'bl'){
    r.h = clamp(r.h + dy, minSize, st.spriteH - r.y);
    const newX = clamp(r.x + dx, 0, r.x + r.w - minSize);
    r.w = clamp(r.w - (newX - r.x), minSize, st.spriteW - newX);
    r.x = newX;
  } else if(drag.kind === 'tl'){
    const newX = clamp(r.x + dx, 0, r.x + r.w - minSize);
    const newY = clamp(r.y + dy, 0, r.y + r.h - minSize);
    r.w = clamp(r.w - (newX - r.x), minSize, st.spriteW - newX);
    r.h = clamp(r.h - (newY - r.y), minSize, st.spriteH - newY);
    r.x = newX; r.y = newY;
  }
  drawCollision();
});

collisionCanvas.addEventListener('pointerup', ()=>{ drag.active=false; drag.kind=null; });
collisionCanvas.addEventListener('pointercancel', ()=>{ drag.active=false; drag.kind=null; });

function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }


// ===== Input safety (iOS): prevent canvas from trapping taps =====
let activePointerId = null;
function releaseCanvasPointer(){
  try{
    if(activePointerId !== null){
      collisionCanvas.releasePointerCapture(activePointerId);
    }
  }catch(_e){}
  activePointerId = null;
  drag.active = false; drag.kind = null;
}
function stopCollisionInput(){
  releaseCanvasPointer();
  // nothing else needed because listeners remain, but drag is reset and capture released
}
