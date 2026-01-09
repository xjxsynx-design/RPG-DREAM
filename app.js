// E3 GOLD HOTFIX – Bootstrap Guard
(() => {
  const VERSION = "E3_GOLD";
  try {
    const stored = localStorage.getItem("RPG_DREAM_VERSION");
    if (stored !== VERSION) {
      localStorage.clear();
      localStorage.setItem("RPG_DREAM_VERSION", VERSION);
    }
  } catch (e) {}

  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');
  const TILE = 40, W = 20, H = 15;

  let mode = 'terrain';
  let terrain = {};

  function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    draw();
  }
  window.addEventListener('resize', resize);

  document.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.mode;
    };
  });

  canvas.addEventListener('click', e => {
    if (mode !== 'terrain') return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE);
    const y = Math.floor((e.clientY - rect.top) / TILE);
    terrain[`${x},${y}`] = true;
    draw();
  });

  function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#222';
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
        if (terrain[`${x},${y}`]) {
          ctx.fillStyle = '#4da6ff';
          ctx.fillRect(x * TILE + 4, y * TILE + 4, TILE - 8, TILE - 8);
        }
      }
    }
  }

  resize();
})();