/* nc-bright: one scroll engine (rAF, reads scrollY directly, writes transform / opacity / clip-path only) drives every
   scroll moment, so pinned stages and their contents move together. Nothing runs on a timer: the visitor's scroll
   or click sets every pace. Everything rests on readable static content under reduced motion. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ramp = function (v, a, b) { return clamp((v - a) / (b - a), 0, 1); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };   // cubic in-out
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var reduced = document.documentElement.classList.contains('rm');
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function () { location.reload(); });
  var vw = innerWidth, vh = innerHeight;
  var phone = function () { return vw <= 734; };
  var hiddenTab = document.hidden;
  function playV(v) { if (v.getAttribute('src')) { var p = v.play(); if (p) p.catch(function () {}); } }

  /* ---------- Nav: one fixed bar, phone sheet ---------- */
  var nav = $('[data-nav]'), toggle = $('[data-toggle]'), sheet = $('[data-sheet]');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    ['main', 'footer', '.skip', '.nav__logo', '.nav__cta'].forEach(function (s) { $(s).inert = open; });
    if (open) sheet.querySelector('a').focus();
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (sheet.hidden) return;
    if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
    if (e.key !== 'Tab') return;
    // keep Tab inside the open menu: the toggle and the sheet's links
    var ring = [toggle].concat($$('a', sheet)), i = ring.indexOf(document.activeElement);
    var n = i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + ring.length) % ring.length;
    e.preventDefault(); ring[n].focus();
  });
  matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* ---------- Scroll engine ---------- */
  var scenes = [], last = -1, dirty = true;
  function docTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }
  function measure() {
    vw = innerWidth; vh = innerHeight;
    scenes.forEach(function (s) { if (s.measure) s.measure(); });
    dirty = true;
  }
  function tick() {
    requestAnimationFrame(tick);
    var y = scrollY;
    if (y === last && !dirty) return;
    last = y; dirty = false;
    for (var i = 0; i < scenes.length; i++) scenes[i].update(y);
    nav.classList.toggle('is-light', y > 4);   // the cream bar turns translucent once the page moves
  }

  /* ---------- 1. The film: four shots as one loop ---------- */
  var intro = $('[data-intro]'), stage = $('[data-stage]'), filmEl = $('[data-film]');
  var vids = $$('video', filmEl), filmBtn = $('[data-film-toggle]'), fills = $$('.film__prog i');
  var FX = ['50%', '62%', '40%', '84%'];
  var SHOT = 7.5, FADE = 850, LOOP = SHOT * 4;
  var t = 0, shot = -1, fraf = 0, flast = 0, fadeTimer = 0;
  var allowVideo = !reduced, userPaused = reduced, filmAway = false;
  function src(n) { return '../../assets/film/hero-' + n + '.mp4'; }
  function setShot(v, n) {
    var want = allowVideo ? src(n) : '';
    if (v.dataset.shot === String(n) && (v.getAttribute('src') || '') === want) return;
    v.dataset.shot = n;
    v.poster = '../../assets/film/hero-' + n + '-poster.webp';
    v.style.setProperty('--fx', FX[n]);
    if (want) { v.src = want; v.load(); } else v.removeAttribute('src');
  }
  function enterShot(n, hard) {
    var v = vids[n % 2], other = vids[(n + 1) % 2];
    setShot(v, n);
    v.currentTime = Math.max(0, t - n * SHOT);
    other.classList.remove('is-top');
    other.classList.toggle('is-under', !hard);
    v.classList.add('is-top'); v.classList.remove('is-under');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(function () { other.classList.remove('is-under'); other.pause(); setShot(other, (n + 1) % 4); }, hard ? 0 : FADE + 120);
    if (filmRunning()) playV(v);
  }
  function filmUpdate(hard) {
    var n = Math.min(3, Math.floor(t / SHOT));
    if (n !== shot || hard) { shot = n; enterShot(n, hard); }
    fills.forEach(function (f, j) { f.style.transform = 'scaleX(' + (j < n ? 1 : j > n ? 0 : (t - n * SHOT) / SHOT) + ')'; });
  }
  function filmFrame(now) {
    fraf = requestAnimationFrame(filmFrame);
    t += clamp((now - flast) / 1000, 0, 0.1); flast = now;
    if (t >= LOOP) t -= LOOP;
    filmUpdate(false);
  }
  function filmRunning() { return !userPaused && !hiddenTab && !filmAway; }
  function filmSync() {
    filmBtn.setAttribute('aria-pressed', String(userPaused));
    filmBtn.setAttribute('aria-label', userPaused ? 'Play' : 'Pause');
    var v = vids[shot % 2];
    if (filmRunning()) { if (!fraf) { flast = performance.now(); fraf = requestAnimationFrame(filmFrame); } if (v) playV(v); }
    else { cancelAnimationFrame(fraf); fraf = 0; vids.forEach(function (e) { e.pause(); }); }
  }
  filmBtn.addEventListener('click', function () {
    userPaused = !userPaused;
    if (!userPaused && !allowVideo) { allowVideo = true; shot = -1; filmUpdate(true); }
    filmSync();
  });
  document.addEventListener('visibilitychange', function () { hiddenTab = document.hidden; filmSync(); closeSync(); });
  filmUpdate(true); filmSync();
  function filmAwayNow(v) { if (v !== filmAway) { filmAway = v; filmSync(); } }

  /* ---------- 2. The reveal: the film shrinks into a frame, Nova takes its place, then answers ---------- */
  var frame = $('[data-frame]'), dim = $('[data-dim]'), shade = $('[data-shade]'), outs = $$('[data-out]');
  var rhead = $('[data-rhead]'), rwin = $('[data-rwin]'), nova = $('[data-nova]', rwin), composer = $('[data-composer]', nova);
  var parts = {}; $$('[data-k]', nova).forEach(function (p) { parts[p.dataset.k] = p; });
  var R = { top: 0, h: 1, fin: null };
  // Nova arrives already answered: the top-down wipe reveals the finished exchange, so no scroll stop shows a half-built
  // or empty window
  Object.keys(parts).forEach(function (k) { parts[k].classList.add('on'); });
  parts.thought.classList.add('done');
  composer.classList.add('is-sent');
  scenes.push({
    measure: function () {
      var sh = stage.offsetHeight;   // the sticky stage's own height: steady while the phone toolbar moves
      R.top = docTop(intro); R.h = intro.offsetHeight - sh;
      if (reduced) return;
      var headBottom = rhead.offsetTop + rhead.offsetHeight;
      var top = headBottom + (phone() ? 20 : 36), bottom = phone() ? 16 : 32;
      var maxW = phone() ? vw - 32 : Math.min(1260, vw - 2 * Math.max(vw * 0.0625, 32));
      nova.style.setProperty('--fs', '10px');
      var w10 = nova.offsetWidth, h10 = nova.offsetHeight;
      var fs = Math.min(phone() ? 15 : 16, 10 * maxW / w10, 10 * (sh - top - bottom) / h10);
      nova.style.setProperty('--fs', fs.toFixed(2) + 'px');
      var w = nova.offsetWidth, h = nova.offsetHeight;
      var left = Math.round((vw - w) / 2), y0 = Math.round(top + Math.max(0, (sh - top - bottom - h) / 2));
      rwin.style.transform = 'translate(' + left + 'px,' + y0 + 'px)';
      R.fin = { t: y0, l: left, r: vw - left - w, b: sh - y0 - h, rad: phone() ? 18 : 24 };
      // the film starts inset on the cream page (Legora-bright from the first frame), matching the CSS fallback
      var hs = phone() ? 12 : 24; R.start = { t: 52 + hs / 3, l: hs, r: hs, b: hs, rad: phone() ? 18 : 28 };
      dirty = true;
    },
    update: function (y) {
      var p = clamp((y - R.top) / R.h, 0, 1);
      if (reduced || !R.fin) { filmAwayNow(y > R.top + R.h + vh); return; }
      var c = 1 - ramp(p, 0.06, 0.16);   // the headline holds for the first wheel notch
      outs.forEach(function (el) { el.style.opacity = c; el.style.transform = 'translateY(' + (-(1 - c) * 40).toFixed(1) + 'px)'; el.style.visibility = c < 0.02 ? 'hidden' : ''; });
      var e = ease(ramp(p, 0.06, 0.36)), f = R.fin, s0 = R.start, st = frame.style;
      frame.style.willChange = p > 0.04 && p < 0.4 ? 'clip-path' : '';
      [['--it', 't'], ['--ib', 'b'], ['--il', 'l'], ['--ir', 'r'], ['--irad', 'rad']].forEach(function (k) {
        st.setProperty(k[0], (s0[k[1]] + e * (f[k[1]] - s0[k[1]])).toFixed(1) + 'px');
      });
      shade.style.opacity = (1 - e * 0.7).toFixed(3);
      dim.style.opacity = (e * 0.3).toFixed(3);
      var h = easeOut(ramp(p, 0.26, 0.4));   // the heading waits until the frame has cleared its space
      rhead.style.opacity = h; rhead.style.transform = 'translateY(' + ((1 - h) * 30).toFixed(1) + 'px)';
      var n = easeOut(ramp(p, 0.30, 0.44));
      // top-down, in story order: the bar and the question first, the composer last
      nova.style.clipPath = 'inset(0 0 ' + ((1 - n) * 100).toFixed(2) + '% 0 round ' + f.rad + 'px)';
      nova.style.transform = 'translateY(' + ((1 - n) * 40).toFixed(1) + 'px)';
      // the film plays inside the frame until Nova covers it, then rests
      filmAwayNow(n >= 1 || y > R.top + R.h + vh);
    }
  });

  /* ---------- Reveals: fire once ---------- */
  var rio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -18% 0px' });
  $$('[data-reveal]').forEach(function (el) { if (reduced) el.classList.add('is-in'); else rio.observe(el); });

  /* ---------- 5. Highlights carousel ---------- */
  var track = $('[data-track]'), cards = $$('.hl__card', track), dots = $$('[data-dots] button');
  var idx = 0, progScroll = 0;
  function cardLeft(i) { return cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2; }
  function setActive(i, scroll) {
    idx = (i + cards.length) % cards.length;
    cards.forEach(function (c, j) { c.classList.toggle('is-on', reduced || j === idx); });
    dots.forEach(function (d, j) { if (j === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); d.querySelector('i').style.setProperty('--fill', j === idx ? 1 : 0); });
    if (scroll) { progScroll = performance.now(); track.scrollTo({ left: cardLeft(idx), behavior: reduced ? 'auto' : 'smooth' }); }
  }
  dots.forEach(function (d, j) { d.addEventListener('click', function () { setActive(j, true); }); });
  [['[data-hl-prev]', -1], ['[data-hl-next]', 1]].forEach(function (b) {
    $(b[0]).addEventListener('click', function () { setActive(idx + b[1], true); });
  });
  // a swipe or trackpad scroll: follow it
  var st0 = 0;
  track.addEventListener('scroll', function () {
    clearTimeout(st0);
    st0 = setTimeout(function () {
      if (performance.now() - progScroll < 900) return;   // our own smooth scroll
      var x = track.scrollLeft, best = 0, bd = 1e9;
      cards.forEach(function (c, j) { var d = Math.abs(cardLeft(j) - x); if (d < bd) { bd = d; best = j; } });
      if (best !== idx) setActive(best, false);
    }, 120);
  }, { passive: true });
  // the first card plays its build when the carousel is half on screen
  setActive(0, false);
  if (!reduced) {
    cards[0].classList.remove('is-on');
    new IntersectionObserver(function (es, o) { if (es[0].intersectionRatio >= 0.5) { setActive(idx, false); o.disconnect(); } }, { threshold: [0, 0.5] }).observe(track);
  }

  /* ---------- 6. How Newcode works: pinned steps, each panel wipes up over the last ---------- */
  var how = $('[data-how]'), texts = $$('.how__t', how), views = $$('.how__v', how), rail = $$('.how__rail li', how);
  var H = { top: 0, h: 1 }, howStage = $('.how__stage', how);
  scenes.push({
    measure: function () { H.top = docTop(how); H.h = how.offsetHeight - howStage.offsetHeight; },
    update: function (y) {
      if (reduced || phone()) {
        if (!H.flat) {
          H.flat = true;
          views.forEach(function (v) { v.style.clipPath = ''; v.style.transform = ''; v.style.removeProperty('--k'); });
          texts.forEach(function (tx) { tx.style.opacity = ''; tx.style.transform = ''; });
        }
        // phone: each panel builds as it travels from the bottom of the screen to the middle
        if (!reduced) views.forEach(function (v) { var r = v.getBoundingClientRect(); v.style.setProperty('--k', ramp(vh - r.top, vh * 0.15, vh * 0.75).toFixed(3)); });
        return;
      }
      H.flat = false;
      // four steps, one ~95vh slice each: the panel's rows build over the slice. The texts swap back to back in short
      // fades (out T i+0.84 to i+0.90, next in i+0.90 to i+0.96, ~50px each), so the column is blank for only a few px
      var T = clamp((y - H.top) / H.h, 0, 1) * 4, cur = Math.min(3, Math.floor(T + 0.08));
      texts.forEach(function (tx, i) {
        var fin = i === 0 ? 1 : easeOut(ramp(T, i - 0.10, i - 0.04));
        var fout = i === 3 ? 1 : 1 - ramp(T, i + 0.84, i + 0.90);
        tx.style.opacity = Math.min(fin, fout).toFixed(3);
        tx.style.transform = 'translateY(' + ((1 - fin) * 24 - (1 - fout) * 24).toFixed(1) + 'px)';
      });
      views.forEach(function (v, i) {
        if (i) { var w = ease(ramp(T, i - 0.16, i + 0.10)); v.style.clipPath = 'inset(' + ((1 - w) * 100).toFixed(2) + '% 0 0 0)'; }
        // the panel being covered sinks back a little, so the next one reads as arriving in front of it
        var under = i < 3 ? ease(ramp(T, i + 0.84, i + 1.10)) : 0;
        v.style.transform = under ? 'scale(' + (1 - under * 0.06).toFixed(4) + ')' : '';
        v.style.setProperty('--k', ramp(T, i - 0.05, i + 0.62).toFixed(3));
      });
      rail.forEach(function (r, i) { r.classList.toggle('is-cur', i === cur); });
    }
  });

  /* ---------- 8. Customer film: lands full width as you arrive, plays on request, pauses off screen ---------- */
  var grow = $('[data-grow]'), storyBtn = $('[data-story-play]');
  var G = { top: 0 };
  scenes.push({
    measure: function () { G.top = docTop(grow); },
    update: function (y) {
      if (reduced || phone()) { grow.style.removeProperty('--gs'); return; }
      var q = ease(ramp(y + vh - G.top, vh * 0.1, vh * 0.85));
      grow.style.setProperty('--gs', (0.86 + q * 0.14).toFixed(4));
    }
  });
  storyBtn.addEventListener('click', function () {
    var v = document.createElement('video');
    v.src = '../../assets/film/raeder-bing-story-360p.mp4';
    v.poster = '../../assets/places/raeder-bing-film-still.webp';
    v.controls = true; v.playsInline = true; v.setAttribute('aria-label', 'Ræder Bing');
    storyBtn.replaceWith(v);
    playV(v);
    v.focus();
    new IntersectionObserver(function (es) { if (!es[0].isIntersecting) v.pause(); }, { threshold: 0 }).observe(v);
  });

  /* ---------- 9. Solutions: one card open ---------- */
  var aud = $('[data-aud]'), audPrev = $('[data-aud-prev]'), audNext = $('[data-aud-next]');
  function audStep(d) { var c = aud.querySelector('.aud__c'); aud.scrollBy({ left: d * (c.offsetWidth + 20), behavior: reduced ? 'auto' : 'smooth' }); }
  function audPaddles() { audPrev.disabled = aud.scrollLeft < 4; audNext.disabled = aud.scrollLeft > aud.scrollWidth - aud.clientWidth - 4; }
  audPrev.addEventListener('click', function () { audStep(-1); });
  audNext.addEventListener('click', function () { audStep(1); });
  aud.addEventListener('scroll', audPaddles, { passive: true });
  scenes.push({ measure: audPaddles, update: function () {} });

  /* ---------- 11. Closing card: its film tile plays while half of it is on screen ---------- */
  var cframe = $('[data-closeframe]'), cv = $('video', cframe), cBtn = $('[data-close-toggle]');
  var cSeen = false, cPaused = reduced;
  function closeSync() {
    var run = cSeen && !cPaused && !hiddenTab;
    cBtn.setAttribute('aria-pressed', String(cPaused));
    cBtn.setAttribute('aria-label', cPaused ? 'Play' : 'Pause');
    if (run) { if (!cv.getAttribute('src')) cv.src = cv.dataset.src; playV(cv); } else cv.pause();
  }
  cBtn.addEventListener('click', function () { cPaused = !cPaused; closeSync(); });
  new IntersectionObserver(function (es) { cSeen = es[0].intersectionRatio >= 0.5; closeSync(); }, { threshold: [0, 0.5] }).observe(cframe);
  closeSync();

  /* ---------- Footer: columns fold away on phone ---------- */
  var folds = $$('.foot details'), phoneMq = matchMedia('(max-width: 734px)');
  function setFolds() { folds.forEach(function (d) { d.open = !phoneMq.matches; }); }
  phoneMq.addEventListener('change', setFolds); setFolds();
  folds.forEach(function (d) { d.querySelector('summary').addEventListener('click', function (e) { if (!phoneMq.matches) e.preventDefault(); }); });

  /* ---------- Canvas wires: drawn from the real port positions, so they always meet ---------- */
  var wireSets = $$('[data-wires]');
  function rel(e, root) { var x = 0, y = 0; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x: x, y: y }; }
  function drawWires() {
    wireSets.forEach(function (svg) {
      var box = svg.parentNode, cw = box.offsetWidth, ch = box.offsetHeight;
      if (!cw) return;
      svg.setAttribute('viewBox', '0 0 ' + cw + ' ' + ch);
      var paths = $$('path', svg);
      svg.dataset.wires.split(' ').forEach(function (pair, i) {
        var ab = pair.split('>'), a = $('[data-w="' + ab[0] + '"]', box), b = $('[data-w="' + ab[1] + '"]', box);
        if (!a || !b || !paths[i]) return;
        var pa = rel(a, box), pb = rel(b, box);
        var x1 = pa.x + a.offsetWidth, y1 = pa.y + a.offsetHeight / 2, x2 = pb.x, y2 = pb.y + b.offsetHeight / 2, mx = (x1 + x2) / 2;
        paths[i].setAttribute('d', 'M' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2);
      });
    });
  }
  scenes.push({ measure: drawWires, update: function () {} });

  /* ---------- Go ---------- */
  var rt = 0, lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', function () {
    // a phone toolbar collapsing changes only the height a little: the stages are sized in svh, so nothing to redo
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return;
    lastW = innerWidth; lastH = innerHeight;
    clearTimeout(rt); rt = setTimeout(measure, 100);
  });
  addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
  requestAnimationFrame(tick);

  window.__nc = { measure: measure, get film() { return t; }, pauseFilm: function () { userPaused = true; filmSync(); } };
})();
