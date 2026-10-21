(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* budget: bar and categories highlight each other (works without GSAP too) */
  const bud = $('#budget');
  const setK = k => {
    bud.classList.toggle('hl', !!k);
    $$('[data-k]', bud).forEach(el => el.classList.toggle('on', el.dataset.k === k));
  };
  $$('[data-k]', bud).forEach(el => {
    el.addEventListener('pointerenter', () => setK(el.dataset.k));
    el.addEventListener('pointerleave', () => setK(null));
    el.addEventListener('focus', () => setK(el.dataset.k));
    el.addEventListener('blur', () => setK(null));
  });

  /* sponsor carousel: native scroll-snap, buttons, autoplay that pauses on interaction */
  const thx = $('#thx'), track = $('#thxTrack'), slides = $$('.slide', track), ctr = $('#thxCtr'), tick = $('#thxTick');
  const N = slides.length, pad = n => String(n).padStart(2, '0');
  if (N < 2) thx.classList.add('solo');
  else {
    let cur = 0, t0 = performance.now(), paused = false, raf;
    const DUR = 5200;
    const show = () => { ctr.innerHTML = pad(cur + 1) + ' <span>/ ' + pad(N) + '</span>'; };
    const go = k => { cur = (k + N) % N; track.scrollTo({ left: cur * track.clientWidth, behavior: reduce || document.hidden ? 'auto' : 'smooth' }); t0 = performance.now(); show(); };
    $('#thxPrev').addEventListener('click', () => go(cur - 1));
    $('#thxNext').addEventListener('click', () => go(cur + 1));
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
    let st; track.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => { const k = Math.round(track.scrollLeft / track.clientWidth); if (k !== cur) { cur = k; t0 = performance.now(); show(); } }, 120); }, { passive: true });
    const hold = v => () => { paused = v; if (!v) t0 = performance.now() - (parseFloat(tick.dataset.p || 0) * DUR); };
    ['pointerenter', 'focusin', 'touchstart'].forEach(ev => thx.addEventListener(ev, hold(true), { passive: true }));
    ['pointerleave', 'focusout'].forEach(ev => thx.addEventListener(ev, hold(false)));
    const loop = now => {
      if (!paused && !document.hidden) {
        const p = Math.min((now - t0) / DUR, 1);
        tick.dataset.p = p; tick.style.transform = 'scaleX(' + p + ')';
        if (p >= 1) go(cur + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    show();
    if (!reduce) raf = requestAnimationFrame(loop);
  }

  if (!hasGsap || reduce) { root.classList.add(hasGsap ? 'rm' : 'nogsap'); return; }
  root.classList.add('gs');
  gsap.registerPlugin(ScrollTrigger);

  /* header */
  const hd = $('#hd');
  ScrollTrigger.create({ start: 40, end: 'max', onToggle: s => hd.classList.toggle('on', s.isActive) });

  const lines = el => $$('.l > span', el);

  /* hero intro */
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from(lines($('.hero h1')), { yPercent: 110, duration: 1.2, stagger: .1, ease: 'power4.out' }, .1)
    .from('.hero .hi', { y: 26, autoAlpha: 0, duration: 1, stagger: .1 }, .25);

  /* budget: total counts up, bar fills segment by segment, item meters grow */
  const totN = $('#totN'), cnt = { v: 0 };
  gsap.set('.stack .sg', { scaleX: 0 });
  gsap.set('.items .m i', { scaleX: 0 });
  gsap.timeline({ scrollTrigger: { trigger: '#stack', start: 'top 85%', once: true } })
    .to(cnt, { v: 770000, duration: 1.6, ease: 'power3.out', onUpdate: () => { totN.textContent = (Math.round(cnt.v / 1000) * 1000).toLocaleString('en-US'); } }, 0)
    .to('.stack .sg', { scaleX: 1, duration: .8, stagger: .16, ease: 'power3.inOut' }, 0);
  $$('.cat').forEach(c => gsap.to($$('.m i', c), {
    scaleX: 1, duration: 1, stagger: .08, ease: 'power3.out',
    scrollTrigger: { trigger: c, start: 'top 85%', once: true }
  }));

  /* safety procedure lights up step by step */
  const ps = $$('#proc li');
  ScrollTrigger.create({
    trigger: '#proc', start: 'top 85%', end: 'bottom 45%', scrub: true,
    onUpdate: s => {
      const n = Math.floor(s.progress * (ps.length + .5));
      ps.forEach((li, k) => { li.classList.toggle('on', k < n); li.classList.toggle('go', k === ps.length - 1 && n >= ps.length); });
    }
  });

  /* roadmap line draws itself */
  const sts = $$('#roadGrid .st');
  ScrollTrigger.create({
    trigger: '#roadGrid', start: 'top 82%', end: 'bottom 60%', scrub: .5,
    onUpdate: s => {
      gsap.set('#roadLine', { scaleX: s.progress });
      sts.forEach((st, k) => st.classList.toggle('on', s.progress >= k / sts.length - .001));
    }
  });

  /* KPI numbers count up */
  $$('#kpi [data-n]').forEach(el => {
    const o = { v: 0 }, n = +el.dataset.n;
    el.textContent = '0';
    gsap.to(o, { v: n, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* reveals */
  $$('.rv').forEach(el => gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  }));
  $$('.split').forEach(el => { if (el.closest('.hero')) return; gsap.from(lines(el), {
    yPercent: 110, duration: 1.2, stagger: .09, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  }); });

  /* HUD */
  const hudT = $('#hudT'), hudBar = $('#hudBar');
  $$('[data-hud]').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: s => s.isActive && (hudT.textContent = sec.dataset.hud)
  }));
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => gsap.set(hudBar, { scaleX: s.progress }) });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
