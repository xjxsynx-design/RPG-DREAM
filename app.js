// Phase 2B.2.2 — Integrated Collision Panel (simple names)

const modeBtn=document.getElementById('modeBtn');
const modeMenu=document.getElementById('modeMenu');
const collisionPanel=document.getElementById('collisionPanel');
const collisionCanvas=document.getElementById('collisionCanvas');
const cctx=collisionCanvas.getContext('2d');
const charSelect=document.getElementById('charSelect');
const closeCollision=document.getElementById('closeCollision');

// Dummy character data (hooked to existing library in later pass)
let characters=[
  {id:'hero',name:'Hero',collision:{x:12,y:28,w:24,h:16},anchor:{x:24,y:48}}
];
let activeChar=characters[0];

modeBtn.onclick=()=>modeMenu.classList.toggle('hidden');
modeMenu.querySelectorAll('button').forEach(btn=>{
 btn.onclick=()=>{
  modeMenu.classList.add('hidden');
  collisionPanel.classList.add('hidden');
  if(btn.dataset.mode==='collision') openCollision();
 };
});

function openCollision(){
  collisionPanel.classList.remove('hidden');
  buildCharSelect();
  resize();
  draw();
}

function buildCharSelect(){
  charSelect.innerHTML='';
  characters.forEach(c=>{
    const o=document.createElement('option');
    o.value=c.id;o.textContent=c.name;
    charSelect.appendChild(o);
  });
  charSelect.onchange=()=>{
    activeChar=characters.find(c=>c.id===charSelect.value);
    draw();
  };
}

closeCollision.onclick=()=>collisionPanel.classList.add('hidden');

function resize(){
 const dpr=window.devicePixelRatio||1;
 collisionCanvas.width=window.innerWidth*dpr;
 collisionCanvas.height=collisionPanel.clientHeight*dpr;
 cctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize',resize);

function draw(){
 cctx.clearRect(0,0,collisionCanvas.width,collisionCanvas.height);
 const cx=collisionCanvas.width/2/(window.devicePixelRatio||1);
 const cy=collisionCanvas.height/2/(window.devicePixelRatio||1);

 // sprite placeholder
 cctx.strokeStyle='#555';
 cctx.strokeRect(cx-24,cy-48,48,48);

 // collision
 const col=activeChar.collision;
 cctx.strokeStyle='#0f0';
 cctx.strokeRect(cx-24+col.x,cy-48+col.y,col.w,col.h);

 // anchor
 cctx.fillStyle='#f00';
 cctx.beginPath();
 cctx.arc(cx-24+activeChar.anchor.x,cy-48+activeChar.anchor.y,4,0,Math.PI*2);
 cctx.fill();
}

collisionCanvas.addEventListener('pointermove',e=>{
 if(e.buttons!==1) return;
 activeChar.collision.w=Math.max(4,activeChar.collision.w+e.movementX*0.2);
 activeChar.collision.h=Math.max(4,activeChar.collision.h+e.movementY*0.2);
 draw();
});
