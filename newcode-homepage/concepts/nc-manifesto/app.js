/* nc-manifesto: one scroll loop, IntersectionObserver for one-shot builds, everything at rest under reduced motion. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, win = window;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = win.matchMedia('(max-width: 720px)');
  var fine = win.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduce) root.classList.add('motion');

  /* ---------- Split text into characters (hero, verbs) and words ([data-lines]) ---------- */
  function splitChars(el, start) {
    var i = start || 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            if (!c.trim()) { if (c) { var sp = doc.createElement('span'); sp.className = 'ch ch--sp'; sp.textContent = ' '; frag.appendChild(sp); } return; }
            var s = doc.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--ci', i++); s.setAttribute('aria-hidden', 'true'); frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return i;
  }
  var title = $('[data-kinetic]');
  if (title) {
    title.setAttribute('aria-label', 'AI for forward-thinking law firms');
    // phone splits "forward-thinking" over two lines
    var nw = $('.nw', title);
    nw.innerHTML = '<span class="p1">forward-</span><span class="p2">thinking</span>';
    var n = 0;
    $$('.ln', title).forEach(function (ln) { n = splitChars(ln, n); });
  }
  $$('.hero__rules i').forEach(function (r, k) { r.style.setProperty('--ri', k); });

  $$('[data-verb]').forEach(function (v) {
    var word = v.textContent.trim();
    var mk = function (cls) {
      var l = doc.createElement('span'); l.className = cls;
      word.split('').forEach(function (c, k) { var w = doc.createElement('span'); w.className = 'vc'; var s = doc.createElement('span'); s.textContent = c; w.appendChild(s); w.style.setProperty('--ci', k); s.style.setProperty('--ci', k); l.appendChild(w); });
      return l;
    };
    v.textContent = '';
    v.appendChild(mk('vlayer'));
    v.appendChild(mk('vlayer vfill'));
  });

  $$('[data-lines]').forEach(function (el) {
    var i = 0;
    var target = el.children.length === 1 && el.firstElementChild.tagName === 'SPAN' ? el.firstElementChild : el;
    var words = target.textContent.trim().split(/\s+/);
    target.textContent = '';
    words.forEach(function (w, k) {
      var o = doc.createElement('span'); o.className = 'wd';
      var s = doc.createElement('span'); s.textContent = w; o.style.setProperty('--i', i++); s.style.setProperty('--i', k);
      o.appendChild(s); target.appendChild(o);
      if (k < words.length - 1) target.appendChild(doc.createTextNode(' '));
    });
  });

  /* ---------- Fit the hero type so the longest line runs margin to margin ---------- */
  var hero = $('[data-hero]');
  function fitHero() {
    if (!hero) return;
    hero.style.setProperty('--hs', '100px');
    var cs = getComputedStyle(hero);
    var w = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var max = 0;
    var ln2 = $('.ln2', hero);
    ln2.style.width = 'max-content';
    max = ln2.getBoundingClientRect().width;
    ln2.style.width = '';
    // desktop: four fifths of margin to margin, so the product shows in the first screen; phone: three lines edge to edge
    var k = phone.matches ? 0.995 : 0.8;
    if (max) hero.style.setProperty('--hs', Math.min(170, Math.floor(100 * w / max * k * 10) / 10) + 'px');
  }
  function fitClose() {
    var t = $('.close__title'); if (!t) return;
    var w = t.parentElement.clientWidth - 2 * parseFloat(getComputedStyle(t.parentElement).paddingLeft);
    t.style.setProperty('--cs', '100px'); t.style.maxWidth = 'none';
    // widest of the two lines "See Newcode on" / "your own matters" at 100px
    var probe = doc.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit';
    t.appendChild(probe);
    var lines = phone.matches ? ['See Newcode', 'on your own', 'matters'] : ['See Newcode on', 'your own matters'];
    var max = 0;
    lines.forEach(function (s) { probe.textContent = s; max = Math.max(max, probe.getBoundingClientRect().width); });
    t.removeChild(probe);
    var size = Math.min(200, Math.floor(100 * w / max * 0.97));
    t.style.setProperty('--cs', size + 'px');
    t.style.maxWidth = (max / 100 * size * 1.02) + 'px';
  }

  /* ---------- Hero pointer: letters near the cursor lift and take the purple ---------- */
  var chars = title ? $$('.ch:not(.ch--sp)', title) : [];
  var pointer = { x: -9999, y: -9999, on: false };
  if (fine && !reduce && chars.length) {
    hero.addEventListener('pointermove', function (e) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; tick(); });
    hero.addEventListener('pointerleave', function () { pointer.on = false; tick(); });
  }
  function heroPointer() {
    if (!root.classList.contains('is-settled')) return;
    chars.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var dx = pointer.x - (r.left + r.width / 2), dy = pointer.y - (r.top + r.height / 2);
      var d = Math.sqrt(dx * dx + dy * dy);
      var k = pointer.on ? clamp(1 - d / 220, 0, 1) : 0;
      k = k * k * (3 - 2 * k);
      c.style.transform = k ? 'translateY(' + (-k * 0.09).toFixed(3) + 'em)' : '';
      c.classList.toggle('is-hot', k > 0.55);
    });
  }

  /* ---------- How: pinned stage ---------- */
  var how = $('[data-how]');
  var verbs = $$('[data-verb]'), copies = $$('[data-copy]'), stages = $$('[data-stage]'), stepBtns = $$('[data-step-btn]');
  var step = -1;
  function play(el) { el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }
  function setStep(s, fromScroll) {
    if (s === step) return;
    var prev = step; step = s;
    verbs.forEach(function (v, k) { v.classList.toggle('is-on', k === s); v.classList.toggle('is-out', k === prev && k !== s); });
    copies.forEach(function (c, k) { c.classList.toggle('is-on', k === s); });
    stages.forEach(function (st, k) {
      st.classList.toggle('was-on', k === prev);
      st.classList.toggle('is-on', k === s);
      if (k === s) play(st);
    });
    stepBtns.forEach(function (b, k) { b.setAttribute('aria-selected', k === s ? 'true' : 'false'); if (k !== s) b.style.setProperty('--p', k < s ? 1 : 0); });
    if (s === 3) requestAnimationFrame(drawWires);
    setTimeout(function () { verbs.forEach(function (v) { v.classList.remove('is-out'); }); }, 900);
  }
  stepBtns.forEach(function (b, k) {
    b.addEventListener('click', function () {
      if (phone.matches || !how) { setStep(k); stepBtns[k].style.setProperty('--p', 1); return; }
      var r = how.getBoundingClientRect();
      var span = how.offsetHeight - win.innerHeight;
      win.scrollTo({ top: win.scrollY + r.top + span * (k + 0.5) / 4, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  // phone: swipe the stage
  var sx = null;
  var stagesBox = $('.how__stages');
  if (stagesBox) {
    stagesBox.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stagesBox.addEventListener('touchend', function (e) {
      if (sx === null || !phone.matches) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { var s = clamp(step + (dx < 0 ? 1 : -1), 0, 3); setStep(s); stepBtns[s].style.setProperty('--p', 1); }
    });
  }

  /* ---------- Aurora wires: each port to the field it feeds ---------- */
  function drawWires() {
    $$('[data-wires]').forEach(function (svg) {
      var flow = svg.parentElement;
      var r = flow.getBoundingClientRect();
      if (!r.width || !flow.offsetWidth) return;
      var k = flow.offsetWidth / r.width;
      svg.setAttribute('viewBox', '0 0 ' + flow.offsetWidth + ' ' + flow.offsetHeight);
      $$('path', svg).forEach(function (path) {
        var from = doc.getElementById(path.getAttribute('data-from'));
        var to = doc.getElementById(path.getAttribute('data-to'));
        if (!from || !to) return;
        var isNode = to.classList.contains('node');
        var node = isNode ? to : to.closest('.node');
        var anchor = isNode ? $('header', to) : to;
        var fr = from.getBoundingClientRect(), nr = from.closest('.node').getBoundingClientRect();
        var tr = node.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
        var x1 = (nr.right - r.left) * k, y1 = (fr.top + fr.height / 2 - r.top) * k;
        var x2 = (tr.left - r.left) * k, y2 = (ar.top + ar.height / 2 - r.top) * k;
        var dx = Math.max(14, (x2 - x1) * 0.5);
        path.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
      });
    });
  }

  /* ---------- Products index ---------- */
  var prows = $$('[data-prow]'), pvs = $$('[data-pv]');
  var pActive = -1, hoverUntil = 0;
  function setProduct(i) {
    if (i === pActive) return;
    pActive = i;
    prows.forEach(function (r, k) { r.classList.toggle('is-on', k === i); });
    pvs.forEach(function (p, k) {
      p.classList.toggle('is-on', k === i);
      if (k === i) {
        var host = $('.tview.is-on', p) || $('.stage--plain', p);
        if (host) play(host);
        startTabs(p);
      } else stopTabs(p);
    });
  }
  prows.forEach(function (r, k) {
    var a = $('a', r);
    var go = function () { hoverUntil = Date.now() + 1600; setProduct(k); };
    a.addEventListener('pointerenter', function () { if (fine) go(); });
    a.addEventListener('focus', go);
  });

  /* Tabs inside a preview (Nova, Aurora): advance on a visible timer until someone picks one */
  function selectTab(panel, i) {
    var btns = $$('[data-tab]', panel), views = $$('[data-tview]', panel);
    btns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    views.forEach(function (v, k) { v.classList.toggle('is-on', k === i); if (k === i) play(v); });
  }
  $$('[data-tabs]').forEach(function (panel) {
    var bar = $('.pv__tabs', panel);
    $$('[data-tab]', panel).forEach(function (b, k) {
      b.addEventListener('click', function () { bar.classList.remove('is-auto'); panel.dataset.manual = '1'; selectTab(panel, k); });
      $('s', b).addEventListener('animationend', function () {
        if (!bar.classList.contains('is-auto')) return;
        var n = $$('[data-tab]', panel).length;
        selectTab(panel, (k + 1) % n);
      });
    });
  });
  function startTabs(pv) {
    var panel = $('[data-tabs]', pv); if (!panel || reduce || panel.dataset.manual || phone.matches) return;
    $('.pv__tabs', panel).classList.add('is-auto');
  }
  function stopTabs(pv) { var b = $('.pv__tabs', pv); if (b) b.classList.remove('is-auto'); }

  $$('.thread i').forEach(function (t, k) { t.style.setProperty('--k', k); });
  $$('.wave i').forEach(function (t, k) { t.style.setProperty('--k', k); t.style.setProperty('--a', (0.35 + 0.65 * Math.abs(Math.sin(k * 1.7))).toFixed(2)); });

  /* Phone product deck: count, progress bar, previous and next */
  var deck = $('.pviews'), count = $('[data-count]'), deckBar = $('[data-deckbar]'), deckBtns = $$('[data-deck]');
  var deckAt = 0;
  function deckW() { return pvs[0].getBoundingClientRect().width + 10; }
  function deckSync() {
    if (!phone.matches) return;
    var i = clamp(Math.round(deck.scrollLeft / deckW()), 0, pvs.length - 1);
    deckAt = i;
    count.textContent = i + 1;
    deckBar.style.setProperty('--dp', ((i + 1) / pvs.length).toFixed(3));
    deckBtns[0].disabled = i === 0; deckBtns[1].disabled = i === pvs.length - 1;
    setProduct(i);
  }
  if (deck && count) {
    deck.addEventListener('scroll', deckSync, { passive: true });
    deckBtns.forEach(function (b) { b.addEventListener('click', function () { deck.scrollTo({ left: clamp(deckAt + Number(b.dataset.deck), 0, pvs.length - 1) * deckW(), behavior: reduce ? 'auto' : 'smooth' }); }); });
    deckBtns[0].disabled = true;
  }

  /* ---------- Audiences ---------- */
  var audBtns = $$('[data-aud-btn]'), aps = $$('[data-ap]');
  function setAud(i, focus) {
    audBtns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; if (k === i && focus) b.focus(); });
    aps.forEach(function (a, k) { a.classList.toggle('is-on', k === i); });
  }
  audBtns.forEach(function (b, k) {
    b.addEventListener('click', function () { setAud(k); });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setAud((k + (e.key === 'ArrowRight' ? 1 : -1) + audBtns.length) % audBtns.length, true); }
    });
  });
  setAud(0);

  /* ---------- Voices track dots (phone) ---------- */
  var track = $('.voices__track'), dots = $$('[data-dots] i');
  if (track) track.addEventListener('scroll', function () {
    var items = track.children, w = items[0].getBoundingClientRect().width + 12;
    var i = clamp(Math.round(track.scrollLeft / w), 0, dots.length - 1);
    dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
  }, { passive: true });

  /* ---------- Film ---------- */
  var filmBtn = $('[data-film-play]');
  if (filmBtn) filmBtn.addEventListener('click', function () {
    var f = $('[data-film]');
    var v = doc.createElement('video');
    v.src = '../../assets/film/raeder-bing-story-360p.mp4'; v.controls = true; v.autoplay = true; v.playsInline = true;
    v.poster = '../../assets/places/raeder-bing-film-still.webp';
    v.setAttribute('aria-label', 'Ræder Bing customer film');
    f.innerHTML = ''; f.appendChild(v); v.focus();
  });

  /* ---------- Nova sequence: plays in view, pause button ---------- */
  var nova = $('[data-play]'), pauseBtn = $('[data-pause]');
  var userPaused = false;
  if (pauseBtn) pauseBtn.addEventListener('click', function () {
    userPaused = !userPaused;
    nova.classList.toggle('is-paused', userPaused);
    pauseBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    $('[data-pause-label]', pauseBtn).textContent = userPaused ? 'Play' : 'Pause';
  });
  if (reduce && pauseBtn) pauseBtn.hidden = true;

  /* ---------- Menu ---------- */
  var menuBtn = $('[data-menu-btn]'), menu = $('[data-menu]');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open; doc.body.style.overflow = open ? 'hidden' : '';
      $('span', menuBtn).textContent = open ? 'Close' : 'Menu';
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menuBtn.click(); }); });
  }

  /* ---------- One-shot reveals ---------- */
  $$('.tile').forEach(function (t, k) { t.style.setProperty('--k', k); });
  $$('.names > *').forEach(function (t, k) { t.style.setProperty('--k', k); });
  $$('.deploy__nodes li').forEach(function (t, k) { t.style.setProperty('--k', k); });
  if ('IntersectionObserver' in win) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        if (e.target === nova) { nova.classList.add('is-playing'); }
        if (e.target.matches('.stage--plain, [data-tview]')) play(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    $$('[data-lines], [data-sys], .names, [data-mark], [data-deploy]').forEach(function (el) { io.observe(el); });
    if (nova) io.observe(nova);
  } else {
    $$('[data-lines], [data-sys], .names, [data-mark], [data-deploy]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- The scroll loop ---------- */
  var nav = $('[data-nav]'), meridian = $('[data-rise]'), footMark = $('[data-footmark]');
  var drifts = $$('[data-drift]');
  var lastY = 0, queued = false;
  function tick() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  function frame() {
    queued = false;
    var y = win.scrollY, vh = win.innerHeight;
    nav.classList.toggle('is-scrolled', y > 24);
    nav.classList.toggle('is-hidden', y > lastY + 4 && y > vh * 1.2 && !phone.matches ? true : (y < lastY - 4 ? false : nav.classList.contains('is-hidden')));
    lastY = y;

    if (!reduce) {
      // hero lines part as you leave
      var hp = clamp(y / vh, 0, 1.2);
      drifts.forEach(function (d) { d.style.transform = 'translate3d(' + (parseFloat(d.dataset.drift) * hp * 7).toFixed(2) + 'vw,0,0)'; });
      if (meridian) {
        var mr = meridian.getBoundingClientRect();
        meridian.style.setProperty('--rise', clamp((vh - mr.top) / (vh * 0.75), 0, 1).toFixed(3));
      }
      if (footMark) {
        var fr = footMark.getBoundingClientRect();
        footMark.style.setProperty('--fm', clamp((vh - fr.top) / (fr.height * 1.4), 0, 1).toFixed(3));
      }
    }

    // how: which step, and how far through it
    if (how && !phone.matches) {
      var hr = how.getBoundingClientRect();
      var span = how.offsetHeight - vh;
      var hp2 = clamp(-hr.top / span, 0, 0.9999);
      var s = Math.floor(hp2 * 4), local = hp2 * 4 - s;
      setStep(s, true);
      var f = reduce ? 100 : clamp(local * 1.15, 0, 1) * 100;
      verbs[s].style.setProperty('--f', f.toFixed(1) + '%');
      verbs.forEach(function (v, k) { if (k !== s) v.style.setProperty('--f', k < s ? '100%' : '0%'); });
      stepBtns[s].style.setProperty('--p', clamp(local * 1.15, 0, 1).toFixed(3));
    }

    // products: the row nearest the reading line, unless the pointer chose one
    if (prows.length && !phone.matches && Date.now() > hoverUntil) {
      var best = -1, bd = 1e9, line = vh * 0.5;
      var lr = $('.pindex__list').getBoundingClientRect();
      if (lr.top < vh && lr.bottom > 0) {
        prows.forEach(function (r, k) {
          var rr = r.getBoundingClientRect();
          var d = Math.abs(rr.top + rr.height / 2 - line);
          if (d < bd) { bd = d; best = k; }
        });
        if (best > -1) setProduct(best);
      }
    }
    if (y < vh && (pointer.on || root.classList.contains('is-settled'))) heroPointer();
  }
  win.addEventListener('scroll', tick, { passive: true });
  win.addEventListener('resize', function () { fitHero(); fitClose(); drawWires(); tick(); });

  /* ---------- Start ---------- */
  function start() {
    fitHero(); fitClose();
    setStep(0); setProduct(0);
    drawWires();
    frame();
    requestAnimationFrame(function () {
      root.classList.add('is-ready');
      setTimeout(function () { root.classList.add('is-settled'); }, reduce ? 0 : 2200);
    });
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(start); else start();
  win.addEventListener('load', function () { fitHero(); fitClose(); drawWires(); });
})();
