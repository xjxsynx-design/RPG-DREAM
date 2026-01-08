// Phase 2B.1 UI-only patch glue
const modeBtn=document.getElementById('modeBtn');
const modeMenu=document.getElementById('modeMenu');
const palette=document.getElementById('palettePanel');
const chars=document.getElementById('charsPanel');

modeBtn.onclick=()=>modeMenu.classList.toggle('hidden');

modeMenu.querySelectorAll('button').forEach(btn=>{
 btn.onclick=()=>{
  const m=btn.dataset.mode;
  modeMenu.classList.add('hidden');
  palette.classList.add('hidden');
  chars.classList.add('hidden');
  if(m==='terrain') palette.classList.remove('hidden');
  if(m==='characters') chars.classList.remove('hidden');
 };
});

// Canvas framing only; logic remains unchanged
