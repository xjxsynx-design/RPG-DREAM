// Phase 2B.2 — Collision + Anchor Editor

const modeBtn = document.getElementById('modeBtn');
const modeMenu = document.getElementById('modeMenu');
const palettePanel = document.getElementById('palettePanel');
const charsPanel = document.getElementById('charsPanel');
const charList = document.getElementById('charList');

const collisionEditor = document.getElementById('collisionEditor');
const collisionCanvas = document.getElementById('collisionCanvas');
const cctx = collisionCanvas.getContext('2d');
const closeCollision = document.getElementById('closeCollision');

let characters = JSON.parse(localStorage.getItem('characters')||'[]');
if(!characters.length){
  characters.push({
    id:'hero',
    name:'Hero',
    collision:{x:16,y:24,w:16,h:16},
    anchor:{x:24,y:48}
  });
}

function saveChars(){
  localStorage.setItem('characters',JSON.stringify(characters));
}

// MODE menu
modeBtn.onclick=()=>modeMenu.classList.toggle('hidden');
modeMenu.querySelectorAll('button').forEach(btn=>{
 btn.onclick=()=>{
  modeMenu.classList.add('hidden');
  palettePanel.classList.add('hidden');
  charsPanel.classList.add('hidden');
  if(btn.dataset.mode==='characters') charsPanel.classList.remove('hidden');
 };
});

// Populate character list
function renderCharList(){
 charList.innerHTML='';
 characters.forEach(c=>{
  const b=document.createElement('button');
  b.textContent=c.name;
  b.onclick=()=>openCollisionEditor(c);
  charList.appendChild(b);
 });
}
renderCharList();

// Collision editor
let activeChar=null;
let dragMode=null;

function openCollisionEditor(char){
 activeChar=char;
 collisionEditor.classList.remove('hidden');
 resizeCollisionCanvas();
 drawCollision();
}

closeCollision.onclick=()=>{
 collisionEditor.classList.add('hidden');
 saveChars();
};

function resizeCollisionCanvas(){
 collisionCanvas.width=window.innerWidth*window.devicePixelRatio;
 collisionCanvas.height=(window.innerHeight-80)*window.devicePixelRatio;
 cctx.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0);
}

window.addEventListener('resize',resizeCollisionCanvas);

function drawCollision(){
 cctx.clearRect(0,0,collisionCanvas.width,collisionCanvas.height);
 const cx=collisionCanvas.width/2/window.devicePixelRatio;
 const cy=collisionCanvas.height/2/window.devicePixelRatio;

 // sprite placeholder
 cctx.strokeStyle='#555';
 cctx.strokeRect(cx-24,cy-48,48,48);

 // collision box
 const col=activeChar.collision;
 cctx.strokeStyle='#0f0';
 cctx.strokeRect(cx-24+col.x,cy-48+col.y,col.w,col.h);

 // anchor
 cctx.fillStyle='#f00';
 cctx.beginPath();
 cctx.arc(cx-24+activeChar.anchor.x,cy-48+activeChar.anchor.y,4,0,Math.PI*2);
 cctx.fill();
}

collisionCanvas.addEventListener('pointerdown',e=>{
 const rect=collisionCanvas.getBoundingClientRect();
 const x=e.clientX-rect.left;
 const y=e.clientY-rect.top;
 dragMode='move';
});

collisionCanvas.addEventListener('pointermove',e=>{
 if(!dragMode) return;
 const dx=e.movementX;
 const dy=e.movementY;
 activeChar.collision.w=Math.max(4,activeChar.collision.w+dx*0.1);
 activeChar.collision.h=Math.max(4,activeChar.collision.h+dy*0.1);
 drawCollision();
});

collisionCanvas.addEventListener('pointerup',()=>dragMode=null);

// Save / export placeholders
document.getElementById('saveBtn').onclick=()=>alert('Saved');
document.getElementById('exportBtn').onclick=()=>alert('Exported');

