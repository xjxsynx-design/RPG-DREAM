// Phase 2B.1: IndexedDB storage for character frames + thumbnails
const TILE = 48;
const TAP_THRESHOLD = 6;

const map = document.getElementById('map');
const ctx = map.getContext('2d');

const palettePanel = document.getElementById('palettePanel');
const paletteToggle = document.getElementById('paletteToggle');

const charsPanel = document.getElementById('charsPanel');
const charsToggle = document.getElementById('charsToggle');
const closeChars = document.getElementById('closeChars');

const playtestToggle = document.getElementById('playtestToggle');
const hud = document.getElementById('hud');
const dpad = document.getElementById('dpad');

// ===== IndexedDB =====
const DB_NAME = 'rpgwb_db';
const DB_VER = 1;
const STORE_PROJECT = 'project';
const STORE_FRAMES = 'frames';

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains(STORE_PROJECT)) db.createObjectStore(STORE_PROJECT);
      if(!db.objectStoreNames.contains(STORE_FRAMES)) db.createObjectStore(STORE_FRAMES);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
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
async function idbGet(store, key){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => { const v = req.result; db.close(); resolve(v); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
async function idbDel(store, key){
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// ====== Resize canvas for crisp drawing ======
function resize() {
  const cssW = window.innerWidth;
  const cssH = window.innerHeight - 112;
  map.style.width = cssW + 'px';
  map.style.height = cssH + 'px';
  const dpr = window.devicePixelRatio || 1;
  map.width = Math.floor(cssW * dpr);
  map.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
window.addEventListener('resize', resize);
resize();

// ====== World ======
const cols = 120, rows = 120;
let camX = 0, camY = 0;

const tiles = [
  { id: 'grassland', name: 'Grassland', color: '#4caf50', desc:'Lush grassland ground' },
  { id: 'plains',    name: 'Plains',    color: '#7cb342', desc:'Open plains ground' },
  { id: 'desert',    name: 'Desert',    color: '#d7b56d', desc:'Sandy desert ground' },
  { id: 'tropical',  name: 'Tropical',  color: '#2ecc71', desc:'Tropical ground' },
  { id: 'wetlands',  name: 'Wetlands',  color: '#5d8c6a', desc:'Wetlands / swamp ground' },
  { id: 'volcanic',  name: 'Volcanic',  color: '#b03a2e', desc:'Volcanic ground' }
];
let currentTile = tiles[0];
let grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

// ====== Characters ======
let characterLibrary = []; // metadata only: {id,name,fps, frames:{dir:[frameKey...]}, thumbKey}
let placedEntities = [];   // {charId,x,y}
let placeMode = false;
let selectedCharId = null;

let playtest = false;
let player = { charId: null, x: TILE * 10 + TILE/2, y: TILE * 10 + TILE/2, dir: 'south', moving: false, frame: 0, t: 0 };

// ====== Panels ======
paletteToggle.onclick = () => {
  palettePanel.classList.toggle('hidden');
  charsPanel.classList.add('hidden');
};
charsToggle.onclick = () => {
  charsPanel.classList.toggle('hidden');
  palettePanel.classList.add('hidden');
  renderCharList();
};
closeChars.onclick = () => charsPanel.classList.add('hidden');

// ====== Palette UI ======
function buildPalette() {
  palettePanel.innerHTML = '';
  tiles.forEach(t => {
    const d = document.createElement('div');
    d.className = 'tile';
    d.style.background = t.color;
    d.title = `${t.name}: ${t.desc}`;
    d.onclick = () => {
      document.querySelectorAll('#palettePanel .tile').forEach(x => x.classList.remove('selected'));
      d.classList.add('selected');
      currentTile = t;
    };
    palettePanel.appendChild(d);
  });
  const first = palettePanel.querySelector('.tile');
  if (first) first.classList.add('selected');
}
buildPalette();

// ===== Modal =====
const addCharBtn = document.getElementById('addCharBtn');
const placeCharBtn = document.getElementById('placeCharBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const charModal = document.getElementById('charModal');
const closeModal = document.getElementById('closeModal');
const createChar = document.getElementById('createChar');

function openModal() { modalBackdrop.classList.remove('hidden'); charModal.classList.remove('hidden'); }
function closeModalFn(){ modalBackdrop.classList.add('hidden'); charModal.classList.add('hidden'); }
addCharBtn.onclick = openModal;
closeModal.onclick = closeModalFn;
modalBackdrop.onclick = closeModalFn;

placeCharBtn.onclick = () => {
  placeMode = !placeMode;
  placeCharBtn.textContent = `Place Mode: ${placeMode ? 'On' : 'Off'}`;
  if (placeMode && !selectedCharId && characterLibrary[0]) selectedCharId = characterLibrary[0].id;
};

// Store uploaded frames as blobs in IndexedDB and keep keys
async function storeFilesAsFrameKeys(charId, dir, fileList){
  const files = Array.from(fileList || []);
  const keys = [];
  for (let i=0;i<files.length;i++){
    const f = files[i];
    const key = `${charId}:${dir}:${i}:${Date.now()}`;
    await idbPut(STORE_FRAMES, key, f); // store Blob/File
    keys.push(key);
  }
  return keys;
}

createChar.onclick = async () => {
  const name = (document.getElementById('charName').value || '').trim();
  const fps = Math.max(1, Math.min(24, parseInt(document.getElementById('charFps').value || '8', 10)));
  if (!name) { alert('Please name the character.'); return; }

  const northFiles = document.getElementById('northFiles').files;
  const southFiles = document.getElementById('southFiles').files;
  const westFiles  = document.getElementById('westFiles').files;
  const eastFiles  = document.getElementById('eastFiles').files;

  const total = (northFiles?.length||0) + (southFiles?.length||0) + (westFiles?.length||0) + (eastFiles?.length||0);
  if (total === 0) { alert('Upload at least one frame (any direction).'); return; }

  createChar.textContent = 'Creating...';
  createChar.disabled = true;

  const charId = 'char_' + cryptoRandomId();

  try{
    const frames = {
      north: await storeFilesAsFrameKeys(charId,'north',northFiles),
      south: await storeFilesAsFrameKeys(charId,'south',southFiles),
      west:  await storeFilesAsFrameKeys(charId,'west',westFiles),
      east:  await storeFilesAsFrameKeys(charId,'east',eastFiles),
    };

    // Fallback: if a direction is empty, reuse any available key
    const anyKey = frames.south[0] || frames.north[0] || frames.west[0] || frames.east[0];
    ['north','south','west','east'].forEach(dir => {
      if (!frames[dir].length && anyKey) frames[dir] = [anyKey];
    });

    // thumb uses south[0] (or any)
    const thumbKey = anyKey;

    const meta = { id: charId, name, fps, frames, thumbKey };
    characterLibrary.push(meta);
    selectedCharId = charId;
    if (!player.charId) player.charId = charId;

    await saveAll();
    renderCharList();
    closeModalFn();

    // clear inputs
    document.getElementById('charName').value = '';
    document.getElementById('northFiles').value = '';
    document.getElementById('southFiles').value = '';
    document.getElementById('westFiles').value = '';
    document.getElementById('eastFiles').value = '';
  } catch(e){
    console.error(e);
    alert('Could not create character.');
  } finally {
    createChar.textContent = 'Create';
    createChar.disabled = false;
  }
};

function cryptoRandomId() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return (a[0].toString(16) + a[1].toString(16)).slice(0, 12);
}

// ====== Project Save/Load in IndexedDB ======
async function saveAll(){
  const payload = { grid, camX, camY, characterLibrary, placedEntities, player };
  await idbPut(STORE_PROJECT, 'default', payload);
}

async function loadAll(){
  const payload = await idbGet(STORE_PROJECT, 'default');
  if (!payload) return;
  if (payload.grid) grid = payload.grid;
  if (typeof payload.camX === 'number') camX = payload.camX;
  if (typeof payload.camY === 'number') camY = payload.camY;
  if (payload.characterLibrary) characterLibrary = payload.characterLibrary;
  if (payload.placedEntities) placedEntities = payload.placedEntities;
  if (payload.player) player = payload.player;
  selectedCharId = characterLibrary[0]?.id || null;
}
await loadAll();

// ===== Character list with thumbnails =====
const charList = document.getElementById('charList');

function countFrames(c){
  return (c.frames.north?.length||0)+(c.frames.south?.length||0)+(c.frames.west?.length||0)+(c.frames.east?.length||0);
}

// cache blob->objectURL for drawing + thumbs
const blobUrlCache = new Map(); // frameKey -> objectURL

async function frameKeyToObjectURL(frameKey){
  if (!frameKey) return null;
  if (blobUrlCache.has(frameKey)) return blobUrlCache.get(frameKey);
  const blob = await idbGet(STORE_FRAMES, frameKey);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(frameKey, url);
  return url;
}

async function renderCharList(){
  charList.innerHTML = '';
  if (!characterLibrary.length){
    const div = document.createElement('div');
    div.className = 'hint';
    div.textContent = 'No characters yet. Tap “Add Character” to import frames.';
    charList.appendChild(div);
    return;
  }

  for (const c of characterLibrary){
    const item = document.createElement('div');
    item.className = 'item';

    const left = document.createElement('div');
    left.className = 'itemLeft';

    const img = document.createElement('img');
    img.className = 'thumb';
    img.alt = c.name;
    // set thumb
    const thumbUrl = await frameKeyToObjectURL(c.thumbKey);
    if (thumbUrl) img.src = thumbUrl;

    const text = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = c.name;
    title.style.fontWeight = '800';
    const meta = document.createElement('div');
    meta.className = 'badge';
    meta.textContent = `${c.fps} FPS • ${countFrames(c)} frames`;
    text.appendChild(title);
    text.appendChild(meta);

    left.appendChild(img);
    left.appendChild(text);

    const right = document.createElement('div');
    right.className = 'row';

    const selectBtn = document.createElement('button');
    selectBtn.className = 'smallBtn';
    selectBtn.textContent = (selectedCharId === c.id) ? 'Selected' : 'Select';
    selectBtn.onclick = async () => {
      selectedCharId = c.id;
      if (!player.charId) player.charId = c.id;
      await saveAll();
      renderCharList();
    };

    const setPlayerBtn = document.createElement('button');
    setPlayerBtn.className = 'smallBtn';
    setPlayerBtn.textContent = (player.charId === c.id) ? 'Player ✓' : 'Set Player';
    setPlayerBtn.onclick = async () => {
      player.charId = c.id;
      await saveAll();
      renderCharList();
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'smallBtn';
    delBtn.textContent = 'Delete';
    delBtn.onclick = async () => {
      if (!confirm(`Delete ${c.name}?`)) return;
      // delete all frame blobs
      for (const dir of ['north','south','west','east']){
        for (const key of (c.frames[dir]||[])){
          // revoke cached URL
          const url = blobUrlCache.get(key);
          if (url) URL.revokeObjectURL(url);
          blobUrlCache.delete(key);
          await idbDel(STORE_FRAMES, key);
        }
      }
      characterLibrary = characterLibrary.filter(x => x.id !== c.id);
      placedEntities = placedEntities.filter(e => e.charId !== c.id);
      if (selectedCharId === c.id) selectedCharId = characterLibrary[0]?.id || null;
      if (player.charId === c.id) player.charId = characterLibrary[0]?.id || null;
      await saveAll();
      renderCharList();
      draw();
    };

    right.appendChild(selectBtn);
    right.appendChild(setPlayerBtn);
    right.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(right);
    charList.appendChild(item);
  }
}
await renderCharList();

// ===== Save button =====
document.getElementById('saveBtn').onclick = async () => {
  await saveAll();
  alert('Saved locally (IndexedDB)');
};

// ===== Export .mk =====
// Exports as JSON with frames inlined as data URLs (can be big, but portable).
async function blobToDataURL(blob){
  return await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('read error'));
    r.readAsDataURL(blob);
  });
}
async function frameKeyToDataURL(key){
  const blob = await idbGet(STORE_FRAMES, key);
  if (!blob) return null;
  return await blobToDataURL(blob);
}

document.getElementById('exportBtn').onclick = async () => {
  const chars = [];
  for (const c of characterLibrary){
    const framesOut = { north:[], south:[], west:[], east:[] };
    for (const dir of ['north','south','west','east']){
      for (const key of (c.frames[dir]||[])){
        const durl = await frameKeyToDataURL(key);
        if (durl) framesOut[dir].push(durl);
      }
    }
    chars.push({ id:c.id, name:c.name, fps:c.fps, frames:framesOut });
  }

  const data = {
    version: '2B.1',
    tileSize: TILE,
    tiles,
    grid,
    characters: chars,
    entities: placedEntities,
    player
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'project.mk';
  a.click();
};

// ===== Tap vs pan on canvas =====
let startX = 0, startY = 0, moved = false;

map.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; moved = false; });
map.addEventListener('pointermove', (e) => {
  const dx = Math.abs(e.clientX - startX);
  const dy = Math.abs(e.clientY - startY);
  if (dx > TAP_THRESHOLD || dy > TAP_THRESHOLD) {
    moved = true;
    camX += startX - e.clientX;
    camY += startY - e.clientY;
    startX = e.clientX;
    startY = e.clientY;
    draw();
  }
});
map.addEventListener('pointerup', async (e) => {
  if (moved) return;

  const wp = screenToWorld(e.clientX, e.clientY);

  if (placeMode && selectedCharId) {
    const snapped = snapToTileCenter(wp.x, wp.y);
    placedEntities.push({ charId: selectedCharId, x: snapped.x, y: snapped.y });
    await saveAll();
    draw();
    return;
  }

  const x = Math.floor(wp.x / TILE);
  const y = Math.floor(wp.y / TILE);
  if (x>=0 && y>=0 && x<cols && y<rows) {
    grid[y][x] = currentTile.id;
    await saveAll();
    draw();
  }
});

function screenToWorld(sx, sy) {
  const canvasTop = 56;
  return { x: sx + camX, y: (sy - canvasTop) + camY };
}
function snapToTileCenter(wx, wy) {
  const tx = Math.floor(wx / TILE);
  const ty = Math.floor(wy / TILE);
  return { x: tx*TILE + TILE/2, y: ty*TILE + TILE/2 };
}

// ===== Playtest =====
playtestToggle.onclick = async () => {
  playtest = !playtest;
  hud.classList.toggle('hidden', !playtest);
  playtestToggle.textContent = playtest ? 'Stop' : 'Playtest';
  palettePanel.classList.add('hidden');
  charsPanel.classList.add('hidden');
  placeMode = false;
  placeCharBtn.textContent = 'Place Mode: Off';

  if (playtest && !player.charId && characterLibrary[0]) player.charId = characterLibrary[0].id;
  await saveAll();
  draw();
};

const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

let dpadDir = null;
dpad.querySelectorAll('.dpad-btn').forEach(btn => {
  btn.addEventListener('pointerdown', () => { dpadDir = btn.dataset.dir; });
  btn.addEventListener('pointerup',   () => { dpadDir = null; });
  btn.addEventListener('pointercancel', () => { dpadDir = null; });
});

function getCharMeta(id) { return characterLibrary.find(c => c.id === id); }
function getFrameKeys(ch, dir) {
  const frames = ch?.frames?.[dir] || [];
  return frames.length ? frames : (ch?.frames?.south || []);
}

async function tick(ts) {
  if (playtest) {
    const speed = 2.0;
    let vx = 0, vy = 0;

    if (keys['ArrowUp'] || dpadDir === 'north') { vy -= speed; player.dir = 'north'; }
    if (keys['ArrowDown'] || dpadDir === 'south') { vy += speed; player.dir = 'south'; }
    if (keys['ArrowLeft'] || dpadDir === 'west') { vx -= speed; player.dir = 'west'; }
    if (keys['ArrowRight'] || dpadDir === 'east') { vx += speed; player.dir = 'east'; }

    player.moving = (vx !== 0 || vy !== 0);
    player.x = Math.max(TILE/2, Math.min(cols*TILE - TILE/2, player.x + vx));
    player.y = Math.max(TILE/2, Math.min(rows*TILE - TILE/2, player.y + vy));

    const viewW = window.innerWidth;
    const viewH = window.innerHeight - 112;
    camX = player.x - viewW/2;
    camY = player.y - viewH/2;

    const ch = getCharMeta(player.charId);
    if (ch) {
      const fps = ch.fps || 8;
      const dt = (ts - player.t) / 1000 || 0;
      player.t = ts;
      const len = getFrameKeys(ch, player.dir).length;
      if (player.moving) player.frame = (player.frame + dt*fps) % Math.max(1,len);
      else player.frame = 0;
    }
    draw();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ===== Rendering =====
async function drawEntity(ch, x, y, dir, frameIndex){
  const keys = getFrameKeys(ch, dir);
  if (!keys.length) return;
  const key = keys[Math.floor(frameIndex) % keys.length];
  const url = await frameKeyToObjectURL(key);
  if (!url) return;

  // Load image (objectURL)
  const img = await loadImage(url);
  // anchor bottom-center
  const drawX = (x - img.width/2) - camX;
  const drawY = (y - img.height) - camY;
  ctx.drawImage(img, drawX, drawY);
}

const imgCache = new Map(); // objectURL -> HTMLImageElement
function loadImage(url){
  if (imgCache.has(url)) return Promise.resolve(imgCache.get(url));
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => { imgCache.set(url, im); res(im); };
    im.src = url;
  });
}

async function draw(){
  ctx.clearRect(0,0, map.width, map.height);

  const viewW = window.innerWidth;
  const viewH = window.innerHeight - 112;
  const startCol = Math.max(0, Math.floor(camX / TILE) - 1);
  const startRow = Math.max(0, Math.floor(camY / TILE) - 1);
  const endCol = Math.min(cols, Math.ceil((camX + viewW) / TILE) + 1);
  const endRow = Math.min(rows, Math.ceil((camY + viewH) / TILE) + 1);

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const id = grid[y][x] || null;
      const px = x*TILE - camX;
      const py = y*TILE - camY;
      if (id) {
        const t = tiles.find(tt => tt.id === id) || tiles[0];
        ctx.fillStyle = t.color;
        ctx.fillRect(px, py, TILE, TILE);
      }
      ctx.strokeStyle = '#222';
      ctx.strokeRect(px, py, TILE, TILE);
    }
  }

  const ents = placedEntities.slice().sort((a,b)=>a.y-b.y);
  for (const e of ents) {
    const ch = getCharMeta(e.charId);
    if (!ch) continue;
    await drawEntity(ch, e.x, e.y, 'south', 0);
  }

  if (playtest && player.charId) {
    const ch = getCharMeta(player.charId);
    if (ch) await drawEntity(ch, player.x, player.y, player.dir, player.frame);
  }
}

// Initial draw
await draw();
