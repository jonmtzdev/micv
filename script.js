const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

// Without GSAP nothing would reveal the hidden blocks, so show everything as-is.
if (!hasGsap) root.classList.remove('js');
else gsap.registerPlugin(ScrollTrigger, ...(window.Flip ? [Flip] : []));

// Shared pointer position, normalised to -1..1, used by the hero stage and the 3D scene.
const pointer = { x: 0, y: 0 };
window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

/* ==========================================================================
   Menu
   ========================================================================== */
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

const closeMenu = () => {
  if (!menuToggle || !nav) return;
  nav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
};

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

/* ==========================================================================
   Theme
   ========================================================================== */
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
if (themeToggle) {
  const pageBody = document.body;
  let savedTheme = null;
  try { savedTheme = window.localStorage.getItem('site-theme'); } catch { /* storage can be unavailable in private/file contexts */ }

  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    pageBody.dataset.theme = isLight ? 'light' : 'dark';
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    themeToggle.innerHTML = `<span class="theme-icon" aria-hidden="true">${isLight ? '☾' : '☼'}</span><span class="theme-label">${isLight ? 'Oscuro' : 'Claro'}</span>`;
    if (themeColorMeta) themeColorMeta.setAttribute('content', isLight ? '#edf2f8' : '#060d17');
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: pageBody.dataset.theme } }));
  };

  applyTheme(savedTheme === 'light' ? 'light' : 'dark');
  themeToggle.addEventListener('click', () => {
    const nextTheme = pageBody.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    try { window.localStorage.setItem('site-theme', nextTheme); } catch { /* keep the switch working without storage */ }
  });
}

/* ==========================================================================
   Small utilities: year, copy phone
   ========================================================================== */
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

const copyPhone = document.querySelector('[data-copy-phone]');
if (copyPhone) {
  copyPhone.addEventListener('click', async () => {
    const phone = copyPhone.dataset.phone;
    try { await navigator.clipboard.writeText(phone); } catch { /* fallback: the phone remains visible */ }
    const original = copyPhone.innerHTML;
    copyPhone.innerHTML = '<span class="phone-icon">✓</span> Número copiado';
    window.setTimeout(() => { copyPhone.innerHTML = original; }, 1800);
  });
}

/* ==========================================================================
   Smooth scroll (Lenis) + anchors
   ========================================================================== */
let lenis = null;
if (window.Lenis && !prefersReducedMotion) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  if (hasGsap) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const target = anchor.getAttribute('href');
    if (!lenis || target.length < 2) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: -96 });
  });
});

/* ==========================================================================
   Header (hide on scroll down) + scroll progress
   ========================================================================== */
const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('[data-scroll-progress]');
let lastScrollY = window.scrollY;
let scrollTicking = false;

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (header) {
    const menuOpen = nav && nav.classList.contains('is-open');
    header.classList.toggle('is-hidden', y > 240 && y > lastScrollY && !menuOpen);
  }
  lastScrollY = y;
  scrollTicking = false;
};
window.addEventListener('scroll', () => {
  if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

/* ==========================================================================
   Active nav link
   ========================================================================== */
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-link:not(.nav-link-cta)')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

/* ==========================================================================
   Text effects: split headings, scramble labels, counters, typing
   ========================================================================== */
// Wraps every word in a mask so it can slide up, keeping <em>, <span> and <br> intact.
function splitWords(element) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(' ')); return; }
          const word = document.createElement('span');
          word.className = 'split-word';
          const inner = document.createElement('span');
          inner.className = 'split-inner';
          inner.textContent = part;
          word.appendChild(inner);
          fragment.appendChild(word);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(element);
  // background-clip:text does not reach into transformed children, so move the gradient onto each word.
  element.querySelectorAll('.grad-text').forEach((gradient) => {
    gradient.classList.remove('grad-text');
    gradient.querySelectorAll('.split-inner').forEach((inner) => inner.classList.add('grad-text'));
  });
  return element.querySelectorAll('.split-inner');
}

const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#01';
function scrambleText(element) {
  const finalText = element.textContent;
  const start = performance.now();
  const duration = 900;
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const revealed = Math.floor(progress * finalText.length);
    let output = '';
    for (let i = 0; i < finalText.length; i += 1) {
      const char = finalText[i];
      output += i < revealed || char === ' ' ? char : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
    element.textContent = output;
    if (progress < 1) requestAnimationFrame(tick);
    else element.textContent = finalText;
  };
  requestAnimationFrame(tick);
}

function typeCode(code) {
  const tokens = [...code.childNodes].map((node) => ({
    className: node.nodeType === Node.ELEMENT_NODE ? node.className : null,
    text: node.textContent
  }));
  const caret = document.createElement('span');
  caret.className = 'type-caret';
  code.textContent = '';
  code.appendChild(caret);

  let tokenIndex = 0;
  let charIndex = 0;
  let current = null;
  const step = () => {
    if (tokenIndex >= tokens.length) return;
    const token = tokens[tokenIndex];
    if (!current) {
      current = token.className ? Object.assign(document.createElement('span'), { className: token.className }) : document.createTextNode('');
      code.insertBefore(current, caret);
    }
    const char = token.text[charIndex];
    current.textContent += char;
    charIndex += 1;
    if (charIndex >= token.text.length) { tokenIndex += 1; charIndex = 0; current = null; }
    window.setTimeout(step, char === '\n' ? 200 : 22 + Math.random() * 45);
  };
  window.setTimeout(step, 1100);
}

const typingTarget = document.querySelector('[data-typing]');
if (typingTarget) {
  if (prefersReducedMotion) typingTarget.insertAdjacentHTML('beforeend', '<span class="type-caret"></span>');
  else typeCode(typingTarget);
}

if (hasGsap && !prefersReducedMotion) {
  // Headings: words slide up out of a mask.
  document.querySelectorAll('[data-split]').forEach((heading) => {
    const words = splitWords(heading);
    const inHero = heading.closest('.hero');
    gsap.from(words, {
      yPercent: 115,
      rotate: 4,
      duration: 1.15,
      stagger: 0.055,
      ease: 'power4.out',
      delay: inHero ? 0.25 : 0,
      scrollTrigger: inHero ? undefined : { trigger: heading, start: 'top 88%' }
    });
  });

  // Mono labels decode like a terminal when they enter the viewport.
  document.querySelectorAll('[data-scramble]').forEach((label) => {
    ScrollTrigger.create({ trigger: label, start: 'top 92%', once: true, onEnter: () => scrambleText(label) });
  });

  // Counters.
  document.querySelectorAll('[data-count]').forEach((counter) => {
    const target = Number(counter.dataset.count);
    const pad = Number(counter.dataset.pad || 0);
    const value = { n: 0 };
    gsap.to(value, {
      n: target,
      duration: 1.8,
      ease: 'power3.out',
      delay: 0.6,
      scrollTrigger: { trigger: counter, start: 'top 95%', once: true },
      onUpdate: () => { counter.textContent = String(Math.round(value.n)).padStart(pad, '0'); }
    });
  });
}

/* ==========================================================================
   Reveal + scroll-driven motion
   ========================================================================== */
if (hasGsap) {
  const delays = { 'reveal-delay-1': 0.1, 'reveal-delay-2': 0.2, 'reveal-delay-3': 0.3, 'reveal-delay-4': 0.4 };
  gsap.utils.toArray('.reveal').forEach((element) => {
    const delayClass = Object.keys(delays).find((name) => element.classList.contains(name));
    if (prefersReducedMotion) { gsap.set(element, { autoAlpha: 1 }); return; }
    gsap.fromTo(element,
      { autoAlpha: 0, y: 44 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        delay: delayClass ? delays[delayClass] : 0,
        ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: { trigger: element, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });

  if (!prefersReducedMotion) {
    // Screenshots drift inside their frame for a parallax feel.
    gsap.utils.toArray('.project-screenshot').forEach((image) => {
      gsap.fromTo(image, { yPercent: -5 }, {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: image.closest('.project-visual'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Process timeline line draws itself.
    const processLine = document.querySelector('[data-process-line]');
    if (processLine) {
      gsap.to(processLine, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: '[data-process]', start: 'top 80%', end: 'bottom 70%', scrub: true }
      });
    }
  }
}

/* ==========================================================================
   Pointer interactions: hero stage, card tilt, spotlight, magnetic, glow
   ========================================================================== */
const stage = document.querySelector('[data-stage]');
if (stage && hasGsap && finePointer && !prefersReducedMotion) {
  const rotateY = gsap.quickTo(stage, 'rotationY', { duration: 1.2, ease: 'power3.out' });
  const rotateX = gsap.quickTo(stage, 'rotationX', { duration: 1.2, ease: 'power3.out' });
  window.addEventListener('pointermove', () => {
    rotateY(pointer.x * 10);
    rotateX(pointer.y * -7);
  }, { passive: true });
}

if (finePointer && !prefersReducedMotion) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const surface = card.querySelector('.card-surface');
    const visual = card.querySelector('.project-visual');
    card.addEventListener('pointerenter', () => card.classList.add('tilt-ready'));
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
      card.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
      if (surface) {
        surface.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
        surface.style.setProperty('--my', `${event.clientY - bounds.top}px`);
      }
      if (visual) {
        const visualBounds = visual.getBoundingClientRect();
        visual.style.setProperty('--gx', `${((event.clientX - visualBounds.left) / visualBounds.width) * 100}%`);
        visual.style.setProperty('--gy', `${((event.clientY - visualBounds.top) / visualBounds.height) * 100}%`);
      }
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll('[data-spotlight-group]').forEach((group) => {
    const items = group.querySelectorAll('[data-spotlight]');
    group.addEventListener('pointermove', (event) => {
      items.forEach((item) => {
        const bounds = item.getBoundingClientRect();
        item.style.setProperty('--mx', `${event.clientX - bounds.left}px`);
        item.style.setProperty('--my', `${event.clientY - bounds.top}px`);
      });
    });
  });

  if (hasGsap) {
    document.querySelectorAll('[data-magnetic]').forEach((button) => {
      const moveX = gsap.quickTo(button, 'x', { duration: 0.4, ease: 'power3.out' });
      const moveY = gsap.quickTo(button, 'y', { duration: 0.4, ease: 'power3.out' });
      button.addEventListener('pointermove', (event) => {
        const bounds = button.getBoundingClientRect();
        moveX((event.clientX - bounds.left - bounds.width / 2) * 0.25);
        moveY((event.clientY - bounds.top - bounds.height / 2) * 0.35);
      });
      button.addEventListener('pointerleave', () => {
        gsap.to(button, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      });
    });

    const glow = document.querySelector('[data-cursor-glow]');
    if (glow) {
      const glowX = gsap.quickTo(glow, 'x', { duration: 0.9, ease: 'power3.out' });
      const glowY = gsap.quickTo(glow, 'y', { duration: 0.9, ease: 'power3.out' });
      window.addEventListener('pointermove', (event) => {
        glow.classList.add('is-active');
        glowX(event.clientX);
        glowY(event.clientY);
      }, { passive: true });
      document.addEventListener('pointerleave', () => glow.classList.remove('is-active'));
    }
  }
}

/* ==========================================================================
   Project filters (GSAP Flip)
   ========================================================================== */
const filterBar = document.querySelector('[data-filters]');
const projectCards = [...document.querySelectorAll('.project-card')];
if (filterBar && projectCards.length) {
  const buttons = [...filterBar.querySelectorAll('[data-filter]')];
  const indicator = filterBar.querySelector('[data-filter-indicator]');
  const matches = (card, filter) => filter === 'all' || card.dataset.tags.split(' ').includes(filter);

  buttons.forEach((button) => {
    const count = button.querySelector('[data-filter-count]');
    if (count) count.textContent = projectCards.filter((card) => matches(card, button.dataset.filter)).length;
  });

  const moveIndicator = (button) => {
    if (!indicator) return;
    indicator.style.width = `${button.offsetWidth}px`;
    indicator.style.height = `${button.offsetHeight}px`;
    indicator.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
  };
  const activeButton = () => buttons.find((button) => button.classList.contains('is-active')) || buttons[0];
  moveIndicator(activeButton());
  if (document.fonts) document.fonts.ready.then(() => moveIndicator(activeButton()));
  window.addEventListener('resize', () => moveIndicator(activeButton()));

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      buttons.forEach((other) => {
        const isActive = other === button;
        other.classList.toggle('is-active', isActive);
        other.setAttribute('aria-pressed', String(isActive));
      });
      moveIndicator(button);

      const canFlip = hasGsap && window.Flip && !prefersReducedMotion;
      // The hover-tilt transition would fight Flip's transforms; pointerenter restores it.
      projectCards.forEach((card) => card.classList.remove('tilt-ready'));
      const state = canFlip ? Flip.getState(projectCards) : null;
      projectCards.forEach((card) => card.classList.toggle('is-filtered-out', !matches(card, filter)));
      if (!canFlip) { if (hasGsap) ScrollTrigger.refresh(); return; }

      Flip.from(state, {
        duration: 0.75,
        ease: 'power3.inOut',
        absolute: true,
        scale: true,
        onEnter: (elements) => gsap.fromTo(elements, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.15 }),
        onLeave: (elements) => gsap.to(elements, { opacity: 0, scale: 0.9, duration: 0.4 }),
        onComplete: () => ScrollTrigger.refresh()
      });
    });
  });
} else if (filterBar) {
  filterBar.classList.add('no-filter-js');
}

/* ==========================================================================
   Stack: "N proyectos" derived from the project cards
   ========================================================================== */
document.querySelectorAll('.stack-tile[data-tech]').forEach((tile) => {
  const tech = tile.dataset.tech;
  // Laravel projects count towards PHP through their filter tags even without a PHP chip.
  const uses = projectCards.filter((card) => card.querySelector(`.tech-list [data-tech="${tech}"]`) || card.dataset.tags.split(' ').includes(tech)).length;
  const label = tile.querySelector('[data-uses]');
  if (label && uses) label.textContent = uses === 1 ? '1 proyecto' : `${uses} proyectos`;
});

/* ==========================================================================
   Hero 3D scene (Three.js, loaded lazily)
   ========================================================================== */
const heroCanvas = document.querySelector('[data-hero-canvas]');
const heroStage = document.querySelector('[data-hero-stage]');

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch { return false; }
}

function loadThree() {
  if (window.THREE) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const PALETTES = {
  dark: ['#c9ff5c', '#6be4ff', '#a796ff'],
  light: ['#4b8600', '#0788ad', '#6a56d6']
};

function startHeroScene() {
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 12;

  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  tilt.add(spin);
  scene.add(tilt);

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: 1.7 * pixelRatio },
    uOpacity: { value: 1 }
  };

  const vertexShader = `
    uniform float uTime;
    uniform float uSize;
    attribute float aRand;
    attribute vec3 aColor;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vec3 p = position;
      p += normalize(p) * sin(p.y * 2.2 + uTime * 1.3 + aRand * 6.2831) * 0.07;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (0.55 + aRand) * (28.0 / -mv.z);
      vColor = aColor;
      float twinkle = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 2.0 + aRand * 40.0));
      float depth = smoothstep(-15.5, -8.5, mv.z);
      vAlpha = twinkle * mix(0.18, 1.0, depth);
    }
  `;
  const fragmentShader = `
    uniform float uOpacity;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float strength = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, strength * vAlpha * uOpacity);
    }
  `;

  const materials = [];
  const makePoints = (positions, gradientAxis) => {
    const count = positions.length / 3;
    const geometry = new THREE.BufferGeometry();
    const random = new Float32Array(count);
    for (let i = 0; i < count; i += 1) random[i] = Math.random();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRand', new THREE.BufferAttribute(random, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.userData.gradientAxis = gradientAxis;
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false });
    materials.push(material);
    return new THREE.Points(geometry, material);
  };

  // Fibonacci sphere of particles.
  const isSmall = window.innerWidth < 680;
  const count = isSmall ? 1000 : 2000;
  const radius = 3;
  const spherePositions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    spherePositions.set([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius], i * 3);
  }
  const sphere = makePoints(spherePositions, 1);
  spin.add(sphere);

  // Two tilted orbit rings.
  const rings = [3.75, 4.1].map((ringRadius, index) => {
    const ringCount = isSmall ? 160 : 260;
    const positions = new Float32Array(ringCount * 3);
    for (let i = 0; i < ringCount; i += 1) {
      const angle = (i / ringCount) * Math.PI * 2;
      positions.set([Math.cos(angle) * ringRadius, (Math.random() - 0.5) * 0.08, Math.sin(angle) * ringRadius], i * 3);
    }
    const ring = makePoints(positions, 0);
    ring.rotation.set(index ? -1.15 : 1.2, 0, index ? -0.5 : 0.35);
    tilt.add(ring);
    return ring;
  });

  // Inner wireframe core.
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.25, 1)),
    new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16 })
  );
  spin.add(wire);

  const applyPalette = (theme) => {
    const isLight = theme === 'light';
    const [a, b, c] = PALETTES[isLight ? 'light' : 'dark'].map((hex) => new THREE.Color(hex));
    const mixed = new THREE.Color();
    [sphere, ...rings].forEach((points) => {
      const position = points.geometry.attributes.position;
      const colors = points.geometry.attributes.aColor;
      const axis = points.geometry.userData.gradientAxis;
      const extent = axis === 1 ? radius : 4.1;
      for (let i = 0; i < position.count; i += 1) {
        const value = axis === 1 ? position.getY(i) : position.getX(i);
        const t = (value / extent + 1) / 2;
        if (t < 0.5) mixed.copy(a).lerp(b, t * 2);
        else mixed.copy(b).lerp(c, (t - 0.5) * 2);
        colors.setXYZ(i, mixed.r, mixed.g, mixed.b);
      }
      colors.needsUpdate = true;
    });
    materials.forEach((material) => {
      material.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
      material.needsUpdate = true;
    });
    wire.material.color.copy(b);
    wire.material.opacity = isLight ? 0.22 : 0.16;
  };
  applyPalette(document.body.dataset.theme);
  document.addEventListener('themechange', (event) => applyPalette(event.detail.theme));

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = heroCanvas;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(heroCanvas);

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(heroStage);

  let scrollProgress = 0;
  if (hasGsap) {
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: (self) => { scrollProgress = self.progress; } });
  }

  const clock = new THREE.Clock();
  const render = () => {
    if (!visible) return;
    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    uniforms.uOpacity.value = 1 - scrollProgress * 0.85;
    spin.rotation.y += 0.0018;
    rings[0].rotation.y += 0.0024;
    rings[1].rotation.y -= 0.0016;
    wire.rotation.x -= 0.0012;
    tilt.rotation.y += (pointer.x * 0.45 - tilt.rotation.y) * 0.04;
    tilt.rotation.x += (pointer.y * 0.3 - tilt.rotation.x) * 0.04;
    const scale = 1 + scrollProgress * 0.4;
    tilt.scale.set(scale, scale, scale);
    renderer.render(scene, camera);
  };
  if (hasGsap) gsap.ticker.add(render);
  else renderer.setAnimationLoop(render);
}

if (heroCanvas && heroStage && !prefersReducedMotion && supportsWebGL()) {
  const boot = () => loadThree().then(startHeroScene).catch(() => { /* the CSS glow stays as a fallback */ });
  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1200 });
  else window.setTimeout(boot, 300);
}
