/* nc-apple: one scroll engine (rAF, reads scrollY directly, writes transform / opacity / clip-path only) drives every
   scroll moment, so pinned stages and their contents move together. Time-based events (the Nova answer, the carousel)
   run on their own clocks. Everything rests on readable static content under reduced motion. */
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

  /* ---------- Nav: phone sheet, theme and current section ---------- */
  var nav = $('[data-nav]'), toggle = $('[data-toggle]'), sheet = $('[data-sheet]');
  var sub = $('[data-sub]'), subToggle = $('[data-sub-toggle]'), subList = $('#sub-links');
  var navLinks = $$('.sub__links a'), themed = $$('main > section, footer');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    ['main', 'footer', '.skip', '.nav__logo', '.nav__cta', '[data-sub]'].forEach(function (s) { $(s).inert = open; });
    if (open) sheet.querySelector('a').focus();
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (sheet.hidden) { if (e.key === 'Escape' && subList.classList.contains('is-open')) { setSub(false); subToggle.focus(); } return; }
    if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
    if (e.key !== 'Tab') return;
    // keep Tab inside the open menu: the toggle and the sheet's links
    var ring = [toggle].concat($$('a', sheet)), i = ring.indexOf(document.activeElement);
    var n = i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + ring.length) % ring.length;
    e.preventDefault(); ring[n].focus();
  });
  matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) { setMenu(false); setSub(false); } });
  function setSub(open) { subToggle.setAttribute('aria-expanded', String(open)); subList.classList.toggle('is-open', open); }
  subToggle.addEventListener('click', function () { setSub(subToggle.getAttribute('aria-expanded') !== 'true'); });
  subList.addEventListener('click', function (e) { if (e.target.closest('a')) setSub(false); });

  /* ---------- Scroll engine ---------- */
  var scenes = [], last = -1, dirty = true;
  function docTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }
  function measure() {
    vw = innerWidth; vh = innerHeight;
    scenes.forEach(function (s) { if (s.measure) s.measure(); });
    themed.forEach(function (el) { el._top = docTop(el); el._bot = el._top + el.offsetHeight; });
    dirty = true;
  }
  function tick() {
    requestAnimationFrame(tick);
    var y = scrollY;
    if (y === last && !dirty) return;
    last = y; dirty = false;
    for (var i = 0; i < scenes.length; i++) scenes[i].update(y);
    var probe = y + 52, theme = 'dark', cur = '';   // the bar's bottom edge decides its colour
    for (var k = 0; k < themed.length; k++) if (probe >= themed[k]._top && probe < themed[k]._bot) { theme = themed[k].dataset.theme; cur = themed[k].id; }
    var subOn = y > vh * 0.5;   // the sub-nav arrives once the hero copy has gone
    if (subOn !== sub.classList.contains('is-on')) { sub.classList.toggle('is-on', subOn); if (!subOn) setSub(false); }
    sub.classList.toggle('is-light', theme === 'light');
    navLinks.forEach(function (a) { if (a.dataset.sec === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
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
  document.addEventListener('visibilitychange', function () { hiddenTab = document.hidden; filmSync(); hlSync(); closeSync(); });
  filmUpdate(true); filmSync();
  function filmAwayNow(v) { if (v !== filmAway) { filmAway = v; filmSync(); } }

  /* ---------- 2. The reveal: the film shrinks into a frame, Nova takes its place, then answers ---------- */
  var frame = $('[data-frame]'), dim = $('[data-dim]'), shade = $('[data-shade]'), outs = $$('[data-out]');
  var rhead = $('[data-rhead]'), rwin = $('[data-rwin]'), nova = $('[data-nova]', rwin), composer = $('[data-composer]', nova);
  var parts = {}; $$('[data-k]', nova).forEach(function (p) { parts[p.dataset.k] = p; });
  var R = { top: 0, h: 1, fin: null };
  // Each beat of the answer has its own scroll point, so the window is finished well before the stage unpins
  // and can never be left half done. CSS transitions smooth each step.
  var SEQ = [['user', 0.36], ['thought', 0.42], ['answer', 0.53], ['file', 0.58], ['doc', 0.62]];
  function beats(p) {
    composer.classList.toggle('is-sent', p >= 0.36);
    SEQ.forEach(function (s) { parts[s[0]].classList.toggle('on', p >= s[1]); });
    parts.thought.classList.toggle('done', p >= 0.51);
  }
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
      dirty = true;
    },
    update: function (y) {
      var p = clamp((y - R.top) / R.h, 0, 1);
      if (reduced || !R.fin) { filmAwayNow(y > R.top + R.h + vh); return; }
      var c = 1 - ramp(p, 0, 0.1);
      outs.forEach(function (el) { el.style.opacity = c; el.style.transform = 'translateY(' + (-(1 - c) * 40).toFixed(1) + 'px)'; el.style.visibility = c < 0.02 ? 'hidden' : ''; });
      var e = ease(ramp(p, 0.0, 0.26)), f = R.fin, st = frame.style;
      frame.style.willChange = p > 0 && p < 0.32 ? 'clip-path' : '';
      st.setProperty('--it', (e * f.t).toFixed(1) + 'px');
      st.setProperty('--ib', (e * f.b).toFixed(1) + 'px');
      st.setProperty('--il', (e * f.l).toFixed(1) + 'px');
      st.setProperty('--ir', (e * f.r).toFixed(1) + 'px');
      st.setProperty('--irad', (e * f.rad).toFixed(1) + 'px');
      shade.style.opacity = (1 - e * 0.7).toFixed(3);
      dim.style.opacity = (e * 0.3).toFixed(3);
      var h = easeOut(ramp(p, 0.1, 0.27));
      rhead.style.opacity = h; rhead.style.transform = 'translateY(' + ((1 - h) * 30).toFixed(1) + 'px)';
      var n = easeOut(ramp(p, 0.26, 0.38));
      nova.style.clipPath = 'inset(' + ((1 - n) * 100).toFixed(2) + '% 0 0 0 round ' + f.rad + 'px)';
      nova.style.transform = 'translateY(' + ((1 - n) * 40).toFixed(1) + 'px)';
      // the film plays inside the frame until Nova covers it, then rests
      filmAwayNow(n >= 1 || y > R.top + R.h + vh);
      beats(p);
    }
  });
  if (reduced) { Object.keys(parts).forEach(function (k) { parts[k].classList.add('on'); }); parts.thought.classList.add('done'); }

  /* ---------- Reveals: fire once ---------- */
  var rio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -18% 0px' });
  $$('[data-reveal]').forEach(function (el) { if (reduced) el.classList.add('is-in'); else rio.observe(el); });

  /* ---------- 5. Highlights carousel ---------- */
  var track = $('[data-track]'), cards = $$('.hl__card', track), dots = $$('[data-dots] button'), hlBtn = $('[data-hl-toggle]');
  var DUR = 6.5, idx = 0, el = 0, hlPaused = reduced, hlSeen = false, hlRaf = 0, hlLast = 0, progScroll = 0;
  function cardLeft(i) { return cards[i].offsetLeft - (track.clientWidth - cards[i].offsetWidth) / 2; }
  function setActive(i, scroll) {
    idx = (i + cards.length) % cards.length; el = 0;
    cards.forEach(function (c, j) { c.classList.toggle('is-on', reduced || j === idx); });
    dots.forEach(function (d, j) { if (j === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); d.querySelector('i').style.removeProperty('--fill'); });
    if (scroll) { progScroll = performance.now(); track.scrollTo({ left: cardLeft(idx), behavior: reduced ? 'auto' : 'smooth' }); }
    paint();
  }
  function paint() { dots[idx].querySelector('i').style.setProperty('--fill', reduced ? 1 : (el / DUR).toFixed(4)); }
  function hlFrame(now) {
    hlRaf = requestAnimationFrame(hlFrame);
    el += clamp((now - hlLast) / 1000, 0, 0.1); hlLast = now;
    if (el >= DUR) setActive(idx + 1, true); else paint();
  }
  function hlRunning() { return !hlPaused && hlSeen && !hiddenTab; }
  function hlSync() {
    hlBtn.setAttribute('aria-pressed', String(hlPaused));
    hlBtn.setAttribute('aria-label', hlPaused ? 'Play' : 'Pause');
    if (hlRunning()) { if (!hlRaf) { hlLast = performance.now(); hlRaf = requestAnimationFrame(hlFrame); } }
    else { cancelAnimationFrame(hlRaf); hlRaf = 0; }
  }
  hlBtn.addEventListener('click', function () { hlPaused = !hlPaused; hlSync(); });
  dots.forEach(function (d, j) { d.addEventListener('click', function () { setActive(j, true); }); });
  [['[data-hl-prev]', -1], ['[data-hl-next]', 1]].forEach(function (b) {
    $(b[0]).addEventListener('click', function () { hlPaused = true; hlSync(); setActive(idx + b[1], true); });
  });
  // a swipe or trackpad scroll is the user taking over: follow it and pause
  track.addEventListener('pointerdown', function () { hlPaused = true; hlSync(); }, { passive: true });
  var st0 = 0;
  track.addEventListener('scroll', function () {
    clearTimeout(st0);
    st0 = setTimeout(function () {
      if (performance.now() - progScroll < 900) return;   // our own smooth scroll
      var x = track.scrollLeft, best = 0, bd = 1e9;
      cards.forEach(function (c, j) { var d = Math.abs(cardLeft(j) - x); if (d < bd) { bd = d; best = j; } });
      if (best !== idx) { setActive(best, false); hlPaused = true; hlSync(); }
    }, 120);
  }, { passive: true });
  new IntersectionObserver(function (es) { hlSeen = es[0].intersectionRatio >= 0.5; hlSync(); }, { threshold: [0, 0.5] }).observe(track);
  setActive(0, false); hlSync();

  /* ---------- 6. How Newcode works: pinned steps, each panel wipes up over the last ---------- */
  var how = $('[data-how]'), texts = $$('.how__t', how), views = $$('.how__v', how), rail = $$('.how__rail li', how);
  var H = { top: 0, h: 1 }, howStage = $('.how__stage', how);
  // Phone: no pin. Each panel plays its sequence once, when it is actually seen.
  var hio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-done'); hio.unobserve(e.target); } }); }, { threshold: 0.45 });
  scenes.push({
    measure: function () { H.top = docTop(how); H.h = how.offsetHeight - howStage.offsetHeight; },
    update: function (y) {
      if (reduced || phone()) {
        if (!H.flat) {
          H.flat = true;
          views.forEach(function (v) { v.style.clipPath = ''; v.style.transform = ''; v.style.removeProperty('--k'); if (!reduced) hio.observe(v); });
          texts.forEach(function (tx) { tx.style.opacity = ''; tx.style.transform = ''; });
        }
        return;
      }
      if (H.flat) { H.flat = false; views.forEach(function (v) { hio.unobserve(v); }); }
      // four steps, one 130vh slice each: the panel's rows build over the slice, the next step hands off over its last fifth
      var T = clamp((y - H.top) / H.h, 0, 1) * 4, cur = Math.min(3, Math.floor(T + 0.08));
      texts.forEach(function (tx, i) {
        var fin = i === 0 ? 1 : easeOut(ramp(T, i - 0.16, i + 0.02));
        var fout = i === 3 ? 1 : 1 - ramp(T, i + 0.70, i + 0.86);
        tx.style.opacity = Math.min(fin, fout).toFixed(3);
        tx.style.transform = 'translateY(' + ((1 - fin) * 24 - (1 - fout) * 24).toFixed(1) + 'px)';
      });
      views.forEach(function (v, i) {
        if (i) { var w = ease(ramp(T, i - 0.16, i + 0.10)); v.style.clipPath = 'inset(' + ((1 - w) * 100).toFixed(2) + '% 0 0 0 round var(--r))'; }
        // the panel being covered sinks back a little, so the next one reads as arriving in front of it
        var under = i < 3 ? ease(ramp(T, i + 0.84, i + 1.10)) : 0;
        v.style.transform = under ? 'scale(' + (1 - under * 0.06).toFixed(4) + ')' : '';
        v.style.setProperty('--k', ramp(T, i - 0.05, i + 0.62).toFixed(3));
      });
      rail.forEach(function (r, i) { r.classList.toggle('is-cur', i === cur); });
    }
  });

  /* ---------- 7. A closer look: tabs ---------- */
  var tabs = $$('.look__list [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (b) {
      var on = b === tab;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    if (phone()) { var l = tab.parentNode; l.scrollTo({ left: tab.offsetLeft - l.clientWidth / 2 + tab.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth' }); }
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { selectTab(b, false); });
    b.addEventListener('keydown', function (e) {
      var n = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (e.key === 'Home') n = -i; if (e.key === 'End') n = tabs.length - 1 - i;
      if (n === undefined) return;
      e.preventDefault(); selectTab(tabs[(i + n + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- 8. Customer film: lands full width as you arrive, plays on request, pauses off screen ---------- */
  var grow = $('[data-grow]'), storyBtn = $('[data-story-play]');
  var G = { top: 0 };
  scenes.push({
    measure: function () { G.top = docTop(grow); },
    update: function (y) {
      if (reduced || phone()) { grow.style.removeProperty('--gx'); return; }
      var q = ease(ramp(y + vh - G.top, vh * 0.1, vh * 0.85));
      grow.style.setProperty('--gx', ((1 - q) * 7).toFixed(3) + '%');
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

  /* ---------- 11. Closing scene: pinned; the frame opens to full bleed, the line arrives and holds ---------- */
  var close = $('[data-close]'), cframe = $('[data-closeframe]'), ccopy = $('[data-closecopy]'), cv = $('video', close), cBtn = $('[data-close-toggle]');
  var C = { top: 0, h: 1 }, cSeen = false, cPaused = reduced, closeStage = $('.close__stage');
  scenes.push({
    measure: function () { C.top = docTop(close); C.h = close.offsetHeight - closeStage.offsetHeight; },
    update: function (y) {
      if (reduced) return;
      var p = clamp((y - C.top) / C.h, 0, 1), q = 1 - ease(ramp(p, 0, 0.45));
      var ins = phone() ? 16 : Math.max(vw * 0.0625, (vw - 1260) / 2);
      cframe.style.setProperty('--ct', (q * (phone() ? 60 : 72)).toFixed(1) + 'px');
      cframe.style.setProperty('--cl', (q * ins).toFixed(1) + 'px');
      cframe.style.setProperty('--crad', (q * 28).toFixed(1) + 'px');
      var k = easeOut(ramp(p, 0.30, 0.50));
      ccopy.style.opacity = k; ccopy.style.transform = 'translateY(' + ((1 - k) * 30).toFixed(1) + 'px)';
    }
  });
  function closeSync() {
    var run = cSeen && !cPaused && !hiddenTab;
    cBtn.setAttribute('aria-pressed', String(cPaused));
    cBtn.setAttribute('aria-label', cPaused ? 'Play' : 'Pause');
    if (run) { if (!cv.getAttribute('src')) cv.src = cv.dataset.src; playV(cv); } else cv.pause();
  }
  cBtn.addEventListener('click', function () { cPaused = !cPaused; closeSync(); });
  new IntersectionObserver(function (es) { cSeen = es[0].intersectionRatio >= 0.5; closeSync(); }, { threshold: [0, 0.5] }).observe($('.close__stage'));
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
