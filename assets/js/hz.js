// halo · paired with zcash. One module: the intro, the nav, live prices, the launch, the coins, shield, the FAQ.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const S = { zec: null, coins: [], filter: 'all', img: null };

async function api(op, { body, qs = '' } = {}) {
  const r = await fetch('/api/' + op + qs, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' });
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok || !j || j.ok === false) throw new Error((j && j.error) || 'Something went wrong. Try again in a moment.');
  return j;
}
const toast = (t) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 1800); };
const copy = async (t, what = 'Copied') => { try { await navigator.clipboard.writeText(t); toast(what); } catch { toast('Copy failed'); } };
const usd = n => n == null ? '—' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + n.toFixed(n < 10 ? 2 : 0);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const short = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';

// ---------------------------------------------------------------- intro: no words, about three seconds, any key or click skips
function intro() {
  const el = $('#intro'); let done = false;
  const end = () => {
    if (done) return; done = true;
    el.classList.add('fly');
    const w = el.querySelector('.iwrap'), b = $('.brand svg').getBoundingClientRect(), r = w.getBoundingClientRect();
    if (b.width && r.height) { const s = b.height / r.height * .99, tx = b.left + b.width * (210 / 1582) - (r.left + r.width / 2), ty = b.top + b.height * (270 / 556) - (r.top + r.height / 2);
      w.style.transition = 'transform .75s cubic-bezier(.7,0,.2,1)'; w.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; }
    setTimeout(() => { el.classList.add('out'); document.body.classList.remove('intro-on'); reveal(); typed(); }, reduce ? 0 : 560);
    setTimeout(() => el.remove(), 1400);
  };
  let seen = false; try { seen = sessionStorage.getItem('hz:intro') === '1'; sessionStorage.setItem('hz:intro', '1'); } catch {}
  if (reduce || seen || location.hash.length > 1) { el.style.transition = 'none'; return end(); }
  setTimeout(end, 2750);
  el.addEventListener('click', end); addEventListener('keydown', end, { once: true }); addEventListener('wheel', end, { once: true, passive: true });
}

// ---------------------------------------------------------------- reveal on scroll, nav state
let io;
function reveal() {
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); const h2 = e.target.matches('.sh') && e.target.querySelector('h2'); if (h2 && !reduce) scramble(h2); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal:not(.in)').forEach(e => io.observe(e));
}
function nav() {
  const n = $('#nav'), links = $$('.links a'), secs = links.map(a => $(a.getAttribute('href')));
  const on = () => {
    n.classList.toggle('sc', scrollY > 8);
    let cur = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
  };
  addEventListener('scroll', on, { passive: true }); on();
}

// ---------------------------------------------------------------- live prices and the tape (real numbers or a dash)
async function prices() {
  try { S.zec = await api('zec'); } catch { S.zec = S.zec || null; }
  const z = S.zec || {};
  $('#zecNav').textContent = z.zecUsd ? '$' + z.zecUsd.toFixed(2) : '—';
  const c = $('#zecChg'); c.textContent = z.zecChange == null ? '' : (z.zecChange >= 0 ? '▲' : '▼') + Math.abs(z.zecChange).toFixed(1) + '%'; c.className = z.zecChange >= 0 ? 'up' : 'dn';
  $('#pvzec').textContent = z.zecUsd ? '$' + z.zecUsd.toFixed(2) : '—';
  tape();
}
function tape() {
  const z = S.zec || {}, n = S.coins.length;
  const items = [
    ['ZEC', z.zecUsd ? '$' + z.zecUsd.toFixed(2) : '—'], ['ZEC 24h', z.zecChange == null ? '—' : (z.zecChange >= 0 ? '+' : '') + z.zecChange.toFixed(2) + '%'],
    ['SOL', z.solUsd ? '$' + z.solUsd.toFixed(2) : '—'], ['coins on halo', S.coinsLoaded ? String(n) : '—'], ['quote asset', 'ZEC'], ['fees to holders', '1%'],
    ['cost to launch', '0 SOL'], ['wallet needed', 'none'], ['paid out by', 'pump.fun'],
  ];
  [...S.coins].filter(c => c.mcapUsd != null).sort((a, b) => b.mcapUsd - a.mcapUsd).slice(0, 6).forEach(c => items.push(['$' + c.symbol, usd(c.mcapUsd)]));
  const one = items.map(([k, v]) => `<span>${esc(k)} <b${k === 'quote asset' || k === 'fees to holders' ? ' class="gd"' : ''}>${esc(v)}</b></span>`).join('');
  $('#track').innerHTML = one + one;
}

// ---------------------------------------------------------------- the launch
function bindLaunch() {
  const f = { name: $('#fname'), sym: $('#fsym'), desc: $('#fdesc'), x: $('#fx'), tg: $('#ftg'), web: $('#fweb') };
  const pv = () => {
    const name = f.name.value.trim(), sym = f.sym.value.trim().replace(/^\$/, '').toUpperCase();
    $('#pvname').textContent = name || 'Your coin'; $('#pvsym').textContent = '$' + (sym || 'TICKER'); $('#pvsym2').textContent = sym || 'TICKER';
    $('#pvdesc').textContent = f.desc.value.trim() || 'Your description shows up here.';
    $$('.cnt').forEach(c => { const i = $('#' + c.dataset.for); c.textContent = i.value.length + '/' + i.maxLength; });
  };
  Object.values(f).forEach(i => i.addEventListener('input', pv));
  f.sym.addEventListener('input', () => { const p = f.sym.selectionStart; f.sym.value = f.sym.value.replace(/[^A-Za-z0-9._-]/g, '').toUpperCase(); f.sym.setSelectionRange(p, p); pv(); });
  const drop = $('#drop'), file = $('#file');
  drop.addEventListener('click', e => { if (e.target !== file) file.click(); });
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => { const x = e.dataTransfer.files[0]; if (x) image(x); });
  file.addEventListener('change', () => { if (file.files[0]) image(file.files[0]); });
  $('#lform').addEventListener('submit', e => { e.preventDefault(); launch(f); });
  pv();
}
// redraw the picture on a canvas: what leaves the device is pixels, never the file's EXIF, GPS or editor data
async function image(file) {
  const err = $('#lerr'); err.textContent = '';
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { err.textContent = 'Use a PNG, JPG, WebP or GIF.'; return; }
  if (file.size > 15e6) { err.textContent = 'That picture is over 15 MB.'; return; }
  try {
    const bmp = await createImageBitmap(file);
    let side = Math.min(1000, Math.max(bmp.width, bmp.height)), out = null;
    for (let tries = 0; tries < 4 && !out; tries++) {
      const k = side / Math.max(bmp.width, bmp.height), w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(bmp, 0, 0, w, h);
      for (const [t, q] of [['image/png'], ['image/webp', .92], ['image/jpeg', .9]]) { const u = c.toDataURL(t, q); if (u.startsWith('data:' + t) && u.length * .75 < 1.4e6) { out = u; break; } }
      side = Math.round(side * .75);
    }
    if (!out) throw new Error();
    S.img = out; $('#dropimg').src = out; $('#drop').classList.add('has');
    $('#pvimg').innerHTML = `<img src="${out}" alt="">`;
    $('#imgnote').textContent = `Redrawn on your device · ${Math.round(out.length * .75 / 1024)} KB · hidden data removed`;
    step(0, 'ok');
  } catch { err.textContent = 'That picture could not be read. Try another one.'; }
}
function step(i, st) { const li = $(`#steps li[data-s="${i}"]`); if (li) { li.classList.remove('run', 'ok', 'bad'); if (st) li.classList.add(st); } }
function pow(challenge, bits, onP) {
  return new Promise((res, rej) => {
    const w = new Worker('/assets/js/pow.js');
    w.onmessage = e => { if (e.data.done) { w.terminate(); res(e.data); } else onP(e.data); };
    w.onerror = () => { w.terminate(); rej(new Error('Proof of work failed on this device.')); };
    w.postMessage({ challenge, bits });
  });
}
async function launch(f) {
  const err = $('#lerr'), btn = $('#lbtn'); err.textContent = '';
  const name = f.name.value.replace(/\s+/g, ' ').trim(), symbol = f.sym.value.trim().replace(/^\$/, '');
  if (!S.img) { err.textContent = 'Add a picture first.'; $('#drop').focus(); return; }
  if (!name) { err.textContent = 'Give it a name.'; f.name.focus(); return; }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,9}$/.test(symbol)) { err.textContent = 'The ticker needs 1 to 10 letters or numbers.'; f.sym.focus(); return; }
  btn.disabled = true; btn.innerHTML = 'Launching…'; $('#done').hidden = true;
  [1, 2, 3].forEach(i => step(i)); step(0, 'ok');
  try {
    step(1, 'run');
    const ch = await api('pow'); const need = 2 ** ch.bits;
    const p = await pow(ch.challenge, ch.bits, d => { $('#powpct').textContent = Math.min(99, Math.round(d.tries / need * 100)) + '%'; });
    $('#powpct').textContent = (p.ms / 1000).toFixed(1) + 's'; step(1, 'ok'); step(2, 'run');
    const r = await api('launch', { body: { name, symbol, description: f.desc.value.trim(), x: f.x.value.trim(), tg: f.tg.value.trim(), web: f.web.value.trim(), image: S.img, pow: { challenge: ch.challenge, nonce: p.nonce } } });
    if (r.status === 'failed') throw new Error('The launch did not land on chain. Nothing was charged to you. Try again.');
    step(2, 'ok'); step(3, 'ok');
    $('#dmint').textContent = 'mint ' + r.mint;
    $('#dpump').href = 'https://pump.fun/coin/' + r.mint; $('#dtx').href = 'https://solscan.io/tx/' + r.sig;
    $('#dcopy').onclick = () => copy(r.mint, 'Address copied');
    const tw = 'I just launched $' + symbol.toUpperCase() + ' on halo. Paired with Zcash.\nhttps://pump.fun/coin/' + r.mint;
    $('#dshare').href = 'https://x.com/intent/post?text=' + encodeURIComponent(tw);
    S.mine = r.mint; $('#done').hidden = false; toast('Launched'); burst($('#done'));
    loadCoins();
  } catch (e) {
    $$('#steps li.run').forEach(li => { li.classList.remove('run'); li.classList.add('bad'); });
    err.textContent = e.message;
  } finally { btn.disabled = false; btn.innerHTML = 'Launch it free <span class="arr">→</span>'; }
}


function burst(from) {
  if (reduce) return; const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 42; i++) { const d = document.createElement('i'); d.className = 'burst'; const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
    d.style.setProperty('--x0', cx + 'px'); d.style.setProperty('--y0', cy + 'px'); d.style.setProperty('--x1', cx + Math.cos(a) * v + 'px'); d.style.setProperty('--y1', cy + Math.sin(a) * v + 180 + 'px'); d.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    d.style.background = i % 3 ? '#f4b728' : '#f6f2e8'; const s = 6 + Math.random() * 8; d.style.width = d.style.height = s + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 1500); }
}

// ---------------------------------------------------------------- the coins
async function loadCoins() {
  const g = $('#cgrid'); if (!S.coinsLoaded) g.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  try { const j = await api('coins'); const before = new Set(S.coins.map(c => c.mint)), fresh = (j.coins || []).filter(c => !before.has(c.mint));
    if (S.coinsLoaded && fresh.length && fresh[0].mint !== S.mine) toast('New coin: $' + fresh[0].symbol);
    S.coins = j.coins || []; S.coinsLoaded = true; S.coinErr = null; }
  catch (e) { S.coinErr = e.message; }
  renderCoins(); tape();
}
function stats() {
  const el = $('#cstats'), n = S.coins.length; if (!S.coinsLoaded || !n) { el.innerHTML = ''; return; }
  const live = S.coins.filter(c => c.mcapUsd != null), sum = live.reduce((a, c) => a + c.mcapUsd, 0), grad = S.coins.filter(c => c.graduated).length;
  el.innerHTML = '<span>coins <b>' + n + '</b></span><span>combined market cap <b>' + usd(live.length ? sum : null) + '</b></span><span>graduated <b>' + grad + '</b></span><span>press <kbd>/</kbd> to search</span>';
}
function renderCoins() {
  stats();
  const g = $('#cgrid'), q = $('#csearch').value.trim().toLowerCase(), sort = $('#csort').value;
  if (S.coinErr && !S.coins.length) { g.innerHTML = `<div class="empty"><svg viewBox="0 0 420 540"><use href="#mark"/></svg><p>${esc(S.coinErr)}</p><button class="btn ghost sm" id="retry">Try again</button></div>`; $('#retry').onclick = loadCoins; return; }
  let list = S.coins.filter(c => S.filter === 'all' || (S.filter === 'grad' ? c.graduated : !c.graduated));
  if (q) list = list.filter(c => (c.name + ' ' + c.symbol).toLowerCase().includes(q));
  if (sort === 'mcap') list.sort((a, b) => (b.mcapUsd || 0) - (a.mcapUsd || 0));
  if (sort === 'prog') list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
  if (!list.length) {
    g.innerHTML = `<div class="empty"><svg viewBox="0 0 420 540"><use href="#mark"/></svg><p>${S.coins.length ? 'Nothing matches that.' : 'No coins yet. The first one could be yours.'}</p><a class="btn gold sm" href="#launch">Launch a coin</a></div>`;
    return;
  }
  g.innerHTML = list.map(c => {
    const pct = c.graduated ? 100 : Math.round((c.progress || 0) * 100);
    return `<article class="card coin" data-mint="${esc(c.mint)}" tabindex="0"><div class="ci" style="background-image:url('${esc(c.img)}')"></div><div class="cb">
      <div class="ct"><b>${esc(c.name)}</b><span class="mono">$${esc(c.symbol)}</span></div>
      <div class="cm mono"><span>market cap</span><span>${usd(c.mcapUsd)}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="cm mono"><span>${c.graduated ? 'graduated' : 'curve'}</span><span>${pct}%</span></div>
      <div class="cl mono"><a href="https://pump.fun/coin/${esc(c.mint)}" target="_blank" rel="noopener">pump.fun</a><a href="https://solscan.io/token/${esc(c.mint)}" target="_blank" rel="noopener">solscan</a>${c.x ? `<a href="${esc(c.x)}" target="_blank" rel="noopener">X</a>` : ''}<a href="#" data-copy="${esc(c.mint)}">${short(c.mint)}</a></div>
    </div></article>`;
  }).join('');
}

const ago = t => { const s = (Date.now() - new Date(t).getTime()) / 1000; return s < 90 ? 'just now' : s < 3600 ? Math.round(s / 60) + 'm ago' : s < 86400 ? Math.round(s / 3600) + 'h ago' : Math.round(s / 86400) + 'd ago'; };
function openCoin(mint) {
  const c = S.coins.find(x => x.mint === mint); if (!c) return;
  const pct = c.graduated ? 100 : Math.round((c.progress || 0) * 100);
  $('#cmimg').style.backgroundImage = `url('${c.img}')`; $('#cmname').textContent = c.name; $('#cmsym').textContent = '$' + c.symbol; $('#cmpc').textContent = '$' + c.symbol;
  $('#cmdesc').textContent = c.description || 'No description.'; $('#cmmc').textContent = usd(c.mcapUsd); $('#cmz').textContent = c.mcapZec == null ? '—' : c.mcapZec.toLocaleString() + ' ZEC';
  $('#cmpr').textContent = c.graduated ? 'graduated' : pct + '%'; $('#cmat').textContent = c.at ? ago(c.at) : '—'; $('#cmbar').style.width = pct + '%'; $('#cmca').textContent = c.mint;
  $('#cmcopy').onclick = () => copy(c.mint, 'Address copied');
  const tw = 'Look at $' + c.symbol + ' on halo. Paired with Zcash.\nhttps://pump.fun/coin/' + c.mint;
  const L = [['pump.fun', 'https://pump.fun/coin/' + c.mint, 1], ['Solscan', 'https://solscan.io/token/' + c.mint], c.x && ['X', c.x], c.tg && ['Telegram', c.tg], c.web && ['Website', c.web], ['Share on X', 'https://x.com/intent/post?text=' + encodeURIComponent(tw)]].filter(Boolean);
  $('#cmlinks').innerHTML = L.map(([t, u, g]) => `<a class="btn ${g ? 'gold' : 'ghost'} sm" href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('');
  $('#cm').showModal();
}
function bindCoins() {
  $$('#ctabs button').forEach(b => b.onclick = () => { $$('#ctabs button').forEach(x => x.classList.toggle('on', x === b)); S.filter = b.dataset.f; renderCoins(); });
  $('#csearch').addEventListener('input', renderCoins); $('#csort').addEventListener('change', renderCoins);
  $('#cgrid').addEventListener('click', e => { const a = e.target.closest('[data-copy]'); if (a) { e.preventDefault(); copy(a.dataset.copy, 'Address copied'); return; } if (e.target.closest('a')) return; const card = e.target.closest('.coin'); if (card) openCoin(card.dataset.mint); });
  $('#cmx').onclick = () => $('#cm').close(); $('#cm').addEventListener('click', e => { if (e.target === $('#cm')) $('#cm').close(); });
}

// ---------------------------------------------------------------- shield: ZEC on Solana → a shielded Zcash address, through NEAR Intents
const ZADDR = /^(u1[02-9ac-hj-np-z]{100,}|zs1[02-9ac-hj-np-z]{75}|t1[1-9A-HJ-NP-Za-km-z]{33}|t3[1-9A-HJ-NP-Za-km-z]{33})$/;
const SOLADDR = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
function bindShield() {
  let timer = null;
  $('#sform').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#serr'), btn = $('#sbtn'); err.textContent = '';
    const amount = Number(String($('#samt').value).replace(',', '.')), to = $('#sto').value.trim(), ref = $('#sref').value.trim();
    if (!(amount > 0) || amount > 10000) { err.textContent = 'Enter an amount of ZEC.'; return; }
    if (!ZADDR.test(to)) { err.textContent = 'That is not a Zcash address (u1…, zs1… or t1…).'; return; }
    if (!SOLADDR.test(ref)) { err.textContent = 'The refund address should be a Solana address.'; return; }
    btn.disabled = true; btn.textContent = 'Asking the solvers…';
    try {
      const q = await api('shieldquote', { body: { amount, recipient: to, refundTo: ref } });
      $('#qin').textContent = q.amountIn + ' ZEC (Solana)'; $('#qout').textContent = q.amountOut + ' ZEC'; $('#qtime').textContent = q.timeEstimate ? '~' + Math.ceil(q.timeEstimate / 60) + ' min' : '—';
      $('#qdep').textContent = q.depositAddress; $('#qcopy').onclick = () => copy(q.depositAddress, 'Deposit address copied');
      $('#qstat').textContent = 'waiting for your deposit'; $('#squote').hidden = false;
      clearInterval(timer); timer = setInterval(async () => {
        try { const s = await api('shieldstatus', { qs: '?deposit=' + encodeURIComponent(q.depositAddress) }); $('#qstat').textContent = s.label; if (s.final) clearInterval(timer); } catch {}
      }, 9000);
    } catch (x) { err.textContent = x.message; }
    finally { btn.disabled = false; btn.innerHTML = 'Get a quote <span class="arr">→</span>'; }
  });
}

// ---------------------------------------------------------------- faq: one open at a time
function bindFaq() { $$('#faqlist details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('#faqlist details').forEach(o => { if (o !== d) o.open = false; }); })); }


// ---------------------------------------------------------------- the console: a session types itself, then it's yours
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TB = () => $('#tbody');
function tl(html, cls = '') { const d = document.createElement('div'); d.className = 'tl ' + cls; d.innerHTML = html; TB().appendChild(d); TB().scrollTop = TB().scrollHeight; return d; }
async function typeCmd(cmd) {
  const d = tl('<span class="tp">halo:~$</span> <span class="tc"></span>'), c = d.querySelector('.tc');
  for (const ch of cmd) { c.textContent += ch; TB().scrollTop = TB().scrollHeight; await sleep(reduce ? 0 : 26 + Math.random() * 46); }
  await sleep(reduce ? 0 : 240);
}
async function out(lines) { for (const l of lines) { tl(l); await sleep(reduce ? 0 : 55); } }
const dots = (k, v, n = 18) => `  ${k} <span style="color:var(--dim2)">${'.'.repeat(Math.max(2, n - k.length))}</span> ${v}`;
const CMDS = {
  help: () => innerWidth < 760 ? ['  <b>launch</b>   open the launcher', '  <b>coins</b>    the newest coins', '  <b>price</b>    live ZEC and SOL', '  <b>pair</b>     paired with ZEC?', '  <b>fees</b>     where the 1% goes', '  <b>shield</b>   ZEC → shielded', '  <b>privacy</b>  what halo never sees', '  <b>status</b>   the engine', '  <b>clear</b>    clear the screen'] : ['  <b>launch</b>   open the launcher        <b>coins</b>    the newest coins', '  <b>price</b>    live ZEC and SOL         <b>pair</b>     what paired with ZEC means', '  <b>fees</b>     where the 1% goes        <b>shield</b>   ZEC on Solana → shielded', '  <b>privacy</b>  what halo never sees     <b>status</b>   the engine at a glance', '  <b>clear</b>    clear the screen'],
  status: () => { const z = S.zec || {}; return [dots('pair', '<span class="g">COIN/ZEC</span>'), dots('cost to launch', '<b>0 SOL</b>, paid by halo'), dots('wallet', '<b>not needed</b>'), dots('creator fee', '<b>1%</b> → holders, in ZEC'), dots('zec', z.zecUsd ? `<b>$${z.zecUsd.toFixed(2)}</b> ${z.zecChange == null ? '' : `<span class="${z.zecChange >= 0 ? 'ok' : 'no'}">${z.zecChange >= 0 ? '▲' : '▼'}${Math.abs(z.zecChange).toFixed(2)}%</span>`}` : '—'), dots('coins on halo', S.coinsLoaded ? `<b>${S.coins.length}</b>` : '—')]; },
  price: () => { const z = S.zec || {}; return [`  ZEC  <b>${z.zecUsd ? '$' + z.zecUsd.toFixed(2) : '—'}</b>  ${z.zecChange == null ? '' : `<span class="${z.zecChange >= 0 ? 'ok' : 'no'}">${z.zecChange >= 0 ? '+' : ''}${z.zecChange.toFixed(2)}% 24h</span>`}`, `  SOL  <b>${z.solUsd ? '$' + z.solUsd.toFixed(2) : '—'}</b>`]; },
  coins: () => S.coins.length ? [...S.coins].slice(0, 6).map(c => dots('$' + c.symbol, `<b>${esc(c.name)}</b> · ${usd(c.mcapUsd)} · <a href="https://pump.fun/coin/${esc(c.mint)}" target="_blank" rel="noopener">pump.fun</a>`)) : ['  no coins yet. type <b>launch</b> and make the first one.'],
  pair: () => ['  on pump.fun a curve is usually priced in SOL.', '  on halo every curve is priced in <span class="g">ZEC</span>: each buy and sell is a trade against ZEC.'],
  fees: () => ['  each coin is created with a <b>1%</b> creator fee and no creator wallet.', '  pump.fun pays that fee to the coin\'s <span class="g">holders, in ZEC</span>. nobody claims it.'],
  privacy: () => ['  no accounts. no cookies. no trackers.', '  your picture is redrawn on your device before upload, so its hidden data stays with you.', '  your browser only ever talks to halo.'],
  launch: () => { $('#launch').scrollIntoView(); setTimeout(() => $('#fname').focus({ preventScroll: true }), 900); return ['  opening the launcher…']; },
  shield: () => { $('#shield').scrollIntoView(); return ['  opening shield…']; },
  clear: () => { TB().innerHTML = ''; return []; },
  whoami: () => ['  nobody. halo never asks.'],
  sudo: () => ['  nice try. there is no root here.'],
};
CMDS.ls = CMDS.help; CMDS['?'] = CMDS.help;
async function run(raw) {
  const cmd = raw.trim().toLowerCase().split(/\s+/)[0]; tl(`<span class="tp">halo:~$</span> <span class="tc">${esc(raw)}</span>`);
  if (!cmd) return;
  const f = CMDS[cmd]; await out(f ? f() : [`  <span class="no">${esc(cmd)}: command not found.</span> type <b>help</b>`]);
}
function bindTerm() {
  const inp = $('#tcmd'), hist = []; let hi = 0, booted = false;
  $('#tin').addEventListener('submit', e => { e.preventDefault(); const v = inp.value; inp.value = ''; if (v.trim()) { hist.push(v); hi = hist.length; } run(v); });
  inp.addEventListener('keydown', e => { if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); inp.value = hist[hi]; } if (e.key === 'ArrowDown' && hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; } });
  $('#term').addEventListener('click', e => { if (!e.target.closest('a')) inp.focus({ preventScroll: true }); });
  const boot = async () => { if (booted) return; booted = true;
    tl('<span style="color:var(--dim2)">halo console · paired with zcash · type help</span>'); await sleep(400);
    await typeCmd('halo status'); await out(CMDS.status()); await sleep(500);
    await typeCmd('help'); await out(CMDS.help()); };
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); boot(); } }, { threshold: .35 }).observe($('#term'));
}
// headings decode themselves when they scroll in
const GL = '#%&$@*+=<>/\\|';
function scramble(el) {
  const final = el.textContent; let f = 0; const n = 16;
  const t = setInterval(() => { f++; el.textContent = [...final].map((ch, i) => ch === ' ' || i < (f / n) * final.length ? ch : GL[(Math.random() * GL.length) | 0]).join(''); if (f >= n) { clearInterval(t); el.textContent = final; } }, 34);
}


// the hero's status line types itself, then the cursor keeps blinking
async function typed() {
  const el = $('#typed'); if (!el || el.dataset.on) return; el.dataset.on = 1;
  const parts = [['> ', ''], ['0 SOL', 'b'], [' to launch · ', ''], ['no', 'b'], [' wallet · ', ''], ['1%', 'b'], [' of every trade to holders, in ', ''], ['ZEC', 'b']];
  el.innerHTML = '<span class="tx"></span><span class="cur"></span>'; const tx = el.querySelector('.tx');
  for (const [t, k] of parts) { const s = document.createElement(k ? 'b' : 'span'); tx.appendChild(s); for (const ch of t) { s.textContent += ch; await sleep(reduce ? 0 : 22 + Math.random() * 30); } }
}

// the hero leans toward the pointer a little
function tilt() {
  const st = $('.stage'); if (!st || reduce || matchMedia('(pointer: coarse)').matches) return;
  addEventListener('pointermove', e => { const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; st.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg'); st.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg'); }, { passive: true });
}
addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#coins').scrollIntoView(); setTimeout(() => $('#csearch').focus(), 500); } });
intro(); nav(); tilt(); bindTerm(); bindLaunch(); bindCoins(); bindShield(); bindFaq(); tape();
prices(); setInterval(prices, 60000);
loadCoins(); setInterval(loadCoins, 45000);
if (!document.body.classList.contains('intro-on')) { reveal(); typed(); }
