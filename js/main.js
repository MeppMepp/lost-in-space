/* =========================================================
   LOST IN SPACE – Interaktionen & Scroll-Animationen
   GSAP + ScrollTrigger + Lenis (Smooth Scroll)
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Starfield ----------
     Dezente Sterne in drei Tiefen. Reagieren auf Scroll (Parallax),
     Maus und Scroll-Tempo (Lichtstreifen). */
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let w, h, dpr, stars = [];
  let scrollY = window.scrollY, lastScroll = scrollY;
  let warp = 0, warpTarget = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const tints = ['255,255,255', '180,225,255', '120,210,255'];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    const count = Math.round((window.innerWidth * window.innerHeight) / 3200);
    stars = Array.from({ length: count }, () => {
      const z = Math.random();
      return { x: Math.random() * w, y: Math.random() * h, z, r: (0.25 + z * 1.1) * dpr, tw: Math.random() * 6.28, c: tints[(Math.random() * 3) | 0] };
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    warp += (warpTarget - warp) * 0.08;
    warpTarget *= 0.9;
    const dir = Math.sign(scrollY - lastScroll || 1);

    for (const s of stars) {
      const depth = 0.15 + s.z * 0.85;
      let y = (s.y - scrollY * depth * 0.3 * dpr) % h;
      if (y < 0) y += h;
      const x = s.x + mouse.x * depth * 14 * dpr;
      const a = (0.3 + 0.7 * Math.abs(Math.sin(t * 0.001 + s.tw))) * (0.35 + s.z * 0.65);

      if (warp > 0.03) {
        ctx.strokeStyle = `rgba(${s.c},${a})`;
        ctx.lineWidth = s.r;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + warp * 46 * depth * dpr * dir);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${s.c},${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, 6.283);
        ctx.fill();
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  requestAnimationFrame(draw);

  function onScroll(y) {
    const v = Math.abs(y - scrollY);
    lastScroll = scrollY;
    scrollY = y;
    warpTarget = Math.min(1, Math.max(warpTarget, v / 70));
    updateNav(y);
    if (reduceMotion) draw(performance.now());
  }

  /* ---------- HUD-Koordinaten ---------- */
  const coords = document.getElementById('coords');
  if (coords && !reduceMotion) {
    const base = [2341.07, -812.44, 129.9];
    setInterval(() => {
      const f = (n, i) => (n + Math.sin(Date.now() / (900 + i * 300)) * 40 + scrollY * 0.03).toFixed(2).padStart(8, '0');
      coords.textContent = `X ${f(base[0], 0)} · Y ${f(base[1], 1)} · Z ${f(base[2], 2)}`;
    }, 120);
  }

  /* ---------- Navigation ---------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  let lastNavY = 0;

  function updateNav(y) {
    nav.classList.toggle('is-scrolled', y > 40);
    const menuOpen = navLinks.classList.contains('is-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > 500 && y > lastNavY);
    lastNavY = y;
  }
  function closeMenu() {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Menü öffnen');
    document.body.style.overflow = '';
  }
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  /* ---------- Loader ---------- */
  const loader = document.getElementById('loader');
  const pctEl = document.getElementById('loaderPct');
  const barEl = document.getElementById('loaderBar');
  let pct = 0, loaded = false, introPlayed = false;
  let playIntro = () => {};

  function finishLoading() {
    if (introPlayed) return;
    introPlayed = true;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    playIntro();
  }
  (function tick() {
    const target = loaded ? 100 : 90;
    pct += Math.max(0.6, (target - pct) * (loaded ? 0.2 : 0.04));
    pct = Math.min(pct, target);
    pctEl.textContent = String(Math.round(pct)).padStart(3, '0') + '%';
    barEl.style.width = pct + '%';
    if (pct >= 100) setTimeout(finishLoading, 200);
    else requestAnimationFrame(tick);
  })();
  window.addEventListener('load', () => { loaded = true; });
  setTimeout(() => { loaded = true; }, 3000); // Fallback, falls ein Asset hängt

  /* ---------- Anker-Links ---------- */
  function setupAnchors(lenis) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ---------- Fallback ohne GSAP / reduzierte Bewegung ---------- */
  if (!hasGSAP || reduceMotion) {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    setupAnchors(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth Scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = window.lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ({ scroll }) => { ScrollTrigger.update(); onScroll(scroll); });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }
  setupAnchors(lenis);

  /* ---------- Helfer ---------- */
  function splitWords(el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((wd) => `<span class="w">${wd}</span>`).join(' ');
    return el.querySelectorAll('.w');
  }
  // Überschrift wortweise in Masken packen, damit die Wörter von unten "hochfahren".
  // Inline-Elemente wie <em> bleiben erhalten, <br> ebenso.
  function splitUp(el) {
    const wrap = (word, tag) => {
      const inner = tag ? `<${tag}>${word}</${tag}>` : word;
      return `<span class="line" style="display:inline-block"><span class="line__in">${inner}</span></span>`;
    };
    const out = [];
    el.childNodes.forEach((node) => {
      if (node.nodeName === 'BR') { out.push('<br>'); return; }
      const tag = node.nodeType === 1 ? node.nodeName.toLowerCase() : null;
      node.textContent.split(/(\s+)/).forEach((part) => out.push(part.trim() ? wrap(part, tag) : part));
    });
    el.innerHTML = out.join('');
    return el.querySelectorAll('.line__in');
  }

  /* ---------- Hero-Intro ---------- */
  const heroLines = document.querySelectorAll('.hero__title .line__in');
  gsap.set(heroLines, { yPercent: 105 });
  gsap.set(['.hero__tag', '.hero__claim', '.hero .ctas', '.hud', '.scroll-cue'], { opacity: 0, y: 20 });
  gsap.set('.hero__badge', { opacity: 0, scale: 0.8 });
  gsap.set('.hero__video', { scale: 1.25 });

  playIntro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__video', { scale: 1.05, duration: 2.4, ease: 'power3.out' })
      .to(heroLines, { yPercent: 0, duration: 1.4, stagger: 0.12 }, 0.2)
      .to('.hero__tag', { opacity: 1, y: 0, duration: 1 }, 0.5)
      .to(['.hero__claim', '.hero .ctas'], { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.8)
      .to('.hero__badge', { opacity: 1, scale: 1, duration: 1.6 }, 0.7)
      .to(['.hud', '.scroll-cue'], { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 1.1);
  };

  /* ---------- Hero-Parallax ---------- */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__media', { yPercent: 25, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__text', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { ...heroST, end: '80% top' } });
  gsap.to('.hero__badge', { yPercent: -60, rotate: 20, ease: 'none', scrollTrigger: heroST });
  gsap.fromTo('.hud', { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', immediateRender: false, scrollTrigger: { ...heroST, start: '5% top', end: '30% top' } });

  // Maus-Tilt aufs Logo
  if (window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      const mx = e.clientX / window.innerWidth - 0.5;
      const my = e.clientY / window.innerHeight - 0.5;
      gsap.to('.hero__badge img', { x: mx * 20, y: my * 20, rotationY: mx * 18, rotationX: my * -18, duration: 1.2, ease: 'power3.out', transformPerspective: 800 });
    });
  }

  /* ---------- Bild-Parallax (Bild bewegt sich langsamer als der Rahmen) ---------- */
  gsap.utils.toArray('.parallax-img').forEach((wrap) => {
    const img = wrap.querySelector('img');
    gsap.fromTo(img, { yPercent: -12 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: wrap.closest('section') || wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- Tags & Text einblenden ---------- */
  gsap.utils.toArray('main .tag').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, { opacity: 0, x: -24, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.utils.toArray('.fade-up').forEach((el) => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.utils.toArray('.split-up').forEach((el) => {
    const parts = splitUp(el);
    gsap.from(parts, { yPercent: 110, duration: 1.3, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- Story: Bild-Reveal, gestapelte Typo, Karte ---------- */
  gsap.from('.story__media', {
    clipPath: 'inset(0 100% 0 0)', duration: 1.6, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.story', start: 'top 75%' }
  });
  gsap.utils.toArray('.stack__row').forEach((row) => {
    const x = parseFloat(row.dataset.x);
    gsap.fromTo(row, { xPercent: -x }, {
      xPercent: x, ease: 'none',
      scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
  gsap.from('.story__card', {
    y: 120, opacity: 0, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.story', start: 'top 60%' }
  });

  /* ---------- Manifest: Wort für Wort ---------- */
  const words = splitWords(document.querySelector('.scrub-words'));
  gsap.to(words, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.scrub-words', start: 'top 80%', end: 'bottom 40%', scrub: true }
  });
  gsap.from('.manifest__quote .line__in', {
    yPercent: 110, duration: 1.2, stagger: 0.12, ease: 'expo.out',
    scrollTrigger: { trigger: '.manifest__quote', start: 'top 85%' }
  });

  /* ---------- Crew-Karten ---------- */
  gsap.from('.card', {
    clipPath: 'inset(100% 0 0 0)', duration: 1.4, stagger: 0.15, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.cards', start: 'top 80%' }
  });
  gsap.from('.card__body > *', {
    y: 30, opacity: 0, duration: 1, stagger: 0.05, ease: 'expo.out', delay: 0.6,
    scrollTrigger: { trigger: '.cards', start: 'top 80%' }
  });
  gsap.from('.fact', {
    opacity: 0, y: 20, duration: 1, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: '.facts', start: 'top 92%' }
  });

  /* ---------- Charta: horizontaler Scroll (Desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = document.getElementById('chartaTrack');
    const rules = track.querySelectorAll('.rule');
    const num = document.getElementById('chartaNum');
    const distance = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.charta',
        pin: '.charta__pin',
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set('#chartaBar', { scaleX: self.progress });
          num.textContent = String(Math.min(rules.length, Math.floor(self.progress * rules.length) + 1)).padStart(2, '0');
        }
      }
    });
    gsap.to('.charta__bg img', {
      scale: 1.25, xPercent: -4, ease: 'none',
      scrollTrigger: { trigger: '.charta', start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true }
    });
  });
  mm.add('(max-width: 860px)', () => {
    gsap.utils.toArray('.rule').forEach((rule) => {
      gsap.from(rule, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: rule, start: 'top 90%' } });
    });
  });

  /* ---------- Join ---------- */
  gsap.from('.step', {
    opacity: 0, y: 30, duration: 1, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.steps', start: 'top 88%' }
  });
  gsap.from('.join .ctas', {
    opacity: 0, y: 30, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: '.join .ctas', start: 'top 95%' }
  });

  /* ---------- Aktiver Nav-Link ---------- */
  document.querySelectorAll('.nav__links a[href^="#"]:not(.nav__cta)').forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: 'top center', end: 'bottom center',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive)
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
