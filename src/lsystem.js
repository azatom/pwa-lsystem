import { strings } from './strings.js';
import lsystemSvg from './lsystem-svg.js';
import { examples } from './examples.js';
import { wrappedRun, yieldOnce, toggleCustomLog, installServiceWorker, setupHtmlBase } from './utils.js';
import { getRules, addDefaults, addVb, stringify } from './ruletext.js';
import { addSvgZoom, downloadPng, downloadSvg } from './svgutils.js';
import { initMobile, isMobile, forceMobile, isMobileAgent } from './ismobile.js';

function getText() { return el.textarea.innerText; }
function clickReset() { localstorageReset(); location.href = location.origin + location.pathname; }
function clickSubmit() { state.abortController ? state.abortController.abort() : update(undefined, 1); }
function setText(rR) { el.textarea.innerHTML = stringify(rR, 1); }
function getSvg() { return el.bigsvg.children[0]; }
function getDot() { return el.buttondot.hasAttribute('data-checked'); }
function setDot(enabled) { el.buttondot.toggleAttribute('data-checked', enabled); }
function updateFromLocation(_, a = location.href.split(/[?#]/)[1]) { return a && (update(decodeURIComponent(a), 1), 1); }
function show(e) { [...el.right.children].forEach(i => i.classList.toggle('hidden', e !== i)); }
function copy(t) { navigator.clipboard.writeText(t); console.log(strings.copied); }

async function message(m, delay = 0, short = '') {
  clearTimeout(state.timer);
  el.buttonminilog.textContent = short;
  const f = async () => show(Object.assign(el.message, { innerText: m }));
  delay ? state.timer = setTimeout(f, delay) : await f();
}

async function lsystemSvgWrap(R, isInterruptable) {
  const acHolder = isInterruptable ? state : undefined;
  const progress = isInterruptable ? n => message('Processing...', 0, (n / 1e6).toFixed(1) + ' M') : undefined;
  return wrappedRun(acHolder, progress, lsystemSvg, R);
}

function createR(o, preserveViewBox) {
  const R = typeof o === 'string' ? getRules(o) : o;
  const vb = preserveViewBox ? getViewBox() : {};
  const dot = getDot() ? {
    _k: R._k ?? 1,
    _o: R._o ?? 0,
  } : {};
  const tp = el.buttontpbg.hasAttribute('data-checked') ? {
    _cb: R._cb ?? '#0000',
  } : {};
  return { ...R, ...vb, ...dot, ...tp };
}

async function update(rules, textToo) {
  try {
    if (rules) {
      rules = typeof rules === 'string' ? getRules(rules) : rules;
      if (textToo) setText(rules);
    } else {
      rules = getRules(getText());
    }
    const R = createR(rules);
    el.buttonsubmit.toggleAttribute('data-checked', 1);
    const svg = await lsystemSvgWrap(R, true);
    clearTimeout(state.timer);
    el.buttonsubmit.toggleAttribute('data-checked', 0);
    const title = svg.querySelector('title')?.textContent;
    if (!svg) return;
    if (!title?.startsWith(state.interrupted) && rules !== '') localstorageSave('R', rules);
    else console.log(title);
    try {
      const stat = JSON.parse(svg.querySelector('desc').textContent).stat;
      console.log(Object.entries(stat).map(([k, v]) => v + ' ' + k).join(' '));
      const t = stat.ms < 1000 ? ~~stat.ms + ' ms' : (stat.ms / 1e3).toPrecision(2) + ' s';
      el.buttonminilog.innerHTML = stat.err ? stat.err + ' error<br>' : '' + t;
    } catch (e) { }
    el.bigsvg.replaceChildren(svg);
    addSvgZoom(svg, '#bigsvg');
    show(el.bigsvg);
    return true;
  } catch (e) {
    message(e.message, 0, strings.error);
  }
}

async function clickDownloadPng() {
  try {
    const svg = getSvg();
    if (!svg) return message(strings.nothingToExport);
    const m = parseInt(prompt(strings.pngPrompt, strings.pngDefaultSize));
    if (isNaN(m) || m < 1 || m > 65536) return;
    const { w, h, s, filename } = await downloadPng(svg, m);
    console.log(`saved: ${w}x${h} ${s} bytes ${filename}`);
  } catch (e) {
    message(e.message);
  }
}

function clickOpenStandaloneSvg(R = getRules(getText()), qs = '#', editor) {
  const svg = getSvg();
  if (!svg) return message(strings.nothingToExport);
  const s = stringify(createR(R, 1));
  if (!s) return message(strings.nothingToExport);
  const qp = s//encodeURIComponent(s);
    .replace(/&/g, '%26')
    .replace(/\?/g, '%3F')
    .replace(/#/g, '%23');
  Object.assign(document.createElement('a'), {
    target: '_blank',
    href: editor
      ? `${location.origin + location.pathname}${qs}${qp}`
      : `${strings.lsystemsvg}${qs}${qp}`,
  }).click();
}

function altbuttonline(alt) {
  const svg = getSvg();
  if (!svg) return message(strings.nothingToExport);
  copy(alt ? JSON.stringify(getRules(getText())) : stringify(getText()));
}

function clickbuttonsvg() {
  const svg = getSvg();
  if (!svg) return message(strings.nothingToExport);
  svg.removeAttribute('tabindex');
  downloadSvg(svg);
}

function altNIncDec(alt, R = getRules(getText())) {
  update(setText(Object.assign(R, { _n: Math.max(0, (alt ? -1 : +1) + +(R._n ?? 0)) })));
}

function altAngleIncDec(alt) {
  const R = getRules(getText());
  let a = +(R._a ?? 0);
  let inc = [1, -1, .1, -.1][alt];
  update(setText(Object.assign(R, { _a: Math.max(0, inc + a) })));
}

function ael(elOrQS, listener) {
  const el = typeof elOrQS === 'string' ? document.querySelector(elOrQS) : elOrQS;
  const typ = el.classList.contains('altclick') ? 'altclick' : 'click';
  if (typ === 'altclick') {
    const MOVE_THRESHOLD = 10;
    let isLongTap = false;
    let longTapTimer = null;
    let startX = 0, startY = 0;
    const alternative = (e, i) => {
      const isKeyboardClick = e.type === 'keydown' && (e.key === 'Enter' || e.key === ' ');
      if (!i && !isKeyboardClick && e.type !== 'click') return;
      if (isKeyboardClick) e.preventDefault();
      listener((e.ctrlKey * 2 + (i || e.shiftKey)));
    };
    const suppressPostLongClick = e => { if (isLongTap) { isLongTap = false; e.stopPropagation(); e.preventDefault(); } };
    const startLongTap = e => {
      if (e.button && e.button !== 0) return;
      isLongTap = false;
      el.classList.add('long-tap-progress');
      try { el.focus && el.focus({ preventScroll: true }); } catch (err) { el.focus && el.focus(); }
      const t = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
      startX = t.pageX; startY = t.pageY;
      longTapTimer = setTimeout(() => {
        isLongTap = true;
        alternative(e, 1);
        el.classList.remove('long-tap-progress');
      }, 200);
    };
    const cancelLongTap = () => {
      if (longTapTimer) { clearTimeout(longTapTimer); longTapTimer = null; }
      el.classList.remove('long-tap-progress');
    };
    const handlePointerMove = e => {
      if (!longTapTimer) return;
      const t = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
      const dx = t.pageX - startX, dy = t.pageY - startY;
      if (Math.hypot(dx, dy) > MOVE_THRESHOLD) cancelLongTap();
    };
    el.addEventListener('click', suppressPostLongClick, { capture: true, passive: false });
    el.addEventListener('click', alternative, { passive: true });
    el.addEventListener('keydown', alternative, { passive: false });
    el.addEventListener('pointerdown', startLongTap, { passive: false });
    el.addEventListener('pointerup', cancelLongTap, { passive: true });
    el.addEventListener('pointermove', handlePointerMove, { passive: true });
    el.addEventListener('pointercancel', cancelLongTap, { passive: true });
    el.addEventListener('pointerleave', cancelLongTap, { passive: true });
  } else {
    el.addEventListener(typ, listener, { passive: true });
  }
}

function getViewBox(force = 0) {
  const svg = el.bigsvg.querySelector('svg');
  if (!svg) return {};
  const v = svg.getAttribute('viewBox')?.split(' ') || [];
  return v.length && (force ||
    ['x', 'y', 'width', 'height'].map(attr => svg.querySelector('rect')?.getAttribute(attr)).join(' ') !== v.join(' ')
  )
    ? { _x: v[0], _y: v[1], _w: v[2], _h: v[3] }
    : {};
}

function showExample(i = state.eg.i, l = state.eg.a.length) {
  i = state.eg.i = (i + l) % l;
  update(state.eg.a[i], 1);
  console.log(`[example: ${i + 1} / ${l}]`);
}

function altPutVbOrDefaults(alt) {
  setText(alt
    ? addDefaults((R => (lsystemSvg(R), R))({}), getText())
    : addVb(getText(), getViewBox(1)));
}

function altNextExample(alt) {
  alt = (state.eg.i + (alt ? -1 : 1)) % state.eg.a.length;
  alt = (alt + state.eg.a.length) % state.eg.a.length;
  showExample(alt);
}

async function clickShowExamples() {
  setText('');
  el.smallsvgs.replaceChildren();
  show(el.smallsvgs);
  const t0 = performance.now();
  const decN = eg => ({
    ...eg,
    _n: Math.max(2, parseInt(eg._n) - 1, 1),
    _k: eg._k ? eg._k : getDot() ? 1 : '',
    _o: eg._o ? eg._o : getDot() ? 0 : '',
    //_cc: eg._cc ? eg._cc : getDot() ? '#0000' : '#000',
    _cb: eg._cb ? eg._cb : el.buttontpbg.hasAttribute('data-checked') ? '#0000' : '',
  });
  const ael = r => {
    (r.el).addEventListener('click', e => e.ctrlKey
      ? clickOpenStandaloneSvg(state.eg.a[r.i])
      : showExample(r.i)
    );
    return r.el;
  };
  const eg2el = async (eg, i) => ({ el: await lsystemSvgWrap(createR(decN(eg))), i });
  state.eg.a.forEach(async (eg, i) => el.smallsvgs.append(await ael(await eg2el(eg, i))));
  await yieldOnce();
  let a, s, m, i, ms = ((performance.now() - t0)).toFixed(0);
  try {
    a = [...el.smallsvgs.querySelectorAll('svg')].map(a =>
      JSON.parse(a.querySelector('desc').textContent).stat.ms);
    s = a.reduce((p, c) => p + parseFloat(c), 0) | 0;
    m = Math.max(...a);
    i = a.indexOf(m);
  } catch (e) { }
  console.log(`[${state.eg.a.length} examples ${ms}ms ?${ms - s}ms ${m}@${i + 1}]`);
}

function toggleTpbg() {
  const s = el.buttontpbg.toggleAttribute('data-checked');
  el.right.classList.toggle('tpbg', s);
  if (!getText()) return clickShowExamples();
  const R = getRules(getText());
  s ? (R._cb = '#0000') : (delete R._cb, 0);
  setText(R);
  update();
}

function toggleFull() {
  el.bigsvg.classList.toggle('full');
}

function toggleDot() {
  setDot(!getDot());
  getText()
    ? update({ ...getRules(getText()), _k: getDot() ? 1 : 0, _o: getDot() ? 0 : '' }, 1)
    : clickShowExamples();
}

function altCursive(alt) {
  if (!getText()) return clickShowExamples();
  if (alt) {
    const R = getRules(getText());
    if (!R) return;
    setText({ ...R, _hand: +R._hand === 1 ? '' : 1 });
    update();
  } else {
    const s = document.body.classList.toggle('cursive');
    document.body.classList.toggle('cursive', s)
    el.buttoncursive.toggleAttribute('data-checked', s);
  }
}

function toggleExport(s = el.buttonexport.getAttribute('data-checked') === null, isInit) {
  el.buttonexport.toggleAttribute('data-checked', s);
  document.querySelectorAll('.export').forEach(e => e.classList.toggle('hidden', !s));
  isInit || localstorageSave('export');
}

function toggleMinilog(s = el.buttonminilog.getAttribute('data-checked') === null, isInit) {
  el.buttonminilog.toggleAttribute('data-checked', s);
  el.buttonlog.classList.toggle('hidden', !s);
  isInit || localstorageSave('minilog');
}

function setupCustomLog() {
  toggleCustomLog(true, (...args) => {
    if (el.buttonlog) {
      el.buttonlog.replaceChildren(
        args.flatMap(a => a && 'object' == typeof a ? Object.entries(a) : [['', a]])
          .map(([k, v]) => `${k}${k && ' '}${String(v).replace(/-/g, '‑').replace(/Infinity/g, '-')}`)
          .join('\n')
        , document.createElement('br')
        , ...[...el.buttonlog.childNodes].slice(0, 19)
        // , ...strings.shorthelp.split('\n').map(s => Object.assign(document.createElement('a'), { textContent: s }))
      );
    } else { console.oldLog(...args); }
  });
}

function setupDividers() {
  const state = {
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0
  };
  const startResize = (e) => {
    if (e.target !== el.divider) return;
    e.preventDefault();
    state.isResizing = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.startWidth = el.left.offsetWidth;
    state.startHeight = el.left.offsetHeight;
    document.addEventListener('pointermove', resize, { passive: false });
    document.addEventListener('pointerup', stopResize, { passive: false });
    document.addEventListener('pointercancel', stopResize, { passive: false });
    el.divider.style.transition = 'none';
  };
  const resize = (e) => {
    if (!state.isResizing) return;
    e.preventDefault();
    const a = 50;
    if (isMobile()) {
      const newHeight = state.startHeight + e.clientY - state.startY;
      const taMinH = parseFloat(getComputedStyle(el.textarea, null).getPropertyValue("min-height"));
      const bH = el.buttons.offsetHeight;
      const dH = el.divider.offsetHeight;
      const clamped = Math.min(Math.max(newHeight, bH + taMinH + dH), window.innerHeight - a);
      el.left.style.width = '';
      el.left.style.height = `${clamped}px`;
    } else {
      const newWidth = state.startWidth + e.clientX - state.startX;
      const clamped = Math.min(Math.max(newWidth, a), window.innerWidth - a);
      el.left.style.width = `${clamped}px`;
      el.left.style.height = '';
    }
  };
  const stopResize = (e) => {
    if (!state.isResizing) return;
    state.isResizing = false;
    document.removeEventListener('pointermove', resize);
    document.removeEventListener('pointerup', stopResize);
    document.removeEventListener('pointercancel', stopResize);
    el.divider.style.transition = '';
  };
  el.divider.addEventListener('pointerdown', startResize, { passive: false });
  el.divider.style.touchAction = 'none';
}

function setupMobileKeyboard() {
  if (!isMobileAgent()) return;
  const updateRightSize = () => {
    if (document.body.classList.contains('keyboard-active') && window.visualViewport) {
      el.right.style.height = `${window.visualViewport.height}px`;
    } else {
      el.right.style.height = 'auto';
    }
  };
  el.textarea.addEventListener('focus', () => {
    document.body.classList.add('keyboard-active');
    updateRightSize();
  });
  el.textarea.addEventListener('blur', () => {
    document.body.classList.remove('keyboard-active');
    el.right.style.height = 'auto';
    el.left.style.background = 'transparent';
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (Math.abs(window.visualViewport.height - state.lastViewportHeight) > 50) {
        document.body.classList.toggle('keyboard-active', window.visualViewport.height < state.lastViewportHeight);
        updateRightSize();
        state.lastViewportHeight = window.visualViewport.height;
      }
    });
  }
}

function setupEventListeners() {
  window.addEventListener('hashchange', updateFromLocation);
  document.addEventListener('keydown', e => e.key === 'Shift' && document.body.classList.add('shift-pressed'));
  document.addEventListener('keyup', e => e.key === 'Shift' && document.body.classList.remove('shift-pressed'));
  el.textarea.addEventListener('keydown', e => e.ctrlKey && e.key === 'Enter' && clickSubmit());
  el.textarea.addEventListener('input', () => update());
  el.textarea.addEventListener('blur', () => el.textarea.textContent === '' && (el.textarea.textContent = ''));
  el.buttontxtclose?.addEventListener('click', () => (el.textarea.focus(), el.textarea.blur()));
  el.textarea.addEventListener('paste', e => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    // deprecated, but it has features: ctrl+z, leaves cursor in place, better htmlAsPlaintext, newline
    document.execCommand('insertText', false, text);
    clickSubmit();
  });
  el.textarea.addEventListener('keydown', e => e.ctrlKey && e.key === 'c'
    && !window.getSelection().toString().length && (
      e.preventDefault(),
      navigator.clipboard.writeText(stringify(getText())),
      console.log(strings.copied)
    )
  );
  ael(el.buttonsubmit, clickSubmit);
  ael(el.buttonnpp, altNIncDec);
  ael(el.buttoncursive, altCursive);
  ael(el.buttondot, toggleDot);
  ael(el.buttontpbg, toggleTpbg);
  ael(el.buttonnexteg, altNextExample);
  ael(el.buttondefs, altPutVbOrDefaults);
  ael(el.buttonalleg, () => clickShowExamples());
  ael(el.buttonpng, () => clickDownloadPng());
  ael(el.buttonjs, () => clickOpenStandaloneSvg());
  ael(el.buttonsvg, () => clickbuttonsvg());
  ael(el.buttonline, altbuttonline);
  ael(el.buttonurleditor, () => clickOpenStandaloneSvg(undefined, '#', 1));
  ael(el.buttonexport, () => toggleExport());
  ael(el.buttonminilog, () => toggleMinilog());
  ael(el.buttonangleinc, altAngleIncDec);
  // ael(el.buttonreserved2, toggleFull);
  ael(el.buttonhelp, alt => alt ? clickReset() : show(el.readme));
  initMobile(() => el.left.style[isMobile() ? 'width' : 'height'] = 'initial');
}

function localstorageReset() { ['export', 'minilog', 'R'].forEach(k => localStorage.removeItem(state.lspre + k)); }
function localstorageSave(s, o) {
  function set(k, v) { (!s || s === k) && localStorage.setItem(state.lspre + k, v); }
  try { set('R', stringify(o || getText())); } catch (e) { return; }
  set('export', el.buttonexport.getAttribute('data-checked') === null);
  set('minilog', el.buttonminilog.getAttribute('data-checked') === null);
}
async function localstorageLoad() {
  let res = 0;
  function get(k, v = localStorage.getItem(state.lspre + k)) { v === null || res++; return v; }
  toggleExport(get('export') === 'false', 1);
  toggleMinilog(get('minilog') === 'false', 1);
  const r = get('R');
  return updateFromLocation() || r && r !== '' && r !== '{}' && update(r, 1);
}

function setupHelp() {
  const setHelpText = (txt, t = 0) => {
    try {
      el.readme.innerHTML = marked.parse(txt);
    } catch (e) {
      t < 5e4 && typeof marked === 'undefined' && setTimeout(() => setHelpText(txt, t * 1.9 + 50), t);
      t || (el.readme.innerText = txt);
    }
  };
  const createFailsafeIframe = () => Object.assign(document.createElement('iframe'), {
    type: 'text/plain',
    src: el.readme.getAttribute('data-src'),
    frameBorder: 0,
  });
  try {
    fetch(el.readme.getAttribute('data-src'))
      .then(r => r.text())
      .then(setHelpText)
      .catch(_ => el.readme.append(createFailsafeIframe()));
  } catch (e) { console.log(e); }
}

function setupConsts() {
  Object.assign(el, Object.fromEntries([...document.querySelectorAll('[id]')].map(e => [e.id, e])));
  Object.assign(state, {
    interrupted: 'interrupted-',
    eg: {
      i: 0,
      a: (typeof examples !== 'undefined' ? examples : ['S=f+f-fSF+FSF,_n=4']).map(s =>
        getRules(typeof s === 'string' ? s : stringify(s))
      ).filter(s => s),
    },
    divider: { active: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, },
    lastViewportHeight: window.visualViewport ? window.visualViewport.height : window.innerHeight,
    lspre: 'lsystem_',
  });
  el.textarea.dataset.placeholder = strings.placeholder;
}

async function init() {
  const base = await setupHtmlBase();
  setupConsts();
  // datasvg = ...; [...document.querySelectorAll('[data-r]')].forEach(e => e.data = datasvg + '#' + e.getAttribute('data-r'));
  setupCustomLog();
  setupHelp();
  setupDividers();
  setupMobileKeyboard();
  setupEventListeners();
  await localstorageLoad() || show(el.readme);
  el.textarea.setAttribute('contenteditable', true);
  await installServiceWorker('./sw.js', base);
}

/* end of fun */

const el = {}, state = {};
document.addEventListener('DOMContentLoaded', init);
