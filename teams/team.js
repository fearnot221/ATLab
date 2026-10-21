(() => {
  /* a fresh visit always starts at the top (some embedded viewers carry the old scroll over);
     links to a #section and back/forward navigation keep their position */
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (location.hash || (nav && nav.type !== 'navigate')) return;
  let touched = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, () => { touched = true; }, { once: true, passive: true }));
  const top = () => { if (!touched) scrollTo(0, 0); };
  top();
  addEventListener('load', () => { top(); setTimeout(top, 80); setTimeout(top, 300); });
})();
(() => {
  /* 技術組 dropdown: click to open, closes on outside click, Esc or leaving it */
  document.querySelectorAll('.dd').forEach(dd => {
    const t = dd.querySelector('.dd-t'), p = dd.querySelector('.dd-p');
    const set = o => { t.setAttribute('aria-expanded', o); p.hidden = !o; };
    t.addEventListener('click', () => set(p.hidden));
    document.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
    dd.addEventListener('keydown', e => { if (e.key === 'Escape' && !p.hidden) { set(false); t.focus(); } });
    dd.addEventListener('focusout', e => { if (e.relatedTarget && !dd.contains(e.relatedTarget)) set(false); });
  });
  /* 技術組 accordion inside the mobile menu */
  document.querySelectorAll('.mexp').forEach(b => {
    const sub = document.getElementById(b.getAttribute('aria-controls'));
    b.addEventListener('click', () => { const o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', o); sub.hidden = !o; });
  });
})();

(() => {
  /* mobile menu: full-screen list under the header */
  const b = document.getElementById('mbtn'), m = document.getElementById('mnav');
  if (!b || !m) return;
  const set = open => {
    b.setAttribute('aria-expanded', open);
    b.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    document.documentElement.classList.toggle('menu-open', open);
    if (open) { m.hidden = false; requestAnimationFrame(() => m.classList.add('on')); }
    else { m.classList.remove('on'); m.hidden = true; }
  };
  b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
  m.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !m.hidden) { set(false); b.focus(); } });
  matchMedia('(min-width: 1001px)').addEventListener('change', e => e.matches && set(false));
})();

/* Shared motion for the team pages. Content is fully visible without it. */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!(window.gsap && window.ScrollTrigger) || reduce) return;
  root.classList.add('gs');
  gsap.registerPlugin(ScrollTrigger);

  const hd = $('#hd');
  ScrollTrigger.create({ start: 40, end: 'max', onToggle: s => hd.classList.toggle('on', s.isActive) });

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero .en > span', { yPercent: 105, duration: 1.2, ease: 'power4.out' }, .05)
    .from('.hero .hi', { y: 24, autoAlpha: 0, duration: 1, stagger: .1 }, .25);

  $$('.rv').forEach(el => gsap.to(el, {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  }));

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
