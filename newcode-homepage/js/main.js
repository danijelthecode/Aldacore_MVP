/* Newcode homepage prototype. Quiet motion only: rise on scroll, one count-up, loops inside product frames. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------- Header: the demo button joins the pill once the hero has passed ---------- */
  var header = $('.site-header');
  var hero = $('.hero');
  var heroAction = hero ? $('.btn', hero) : null;
  function updateHeader() {
    /* The pill's button takes over once the hero's own button has left the screen, so one is always in reach and never two. */
    var mark = heroAction || hero;
    if (header && mark) header.classList.toggle('is-past-hero', mark.getBoundingClientRect().bottom < 0);
  }
  /* The review ribbon sits above the hero. Subtract it so the first screen holds what the live hero holds. */
  var ribbon = $('.proto-ribbon');
  function setRibbonHeight() { root.style.setProperty('--ribbon-h', (ribbon ? ribbon.offsetHeight : 0) + 'px'); }
  setRibbonHeight();
  window.addEventListener('resize', setRibbonHeight);
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
    item.addEventListener('mouseleave', function () { timer = setTimeout(close, 180); });
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
  doc.addEventListener('click', function (e) { if (!e.target.closest('.nav-links')) closeMenus(); });

  /* ---------- Mobile menu ---------- */
  var mobileToggle = $('[data-mobile-toggle]');
  var mobileMenu = $('[data-mobile-menu]');
  function setMobileMenu(open) {
    if (!mobileToggle || !mobileMenu) return;
    mobileToggle.setAttribute('aria-expanded', String(open));
    var bar = $('.navbar');
    if (open && bar) mobileMenu.style.paddingTop = Math.round(bar.getBoundingClientRect().bottom + 14) + 'px';
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

  /* ---------- Tabs: audiences, and the feature views on the Nova and Aurora cards ---------- */
  var tabSelectors = {};
  $$('[data-tabs]').forEach(function (group) {
    var tabs = $$('[role="tab"]', group);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (!panel) return;
        panel.toggleAttribute('data-off', !on);
        panel.setAttribute('aria-hidden', String(!on));
      });
      if (focus) tab.focus();
      drawWires();
    }
    tabs.forEach(function (tab, i) {
      tabSelectors[tab.id] = function () { select(tab, false); };
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
    var first = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    if (first) select(first, false);
  });
  /* data-autoplay="ms": the tabs move on by themselves while the group is on screen, hold while the
     pointer or focus is inside, and stop for good once the visitor picks a tab. */
  $$('[data-tabs][data-autoplay]').forEach(function (group) {
    if (reduceMotion || !hasIO) return;
    var tabs = $$('[role="tab"]', group);
    var ms = parseInt(group.getAttribute('data-autoplay'), 10) || 6000;
    var timer = null, inView = false, held = false, stopped = false;
    group.style.setProperty('--autoplay', ms + 'ms');
    function arm() {
      clearTimeout(timer);
      var on = inView && !held && !stopped;
      group.classList.toggle('is-autoplaying', on);
      if (!on) return;
      timer = setTimeout(function () {
        var i = 0;
        tabs.forEach(function (t, k) { if (t.getAttribute('aria-selected') === 'true') i = k; });
        tabSelectors[tabs[(i + 1) % tabs.length].id]();
        group.classList.remove('is-autoplaying');
        void group.offsetWidth; /* restart the progress line on the new tab */
        arm();
      }, ms);
    }
    function stop() { stopped = true; arm(); }
    tabs.forEach(function (t) { t.addEventListener('click', stop); t.addEventListener('keydown', stop); });
    group.addEventListener('pointerenter', function () { held = true; arm(); });
    group.addEventListener('pointerleave', function () { held = false; arm(); });
    group.addEventListener('focusin', function () { held = true; arm(); });
    group.addEventListener('focusout', function (e) { if (!group.contains(e.relatedTarget)) { held = false; arm(); } });
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; arm(); }, { threshold: 0.35 }).observe(group);
  });
  /* Links elsewhere on the page can open a specific tab before the page scrolls to it. */
  $$('[data-tab-target]').forEach(function (link) {
    link.addEventListener('click', function () {
      var tab = doc.getElementById(link.getAttribute('data-tab-target'));
      var pick = tab ? tabSelectors[tab.id] : null;
      if (!pick) return;
      pick();
      /* Once the browser has followed the link to the tabs, the chosen tab takes keyboard focus without a second scroll. */
      window.setTimeout(function () { tab.focus({ preventScroll: true }); }, 0);
    });
  });

  /* ---------- The band's pause control: offered as soon as anything in the band moves (the flow or the film) ---------- */
  function offerPause(band) {
    var toggle = band ? $('[data-shape-toggle]', band) : null;
    if (!toggle || !toggle.hidden) return;
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      var pause = toggle.getAttribute('data-paused') !== 'true';
      toggle.setAttribute('data-paused', String(pause));
      var label = $('[data-shape-toggle-label]', toggle);
      if (label) label.textContent = pause ? 'Play the background animation' : 'Pause the background animation';
      $$('[data-shape] video', band).forEach(function (film) {
        if (pause) { film.pause(); } else { var again = film.play(); if (again && again.catch) again.catch(function () {}); }
      });
      var flowEl = $('[data-flow]', band);
      if (flowEl) flowEl.toggleAttribute('data-paused', pause);
    });
  }

  /* ---------- Hero background: the live site's flowing gradient (WebGL2) over the still image ---------- */
  /* Same shader and settings as newcode.ai's HeroGradient. Without WebGL2, or with reduced motion, the still image stays. */
  function startFlow(host) {
    var canvas = doc.createElement('canvas');
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    host.appendChild(canvas);
    var RAMP = [[.199,.02,.293],[.199,.02,.293],[.199,.02,.293],[.188,.02,.306],[.235,.012,.38],[.235,.016,.38],[.259,.031,.404],[.298,.035,.447],
      [.325,.098,.529],[.408,.173,.557],[.451,.255,.651],[.565,.424,.784],[.647,.624,.886],[.749,.804,.969],[.76,.895,.98],[.76,.895,.98]];
    var vert = '#version 300 es\nprecision mediump float;\nin vec2 aPosition;\nout vec2 vUv;\nvoid main(){vUv=aPosition*0.5+0.5;gl_Position=vec4(aPosition,0.0,1.0);}';
    var frag = [
      '#version 300 es', 'precision highp float;', 'in vec2 vUv;', 'out vec4 fragColor;', 'uniform float uTime;', 'uniform vec2 uResolution;',
      'const float PI = 3.14159265;',
      RAMP.map(function (c, i) { return 'const vec3 C' + i + ' = vec3(' + c[0].toFixed(4) + ', ' + c[1].toFixed(4) + ', ' + c[2].toFixed(4) + ');'; }).join('\n'),
      'vec3 getColor(int index) {', RAMP.map(function (c, i) { return '  if (index == ' + i + ') return C' + i + ';'; }).join('\n'), '  return vec3(0.0);', '}',
      'mat2 rot2(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }',
      'float rand(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); }',
      'vec3 linear_from_srgb(vec3 rgb) { return pow(rgb, vec3(2.2)); }',
      'vec3 srgb_from_linear(vec3 lin) { return pow(lin, vec3(1.0 / 2.2)); }',
      'vec3 oklab_mix(vec3 lin1, vec3 lin2, float a) {',
      '  const mat3 kCONEtoLMS = mat3(0.4121656120, 0.2118591070, 0.0883097947, 0.5362752080, 0.6807189584, 0.2818474174, 0.0514575653, 0.1074065790, 0.6302613616);',
      '  const mat3 kLMStoCONE = mat3(4.0767245293, -1.2681437731, -0.0041119885, -3.3072168827, 2.6093323231, -0.7034763098, 0.2307590544, -0.3411344290, 1.7068625689);',
      '  vec3 lms1 = pow(kCONEtoLMS * lin1, vec3(1.0 / 3.0));',
      '  vec3 lms2 = pow(kCONEtoLMS * lin2, vec3(1.0 / 3.0));',
      '  vec3 lms = mix(lms1, lms2, a);',
      '  lms *= 1.0 + 0.025 * a * (1.0 - a);',
      '  return kLMStoCONE * (lms * lms * lms);',
      '}',
      'vec3 getGradientColor(float position) {',
      '  position = clamp(position, 0.0, 1.0);',
      '  for (int i = 0; i < 15; i++) {',
      '    float colorPosition = float(i) / 15.0;',
      '    float nextColorPosition = float(i + 1) / 15.0;',
      '    if (position <= nextColorPosition) {',
      '      float mixFactor = (position - colorPosition) / (nextColorPosition - colorPosition);',
      '      return srgb_from_linear(oklab_mix(linear_from_srgb(getColor(i)), linear_from_srgb(getColor(i + 1)), mixFactor));',
      '    }',
      '  }',
      '  return getColor(15);',
      '}',
      'vec3 gradientAt(vec2 uv) {',
      '  uv -= vec2(0.62, 0.52);',
      '  uv /= (0.7200 * 2.0);',
      '  uv = rot2(0.643500) * uv;',
      '  float position = uv.x + 0.5;',
      '  position += 0.040 * sin(uTime * 0.100);',
      '  vec3 color = getGradientColor(position);',
      '  color += rand(gl_FragCoord.xy) * 0.005;',
      '  return color;',
      '}',
      'vec2 liquify(vec2 st) {',
      '  float aspectRatio = uResolution.x / uResolution.y;',
      '  vec2 pos = vec2(0.5);',
      '  st -= pos;',
      '  st.x *= aspectRatio;',
      '  st = rot2(0.0945 * 2.0 * PI) * st;',
      '  float amplitude = 0.075 * mix(0.2, 0.2 / (0.08 + 0.05), 0.25);',
      '  float t = uTime * 0.4500;',
      '  for (float i = 1.0; i <= 5.0; i++) {',
      '    st = rot2(i / 5.0 * PI * 2.0) * st;',
      '    st.x += amplitude * cos(i * (5.0 * (0.08 + 0.1)) * st.y + t);',
      '    st.y += amplitude * sin(i * (5.0 * (0.08 + 0.1)) * st.x + t);',
      '  }',
      '  st = rot2(0.0945 * -2.0 * PI) * st;',
      '  st.x /= aspectRatio;',
      '  st += pos;',
      '  return st;',
      '}',
      'void main() {',
      '  vec2 uv = vUv;',
      '  vec2 lq = liquify(uv);',
      '  vec2 dir = normalize(lq - uv + 1e-6);',
      '  float dist = length(lq - uv);',
      '  vec2 offR = lq + 0.0600 * dir * dist;',
      '  vec2 offB = lq - 0.0600 * dir * dist;',
      '  fragColor = vec4(gradientAt(offR).r, gradientAt(lq).g, gradientAt(offB).b, 1.0);',
      '}'
    ].join('\n');
    function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aPosition');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uRes = gl.getUniformLocation(prog, 'uResolution');
    /* On a software renderer (no GPU) the full-size shader takes the whole page to about one frame a second: draw it at a quarter size there. */
    var info = gl.getExtension('WEBGL_debug_renderer_info');
    var soft = !!info && /swiftshader|llvmpipe|software/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)));
    var ratio = soft ? 0.25 : Math.min(window.devicePixelRatio || 1, 2);
    function fit() {
      var w = Math.round(canvas.clientWidth * ratio), h = Math.round(canvas.clientHeight * ratio);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }
    function draw(t) { gl.uniform1f(uTime, t); gl.uniform2f(uRes, canvas.width, canvas.height); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    fit(); draw(0);
    host.classList.add('is-on');
    offerPause(host.closest('section'));
    var start = performance.now(), last = 0, onScreen = true;
    if (hasIO) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; }).observe(host);
    (function loop(now) {
      window.requestAnimationFrame(loop);
      if (!onScreen || host.hasAttribute('data-paused') || now - last < 33) return;
      last = now; fit(); draw((now - start) / 1000);
    })(start);
  }
  var flow = $('[data-flow]');
  if (flow && !reduceMotion) startFlow(flow);

  /* ---------- Faceted shape (hero and closing band): upgrade the still to the looping film when it comes near ---------- */
  function startShape(shape) {
    /* Same test as the live site: browsers that play HEVC with alpha get the .mov, the rest get the WebM. */
    var probe = doc.createElement('video');
    var useMov = probe.canPlayType('video/quicktime') !== '' && probe.canPlayType('video/mp4; codecs="hvc1"') !== '';
    var src = shape.getAttribute(useMov ? 'data-mov' : 'data-webm') || shape.getAttribute('data-webm');
    if (!src) return; /* no film for this browser on this host: the still stays */
    var video = doc.createElement('video');
    video.muted = true; video.loop = true; video.autoplay = true;
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
    video.preload = 'auto';
    video.src = src;
    video.style.opacity = '0';
    video.addEventListener('playing', function () {
      /* The still is the film's first frame: show the film in one step, then drop the still two frames later. No fade, no gap. */
      video.style.opacity = '1';
      var still = $('img', shape);
      if (still) window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { still.style.opacity = '0'; }); });
      /* Once the film runs, offer the control that pauses it. If the band was paused before the film arrived, it stays still. */
      var band = shape.closest('section');
      var toggle = band ? $('[data-shape-toggle]', band) : null;
      if (toggle && toggle.getAttribute('data-paused') === 'true') video.pause();
      offerPause(band);
    }, { once: true });
    video.addEventListener('error', function () { video.style.display = 'none'; });
    shape.appendChild(video);
    /* Like the live site, stop decoding while the film is off screen. A film the visitor paused stays paused. */
    new IntersectionObserver(function (entries) {
      if (!entries[entries.length - 1].isIntersecting) { video.pause(); return; }
      var band = shape.closest('section');
      var toggle = band ? $('[data-shape-toggle]', band) : null;
      if (toggle && toggle.getAttribute('data-paused') === 'true') return;
      var again = video.play();
      if (again && again.catch) again.catch(function () {});
    }, { rootMargin: '200px 0px' }).observe(shape);
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay refused: the still stays */ });
  }
  /* Hero shape: quick pointer movement over the hero spins the film faster, resting the pointer on the shape slows it,
     and it always eases back to normal speed. The shape also leans a little toward the pointer. */
  (function () {
    var heroShape = $('.hero [data-shape]');
    if (!heroShape || !hero || reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    var last = null, rate = 1, target = 1, lean = { x: 0, y: 0 }, aim = { x: 0, y: 0 }, running = false;
    function step() {
      target += (1 - target) * 0.04;
      rate += (target - rate) * 0.12;
      lean.x += (aim.x - lean.x) * 0.06; lean.y += (aim.y - lean.y) * 0.06;
      var film = $('video', heroShape);
      if (film && !film.paused) film.playbackRate = Math.max(0.25, Math.min(4, rate));
      heroShape.style.translate = lean.x.toFixed(1) + 'px ' + lean.y.toFixed(1) + 'px';
      running = Math.abs(rate - 1) > 0.01 || Math.abs(aim.x - lean.x) > 0.3 || Math.abs(aim.y - lean.y) > 0.3;
      if (running) window.requestAnimationFrame(step);
    }
    function kick() { if (!running) { running = true; window.requestAnimationFrame(step); } }
    hero.addEventListener('pointermove', function (e) {
      var now = performance.now();
      var speed = last ? Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(1, now - last.t) : 0;
      target = Math.min(4, Math.max(target, 1 + speed * 1.6));
      last = { x: e.clientX, y: e.clientY, t: now };
      var box = hero.getBoundingClientRect();
      aim.x = ((e.clientX - box.left) / box.width - 0.5) * 40; aim.y = ((e.clientY - box.top) / box.height - 0.5) * 30;
      var b = heroShape.getBoundingClientRect();
      var onShape = e.clientX > b.left + b.width * 0.15 && e.clientX < b.right - b.width * 0.15 && e.clientY > b.top + b.height * 0.15 && e.clientY < b.bottom - b.height * 0.15;
      if (onShape && speed < 0.15) target = Math.min(target, 0.4);
      kick();
    });
    hero.addEventListener('pointerleave', function () { last = null; aim.x = 0; aim.y = 0; kick(); });
  })();

  var shapes = $$('[data-shape]');
  if (shapes.length && !reduceMotion && hasIO) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sio.unobserve(entry.target);
        startShape(entry.target);
      });
    }, { rootMargin: '600px 0px' });
    shapes.forEach(function (el) { sio.observe(el); });
  }

  /* ---------- Product preview loop: plays only while on screen, with a pause control ---------- */
  var players = $$('[data-play]');
  if (players.length && !reduceMotion && hasIO) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-playing', entry.isIntersecting); });
    }, { threshold: 0.35 });
    players.forEach(function (el) { pio.observe(el); });
  }
  $$('[data-pause]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('data-paused') !== 'true';
      btn.setAttribute('data-paused', String(paused));
      btn.parentElement.classList.toggle('is-paused', paused);
      var label = $('[data-pause-label]', btn);
      if (label) label.textContent = paused ? 'Play' : 'Pause';
    });
  });

  /* ---------- Flow diagrams: wires run from each port to the field or block it feeds ---------- */
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
        var fr = from.getBoundingClientRect();
        var nr = from.closest('.node').getBoundingClientRect();
        var tr = node.getBoundingClientRect();
        var ar = anchor.getBoundingClientRect();
        var x1 = (nr.right - r.left) * k, y1 = (fr.top + fr.height / 2 - r.top) * k;
        var x2 = (tr.left - r.left) * k, y2 = (ar.top + ar.height / 2 - r.top) * k;
        var dx = Math.max(14, (x2 - x1) * 0.5);
        path.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
      });
    });
  }
  drawWires();
  window.addEventListener('load', drawWires);
  window.addEventListener('resize', drawWires);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(drawWires);

  /* ---------- Rise on scroll ---------- */
  var revealEls = $$('[data-reveal]');
  if (revealEls.length && hasIO && !reduceMotion) {
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

  /* ---------- Trusted by: names fill in as the list enters, and are all lit before it is centered ---------- */
  var sweep = $('[data-sweep]');
  var sweepItems = sweep ? $$('[data-sweep-item]', sweep) : [];
  var sweepBand = sweep ? sweep.closest('section') : null;
  /* data-sweep="free": the names light as the list scrolls past, without holding the page. */
  var sweepPinned = sweep && sweep.getAttribute('data-sweep') !== 'free';
  if (sweep && !reduceMotion) { sweep.classList.add('is-sweeping'); if (sweepPinned) sweepBand.classList.add('is-pinned'); }
  function updateSweep() {
    if (!sweep || reduceMotion) return;
    var progress;
    if (sweepPinned) {
      /* Progress runs from the moment the band pins until it lets go: 0 to 1 over the band's extra height. */
      var r = sweepBand.getBoundingClientRect();
      var travel = r.height - window.innerHeight;
      progress = travel > 0 ? (-r.top) / (travel * 0.85) : 1;
    } else {
      /* From the list's top at 85% of the screen to 40%: all lit before it reaches the middle. */
      var vh = window.innerHeight;
      progress = (vh * 0.85 - sweep.getBoundingClientRect().top) / (vh * 0.45);
    }
    progress = Math.max(0, Math.min(1, progress));
    var lit = Math.ceil(progress * sweepItems.length);
    sweepItems.forEach(function (item, i) { item.classList.toggle('is-lit', i < lit); });
  }

  /* ---------- How Newcode works: progress rail, and a one-time build inside each plate ---------- */
  var rail = $('[data-rail]');
  var steps = $$('[data-step]');
  /* Stacking cards: each step's --cover runs 0 to 1 as the next card slides up over it. */
  function updateStack() {
    if (!steps.length) return;
    var stacked = getComputedStyle(steps[0]).position === 'sticky';
    steps.forEach(function (step, i) {
      var next = steps[i + 1];
      if (!stacked || !next) { step.style.removeProperty('--cover'); step.classList.remove('is-buried'); return; }
      var top = step.getBoundingClientRect().top;
      var h = step.offsetHeight;
      var p = (top + h - next.getBoundingClientRect().top) / h;
      step.style.setProperty('--cover', Math.max(0, Math.min(1, p)).toFixed(3));
      step.classList.toggle('is-buried', p >= 0.995);
    });
  }
  function updateRail() {
    updateStack();
    if (!rail) return;
    var r = rail.getBoundingClientRect();
    var mid = window.innerHeight * 0.55;
    var progress = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    rail.style.setProperty('--progress', progress.toFixed(4));
    steps.forEach(function (step) {
      var sr = step.getBoundingClientRect();
      step.classList.toggle('is-done', sr.top < mid);
    });
  }
  if (steps.length && hasIO && !reduceMotion) {
    root.classList.add('steps-on');
    var stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.closest('[data-step]').classList.add('has-played');
        stepIO.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    steps.forEach(function (step) { var plate = $('.plate', step); if (plate) stepIO.observe(plate); });
  }

  /* ---------- Count-up on confirmed numbers only: it runs each time the row is well inside the screen (upper two thirds),
     so the visitor sees it. Only the digits run; a prefix or suffix ($, M, +) sits outside the counted element. ---------- */
  var counters = $$('[data-count]');
  if (counters.length && hasIO && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (!entry.isIntersecting) { el.removeAttribute('data-counted'); return; }
        if (el.hasAttribute('data-counted')) return;
        el.setAttribute('data-counted', '');
        var target = parseFloat(el.getAttribute('data-count'));
        var startTime = null, duration = 1600;
        /* Hold the final width while the digits run, so the suffix does not slide. */
        el.textContent = String(target);
        var size = parseFloat(window.getComputedStyle(el).fontSize);
        if (size) el.style.minWidth = (el.getBoundingClientRect().width / size).toFixed(3) + 'em';
        function frame(t) {
          if (startTime === null) startTime = t;
          var k = Math.min(1, (t - startTime) / duration);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
          if (k < 1) window.requestAnimationFrame(frame); else el.style.minWidth = '';
        }
        el.textContent = '0';
        window.requestAnimationFrame(frame);
      });
    }, { rootMargin: '0px 0px -33% 0px', threshold: 1 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Customer film: the still becomes a player on request. Nothing loads or plays before the click. ---------- */
  $$('[data-film]').forEach(function (frame) {
    var play = $('[data-film-play]', frame);
    var link = $('[data-film-link]', frame);
    var still = $('img', frame);
    var probe = doc.createElement('video');
    /* No player for this file in this browser: the link to newcode.ai stays. */
    if (!play || !probe.canPlayType || !probe.canPlayType('video/mp4')) return;
    if (link) link.hidden = true;
    play.hidden = false;
    play.addEventListener('click', function () {
      var video = doc.createElement('video');
      video.controls = true;
      video.preload = 'none';
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-label', frame.getAttribute('data-film-label') || 'Customer film');
      video.tabIndex = 0;
      if (still) video.poster = still.currentSrc || still.src;
      video.addEventListener('error', function () {
        /* The file could not be played here: put the still back and offer the film on newcode.ai. */
        if (!video.parentNode) return;
        if (still) frame.insertBefore(still, video);
        frame.removeChild(video);
        if (link) { link.hidden = false; link.focus(); }
      });
      video.src = frame.getAttribute('data-film');
      frame.replaceChild(video, play);
      if (still && still.parentNode === frame) frame.removeChild(still);
      video.focus();
      var started = video.play();
      if (started && started.catch) started.catch(function () { /* play refused: the controls remain */ });
    });
  });

  /* ---------- Pointer drift: the capability network and the harness move a little with the pointer (--mx, --my from -1 to 1) ---------- */
  function drift(el) {
    if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
    });
    el.addEventListener('pointerleave', function () { el.style.setProperty('--mx', 0); el.style.setProperty('--my', 0); });
  }

  /* Capability network: the pills float, lean with the pointer (by depth) and step aside from it; the lines follow every frame. */
  $$('[data-capnet]').forEach(function (net) {
    var svg = $('svg', net);
    var nodes = $$('.cnode', net);
    var pairs = net.getAttribute('data-edges').split(' ').map(function (p) { return p.split('-').map(Number); });
    var lines = pairs.map(function () { var l = doc.createElementNS('http://www.w3.org/2000/svg', 'line'); svg.appendChild(l); return l; });
    var state = nodes.map(function (n, i) { return { d: parseFloat(n.style.getPropertyValue('--d')) || 1, x: 0, y: 0, phase: i * 1.7 }; });
    var pointer = null;
    var visible = false;
    function draw() {
      var box = net.getBoundingClientRect();
      var c = nodes.map(function (n) { var b = n.getBoundingClientRect(); return [b.left + b.width / 2 - box.left, b.top + b.height / 2 - box.top]; });
      pairs.forEach(function (p, i) {
        lines[i].setAttribute('x1', c[p[0]][0].toFixed(1)); lines[i].setAttribute('y1', c[p[0]][1].toFixed(1));
        lines[i].setAttribute('x2', c[p[1]][0].toFixed(1)); lines[i].setAttribute('y2', c[p[1]][1].toFixed(1));
      });
    }
    function tick(now) {
      if (!visible) return;
      var box = net.getBoundingClientRect();
      var t = now / 1000;
      nodes.forEach(function (n, i) {
        var s = state[i];
        var tx = Math.sin(t * 0.6 + s.phase) * 6 * s.d, ty = Math.cos(t * 0.5 + s.phase) * 5 * s.d; /* idle float */
        if (pointer) {
          tx += pointer.nx * 34 * s.d; ty += pointer.ny * 24 * s.d; /* lean toward the pointer, by depth */
          var dx = box.left + n.offsetLeft - pointer.x, dy = box.top + n.offsetTop - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var push = Math.max(0, 1 - dist / 170) * 38; /* step aside when the pointer comes close */
          tx += dx / dist * push; ty += dy / dist * push;
        }
        s.x += (tx - s.x) * 0.08; s.y += (ty - s.y) * 0.08;
        n.style.setProperty('--ox', s.x.toFixed(1) + 'px'); n.style.setProperty('--oy', s.y.toFixed(1) + 'px');
      });
      draw();
      window.requestAnimationFrame(tick);
    }
    if (!reduceMotion && hasIO && window.matchMedia('(hover: hover)').matches) {
      net.addEventListener('pointermove', function (e) {
        var box = net.getBoundingClientRect();
        pointer = { x: e.clientX, y: e.clientY, nx: (e.clientX - box.left) / box.width * 2 - 1, ny: (e.clientY - box.top) / box.height * 2 - 1 };
      });
      net.addEventListener('pointerleave', function () { pointer = null; });
      new IntersectionObserver(function (en) { var was = visible; visible = en[0].isIntersecting; if (visible && !was) window.requestAnimationFrame(tick); }).observe(net);
    }
    window.addEventListener('resize', draw);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(draw);
    draw();
  });

  /* Harness notes: each opens its sentence; the section drifts with the pointer. */
  $$('[data-harness]').forEach(function (band) {
    $$('.hnote button', band).forEach(function (btn) {
      btn.addEventListener('click', function () { btn.setAttribute('aria-expanded', String(btn.getAttribute('aria-expanded') !== 'true')); });
    });
    drift(band);
  });

  updateHeader(); updateSweep(); updateRail();
})();
