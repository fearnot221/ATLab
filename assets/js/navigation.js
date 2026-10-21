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
    b.setAttribute('aria-label', open ? b.dataset.closeLabel : b.dataset.openLabel);
    document.documentElement.classList.toggle('menu-open', open);
    if (open) { m.hidden = false; requestAnimationFrame(() => m.classList.add('on')); }
    else { m.classList.remove('on'); m.hidden = true; }
  };
  b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
  m.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !m.hidden) { set(false); b.focus(); } });
  matchMedia('(min-width: 1001px)').addEventListener('change', e => e.matches && set(false));
})();

(() => {
  /* sub-nav: underline the section being read */
  const links = [...document.querySelectorAll('.subnav a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  links.forEach(a => { const t = document.querySelector(a.getAttribute('href')); t && io.observe(t); });
})();
