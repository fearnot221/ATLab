(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const endBoot = () => { root.classList.remove('booting'); try { sessionStorage.setItem('atl-boot', '1'); } catch (e) {} };

  if (!hasGsap || reduce) {
    root.classList.add(hasGsap ? 'rm' : 'nogsap');
    endBoot();
    return;
  }
  root.classList.add('gs');
  gsap.registerPlugin(ScrollTrigger);

  /* header + HUD */
  const hd = $('#hd');
  ScrollTrigger.create({ start: () => innerHeight * 0.9, end: 'max', onToggle: s => hd.classList.toggle('on', s.isActive) });

  const lines = el => $$('.l > span', el);

  /* ---------- intro (after the boot countdown) ---------- */
  gsap.set(['.head .wm', '.head h1', '#heroPlate', '#hint'], { autoAlpha: 0 });
  gsap.set('.dw', { clipPath: 'inset(0 100% 0 0)' });
  const intro = () => {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.head .wm', { y: 30 }, { y: 0, autoAlpha: 1, duration: 1 })
      .fromTo('.head h1', { y: 24 }, { y: 0, autoAlpha: 1, duration: 1 }, '-=.75')
      .fromTo('#heroPlate', { y: 90 }, { y: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, '-=.8')
      .to('.dw', { clipPath: 'inset(0 0% 0 0)', duration: 1.6, stagger: .15, ease: 'power2.inOut' }, '-=1.1')
      .to('#hint', { autoAlpha: 1, duration: .6 }, '-=.6');
  };
  if (root.classList.contains('booting')) {
    const t = $('#bootT');
    const btl = gsap.timeline({ onComplete: endBoot });
    JSON.parse(t.dataset.steps).forEach((text, k, steps) => btl.call(() => {
      const label = document.createElement(k === steps.length - 1 ? 'em' : 'span');
      label.textContent = text;
      t.replaceChildren(label);
    }, null, k * .32));
    btl.to('#bootBar', { width: '100%', duration: 1.2, ease: 'none' }, 0)
       .to('#boot', { yPercent: -100, duration: .9, ease: 'power4.inOut' }, 1.35)
       .call(intro, null, 1.6)
       .set('#boot', { display: 'none' });
    setTimeout(() => btl.progress() < 1 && btl.progress(1), 5000);
  } else {
    intro();
  }


  const mm = gsap.matchMedia();

  /* ---------- HERO: fly through the porthole ---------- */
  const plate = $('#heroPlate');
  const cover = () => {
    const w = plate.offsetWidth * .885, h = plate.offsetHeight * .835;
    return Math.max(innerWidth / w, innerHeight / h) * 1.06;
  };
  gsap.set('#over', { visibility: 'visible' });
  gsap.set(lines($('#over')), { yPercent: 110 });
  gsap.timeline({
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=160%', scrub: .7, pin: true, invalidateOnRefresh: true }
  })
    .to('#hint', { opacity: 0, duration: .08 }, 0)
    .to('.head', { y: -140, opacity: 0, ease: 'power1.in', duration: .32 }, 0)
    .to('.d-turbine', { x: -200, y: -120, opacity: 0, duration: .4 }, 0)
    .to('.d-target', { x: 200, y: -120, opacity: 0, duration: .4 }, 0)
    .to('.d-injector', { x: -220, y: 120, opacity: 0, duration: .4 }, 0)
    .to('.d-rocket', { x: 260, y: 120, opacity: 0, duration: .4 }, 0)
    .to(plate, { scale: cover, y: () => innerHeight / 2 - (plate.offsetTop + plate.offsetHeight / 2), ease: 'power2.in', duration: .62 }, .04)
    .to('#shade', { opacity: 1, duration: .25, ease: 'none' }, .46)
    .to(lines($('#over')), { yPercent: 0, stagger: .06, duration: .26, ease: 'power3.out' }, .6)
    .to({}, { duration: .14 });

  /* ---------- manifesto: characters light up as you read ---------- */
  const mani = $('#mani');
  const toks = mani.textContent.match(/[A-Za-z0-9]+|\s+|./g);
  mani.textContent = '';
  toks.forEach(t => { const s = document.createElement('span'); s.className = 'c'; s.textContent = t; mani.appendChild(s); });
  gsap.to($$('.c', mani), {
    opacity: 1, stagger: .05, ease: 'none',
    scrollTrigger: { trigger: mani, start: 'top 78%', end: 'bottom 45%', scrub: .4 }
  });

  /* ---------- FLIGHT: altitude scrub ---------- */
  const asc = $('#asc'), dsc = $('#dsc'), dot = $('#dot'), ring = $('#ring');
  const altN = $('#altN'), altNow = $('#altNow'), altEl = $('#alt'), phases = $$('#phases li');
  const La = asc.getTotalLength(), Ld = dsc.getTotalLength();
  asc.style.strokeDasharray = La; dsc.style.strokeDasharray = Ld;
  const peakAltitude = Number(altEl.dataset.peak);
  const APO = .5, CHUTE = .62;
  const flight = p => {
    let alt, pt;
    if (p < APO) {
      const k = p / APO;
      asc.style.strokeDashoffset = La * (1 - k); dsc.style.strokeDashoffset = Ld;
      pt = asc.getPointAtLength(La * k); alt = peakAltitude * (1 - Math.pow(1 - k, 2.2));
    } else if (p < CHUTE) {
      asc.style.strokeDashoffset = 0; dsc.style.strokeDashoffset = Ld;
      pt = asc.getPointAtLength(La); alt = peakAltitude;
    } else {
      const k = Math.min((p - CHUTE) / (1 - CHUTE - .03), 1);
      asc.style.strokeDashoffset = 0; dsc.style.strokeDashoffset = Ld * (1 - k);
      pt = dsc.getPointAtLength(Ld * k); alt = peakAltitude * (1 - k);
    }
    const peak = p < APO ? alt : peakAltitude;
    altN.textContent = Math.round(peak).toLocaleString('en-US');
    altNow.textContent = Math.round(alt).toLocaleString('en-US');
    altEl.classList.toggle('apo', p >= APO - .004);
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    ring.setAttribute('cx', pt.x); ring.setAttribute('cy', pt.y);
    let last = -1;
    phases.forEach((li, k) => { const on = p >= +li.dataset.p; li.classList.toggle('on', on); if (on) last = k; });
    phases.forEach((li, k) => li.classList.toggle('now', k === last));
  };
  flight(0);
  ScrollTrigger.create({
    trigger: '#flStage', start: 'top top', end: '+=220%', pin: true, scrub: true,
    onUpdate: s => flight(s.progress)
  });
  gsap.fromTo(ring, { attr: { r: 6 }, opacity: 1 }, { attr: { r: 22 }, opacity: 0, duration: 1.4, repeat: -1, ease: 'power2.out' });

  /* ---------- PARTS: horizontal track on desktop ---------- */
  mm.add('(min-width: 901px)', () => {
    const track = $('#track');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#ptStage', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true,
        onUpdate: s => gsap.set('#ptBar', { scaleX: s.progress })
      }
    });
  });

  /* ---------- AT2 dossier: photo follows the chapter you're reading ---------- */
  const dImgs = $$('#dosImgs img'), dCap = $('#dosCap'), dMeta = $('#dosMeta');
  $$('.chap').forEach(ch => ScrollTrigger.create({
    trigger: ch, start: 'top 62%', end: 'bottom 62%',
    onToggle: s => {
      if (!s.isActive) return;
      dImgs.forEach((im, k) => im.classList.toggle('on', k === +ch.dataset.img));
      dCap.textContent = ch.dataset.cap; dMeta.textContent = ch.dataset.meta;
    }
  }));

  /* ---------- roadmap line draws itself ---------- */
  const sts = $$('#road .st');
  ScrollTrigger.create({
    trigger: '#road', start: 'top 78%', end: 'bottom 70%', scrub: .5,
    onUpdate: s => {
      gsap.set('#roadLine', { scaleX: s.progress });
      sts.forEach((st, k) => st.classList.toggle('on', s.progress >= k / sts.length));
    }
  });

  /* ---------- countdown steps ---------- */
  const cs = $$('#count li');
  ScrollTrigger.create({
    trigger: '#count', start: 'top 82%', end: 'bottom 50%', scrub: true,
    onUpdate: s => {
      const n = Math.floor(s.progress * (cs.length + .5));
      cs.forEach((li, k) => { li.classList.toggle('on', k < n); li.classList.toggle('go', k === cs.length - 1 && n >= cs.length); });
    }
  });

  /* ---------- crew list: photo peeks next to the cursor ---------- */
  if (fine) {
    const peek = $('#peek'), pimg = $('#peekImg');
    gsap.set(peek, { scale: .8 });
    const qx = gsap.quickTo(peek, 'x', { duration: .55, ease: 'power3' }), qy = gsap.quickTo(peek, 'y', { duration: .55, ease: 'power3' });
    $$('.fields li, .teams a').forEach(li => {
      li.addEventListener('pointerenter', e => {
        if (!peek.classList.contains('on')) { gsap.set(peek, { x: e.clientX + 200, y: e.clientY }); }
        pimg.src = li.dataset.img; peek.classList.add('on');
        gsap.to(peek, { scale: 1, rotate: gsap.utils.random(-4, 4), duration: .5, ease: 'power3.out' });
      });
      li.addEventListener('pointermove', e => { qx(e.clientX + 200); qy(e.clientY); });
      li.addEventListener('pointerleave', () => { peek.classList.remove('on'); gsap.to(peek, { scale: .8, duration: .3 }); });
    });
  }

  /* created last so their positions account for every pin above */
  /* ---------- reveals ---------- */
  $$('.rv').forEach(el => gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  }));
  $$('.split').forEach(el => gsap.from(lines(el), {
    yPercent: 110, duration: 1.2, stagger: .09, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  }));

  /* ---------- HUD ---------- */
  const hudT = $('#hudT'), hudBar = $('#hudBar');
  $$('[data-hud]').forEach(sec => ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: s => s.isActive && (hudT.textContent = sec.dataset.hud)
  }));
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => gsap.set(hudBar, { scaleX: s.progress }) });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
