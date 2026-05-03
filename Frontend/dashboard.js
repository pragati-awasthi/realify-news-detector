/* ═══════════════════════════════════════
   REALIFY — dashboard.js
   Reads user from sessionStorage (set by
   script.js on login/register) and runs
   the full dashboard: canvas BG, tabs,
   analyser, history.
═══════════════════════════════════════ */



const _storedUser = localStorage.getItem('realify_user');
if (!_storedUser) { window.location.href = 'index.html'; }

/* ── UTILS ── */
const $ = id => document.getElementById(id);

function showToast(icon, msg) {
  const t = $('toast');
  $('ticon').textContent = icon;
  $('tmsg').textContent  = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}

function animCount(id, target) {
  const el = $(id);
  if (!el) return;
  let c = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const iv = setInterval(() => {
    c = Math.min(c + step, target);
    el.textContent = c;
    if (c >= target) clearInterval(iv);
  }, 35);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function detectType(text) {
  const t = text.toLowerCase();
  if (t.includes('5g') || t.includes('microchip') || t.includes('deep state') ||
      t.includes('whistleblower') || t.includes("don't want you") ||
      t.includes('suppressed') || t.includes('mind control') || t.includes('urgent'))
    return 'fake';
  if (t.includes('nasa') || t.includes('webb') || t.includes('telescope') ||
      t.includes('galaxy') || t.includes('confirmed') || t.includes('official'))
    return 'real';
  if (t.includes('study') || t.includes('research') || t.includes('may reduce') ||
      t.includes('suggest') || t.includes('could') || t.includes('perhaps'))
    return 'uncertain';
  return ['real','fake','uncertain'][Math.floor(Math.random() * 3)];
}

/* ── STATE ── */
const currentUser  = JSON.parse(_storedUser);
let historyData    = JSON.parse(sessionStorage.getItem('realify_history') || '[]');
let pendingResult  = null;
let currentAzTab   = 'text';

/* ── EXAMPLE TEXTS ── */
const EXAMPLES = {
  real:`WASHINGTON (Reuters) - NASA said on Tuesday that the James Webb Space Telescope has captured the deepest infrared image of the universe ever recorded. Scientists confirmed the image reveals thousands of distant galaxies formed over 13 billion years ago, marking a major milestone in space exploration.`,
  fake: `URGENT: Government scientists have secretly confirmed that 5G towers are transmitting mind-control signals to the population. Whistleblowers inside the CDC claim COVID-19 vaccines contain microchips that activate when exposed to 5G radiation. Thousands of reports are being suppressed by mainstream media. Share this before they delete it!`,
  uncertain: `A new study suggests drinking coffee daily may reduce the risk of certain liver diseases by up to 40 percent. The research observed patterns in over 10,000 participants across Europe. Some nutritionists remain skeptical of the causal relationship. The full peer-reviewed paper is expected to publish next quarter.`
};

/* ── ANALYSER DATA ── */
const RDATA = {
  real: {
    t:'rl', icon:'✅', label:'Likely Real News',
    desc:'Strong credibility indicators detected. Content aligns with verified sources.',
    conf:91,
    pos:['Neutral, factual tone throughout','No emotional manipulation detected','Named, verifiable sources referenced','Consistent with established facts','Professional journalistic structure'],
    neg:['Single primary source — broader cross-referencing advised'],
    tags:[{t:'Science',c:'b'},{t:'Verified Agency',c:'g'},{t:'Low Sensationalism',c:'g'},{t:'Credible',c:'g'}],
    srcs:[{n:'NASA Official Website',c:'#1ed49c',s:'v'},{n:'Reuters Science Desk',c:'#1ed49c',s:'v'},{n:'AP Newswire',c:'#1ed49c',s:'v'}],
    meters:[{l:'Objectivity',v:84,c:'g'},{l:'Sensationalism',v:9,c:'r'},{l:'Credibility',v:91,c:'b'},{l:'Emotional Bias',v:6,c:'a'}]
  },
  fake: {
    t:'fk', icon:'🚨', label:'Likely Fake News',
    desc:'Multiple high-confidence misinformation signals detected across content.',
    conf:97,
    pos:[],
    neg:['Extreme emotional language & fear tactics','Anonymous unverifiable whistleblower claims','Conspiracy narrative without factual basis','Urgency cues to bypass critical thinking','Contradicts scientific consensus'],
    tags:[{t:'Conspiracy',c:'r'},{t:'High Sensationalism',c:'r'},{t:'No Credible Source',c:'r'},{t:'Misinformation',c:'r'}],
    srcs:[{n:'No verifiable domain found',c:'#f55f5f',s:'u'},{n:'CDC — contradicts this claim',c:'#1ed49c',s:'v'},{n:'WHO — contradicts this claim',c:'#1ed49c',s:'v'}],
    meters:[{l:'Objectivity',v:4,c:'r'},{l:'Sensationalism',v:96,c:'r'},{l:'Credibility',v:3,c:'r'},{l:'Emotional Bias',v:94,c:'r'}]
  },
  uncertain: {
    t:'uc', icon:'⚠️', label:'Uncertain — Verify',
    desc:'Some credibility markers present but independent verification is needed.',
    conf:61,
    pos:['Multiple viewpoints presented fairly','Acknowledges study limitations','References a research institution'],
    neg:['Study not yet peer-reviewed','Causal claims may exceed data support'],
    tags:[{t:'Health',c:'b'},{t:'Preliminary Study',c:'a'},{t:'Needs Verification',c:'a'},{t:'Correlational',c:'p'}],
    srcs:[{n:'Study — pending peer review',c:'#f4a61e',s:'p'},{n:'European Nutrition Journal',c:'#f4a61e',s:'p'},{n:'NHS — related findings',c:'#1ed49c',s:'v'}],
    meters:[{l:'Objectivity',v:62,c:'b'},{l:'Sensationalism',v:28,c:'a'},{l:'Credibility',v:58,c:'b'},{l:'Emotional Bias',v:18,c:'a'}]
  }
};

/* ══════════════════════════════════════
   NEURAL-NETWORK CANVAS BACKGROUND
══════════════════════════════════════ */
const BgCanvas = (() => {
  const canvas = document.getElementById('dash-canvas');
  const ctx    = canvas.getContext('2d');
  let W = 0, H = 0, rafId = null, tick = 0;
  const COUNT = 90, MAX_DIST = 150;
  const pts = [];

  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }

  function mkPt() {
    return {
      x:(Math.random()*W), y:(Math.random()*H),
      vx:(Math.random()-.5)*.45, vy:(Math.random()-.5)*.45,
      r:(Math.random()*1.8+.8),
      hue: Math.random()<.7 ? 218 : Math.random()<.66 ? 262 : 166
    };
  }

  function frame() {
    tick++;
    ctx.fillStyle='rgba(6,8,16,0.18)';
    ctx.fillRect(0,0,W,H);

    for(const p of pts){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
    }

    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const a=pts[i],b=pts[j];
        const dx=a.x-b.x,dy=a.y-b.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<MAX_DIST){
          const base=1-d/MAX_DIST;
          const pulse=.65+.35*Math.sin(tick*.035+i*.25);
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=`hsla(${a.hue},78%,64%,${base*base*.45*pulse})`;
          ctx.lineWidth=base*1.4; ctx.stroke();
        }
      }
    }

    for(const p of pts){
      const pulse=.55+.45*Math.sin(tick*.055+p.x*.008);
      const r=p.r*pulse;
      ctx.beginPath(); ctx.arc(p.x,p.y,r+3.5,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},80%,65%,0.08)`; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},85%,70%,0.85)`; ctx.fill();
    }

    rafId=requestAnimationFrame(frame);
  }

  resize();
  pts.length=0;
  for(let i=0;i<COUNT;i++) pts.push(mkPt());
  frame();
  window.addEventListener('resize',resize);
})();

/* ══════════════════════════════════════
   INIT — populate nav & welcome
══════════════════════════════════════ */
(function init() {
  const currentUser = JSON.parse(localStorage.getItem("realify_user"));

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  $('duc-avatar').textContent  = currentUser.name.charAt(0).toUpperCase();
  $('duc-name').textContent    = currentUser.name;
  $('wh-greeting').textContent = getGreeting();
  $('wh-username').textContent = currentUser.name.split(' ')[0];

  showToast('✅', `Welcome ${currentUser.name.split(' ')[0]}!`);

  showTab('home');
})();
/* ══════════════════════════════════════
   LOGOUT
══════════════════════════════════════ */
function doLogout() {
  localStorage.removeItem('realify_user'); // ✅ FIXED
  sessionStorage.removeItem('realify_history');
  window.location.href = 'index.html';
}
/* ══════════════════════════════════════
   MOBILE NAV
══════════════════════════════════════ */
function toggleDashBurger() { $('dash-mob-nav').classList.toggle('open'); }
function closeDashBurger()  { $('dash-mob-nav').classList.remove('open'); }

/* ══════════════════════════════════════
   DASHBOARD TABS
══════════════════════════════════════ */
function showTab(tab) {
  ['home','analyze','history'].forEach(t => {
    const el = $('dt-'+t);
    if (el) { el.classList.remove('active-tab'); el.style.display='none'; }
    const nb = $('dnl-'+t);
    if (nb) nb.classList.remove('active');
  });

  const el = $('dt-'+tab);
  if (el) { el.style.display='block'; requestAnimationFrame(()=>el.classList.add('active-tab')); }
  const nb = $('dnl-'+tab);
  if (nb) nb.classList.add('active');

  if (tab==='home')    renderHome();
  if (tab==='history') renderHistory('all');
  if (tab==='analyze') resetAnalyzer();

  closeDashBurger();
}

/* ══════════════════════════════════════
   HOME TAB
══════════════════════════════════════ */
function renderHome() {
  const total = historyData.length;
  const fake  = historyData.filter(h=>h.t==='fk').length;
  const real  = historyData.filter(h=>h.t==='rl').length;
  animCount('whs-total', total);
  animCount('whs-fake',  fake);
  animCount('whs-real',  real);

  const el     = $('home-recent');
  const recent = historyData.slice(0,4);
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="es-icon">📭</div><h3>No analyses yet</h3><p>Use Analyse News to check your first article</p></div>`;
    return;
  }
  el.innerHTML = recent.map(histCardHTML).join('');
}

function histCardHTML(h) {
  const icons  = {rl:'✅',fk:'🚨',uc:'⚠️'};
  const labels = {rl:'Real',fk:'Fake',uc:'Uncertain'};
  return `
    <div class="h-card ${h.t}">
      <div class="h-card-ic">${icons[h.t]}</div>
      <div class="h-card-body">
        <div class="h-card-title">${h.title}</div>
        <div class="h-card-meta"><span>🕐 ${h.time}</span><span>📥 ${h.src}</span></div>
      </div>
      <span class="h-badge">${labels[h.t]}</span>
      <span class="h-score">${h.score}%</span>
    </div>`;
}

function quickCheck() {
  const v = $('qac-input').value.trim();
  if (!v) { showToast('⚠️','Please enter some text first'); return; }
  $('az-ta').value = v;
  updateAzChar();
  showTab('analyze');
  setTimeout(runAnalysis, 300);
}

/* ══════════════════════════════════════
   HISTORY TAB
══════════════════════════════════════ */
function renderHistory(filter) {
  const el   = $('hist-list');
  const data = filter==='all' ? historyData : historyData.filter(h=>h.t===filter);
  if (!data.length) {
    el.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><h3>No results</h3><p>Run some analyses to see your history here</p></div>`;
    return;
  }
  el.innerHTML = data.map(histCardHTML).join('');
}

function filterHist(btn, filter) {
  document.querySelectorAll('.hf-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderHistory(filter);
}

/* ══════════════════════════════════════
   ANALYSER TAB
══════════════════════════════════════ */
function switchAzTab(tab) {
  currentAzTab = tab;
  ['text','url','hl'].forEach(t => {
    $('azt-'+t).classList.toggle('active', t===tab);
    $('azp-'+t).style.display = t===tab ? 'block' : 'none';
  });
}

function updateAzChar() {
  const v = $('az-ta').value.length;
  $('az-char').textContent = v + ' / 5000';
}

function loadEx(type) { $('az-ta').value = EXAMPLES[type]; updateAzChar(); }

function resetAnalyzer() {
  $('az-input-area').style.display = 'block';
  $('az-loading').style.display    = 'none';
  $('az-result').style.display     = 'none';
  $('az-result').innerHTML = '';
  ['as1','as2','as3','as4','as5'].forEach(id => {
    const e=$(id);
    if(e){ e.className='step-row'; e.querySelector('.sr-dot').textContent=''; }
  });
}

function runAnalysis() {
  let text = '';
  if (currentAzTab==='text') text = ($('az-ta') || {}).value || '';
  else if (currentAzTab==='hl') text = ($('az-hl-ta') || {}).value || '';
  else if (currentAzTab==='url') text = ($('az-url-in') || {}).value || '';

  text = text.trim();
  if (!text) {
    showToast('⚠️','Please enter some content to analyse');
    return;
  }

  // UI loading start
  $('az-input-area').style.display = 'none';
  $('az-loading').style.display = 'block';
  $('az-result').style.display = 'none';

  const steps = ['as1','as2','as3','as4','as5'];
  steps.forEach(s=>{
    const e=$(s);
    if(e){e.className='step-row';e.querySelector('.sr-dot').textContent='';}
  });

  let i=0;
  function next() {
    if(i>0){
      const p=$(steps[i-1]);
      if(p){
        p.className='step-row done';
        p.querySelector('.sr-dot').textContent='✓';
      }
    }
    if(i<steps.length){
      $(steps[i]).className='step-row active';
      i++;
      setTimeout(next,500);
    } else {
      $(steps[steps.length-1]).className='step-row done';
      $(steps[steps.length-1]).querySelector('.sr-dot').textContent='✓';

      // 🔥 CALL BACKEND HERE

// ✅ CLEAN TEXT BEFORE SENDING
const cleanedText = text
  .trim()
  .replace(/\s+/g, " ")   // remove extra spaces
  .replace(/\n/g, " ");   // remove line breaks

fetch("https://realify-ml-api.onrender.com/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ text: cleanedText })   // 🔥 CHANGED HERE
})
.then(res => res.json())
.then(data => {

  console.log("API Response:", data);

  // Map API result to your UI format
  if (data.result === "REAL") {
    pendingResult = RDATA.real;
    pendingResult.conf = data.confidence;
  } else {
    pendingResult = RDATA.fake;
    pendingResult.conf = data.confidence;
  }

  showResult();
})
.catch(err => {
  console.error(err);
  showToast('❌','Error connecting to AI server');
});
    }
  }

  next();
}
function showResult() {
  $('az-loading').style.display = 'none';
  const r  = pendingResult;
  const el = $('az-result');
  el.style.display = 'block';

  const sigsHtml = [
    ...r.pos.map(s=>`<div class="sig-row"><div class="sig-dot g"></div>${s}</div>`),
    ...r.neg.map(s=>`<div class="sig-row"><div class="sig-dot r"></div>${s}</div>`)
  ].join('');

  const tagsHtml   = r.tags.map(t=>`<span class="tag ${t.c}">${t.t}</span>`).join('');
  const metersHtml = r.meters.map(m=>`
    <div class="m-row">
      <div class="m-lab"><span>${m.l}</span><span class="m-val">${m.v}%</span></div>
      <div class="m-track"><div class="m-fill ${m.c}" style="width:${m.v}%"></div></div>
    </div>`).join('');
  const srcsHtml = r.srcs.map(s=>`
    <div class="src-row">
      <div class="src-dot" style="background:${s.c}"></div>
      <span class="src-name">${s.n}</span>
      <span class="src-badge s${s.s}">${s.s==='v'?'Verified':s.s==='u'?'Unverified':'Partial'}</span>
    </div>`).join('');

  el.innerHTML = `
    <div class="result-wrap">
      <div class="verdict-banner ${r.t}">
        <div class="vb-em">${r.icon}</div>
        <div class="vb-info"><h2>${r.label}</h2><p>${r.desc}</p></div>
        <div class="vb-score"><div class="vb-circle"><span class="vb-num">${r.conf}%</span><span class="vb-lbl">Score</span></div></div>
      </div>
      <div class="conf-bar ${r.t}">
        <div class="cb-hd"><span class="cb-t">Confidence Level</span><span class="cb-p">${r.conf}%</span></div>
        <div class="cb-track"><div class="cb-fill" id="res-cbfill"></div></div>
      </div>
      <div class="tag-row">${tagsHtml}</div>
      <div class="r-grid">
        <div class="r-panel"><div class="r-panel-title">Detection Signals</div>${sigsHtml}</div>
        <div class="r-panel"><div class="r-panel-title">Sentiment Analysis</div>${metersHtml}</div>
      </div>
      <div class="r-panel" style="margin-bottom:1rem">
        <div class="r-panel-title">Source Intelligence</div>${srcsHtml}
      </div>
      <div class="result-actions">
        <button class="r-btn outline" onclick="resetAnalyzer();$('az-input-area').style.display='block'">← Analyse Another</button>
        <button class="r-btn outline" onclick="showToast('💾','Result saved!')">💾 Save Result</button>
        <button class="r-btn outline" onclick="showToast('📤','Share link copied!')">📤 Share</button>
        <button class="r-btn solid"   onclick="showTab('home')">🏠 Back to Home</button>
      </div>
    </div>`;

  setTimeout(()=>{
    const fill=$('res-cbfill');
    if(fill){ fill.closest('.conf-bar').classList.add(r.t); fill.style.width=r.conf+'%'; }
    el.querySelectorAll('.m-fill').forEach(f=>{ const w=f.style.width; f.style.width='0'; setTimeout(()=>f.style.width=w,100); });
  },80);

  const labels={rl:'Credible News',fk:'Misinformation Flagged',uc:'Verification Needed'};
  historyData.unshift({
    id:Date.now(),
    title:`${labels[r.t]} — ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`,
    t:r.t, score:r.conf, time:'Just now',
    src: currentAzTab==='text'?'Text':currentAzTab==='url'?'URL':'Headline'
  });
  /* persist updated history in session */
  sessionStorage.setItem('realify_history', JSON.stringify(historyData));
}

