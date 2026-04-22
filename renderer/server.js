import express from 'express';
import { exec } from 'child_process';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
const HF_BIN = join(__dirname, 'node_modules', '.bin', 'hyperframes');

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── REEL template (1080×1920, 9:16) ─────────────────────
function buildReelHtml(data, jobId) {
  const { hook_text, script, caption } = data;
  const paras = String(script || '')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (paras.length === 0 && script) paras.push(String(script));
  const ctaLine = esc(
    String(caption || '').split('\n').find(l => l.trim()) || 'Seguimi per altri contenuti'
  );

  const HOOK_DUR = 3, PARA_DUR = 5, CTA_DUR = 3, FADE = 0.5;

  let slides = '';
  let gsap = [];

  // Hook
  slides += `<div class="slide" id="s-hook">
    <h1 class="hook-text">${esc(hook_text)}</h1>
    <div class="accent"></div>
  </div>`;
  gsap.push(`tl.to('#s-hook',{opacity:1,y:0,duration:${FADE}},0)`);
  gsap.push(`tl.to('#s-hook',{opacity:0,duration:${FADE}},${HOOK_DUR - FADE})`);

  // Paragraphs
  paras.forEach((p, i) => {
    const t = HOOK_DUR + i * PARA_DUR;
    slides += `<div class="slide" id="s-p${i}"><p class="para-text">${esc(p)}</p></div>`;
    gsap.push(`tl.to('#s-p${i}',{opacity:1,y:0,duration:${FADE}},${t})`);
    gsap.push(`tl.to('#s-p${i}',{opacity:0,duration:${FADE}},${t + PARA_DUR - FADE})`);
  });

  // CTA
  const ctaT = HOOK_DUR + paras.length * PARA_DUR;
  slides += `<div class="slide" id="s-cta"><p class="cta-text">${ctaLine}</p></div>`;
  gsap.push(`tl.to('#s-cta',{opacity:1,y:0,duration:${FADE}},${ctaT})`);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Inter:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:#0f0d1c}
#stage{width:1080px;height:1920px;position:relative;background:linear-gradient(160deg,#13111f 0%,#1a1530 60%,#13111f 100%)}
.glow{position:absolute;border-radius:50%;filter:blur(140px);opacity:.18}
.g1{width:700px;height:700px;background:#a855f7;top:100px;left:-200px}
.g2{width:600px;height:600px;background:#ec4899;bottom:200px;right:-150px}
.slide{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:90px;opacity:0;transform:translateY(28px)}
.hook-text{font-family:'Montserrat',system-ui,sans-serif;font-size:84px;font-weight:900;color:#fff;text-align:center;line-height:1.15}
.accent{width:100px;height:5px;background:linear-gradient(135deg,#a855f7,#ec4899);border-radius:3px;margin-top:28px}
.para-text{font-family:'Inter',system-ui,sans-serif;font-size:52px;font-weight:600;color:rgba(255,255,255,.92);text-align:center;line-height:1.6}
.cta-text{font-family:'Montserrat',system-ui,sans-serif;font-size:64px;font-weight:900;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
</head><body>
<div id="stage" data-composition-id="reel-${jobId}" data-start="0" data-width="1080" data-height="1920">
  <div class="glow g1"></div><div class="glow g2"></div>
  ${slides}
</div>
<script>
const tl=gsap.timeline({defaults:{ease:'power2.out'}});
${gsap.join(';\n')};
</script>
</body></html>`;
}

// ── CAROUSEL template (1080×1350, 4:5) ───────────────────
function buildCarouselHtml(data, jobId) {
  const { hook_text, slides: rawSlides } = data;
  const SLIDE_DUR = 5, FADE = 0.5;

  const allSlides = [
    { kind: 'cover', text: hook_text },
    ...(rawSlides || []).slice(0, 5).map((s, i) => {
      const lines = String(s).split('\n').map(l => l.trim()).filter(Boolean);
      return { kind: 'body', num: String(i + 1).padStart(2, '0'), title: lines[0] || '', points: lines.slice(1) };
    }),
    { kind: 'cta', text: 'Seguimi per altri contenuti!' },
  ];

  let slideHtml = '', gsap = [];

  allSlides.forEach((s, i) => {
    const t = i * SLIDE_DUR;
    const isLast = i === allSlides.length - 1;

    if (s.kind === 'cover') {
      slideHtml += `<div class="slide cover" id="s${i}">
        <h1 class="cover-title">${esc(s.text)}</h1>
        <div class="accent"></div>
      </div>`;
    } else if (s.kind === 'body') {
      const pts = s.points.map(p => `<div class="point">${esc(p)}</div>`).join('');
      slideHtml += `<div class="slide body" id="s${i}">
        <span class="num">${esc(s.num)}</span>
        <h2 class="body-title">${esc(s.title)}</h2>
        <div class="points">${pts}</div>
      </div>`;
    } else {
      slideHtml += `<div class="slide cta" id="s${i}">
        <p class="cta-text">${esc(s.text)}</p>
        <div class="accent"></div>
      </div>`;
    }

    gsap.push(`tl.to('#s${i}',{opacity:1,x:0,duration:${FADE}},${t})`);
    if (!isLast) gsap.push(`tl.to('#s${i}',{opacity:0,x:-60,duration:${FADE}},${t + SLIDE_DUR - FADE})`);
  });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Inter:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden}
#stage{width:1080px;height:1350px;position:relative}
.slide{position:absolute;inset:0;opacity:0;transform:translateX(60px);padding:80px;display:flex;flex-direction:column;justify-content:center}
.cover{background:linear-gradient(135deg,#13111f 0%,#1e1535 100%);align-items:center;text-align:center}
.body{background:#13111f}
.cta{background:linear-gradient(135deg,#1a1035 0%,#13111f 100%);align-items:center;text-align:center}
.cover-title{font-family:'Montserrat',system-ui,sans-serif;font-size:80px;font-weight:900;color:#fff;line-height:1.15}
.accent{width:100px;height:5px;background:linear-gradient(135deg,#a855f7,#ec4899);border-radius:3px;margin-top:28px}
.num{font-family:'Montserrat',sans-serif;font-size:110px;font-weight:900;color:rgba(168,85,247,.35);line-height:1;margin-bottom:8px}
.body-title{font-family:'Montserrat',sans-serif;font-size:54px;font-weight:900;color:#fff;margin-bottom:24px;line-height:1.2}
.points{display:flex;flex-direction:column;gap:14px}
.point{font-family:'Inter',system-ui,sans-serif;font-size:36px;color:rgba(255,255,255,.82);line-height:1.5}
.cta-text{font-family:'Montserrat',sans-serif;font-size:66px;font-weight:900;color:#fff;line-height:1.2}
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
</head><body>
<div id="stage" data-composition-id="carousel-${jobId}" data-start="0" data-width="1080" data-height="1350">
  ${slideHtml}
</div>
<script>
const tl=gsap.timeline({defaults:{ease:'power2.out'}});
${gsap.join(';\n')};
</script>
</body></html>`;
}

// ── Express API ───────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_, res) => res.json({ ok: true, service: 'sketchario-renderer' }));

app.post('/render', async (req, res) => {
  const { content_id, format, hook_text, script, caption, opening_hook, slides } = req.body;
  const jobId = randomUUID().replace(/-/g, '').slice(0, 12);
  const workDir = `/tmp/hf-${jobId}`;

  try {
    mkdirSync(workDir, { recursive: true });

    const data = { hook_text, script, caption, opening_hook, slides };
    const html = format === 'carousel'
      ? buildCarouselHtml(data, jobId)
      : buildReelHtml(data, jobId);

    writeFileSync(join(workDir, 'index.html'), html, 'utf8');

    const outName = `render_${content_id}_${jobId}.mp4`;
    const outPath = join(UPLOADS_DIR, outName);
    const chromiumExe = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

    const { stderr } = await execAsync(
      `${HF_BIN} render index.html`,
      {
        cwd: workDir,
        timeout: 180_000,
        env: {
          ...process.env,
          PUPPETEER_EXECUTABLE_PATH: chromiumExe,
          PUPPETEER_ARGS: '--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --no-first-run --no-zygote',
        },
      }
    );

    const defaultOut = join(workDir, 'out.mp4');
    if (!existsSync(defaultOut)) {
      throw new Error(`HyperFrames non ha prodotto out.mp4. stderr: ${stderr?.slice(0, 400)}`);
    }

    copyFileSync(defaultOut, outPath);
    res.json({ url: `/api/media/file/${outName}`, filename: outName });
  } catch (err) {
    console.error('[renderer] Error:', err.message);
    res.status(500).json({ error: err.message || 'Render fallito' });
  } finally {
    try { await execAsync(`rm -rf ${workDir}`); } catch {}
  }
});

const PORT = parseInt(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`[renderer] In ascolto su :${PORT}`));
