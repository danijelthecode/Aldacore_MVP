/* Concept "product-stage". main.js already runs the header, menus, hero flow and film, tabs and the customer film.
   This file runs the stage (scroll picks the scene, each scene builds once on arrival) and the few one-time reveals. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* Streamed text: each word becomes a span with its index, so CSS can reveal words in order without moving the layout. */
  $$('[data-stream]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var s = doc.createElement('span');
      s.style.setProperty('--w', i);
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(doc.createTextNode(' '));
    });
  });

  /* ---------- The stage ---------- */
  var section = $('[data-stage-section]');
  var stage = $('[data-stage]');
  if (section && stage) {
    var acts = $$('.ps-act', section);
    var scenes = $$('.ps-scene', stage);
    var rail = $$('.ps-rail button', stage);
    var photo = $('.plate__photo', stage);
    var narrow = window.matchMedia('(max-width: 859px)');
    var current = -1;

    var show = function (i) {
      if (i === current) return;
      current = i;
      scenes.forEach(function (s, k) {
        s.classList.toggle('is-on', k === i);
        s.classList.toggle('is-past', k < i);
        s.setAttribute('aria-hidden', String(k !== i));
      });
      acts.forEach(function (a, k) { a.classList.toggle('is-current', k === i); });
      rail.forEach(function (b, k) {
        if (k + 1 === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.classList.toggle('is-done', k + 1 < i);
      });
      if (i === 4) placeWires();
    };

    /* The reading line: mid-screen on desktop; on a phone, the middle of the space under the pinned stage. */
    var line = function () {
      var vh = window.innerHeight;
      if (!narrow.matches) return vh * 0.56;
      var b = stage.getBoundingClientRect().bottom;
      return b + (vh - b) * 0.55;
    };

    var update = function () {
      var y = line();
      var active = 0;
      acts.forEach(function (a, k) {
        var r = a.getBoundingClientRect();
        if (r.top + r.height * 0.5 <= y + r.height * 0.15) active = k;
        /* Rail fill: how far the reading line has travelled through this act. */
        if (k > 0) {
          var p = (y - r.top) / r.height;
          rail[k - 1].style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
        }
      });
      show(active);
      /* The plate drifts a little with the section's progress, so the stage never feels frozen. */
      if (photo && !reduce) {
        var sr = section.getBoundingClientRect();
        var prog = Math.max(0, Math.min(1, -sr.top / Math.max(1, sr.height - window.innerHeight)));
        photo.style.setProperty('--px', (prog * -3).toFixed(2) + '%');
      }
    };

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { update(); placeWires(); });

    rail.forEach(function (b) {
      b.addEventListener('click', function () {
        var a = acts[parseInt(b.getAttribute('data-go'), 10)];
        var r = a.getBoundingClientRect();
        var target = window.scrollY + r.top + r.height * 0.5 - line() + 2;
        window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
      });
    });

    /* Aurora wires, from each port to the block or field it feeds. Layout offsets ignore the build's transforms. */
    var offsetIn = function (el, root) {
      var x = 0, y = 0;
      while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      return { x: x, y: y };
    };
    function placeWires() {
      $$('[data-ps-wires]', stage).forEach(function (canvas) {
        var svg = $('svg.wires', canvas);
        svg.setAttribute('viewBox', '0 0 ' + canvas.offsetWidth + ' ' + canvas.offsetHeight);
        $$('path', svg).forEach(function (path) {
          var from = doc.getElementById(path.getAttribute('data-from'));
          var to = doc.getElementById(path.getAttribute('data-to'));
          if (!from || !to || !from.offsetParent || !to.offsetParent) return;
          var fromNode = from.closest('.node');
          var toNode = to.classList.contains('node') ? to : to.closest('.node');
          var anchor = to.classList.contains('node') ? $('header', to) : to;
          var f = offsetIn(from, canvas), n = offsetIn(fromNode, canvas), t = offsetIn(toNode, canvas), a = offsetIn(anchor, canvas);
          var x1 = n.x + fromNode.offsetWidth, y1 = f.y + from.offsetHeight / 2;
          var x2 = t.x, y2 = a.y + anchor.offsetHeight / 2;
          var dx = Math.max(18, Math.abs(x2 - x1) * 0.5);
          path.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
        });
      });
    }
    window.addEventListener('load', placeWires);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(placeWires);
    placeWires();
    update();
  }

  /* ---------- One-time reveals: headings, the published figures, the security scan, the tool menu ---------- */
  if (!('IntersectionObserver' in window)) return;
  var once = function (els, cb, opts) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, opts || { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });
  };
  once($$('[data-ps-reveal]'), function (el) { el.classList.add('is-in'); });
  $$('.ps-stat').forEach(function (el, i) { el.style.transitionDelay = (i * 120) + 'ms'; $('.ps-fig > span', el).style.transitionDelay = (i * 120 + 100) + 'ms'; });
  once($$('.ps-stat'), function (el) { el.classList.add('is-in'); }, { rootMargin: '0px 0px -18% 0px', threshold: 0.6 });

  /* Security: a light line runs down the register once and each control lights as the line passes it. */
  var sec = $('[data-scan]');
  if (sec) once([sec], function () {
    var reg = $('.ps-register', sec);
    reg.style.setProperty('--scan-h', (reg.offsetHeight + 140) + 'px');
    sec.classList.add('is-scanned');
    var top = reg.getBoundingClientRect().top;
    $$('.ps-reg li', sec).forEach(function (li) {
      var at = (li.getBoundingClientRect().top - top + 70) / (reg.offsetHeight + 140) * 1800;
      setTimeout(function () { li.classList.add('is-lit'); }, reduce ? 0 : Math.max(0, at));
    });
  }, { threshold: 0.35 });

  /* Integrations: the tools menu steps through its sources while on screen, holding on DMS Search. */
  var menu = $('.ps-toolmenu');
  if (menu) {
    var items = $$('li', menu);
    var hold = 3;
    if (reduce) { items[hold].classList.add('is-on'); return; }
    once([menu], function () {
      items.forEach(function (li, k) {
        setTimeout(function () {
          items.forEach(function (x) { x.classList.remove('is-on'); });
          li.classList.add('is-on');
        }, 300 + k * 420);
      });
      setTimeout(function () { items.forEach(function (x, k) { x.classList.toggle('is-on', k === hold); }); }, 300 + items.length * 420 + 200);
    }, { threshold: 0.6 });
  }
})();
