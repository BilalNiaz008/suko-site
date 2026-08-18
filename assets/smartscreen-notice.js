/* ─────────────────────────────────────────────────────────────
   SmartScreen notice

   Windows shows a blue "Windows protected your PC" dialog for any
   app it has not seen enough installs of yet. People read that as
   "virus". This slides a short explainer in from the bottom-right
   the moment someone clicks a download link, so the reassurance is
   already on screen by the time the dialog appears.

   Self-contained on purpose: its own styles, no Tailwind classes.
   The light theme on these pages is built from hand-written
   overrides of white-alpha utilities, so borrowing utilities here
   would mean maintaining this widget in two places.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var DOWNLOAD_SELECTOR = 'a[href*="suko-app-releases"], a[href$=".exe"]';
  var AUTO_HIDE_MS = 45000;
  var mounted = null;
  var hideT;

  var CSS = [
    '.ss-toast{',
    '  position:fixed; right:20px; bottom:20px; z-index:9999;',
    '  width:min(384px, calc(100vw - 32px));',
    '  border-radius:16px; overflow:hidden;',
    '  background:#fff; color:rgba(20,19,43,.90);',
    '  border:1px solid rgba(20,19,43,.10);',
    '  box-shadow:0 24px 60px -20px rgba(20,19,43,.28), 0 2px 6px rgba(20,19,43,.06);',
    '  font-family:Inter, ui-sans-serif, system-ui, sans-serif;',
    '  opacity:0; transform:translateY(14px) scale(.98);',
    '  transition:opacity .35s ease, transform .35s cubic-bezier(.2,.7,.2,1);',
    '}',
    '.ss-toast.ss-in{opacity:1; transform:none;}',
    '.ss-accent{height:3px; background:linear-gradient(90deg,#22d3ee,#8b5cf6,#7c3aed);}',
    '.ss-body{padding:16px 16px 14px;}',
    '.ss-head{display:flex; align-items:flex-start; gap:11px;}',
    '.ss-icon{',
    '  flex:none; width:34px; height:34px; border-radius:10px; display:grid; place-items:center;',
    '  color:#7c3aed; background:rgba(124,58,237,.10); border:1px solid rgba(124,58,237,.22);',
    '}',
    '.ss-title{font-size:14px; font-weight:600; line-height:1.35; letter-spacing:-.01em;}',
    '.ss-text{margin:5px 0 0; font-size:12.5px; line-height:1.55; color:rgba(20,19,43,.60);}',
    '.ss-close{',
    '  flex:none; margin:-4px -4px 0 0; width:26px; height:26px; border-radius:8px;',
    '  display:grid; place-items:center; cursor:pointer; padding:0;',
    '  background:transparent; border:0; color:rgba(20,19,43,.40);',
    '  transition:background .2s, color .2s;',
    '}',
    '.ss-close:hover{background:rgba(20,19,43,.06); color:rgba(20,19,43,.75);}',
    '.ss-steps{',
    '  margin:13px 0 0; padding:11px 12px; list-style:none;',
    '  border-radius:11px; background:rgba(20,19,43,.035);',
    '  border:1px solid rgba(20,19,43,.07);',
    '  display:grid; gap:8px;',
    '}',
    '.ss-steps li{display:flex; align-items:center; gap:9px; font-size:12.5px; color:rgba(20,19,43,.72);}',
    '.ss-num{',
    '  flex:none; width:18px; height:18px; border-radius:999px;',
    '  display:grid; place-items:center; font-size:10.5px; font-weight:600;',
    '  color:#6d28d9; background:rgba(124,58,237,.12);',
    '}',
    '.ss-key{',
    '  font-family:"JetBrains Mono", ui-monospace, monospace; font-size:11px; font-weight:500;',
    '  padding:2px 6px; border-radius:6px; white-space:nowrap;',
    '  color:rgba(20,19,43,.88); background:#fff; border:1px solid rgba(20,19,43,.14);',
    '  box-shadow:0 1px 0 rgba(20,19,43,.06);',
    '}',
    '.ss-foot{margin-top:12px; display:flex; align-items:center; justify-content:space-between; gap:10px;}',
    '.ss-note{font-size:11px; line-height:1.4; color:rgba(20,19,43,.45);}',
    '.ss-ok{',
    '  flex:none; cursor:pointer; font:inherit; font-size:12px; font-weight:500;',
    '  padding:6px 12px; border-radius:9px; color:#fff; border:0;',
    '  background:linear-gradient(180deg,#a78bfa,#7c3aed);',
    '  box-shadow:0 1px 0 rgba(255,255,255,.18) inset, 0 8px 20px -8px rgba(124,58,237,.65);',
    '  transition:filter .2s;',
    '}',
    '.ss-ok:hover{filter:brightness(1.06);}',

    /* Dark theme, only where the page opts in (index.html puts .dark on <html>) */
    'html.dark .ss-toast{',
    '  background:linear-gradient(180deg, rgba(23,20,44,.96), rgba(14,12,28,.96));',
    '  -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);',
    '  color:rgba(255,255,255,.90); border-color:rgba(167,139,250,.20);',
    '  box-shadow:0 0 0 1px rgba(167,139,250,.10), 0 30px 70px -22px rgba(0,0,0,.75);',
    '}',
    'html.dark .ss-text{color:rgba(255,255,255,.60);}',
    'html.dark .ss-icon{color:#c4b5fd; background:rgba(139,92,246,.16); border-color:rgba(167,139,250,.30);}',
    'html.dark .ss-close{color:rgba(255,255,255,.45);}',
    'html.dark .ss-close:hover{background:rgba(255,255,255,.08); color:#fff;}',
    'html.dark .ss-steps{background:rgba(255,255,255,.035); border-color:rgba(255,255,255,.08);}',
    'html.dark .ss-steps li{color:rgba(255,255,255,.75);}',
    'html.dark .ss-num{color:#ddd6fe; background:rgba(139,92,246,.22);}',
    'html.dark .ss-key{',
    '  color:rgba(255,255,255,.90); background:rgba(255,255,255,.06);',
    '  border-color:rgba(255,255,255,.16); box-shadow:none;',
    '}',
    'html.dark .ss-note{color:rgba(255,255,255,.42);}',

    '@media (max-width:640px){',
    '  .ss-toast{right:12px; left:12px; bottom:12px; width:auto;}',
    '}',
    '@media (prefers-reduced-motion:reduce){',
    '  .ss-toast{transition:opacity .2s ease;}',
    '  .ss-toast.ss-in{transform:none;}',
    '}'
  ].join('\n');

  var SHIELD = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.4c0 4.5-3.1 8.2-7.5 9.6-4.4-1.4-7.5-5.1-7.5-9.6V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>';
  var XMARK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  var HTML = [
    '<div class="ss-accent"></div>',
    '<div class="ss-body">',
    '  <div class="ss-head">',
    '    <span class="ss-icon">' + SHIELD + '</span>',
    '    <div style="flex:1; min-width:0;">',
    '      <div class="ss-title">Windows may show a blue warning</div>',
    '      <p class="ss-text">That is normal. Microsoft Defender SmartScreen flags every new app until enough people have installed it. It is not a virus alert, and nothing is wrong with your download.</p>',
    '    </div>',
    '    <button class="ss-close" type="button" aria-label="Dismiss">' + XMARK + '</button>',
    '  </div>',
    '  <ol class="ss-steps">',
    '    <li><span class="ss-num">1</span><span>Click <span class="ss-key">More info</span> on the blue screen</span></li>',
    '    <li><span class="ss-num">2</span><span>Then click <span class="ss-key">Run anyway</span></span></li>',
    '  </ol>',
    '  <div class="ss-foot">',
    '    <span class="ss-note">Installs locally. No account, no telemetry.</span>',
    '    <button class="ss-ok" type="button">Got it</button>',
    '  </div>',
    '</div>'
  ].join('');

  function injectStyles() {
    if (document.getElementById('ss-toast-styles')) return;
    var s = document.createElement('style');
    s.id = 'ss-toast-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function hide() {
    if (!mounted) return;
    var el = mounted;
    mounted = null;
    clearTimeout(hideT);
    el.classList.remove('ss-in');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 400);
  }

  function show() {
    if (mounted) {                    // already up, just restart the auto-hide
      clearTimeout(hideT);
      hideT = setTimeout(hide, AUTO_HIDE_MS);
      return;
    }
    injectStyles();

    var el = document.createElement('div');
    el.className = 'ss-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = HTML;

    el.querySelector('.ss-close').addEventListener('click', hide);
    el.querySelector('.ss-ok').addEventListener('click', hide);

    document.body.appendChild(el);
    mounted = el;

    // Two frames, so the browser paints the hidden state before transitioning.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('ss-in'); });
    });

    hideT = setTimeout(hide, AUTO_HIDE_MS);
  }

  // Delegated, so it also catches the download link Vue renders in the footer.
  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!link || !link.matches(DOWNLOAD_SELECTOR)) return;
    show();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });
})();
