(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 901px)');

  /* ---------- nav, menu, progress ---------- */
  const nav = $('[data-nav]');
  const bar = $('.scrollbar');
  const menuBtn = $('[data-menu]');
  const sheet = $('#sheet');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('is-scrolled', open || scrollY > 8);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  $$('[data-r], .ruler').forEach((el) => io.observe(el));

  /* ---------- readouts: final values are in the HTML; only the last digits tick ---------- */
  const tickIO = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      tickIO.unobserve(e.target);
      const m = e.target.textContent.match(/^(\D*)(\d+)(\D*)$/);
      if (!m || reduced) return;
      const end = +m[2], start = Math.max(0, end - 9), t0 = performance.now(), D = 900;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / D), v = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
        e.target.textContent = m[1] + v + m[3];
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-n]').forEach((el) => tickIO.observe(el));
  $$('.ticker__list > span').forEach((s, i) => s.style.setProperty('--i', i));

  /* ---------- hero pointer light ---------- */
  const hero = $('.hero');
  if (!reduced) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }

  /* ---------- the instrument: prompts that build real answers ---------- */
  const inst = $('[data-inst]');
  const keys = $$('.key', inst);
  const scenes = $$('.scene', inst);
  const title = $('[data-title]', inst);
  const pauseBtn = $('[data-pause]', inst);
  const DUR = 10000;
  const countEl = $('[data-count-i]', inst);
  const pauseLabel = $('[data-pause-label]', pauseBtn);
  // stopped: autoplay is off, because the visitor paused it or picked a prompt (reduced motion starts stopped)
  let cur = -1, timers = [], nextT = 0, stopped = reduced, heroVisible = true;

  // split streamed text into words, so it can write itself without reflow
  $$('.stream', inst).forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'wd'; s.style.setProperty('--i', i); s.textContent = w;
      el.append(s, i < words.length - 1 ? ' ' : '');
    });
  });
  // matrix: rows arrive, then each extracted cell resolves
  $$('.sc-matrix tbody tr', inst).forEach((tr, r) => {
    tr.dataset.t = 250 + r * 240;
    $$('td.c', tr).forEach((td, c) => { td.dataset.t = 1100 + r * 260 + c * 380; });
  });

  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearTimeout(nextT); };
  const schedule = () => {
    clearTimeout(nextT);
    if (stopped || !heroVisible) return;
    nextT = setTimeout(() => run((cur + 1) % scenes.length), DUR);
  };
  const restartBar = (k) => { k.classList.remove('is-run'); void k.offsetWidth; k.classList.add('is-run'); };

  function run(i, instant) {
    clearTimers();
    instant = instant || reduced;
    countEl.textContent = String(i + 1).padStart(2, '0');
    const kb = keys[i].parentElement;
    if (kb.scrollWidth > kb.clientWidth + 2 && cur !== -1) {
      const pad = parseFloat(getComputedStyle(kb).paddingLeft) || 0;
      kb.scrollTo({ left: kb.scrollLeft + keys[i].getBoundingClientRect().left - kb.getBoundingClientRect().left - pad, behavior: reduced ? 'auto' : 'smooth' });
    }
    const sc = scenes[i];
    cur = i;
    keys.forEach((k, j) => { k.setAttribute('aria-selected', String(j === i)); k.tabIndex = j === i ? 0 : -1; if (j !== i) k.classList.remove('is-run'); });
    restartBar(keys[i]);
    keys[i].style.setProperty('--dur', DUR + 'ms');
    scenes.forEach((s) => s.classList.toggle('is-on', s === sc));
    if (instant) title.textContent = sc.dataset.title;
    else {
      title.classList.add('is-swap');
      timers.push(setTimeout(() => { title.textContent = sc.dataset.title; title.classList.remove('is-swap'); }, 200));
    }

    const items = $$('[data-t]', sc);
    const plan = $('[data-count]', sc);
    let done = 0;
    items.forEach((el) => { el.classList.remove('on', 'is-busy', 'is-done'); });
    if (plan) plan.textContent = instant ? '5/5' : '0/5';
    items.forEach((el) => {
      const show = () => {
        el.classList.add('on');
        if (el.classList.contains('chat__thought')) el.classList.add('is-busy');
        if (plan && el.matches('.plan li')) plan.textContent = (++done) + '/5';
      };
      if (instant) { show(); if (el.dataset.done) { el.classList.remove('is-busy'); el.classList.add('is-done'); } return; }
      timers.push(setTimeout(show, +el.dataset.t));
      if (el.dataset.done) timers.push(setTimeout(() => { el.classList.remove('is-busy'); el.classList.add('is-done'); }, +el.dataset.done));
    });
    schedule();
  }

  const setStopped = (v, word) => {
    stopped = v;
    inst.classList.toggle('is-paused', v || !heroVisible);
    pauseBtn.setAttribute('aria-pressed', String(v));
    pauseLabel.textContent = word;
  };
  keys.forEach((k, i) => {
    k.addEventListener('click', () => { setStopped(true, 'Resume'); inst.classList.add('is-held'); run(i); });
    k.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = (i + d + keys.length) % keys.length;
      keys[n].focus(); keys[n].click();
    });
  });
  pauseBtn.addEventListener('click', () => {
    if (stopped) {
      setStopped(false, 'Pause');
      inst.classList.remove('is-held');
      run((cur + 1) % scenes.length);
    } else { setStopped(true, 'Play'); clearTimeout(nextT); }
  });
  new IntersectionObserver(([e]) => {
    const was = heroVisible;
    heroVisible = e.isIntersecting;
    inst.classList.toggle('is-paused', stopped || !heroVisible);
    if (heroVisible && !was && !stopped) { restartBar(keys[cur]); schedule(); } else if (!heroVisible) clearTimeout(nextT);
  }, { threshold: 0.25 }).observe($('[data-win]'));
  if (reduced) setStopped(true, 'Play');
  // first paint is a finished answer; the next prompt builds live
  run(0, true);

  /* ---------- How: a signal chain scrubbed by scroll ---------- */
  const how = $('[data-how]');
  const steps = $$('.chain__step', how);
  const chain = $('.chain', how);
  const texts = $$('.htext', how);
  const stages = $$('.stage', how);
  let hStep = -1, hAuto = 0, hManual = false;
  const pinned = () => wide.matches && !reduced;
  function setStep(i) {
    if (i === hStep) return;
    hStep = i;
    steps.forEach((s, j) => { s.setAttribute('aria-selected', String(j === i)); s.tabIndex = j === i ? 0 : -1; });
    texts.forEach((t, j) => t.classList.toggle('is-on', j === i));
    stages.forEach((t, j) => t.classList.toggle('is-on', j === i));
    if (!pinned()) how.style.setProperty('--hp', ((i + 1) / 4).toFixed(3));
  }
  function howScroll() {
    if (!pinned()) return;
    const total = how.offsetHeight - innerHeight;
    const p = clamp(-how.getBoundingClientRect().top / total, 0, 1);
    how.style.setProperty('--hp', p.toFixed(4));
    setStep(Math.min(3, Math.floor(p * 4.0001)));
  }
  const sizeChain = () => how.style.setProperty('--cw', chain.offsetWidth + 'px');
  steps.forEach((s, i) => s.addEventListener('click', () => {
    if (pinned()) {
      const total = how.offsetHeight - innerHeight;
      scrollTo({ top: how.offsetTop + total * (i + 0.12) / 4, behavior: 'smooth' });
    } else { hManual = true; clearInterval(hAuto); setStep(i); }
  }));
  const howAuto = () => { clearInterval(hAuto); if (!pinned() && !hManual && !reduced) hAuto = setInterval(() => setStep((hStep + 1) % 4), 6000); };
  new IntersectionObserver(([e]) => { if (e.isIntersecting) howAuto(); else clearInterval(hAuto); }, { threshold: 0.3 }).observe(how);
  setStep(0);

  /* ---------- Nova and Aurora feature tabs ---------- */
  $$('[data-tabs]').forEach((box) => {
    const btns = $$('[data-tab]', box), panels = $$('[data-tp]', box);
    let i = 0, t = 0, user = false;
    const set = (n) => {
      i = n;
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(j === n)); b.tabIndex = j === n ? 0 : -1; });
      panels.forEach((p, j) => p.classList.toggle('is-on', j === n));
    };
    btns.forEach((b, n) => b.addEventListener('click', () => { user = true; box.classList.remove('is-auto'); clearInterval(t); set(n); }));
    if (reduced) return;
    new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting && !user) { box.classList.add('is-auto'); t = setInterval(() => set((i + 1) % btns.length), 6500); }
      else box.classList.remove('is-auto');
    }, { threshold: 0.45 }).observe(box);
  });

  /* ---------- audiences ---------- */
  const aud = $('[data-aud]');
  const aBtns = $$('[data-a]', aud), aPh = $$('[data-ap]', aud), aCo = $$('[data-ac]', aud);
  const setAud = (n) => {
    aBtns.forEach((b, j) => { b.setAttribute('aria-selected', String(j === n)); b.tabIndex = j === n ? 0 : -1; });
    aPh.forEach((p, j) => p.classList.toggle('is-on', j === n));
    aCo.forEach((p, j) => p.classList.toggle('is-on', j === n));
  };
  aBtns.forEach((b, n) => {
    b.addEventListener('click', () => setAud(n));
    b.addEventListener('mouseenter', () => { if (wide.matches) setAud(n); });
  });
  $$('[data-goto]').forEach((a) => a.addEventListener('click', () => setAud(+a.dataset.goto)));

  /* ---------- integrations patch bay ---------- */
  const bay = $('[data-bay]');
  function wire() {
    const svg = $('.bay__wires', bay), base = $('.w-base', svg), pulse = $('.w-pulse', svg);
    const b = bay.getBoundingClientRect(), c = $('.bay__core', bay).getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
    base.innerHTML = ''; pulse.innerHTML = '';
    const jacks = $$('.jack', bay);
    jacks.forEach((j, n) => {
      const r = j.getBoundingClientRect();
      const left = r.left + r.width / 2 < c.left + c.width / 2;
      const sx = (left ? r.right : r.left) - b.left, sy = r.top + r.height / 2 - b.top;
      let d;
      if (b.width < 600) {
        // phone: wires drop vertically into the top or bottom edge of the core
        const above = sy < c.top;
        const ex = c.left - b.left + c.width * (left ? 0.3 : 0.7) + (n % 3 - 1) * 8;
        const ey = (above ? c.top : c.bottom) - b.top;
        d = `M${sx.toFixed(1)} ${sy.toFixed(1)} C${ex.toFixed(1)} ${sy.toFixed(1)} ${ex.toFixed(1)} ${sy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      } else {
        const ex = (left ? c.left : c.right) - b.left;
        const ey = c.top - b.top + c.height / 2 + (sy - (c.top - b.top + c.height / 2)) * 0.12;
        const dx = Math.abs(ex - sx) * 0.55;
        d = `M${sx.toFixed(1)} ${sy.toFixed(1)} C${(sx + (left ? dx : -dx)).toFixed(1)} ${sy.toFixed(1)} ${(ex - (left ? dx : -dx)).toFixed(1)} ${ey.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      }
      const mk = (g, delay) => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d); p.setAttribute('pathLength', '106');
        if (delay != null) p.style.animationDelay = delay + 's';
        g.appendChild(p);
      };
      mk(base);
      mk(pulse, -((n * 0.73) % 2.8).toFixed(2));
    });
  }

  /* ---------- canvas wires, measured from the real ports ---------- */
  function canvasWires() {
    $$('[data-wires]').forEach((svg) => {
      const cv = svg.parentElement;
      const pos = (el) => { let x = 0, y = 0, n = el; while (n && n !== cv) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
      svg.setAttribute('viewBox', `0 0 ${cv.offsetWidth} ${cv.offsetHeight}`);
      $$('path', svg).forEach((p) => {
        const a = pos(document.getElementById(p.dataset.from)), b = pos(document.getElementById(p.dataset.to));
        const sx = a.x + a.w + 6, sy = a.y + a.h / 2, ex = b.x - 2, ey = b.y + Math.min(b.h / 2, 16);
        const dx = Math.max(30, (ex - sx) * 0.5);
        p.setAttribute('d', `M${sx} ${sy} C${sx + dx} ${sy} ${ex - dx} ${ey} ${ex} ${ey}`);
      });
    });
  }

  /* ---------- film ---------- */
  const frame = $('[data-film]');
  const play = $('[data-film-play]', frame);
  $('[data-film-link]', frame).hidden = true;
  play.hidden = false;
  play.addEventListener('click', () => {
    const v = document.createElement('video');
    v.src = frame.dataset.film; v.controls = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('aria-label', 'Ræder Bing customer film');
    frame.appendChild(v); play.remove();
    v.play().catch(() => {});
    v.focus();
  });

  /* ---------- closing light and footer wordmark ---------- */
  const close = $('[data-close]');

  /* ---------- progress spine: one tick per section, a readout of where you are ---------- */
  const spine = $('.spine');
  const spineN = $('[data-spine-n]', spine), spineT = $('[data-spine-t]', spine);
  const marks = $$('main > section').map((sec) => {
    const ix = $('.idx', sec);
    const m = document.createElement('i'); m.className = 'spine__m'; spine.appendChild(m);
    return { sec, m, n: sec.dataset.spineN || (ix ? $('b', ix).textContent : '00'), t: sec.dataset.spineT || (ix ? $('span', ix).textContent : 'Newcode') };
  });
  function placeMarks() {
    const max = document.documentElement.scrollHeight - innerHeight;
    marks.forEach((o) => { o.m.style.top = (clamp(o.sec.offsetTop / max, 0, 1) * 100).toFixed(2) + '%'; });
  }
  let spineCur = null;
  function spineTick(p) {
    spine.style.setProperty('--sp', p.toFixed(4));
    spine.classList.toggle('is-on', scrollY > innerHeight * 0.5);
    let on = marks[0];
    marks.forEach((o) => { if (o.sec.getBoundingClientRect().top < innerHeight * 0.45) on = o; });
    if (on === spineCur) return;
    spineCur = on;
    marks.forEach((o) => o.m.classList.toggle('is-on', o === on));
    spineN.textContent = on.n; spineT.textContent = on.t;
  }

  /* ---------- one scroll loop ---------- */
  let ticking = false;
  function frameTick() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--sp', (scrollY / max).toFixed(4));
    spineTick(clamp(scrollY / max, 0, 1));
    if (sheet.hidden) nav.classList.toggle('is-scrolled', scrollY > 8);
    howScroll();
    if (!reduced) {
      const r = close.getBoundingClientRect();
      close.style.setProperty('--cp', clamp((innerHeight - r.top) / (innerHeight * 0.85), 0, 1).toFixed(3));
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frameTick); } }, { passive: true });
  const onResize = () => { sizeChain(); wire(); canvasWires(); placeMarks(); if (!pinned()) howAuto(); frameTick(); };
  addEventListener('resize', onResize);
  wide.addEventListener('change', () => { hStep = -1; setStep(0); onResize(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  addEventListener('load', onResize);
  onResize();
})();
