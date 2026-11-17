/* Newcode homepage refresh prototype. Quiet motion only: rise on scroll, one count-up, loops inside product frames. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------- Header: tone over dark bands, CTA after the hero ---------- */
  var header = $('.site-header');
  var hero = $('.hero');
  var darkBands = $$('[data-header-tone="dark"]');
  function updateHeader() {
    if (!header) return;
    var probe = header.getBoundingClientRect().top + 44;
    var dark = darkBands.some(function (band) {
      var r = band.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    header.setAttribute('data-tone', dark ? 'dark' : 'light');
    if (hero) header.classList.toggle('is-past-hero', hero.getBoundingClientRect().bottom < 80);
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; updateHeader(); updateSweep(); updateRail(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Dropdown menus in the navigation pill ---------- */
  var menuButtons = $$('[data-menu-button]');
  function closeMenus(except) {
    menuButtons.forEach(function (btn) {
      if (btn === except) return;
      btn.setAttribute('aria-expanded', 'false');
      var menu = doc.getElementById(btn.getAttribute('aria-controls'));
      if (menu) menu.classList.remove('is-open');
    });
  }
  menuButtons.forEach(function (btn) {
    var item = btn.parentElement;
    var menu = doc.getElementById(btn.getAttribute('aria-controls'));
    var timer, openedAt = 0;
    function open() {
      clearTimeout(timer);
      if (btn.getAttribute('aria-expanded') === 'true') return;
      closeMenus(btn); btn.setAttribute('aria-expanded', 'true'); menu.classList.add('is-open'); openedAt = Date.now();
    }
    function close() { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); }
    btn.addEventListener('click', function () {
      /* A click that follows the hover that just opened the menu keeps it open. */
      if (btn.getAttribute('aria-expanded') === 'true' && Date.now() - openedAt > 400) close(); else open();
    });
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', function () { timer = setTimeout(close, 160); });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) close(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = menuButtons.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
    closeMenus();
    if (open) open.focus();
    setMobileMenu(false);
  });
  doc.addEventListener('click', function (e) { if (!e.target.closest('.nav-pill')) closeMenus(); });

  /* ---------- Mobile menu ---------- */
  var mobileToggle = $('[data-mobile-toggle]');
  var mobileMenu = $('[data-mobile-menu]');
  function setMobileMenu(open) {
    if (!mobileToggle || !mobileMenu) return;
    mobileToggle.setAttribute('aria-expanded', String(open));
    if (open && header) mobileMenu.style.paddingTop = Math.round(header.getBoundingClientRect().top + 92) + 'px';
    mobileMenu.classList.toggle('is-open', open);
    doc.body.classList.toggle('menu-open', open);
    var label = $('[data-mobile-toggle-label]', mobileToggle);
    if (label) label.textContent = open ? 'Close' : 'Menu';
  }
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () { setMobileMenu(mobileToggle.getAttribute('aria-expanded') !== 'true'); });
    mobileMenu.addEventListener('click', function (e) { if (e.target.closest('a')) setMobileMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1023) setMobileMenu(false); });
  }

  /* ---------- Closing CTA shape: upgrade the still to the looping film when it comes near ---------- */
  var shape = $('[data-shape]');
  function startShape() {
    var ua = navigator.userAgent;
    var isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
    var src = isSafari ? shape.getAttribute('data-mov') : shape.getAttribute('data-webm');
    if (!src) return; /* no film for this browser on this host: the still stays */
    var video = doc.createElement('video');
    video.muted = true; video.loop = true; video.autoplay = true;
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
    video.preload = 'auto';
    video.src = src;
    video.style.opacity = '0';
    video.style.transition = 'opacity 0.6s ease';
    video.addEventListener('playing', function () {
      video.style.opacity = '1';
      var still = $('img', shape);
      if (still) still.style.opacity = '0';
    }, { once: true });
    video.addEventListener('error', function () { video.style.display = 'none'; });
    shape.appendChild(video);
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: the still stays */ });
  }
  if (shape && !reduceMotion && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      sio.disconnect();
      startShape();
    }, { rootMargin: '600px 0px' });
    sio.observe(shape);
  }

  /* ---------- Product UI loops: play only while the frame is on screen ---------- */
  var players = $$('[data-play]');
  if (players.length && !reduceMotion && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-playing', entry.isIntersecting); });
    }, { threshold: 0.35 });
    players.forEach(function (el) { pio.observe(el); });
  }

  /* ---------- Flow diagrams: wires run from each port to the block it feeds ---------- */
  $$('.flow').forEach(function (flow) {
    var svg = $('[data-wires]', flow);
    if (!svg) return;
    function draw() {
      var r = flow.getBoundingClientRect();
      if (!r.width) return;
      var k = flow.offsetWidth / r.width;
      svg.setAttribute('viewBox', '0 0 ' + flow.offsetWidth + ' ' + flow.offsetHeight);
      $$('path', svg).forEach(function (path) {
        var from = doc.getElementById(path.getAttribute('data-from'));
        var to = doc.getElementById(path.getAttribute('data-to'));
        if (!from || !to) return;
        var fr = from.getBoundingClientRect();
        var nr = from.closest('.node').getBoundingClientRect();
        var tr = to.getBoundingClientRect();
        var head = $('header', to).getBoundingClientRect();
        var x1 = (nr.right - r.left) * k, y1 = (fr.top + fr.height / 2 - r.top) * k;
        var x2 = (tr.left - r.left) * k, y2 = (head.top + head.height / 2 - r.top) * k;
        var dx = Math.max(16, (x2 - x1) * 0.5);
        path.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
      });
    }
    draw();
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(flow);
    window.addEventListener('load', draw);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(draw);
  });

  /* ---------- Rise on scroll ---------- */
  var revealEls = $$('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    root.classList.add('reveal-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Trusted by: names fill in as the list scrolls through the viewport ---------- */
  var sweep = $('[data-sweep]');
  var sweepItems = sweep ? $$('[data-sweep-item]', sweep) : [];
  if (sweep && !reduceMotion) sweep.classList.add('is-sweeping');
  function updateSweep() {
    if (!sweep || reduceMotion) return;
    var r = sweep.getBoundingClientRect();
    var vh = window.innerHeight;
    var start = vh * 0.88, end = vh * 0.3;
    var progress = (start - r.top) / (start - end + r.height * 0.55);
    progress = Math.max(0, Math.min(1, progress));
    var lit = Math.ceil(progress * sweepItems.length);
    sweepItems.forEach(function (item, i) { item.classList.toggle('is-lit', i < lit); });
  }

  /* ---------- How Newcode works: progress rail and active step ---------- */
  var rail = $('[data-rail]');
  var steps = $$('[data-step]');
  function updateRail() {
    if (!rail) return;
    var r = rail.getBoundingClientRect();
    var mid = window.innerHeight * 0.55;
    var progress = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    rail.style.setProperty('--progress', progress.toFixed(4));
    steps.forEach(function (step) {
      var sr = step.getBoundingClientRect();
      step.classList.toggle('is-active', sr.top < mid && sr.bottom > mid);
      step.classList.toggle('is-done', sr.top < mid);
    });
  }

  /* ---------- Count-up, once ---------- */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cio.unobserve(entry.target);
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var startTime = null, duration = 1400;
        function frame(t) {
          if (startTime === null) startTime = t;
          var k = Math.min(1, (t - startTime) / duration);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = String(Math.round(target * eased));
          if (k < 1) window.requestAnimationFrame(frame);
        }
        el.textContent = '0';
        window.requestAnimationFrame(frame);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Tabs (Solutions by audience) ---------- */
  $$('[data-tabs]').forEach(function (group) {
    var tabs = $$('[role="tab"]', group);
    var panels = $$('[role="tabpanel"]', group);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* ---------- Review notes: list every labeled placeholder and confirm flag ---------- */
  var noteItems = $$('[data-note]');
  var noteList = $('[data-note-list]');
  var countEl = $('[data-ph-count]');
  if (countEl && noteItems.length) countEl.textContent = noteItems.length + ' placeholders and open points';
  if (noteList) {
    noteItems.forEach(function (el, i) {
      var id = el.id || ('note-' + (i + 1));
      el.id = id;
      var li = doc.createElement('li');
      var a = doc.createElement('a');
      a.href = '#' + id;
      a.textContent = el.getAttribute('data-note');
      li.appendChild(a);
      noteList.appendChild(li);
    });
  }

  updateHeader(); updateSweep(); updateRail();
})();
