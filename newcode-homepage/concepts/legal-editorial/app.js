/* Newcode concept, legal editorial: the page-specific motion. ../../js/main.js still runs the hero, tabs, wires and film. */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var motion = root.classList.contains('le-motion');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

  /* ---------- Mark what rises, and stagger the rows that arrive one after another ---------- */
  $$('.le-head .le-label, .le-head .le-h2, .le-trusted .le-label, .le-proof .le-h2, .le-ex, .le-quote__portrait, .le-vcard, .le-story, .le-academy, .le-news, .le-cta .cta__copy, .le-how__side, .le-how__stage, .le-sol__body')
    .forEach(function (el) { el.classList.add('le-rise'); });
  $$('.le-ex').forEach(function (el, i) { el.style.setProperty('--d', i * 120 + 'ms'); });
  $$('.le-def').forEach(function (el, i) { el.style.setProperty('--d', i * 90 + 'ms'); });
  $$('.le-itile__icon').forEach(function (el, i) { el.style.setProperty('--d', i * 60 + 'ms'); });
  $$('.hero__logos li').forEach(function (el, i) { el.style.setProperty('--i', i); });
  $$('.le-sched .le-fig').forEach(function (el, i) { el.style.setProperty('--d', i * 120 + 'ms'); });

  /* Security register: each control is signed off with a tick, row by row. */
  $$('.le-register li').forEach(function (li, i) {
    li.style.setProperty('--d', (i * 70 + 200) + 'ms');
    li.insertAdjacentHTML('beforeend', '<svg class="le-tick" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M6 10.4l2.6 2.6L14.2 7.4"/></svg>');
  });

  /* ---------- One observer flags sections and blocks as they arrive ---------- */
  if (motion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    $$('.le-sec, .le-rise, .le-defs, .le-int__index, .le-register, .le-fig, .site-footer__logo').forEach(function (el) { io.observe(el); });
  }

  /* ---------- Exhibit A: plays once in view, then rests; the margin notes point into it ---------- */
  var exa = $('.le-exa');
  var plate = $('[data-exa]');
  var replay = $('[data-exa-replay]');
  function run() {
    exa.classList.remove('is-run');
    void exa.offsetWidth;
    exa.classList.add('is-run');
    if (replay) { replay.hidden = true; setTimeout(function () { replay.hidden = false; }, 5400); }
  }
  if (exa && plate) {
    if (motion) {
      var eio = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        eio.disconnect();
        run();
      }, { threshold: 0.3 });
      eio.observe(plate);
      if (replay) replay.addEventListener('click', run);
    }
    $$('.le-note', exa).forEach(function (note) {
      var n = note.getAttribute('data-note');
      note.addEventListener('pointerenter', function () { exa.classList.add('hl-' + n); });
      note.addEventListener('pointerleave', function () { exa.classList.remove('hl-' + n); });
    });
  }

  /* ---------- Customer quote: wrap words so they can ink in as the visitor reads ---------- */
  var quote = $('[data-read]');
  var words = [];
  if (quote && motion) {
    var text = quote.textContent;
    quote.setAttribute('aria-label', text);
    quote.innerHTML = text.split(/(\s+)/).map(function (w) {
      return /^\s+$/.test(w) ? w : '<span class="w" aria-hidden="true">' + w + '</span>';
    }).join('');
    words = $$('.w', quote);
  }

  /* ---------- Proof: a figure and its footnote light together ---------- */
  var proof = $('.le-proof');
  if (proof) {
    $$('[data-fn]', proof).forEach(function (el) {
      var n = el.getAttribute('data-fn');
      el.addEventListener('pointerenter', function () { proof.classList.add('hl-' + n); });
      el.addEventListener('pointerleave', function () { proof.classList.remove('hl-' + n); });
    });
  }

  /* ---------- How Newcode works: the clauses advance with the scroll while the exhibit holds ---------- */
  var how = $('[data-how]');
  var track = how ? $('.le-how__track', how) : null;
  var tabs = how ? $$('[role="tab"]', how) : [];
  var texts = how ? $$('.le-how__text', how) : [];
  var exs = how ? $$('.le-how__ex', how) : [];
  var pinQuery = window.matchMedia('(min-width: 1100px) and (min-height: 700px)');
  var current = -1;
  function setStep(i, focus) {
    if (i === current) return;
    current = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (!on) t.style.removeProperty('--p');
    });
    texts.forEach(function (t, k) { t.classList.toggle('is-on', k === i); });
    exs.forEach(function (x, k) { x.classList.toggle('is-on', k === i); x.setAttribute('aria-hidden', String(k !== i)); });
    if (focus) tabs[i].focus();
  }
  if (how) {
    setStep(0);
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        if (pinQuery.matches) {
          /* Pinned: move the page to where this clause is read, so scroll and selection stay in step. */
          var top = track.getBoundingClientRect().top + window.scrollY;
          var travel = track.offsetHeight - window.innerHeight;
          window.scrollTo({ top: top + travel * (i + 0.15) / tabs.length, behavior: motion ? 'smooth' : 'auto' });
        } else {
          setStep(i);
          tab.style.setProperty('--p', 1);
        }
      });
      tab.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length;
        tabs[n].click();
        tabs[n].focus();
      });
    });
    tabs[0].style.setProperty('--p', 1);
  }

  /* ---------- Scroll-linked work, batched into one frame ---------- */
  var parties = $$('[data-ink] > span');
  var partyList = $('[data-ink]');
  function onFrame() {
    var vh = window.innerHeight;
    if (partyList && motion) {
      var r = partyList.getBoundingClientRect();
      var lit = Math.ceil(clamp((vh * 0.9 - r.top) / (r.height + vh * 0.3)) * parties.length);
      parties.forEach(function (s, i) { s.classList.toggle('is-lit', i < lit); });
    }
    if (words.length) {
      var q = quote.getBoundingClientRect();
      var n = Math.ceil(clamp((vh * 0.82 - q.top) / (q.height + vh * 0.2)) * words.length);
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < n); });
    }
    if (how && pinQuery.matches) {
      var t = track.getBoundingClientRect();
      var travel = t.height - vh;
      var f = clamp(-t.top / travel) * tabs.length;
      var i = Math.min(tabs.length - 1, Math.floor(f));
      setStep(i);
      tabs[i].style.setProperty('--p', Math.min(1, f - i).toFixed(3));
    }
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; onFrame(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onFrame();
})();
