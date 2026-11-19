/* nc-film: one film clock drives the shots, the crossfades, the Nova moments and the progress line. */
(function () {
  'use strict';

  /* ---------- Nav: solid after the film, phone sheet ---------- */
  var nav = document.querySelector('[data-nav]');
  var film = document.querySelector('[data-film]');
  var toggle = document.querySelector('[data-toggle]');
  var sheet = document.querySelector('[data-sheet]');

  // Solid once the headline reaches the nav: the page is short, so the film never fully passes under it,
  // and a transparent nav would sit on top of the headline.
  var h1 = film.querySelector('h1');
  function onScroll() { nav.classList.toggle('is-solid', window.scrollY >= h1.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
    // Keep focus inside the sheet: everything behind it is inert while it is open.
    document.querySelector('main').inert = open;
    document.querySelector('footer').inert = open;
    document.querySelector('.skip').inert = open;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (open) sheet.querySelector('a').focus();
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* ---------- The film ---------- */
  var els = Array.prototype.slice.call(film.querySelectorAll('video'));
  var btn = film.querySelector('[data-film-toggle]');
  var fills = Array.prototype.slice.call(film.querySelectorAll('.film__prog i'));
  var novas = {};
  Array.prototype.forEach.call(film.querySelectorAll('[data-nova]'), function (n) {
    novas[n.dataset.nova] = { el: n, parts: Array.prototype.slice.call(n.querySelectorAll('[data-at]')) };
  });
  var composer = film.querySelector('[data-composer]');
  var typed = film.querySelector('[data-typed]');
  var ASK = film.querySelector('.chat__user').textContent;

  var FX = ['50%', '62%', '40%', '84%'];       // phone focal point per shot (corridor, hands, dusk room, window)
  var FADE = 850;
  // A Nova moment holds the previous shot: the clip runs on at .28x under the blur so it never freezes or runs out.
  var SEGS = [
    { shot: 0, dur: 6 },
    { shot: 0, dur: 5.6, nova: 'a', rate: 0.28 },
    { shot: 1, dur: 7.5 },
    { shot: 2, dur: 6 },
    { shot: 2, dur: 5.6, nova: 'b', rate: 0.28 },
    { shot: 3, dur: 7.5 }
  ];
  // The window rises with the blur at 0s and is gone 0.05s before the segment ends; the cut into the
  // next shot starts PRE seconds early so the exit and the crossfade overlap (no blurred dead air).
  var IN = 0, LEAVE = 0.42, PRE = 0.45, TYPE0 = 0.35, TYPE1 = 1.45;
  var LOOP = 0;
  SEGS.forEach(function (s, i) {
    s.start = LOOP; LOOP += s.dur; s.rate = s.rate || 1;
    s.cut = i && SEGS[i - 1].nova ? s.start - PRE : s.start;
    if (s.nova) s.out = s.dur - 0.05 - LEAVE;
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var allowVideo = !reduced;
  var t = 0, seg = -1, vseg = -1, raf = 0, last = 0, fadeTimer = 0;
  var userPaused = reduced, hiddenTab = document.hidden, offscreen = false;

  function src(n) { return '../../assets/film/hero-' + n + '.mp4'; }
  function elFor(shot) { return els[shot % 2]; }
  function play(v) { if (v.getAttribute('src')) { var p = v.play(); if (p) p.catch(function () {}); } }

  function setShot(v, shot) {
    var want = allowVideo ? src(shot) : '';
    if (v.dataset.shot === String(shot) && (v.getAttribute('src') || '') === want) return;
    v.dataset.shot = shot;
    v.poster = '../../assets/film/hero-' + shot + '-poster.webp';
    v.style.setProperty('--fx', FX[shot]);
    if (want) { v.src = want; v.load(); } else v.removeAttribute('src');
  }

  // Video side of a segment: which shot shows, its veil and its playback rate.
  function enterSeg(i, hard) {
    var s = SEGS[i], prev = SEGS[vseg];
    var v = elFor(s.shot), other = els[0] === v ? els[1] : els[0];
    film.dataset.shot = s.shot;
    if (hard || !prev || prev.shot !== s.shot) {
      setShot(v, s.shot);
      // Seeking mid shot (debug hook, reduced motion): the shot runs at 1x from its cut, then at rate under a Nova moment.
      var local = Math.max(0, t - s.cut);
      if (s.nova) { var p = SEGS[i - 1]; local = (s.start - p.cut) + local * s.rate; }
      v.currentTime = local;
      v.classList.remove('is-veiled', 'is-under');
      other.classList.remove('is-top');
      if (hard) other.classList.remove('is-under', 'is-veiled');
      else other.classList.add('is-under');
      v.classList.add('is-top');
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(function () {
        other.classList.remove('is-under', 'is-veiled');
        other.pause();
        setShot(other, (s.shot + 1) % 4);   // load the next shot while it is hidden
      }, hard ? 0 : FADE + 120);
    }
    v.defaultPlaybackRate = v.playbackRate = s.rate;
    v.classList.toggle('is-veiled', !!s.nova);
    if (running()) play(v);
  }

  function render() {
    var s = SEGS[seg], local = t - s.start;
    Object.keys(novas).forEach(function (k) {
      var n = novas[k], on = s.nova === k;
      n.el.classList.toggle('is-in', on && local >= IN && local < s.out);
      n.el.classList.toggle('is-out', on && local >= s.out);
      n.parts.forEach(function (p) {
        p.classList.toggle('on', on && local >= +p.dataset.at);
        if (p.dataset.done) p.classList.toggle('done', on && local >= +p.dataset.done);
      });
    });
    var k = Math.max(0, Math.min(1, (local - TYPE0) / (TYPE1 - TYPE0)));
    var typing = s.nova === 'a' && k > 0 && local < 1.55;
    composer.classList.toggle('is-typing', typing);
    typed.textContent = typing ? ASK.slice(0, Math.round(k * ASK.length)) : '';
    fills.forEach(function (f, j) { f.style.transform = 'scaleX(' + (j < seg ? 1 : j > seg ? 0 : local / s.dur) + ')'; });
  }

  function segAt(time, key) { for (var i = SEGS.length - 1; i > 0; i--) if (time >= SEGS[i][key]) return i; return 0; }

  function update(hard) {
    var vi = segAt(t, 'cut');
    if (vi !== vseg || hard) { enterSeg(vi, hard); vseg = vi; }
    seg = segAt(t, 'start');
    render();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    t += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (t >= LOOP) t -= LOOP;
    update(false);
  }

  function running() { return !userPaused && !hiddenTab && !offscreen; }
  function sync() {
    film.classList.toggle('is-paused', userPaused);
    film.classList.toggle('is-idle', !running());
    btn.setAttribute('aria-pressed', String(userPaused));
    var v = SEGS[vseg] ? elFor(SEGS[vseg].shot) : null;
    if (running()) {
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      if (v) play(v);
    } else {
      cancelAnimationFrame(raf); raf = 0;
      els.forEach(function (e) { e.pause(); });
    }
  }

  function seek(i, local) {
    t = SEGS[i].start + (local || 0);
    film.classList.add('no-t');
    update(true);
    void film.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { film.classList.remove('no-t'); }); });
  }

  btn.addEventListener('click', function () {
    userPaused = !userPaused;
    if (!userPaused && !allowVideo) { allowVideo = true; seek(0, 0); }   // reduced motion: the film starts only on request
    sync();
  });
  document.addEventListener('visibilitychange', function () { hiddenTab = document.hidden; sync(); });
  // A thin strip of hero left on screen should not keep the film decoding.
  new IntersectionObserver(function (es) { offscreen = es[0].intersectionRatio < 0.35; sync(); }, { threshold: [0, 0.35] }).observe(film);

  // Reduced motion: hero-0 poster, the Meridian moment shown complete and still.
  if (reduced) seek(1, 3.6); else seek(0, 0);
  sync();

  // Debug hook for review captures: __film.seek(segment, secondsIntoSegment)
  window.__film = {
    seek: function (i, local) { seek(i, local); sync(); },
    pause: function () { userPaused = true; sync(); },
    play: function () { userPaused = false; sync(); },
    get loop() { return LOOP; },
    get time() { return t; }
  };
})();
