/* nc-matter: one scroll loop, one IntersectionObserver, play-once product sequences. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- hero entrance ---------- */
  var hero = $('.hero');
  requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-ready'); }); });

  /* ---------- Nova sequence: type, think, answer, file ---------- */
  var nova = $('[data-nova]');
  function playNova() {
    var t = $('[data-type]', nova), full = t.textContent;
    if (RM) { nova.setAttribute('data-step', '4'); $('.thought', nova).classList.add('is-done'); return; }
    nova.setAttribute('data-step', '1');
    t.textContent = '';
    var caret = d.createElement('i'); caret.className = 'tcaret';
    var i = 0;
    (function tick() {
      i += 2;
      t.textContent = full.slice(0, i);
      t.appendChild(caret);
      if (i < full.length) setTimeout(tick, 22);
      else {
        setTimeout(function () { caret.remove(); nova.setAttribute('data-step', '2'); }, 300);
        setTimeout(function () { $('.thought', nova).classList.add('is-done'); nova.setAttribute('data-step', '3'); }, 1900);
        setTimeout(function () { nova.setAttribute('data-step', '4'); }, 2600);
      }
    })();
  }
  setTimeout(playNova, RM ? 0 : 1100);

  /* ---------- reveal + play-once sequences ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('is-in');
      if (el.hasAttribute('data-seq')) el.classList.add('play');
      $$('[data-seq]', el).forEach(function (s) { s.classList.add('play'); });
      if (el.matches('.matrix')) el.classList.add('play');
      // a swipe row reveals and plays all its slides at once, so the next slide never peeks in blank
      if (el.hasAttribute('data-carousel')) $$('[data-in], [data-seq]', el).forEach(function (c) { c.classList.add('is-in', 'play'); });
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
  $$('[data-in], [data-seq], .matrix, [data-carousel]').forEach(function (el) { io.observe(el); });
  if (RM) $$('[data-in], [data-seq]').forEach(function (el) { el.classList.add('is-in', 'play'); });

  /* ---------- pause looping CSS when off screen ---------- */
  var loopIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('paused-anim', !e.isIntersecting); });
  });
  $$('.dnd, .hub').forEach(function (el) { loopIO.observe(el); });

  /* ---------- Aurora guarded flow ---------- */
  var flow = $('.flow'), canvas = $('[data-flow]'), svg = $('[data-wires]');
  new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) runFlow();
    else { timers.forEach(clearTimeout); flow.className = flow.className.replace(/\bs\d\b/g, '').trim(); }
  }, { threshold: 0.35 }).observe(flow);
  function wire() {
    var cr = canvas.getBoundingClientRect();
    if (!cr.width) return;
    svg.setAttribute('viewBox', '0 0 ' + cr.width + ' ' + cr.height);
    $$('path', svg).forEach(function (p) {
      var a = d.getElementById(p.getAttribute('data-from')).getBoundingClientRect();
      var b = d.getElementById(p.getAttribute('data-to')).getBoundingClientRect();
      var x1 = a.right - cr.left + 2, y1 = a.top + a.height / 2 - cr.top;
      var toReview = p.getAttribute('data-to') === 'f-review';
      var x2 = (toReview ? b.left + b.width * 0.18 : b.left) - cr.left, y2 = toReview ? b.top - cr.top : b.top + b.height / 2 - cr.top;
      var dx = Math.max(40, (x2 - x1) * 0.5);
      var dd = toReview
        ? 'M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ' ' + x2 + ' ' + (y2 - Math.max(60, (y2 - y1) * 0.6)) + ' ' + x2 + ' ' + y2
        : 'M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2;
      p.setAttribute('d', dd);
      p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1);
    });
  }
  var timers = [];
  function pulse(cls) {
    var p = $('.w--' + cls, svg), dot = d.createElement('i');
    dot.className = 'pulse';
    var cr = canvas.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    var k = vb.width ? cr.width / vb.width : 1;
    dot.style.offsetPath = 'path("' + p.getAttribute('d') + '")';
    dot.style.transform = 'scale(' + (1 / k) + ')';
    canvas.appendChild(dot);
    requestAnimationFrame(function () { dot.classList.add('go'); });
    setTimeout(function () { dot.remove(); }, 1500);
  }
  function runFlow() {
    timers.forEach(clearTimeout); timers = [];
    flow.className = flow.className.replace(/\bs\d\b/g, '').trim();
    wire();
    if (RM) { flow.classList.add('s1', 's2', 's3', 's4', 's5', 's6'); return; }
    var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
    at(300, function () { flow.classList.add('s1'); });
    at(1100, function () { pulse('pass'); });
    at(1500, function () { flow.classList.add('s2'); });
    at(2300, function () { pulse('tools'); });
    at(2900, function () { flow.classList.add('s3'); });
    at(3900, function () { pulse('fail'); });
    at(5100, function () { flow.classList.add('s4'); });
    at(5900, function () { flow.classList.add('s5'); });
    at(6700, function () { flow.classList.add('s6'); });
  }

  /* ---------- Nova tabs: auto-advance while in view, click hands control over ---------- */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role=tab]', box), dur = +box.getAttribute('data-auto') || 7000, cur = 0, auto = !RM, visible = false;
    var pb = $('[data-pause]', box);
    function setAuto(v) {
      auto = v; box.classList.toggle('is-paused', !v);
      pb.setAttribute('aria-label', v ? 'Pause the rotation' : 'Play the rotation');
      pb.setAttribute('aria-pressed', String(!v));
    }
    box.style.setProperty('--dur', dur + 'ms');
    function show(i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, j) {
        var on = j === cur;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        d.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        var bar = $('.tab__t', t); bar.classList.remove('is-run');
      });
      var m = $('.matrix', d.getElementById(tabs[cur].getAttribute('aria-controls')));
      if (m) { m.classList.remove('play'); void m.offsetWidth; m.classList.add('play'); }
      if (focus) tabs[cur].focus();
      arm();
    }
    function arm() {
      var bar = $('.tab__t', tabs[cur]);
      bar.classList.remove('is-run');
      if (auto && visible) { void bar.offsetWidth; bar.classList.add('is-run'); }
    }
    tabs.forEach(function (t, j) {
      t.addEventListener('click', function () { setAuto(false); show(j); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { setAuto(false); show(cur + 1, true); }
        if (e.key === 'ArrowLeft') { setAuto(false); show(cur - 1, true); }
      });
      $('.tab__t', t).addEventListener('animationend', function () { if (auto) show(cur + 1); });
    });
    pb.addEventListener('click', function () { setAuto(!auto); arm(); });
    setAuto(auto);
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; arm(); }, { threshold: 0.4 }).observe(box);
  });

  /* ---------- audience slats ---------- */
  var slats = $$('[data-slat]');
  slats.forEach(function (s) {
    var b = $('.slat__btn', s);
    function on() {
      slats.forEach(function (o) { o.classList.toggle('is-on', o === s); $('.slat__btn', o).setAttribute('aria-expanded', o === s); });
    }
    b.addEventListener('click', on);
    s.addEventListener('mouseenter', function () { if (window.innerWidth > 760) on(); });
  });

  /* ---------- phone carousels: dots follow the swipe, tap a dot to go there ---------- */
  $$('[data-carousel]').forEach(function (row) {
    var items = Array.prototype.slice.call(row.children), dots = d.createElement('div');
    dots.className = 'dots'; dots.setAttribute('aria-hidden', 'true');
    items.forEach(function (it) {
      var b = d.createElement('i');
      b.addEventListener('click', function () { row.scrollTo({ left: it.offsetLeft - row.offsetLeft - (row.clientWidth - it.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' }); });
      dots.appendChild(b);
    });
    row.after(dots);
    function upd() {
      var c = row.scrollLeft + row.clientWidth / 2, best = 0, bd = 1e9;
      items.forEach(function (it, i) { var m = it.offsetLeft - row.offsetLeft + it.offsetWidth / 2, dd = Math.abs(m - c); if (dd < bd) { bd = dd; best = i; } });
      Array.prototype.forEach.call(dots.children, function (b, i) { b.classList.toggle('is-on', i === best); });
    }
    row.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    upd();
  });

  /* ---------- film plays in place ---------- */
  var fb = $('[data-film-play]');
  fb.addEventListener('click', function () {
    var box = fb.parentNode, v = d.createElement('video');
    v.src = box.getAttribute('data-film'); v.controls = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('aria-label', 'Ræder Bing customer film');
    box.replaceChildren(v); v.focus();
  });

  /* ---------- phone menu ---------- */
  var mb = $('[data-menu]'), mm = $('[data-mmenu]');
  mb.addEventListener('click', function () {
    var open = mb.getAttribute('aria-expanded') !== 'true';
    mb.setAttribute('aria-expanded', open); mm.classList.toggle('is-open', open);
    $('span', mb).textContent = open ? 'Close' : 'Menu';
  });
  $$('a', mm).forEach(function (a) { a.addEventListener('click', function () { mb.click(); }); });

  /* ---------- Voyager field: a billion documents to the one that matters ---------- */
  var cv = $('[data-field]'), ctx = cv.getContext('2d'), pts = [], fieldP = 0, fieldOn = false, W = 0, H = 0, dpr = 1;
  function sizeField() {
    var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
    if (!pts.length) for (var i = 0; i < 900; i++) pts.push({ x: Math.random(), y: Math.random() * 0.78, s: Math.random(), ph: Math.random() * 6.28 });
  }
  function drawField(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var tx = W * 0.5, ty = H * 0.3, p = RM ? 1 : fieldP;
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i];
      var k = clamp((p * 1.5 - q.s * 0.5), 0, 1); k = k * k * (3 - 2 * k);
      var wob = RM ? 0 : Math.sin(t / 1400 + q.ph) * 3 * (1 - k);
      var x = q.x * W + (tx - q.x * W) * k + wob, y = q.y * H + (ty - q.y * H) * k + Math.cos(t / 1700 + q.ph) * 2 * (1 - k);
      ctx.globalAlpha = (0.14 + q.s * 0.3) * (1 - k * 0.92);
      ctx.fillStyle = q.s > 0.94 ? '#D596FE' : '#ffffff';
      ctx.fillRect(x, y, 3, 4);
    }
    var f = clamp((p - 0.55) / 0.35, 0, 1);
    if (f > 0) {
      ctx.globalAlpha = f;
      var w = 34 + 26 * f, h = w * 1.3;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - w / 2, ty - h / 2, w, h);
      ctx.fillStyle = '#57068C'; ctx.fillRect(tx - w / 2, ty - h / 2, w, 6);
      ctx.fillStyle = 'rgba(21,17,27,.18)';
      for (var l = 0; l < 4; l++) ctx.fillRect(tx - w / 2 + 7, ty - h / 2 + 16 + l * 8, (w - 14) * (l === 3 ? 0.55 : 1), 3);
      ctx.globalAlpha = f * 0.5; ctx.strokeStyle = '#D596FE'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(tx, ty, h * 0.9 + (RM ? 0 : Math.sin(t / 600) * 4), 0, 6.283); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  new IntersectionObserver(function (es) { fieldOn = es[0].isIntersecting; if (fieldOn && RM) drawField(0); }).observe(cv);
  sizeField();

  /* ---------- the one scroll loop ---------- */
  var nav = $('[data-nav]'), trackFill = $('[data-track-fill]');
  var trackItems = $$('[data-track-for]');
  var acts = trackItems.map(function (li) { return d.getElementById(li.getAttribute('data-track-for')); });
  var sec = $('#security');
  var sections = $$('main > section, footer');
  var scrubs = $$('[data-scrub]');
  var plates = $$('.plate');
  var hs = $('[data-hero-stage]');
  var last = -1;

  function frame(t) {
    var vh = window.innerHeight, y = window.scrollY;
    if (y !== last || fieldOn) {
      if (y !== last) {
        last = y;
        // nav theme: what sits under the bar
        var probe = 30, theme = 'light';
        for (var i = 0; i < sections.length; i++) {
          var r = sections[i].getBoundingClientRect();
          if (r.top <= probe && r.bottom > probe) {
            theme = sections[i].classList.contains('close') ? 'purple' : (sections[i].classList.contains('dark') || sections[i].tagName === 'FOOTER') ? 'dark' : 'light';
            break;
          }
        }
        nav.classList.toggle('is-scrolled', y > 10);
        nav.classList.toggle('is-light', theme === 'light' && y > 10);
        nav.classList.toggle('is-purple', theme === 'purple');

        // scrub values
        scrubs.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var p = el.classList.contains('foot__wm') ? clamp((vh - r.top) / (r.height * 1.1), 0, 1) : clamp((vh - r.top) / (vh + r.height), 0, 1);
          el.style.setProperty('--p', p.toFixed(4));
        });
        $$('.h-act').forEach(function (h) { var r = h.getBoundingClientRect(); h.parentNode.style.setProperty('--sp', clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(3)); });
        if (!RM) plates.forEach(function (pl) { var r = pl.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) pl.style.setProperty('--pp', ((r.top + r.height / 2) / vh - 0.5).toFixed(3)); });
        hs.style.setProperty('--p', clamp(y / vh, 0, 1).toFixed(3));

        // the harness: which act holds the middle of the screen
        var mid = vh * 0.45, now = -1;
        for (var a = 0; a < acts.length; a++) if (acts[a].getBoundingClientRect().top <= mid) now = a;
        var first = acts[0].getBoundingClientRect().top + y, end = sec.getBoundingClientRect().top + y;
        var prog = clamp((y + mid - first) / (end - first), 0, 1);
        trackItems.forEach(function (li, j) { li.classList.toggle('is-now', j === now); li.classList.toggle('is-done', j < now); });
        trackFill.style.setProperty('--f', prog.toFixed(3));
        nav.classList.toggle('is-track', now >= 0 && sec.getBoundingClientRect().top > mid);
      }
      if (fieldOn) {
        var fr = cv.getBoundingClientRect();
        fieldP = clamp((vh * 0.95 - fr.top) / (vh * 0.85), 0, 1);
        drawField(t);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- pointer light in the hero ---------- */
  if (!RM) hero.addEventListener('pointermove', function (e) { hero.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3)); });

  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { sizeField(); wire(); last = -1; if (RM) drawField(0); }, 120); });
  window.addEventListener('load', function () { wire(); });
})();
