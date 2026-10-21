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
