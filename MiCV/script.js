const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú');
    });
  });
}

// Initialize Lenis
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Sync Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time)=>{
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Handle anchor links for smooth scrolling with Lenis
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    lenis.scrollTo(this.getAttribute('href'), { offset: -92 }); // offset for header
  });
});

// GSAP Reveal Animations
gsap.utils.toArray('.reveal').forEach(element => {
  let delay = 0;
  if (element.classList.contains('reveal-delay-1')) delay = 0.1;
  else if (element.classList.contains('reveal-delay-2')) delay = 0.2;
  else if (element.classList.contains('reveal-delay-3')) delay = 0.3;
  else if (element.classList.contains('reveal-delay-4')) delay = 0.4;
  
  gsap.fromTo(element, 
    { autoAlpha: 0, y: 40 },
    {
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      duration: 1,
      autoAlpha: 1,
      y: 0,
      delay: delay,
      ease: 'power3.out'
    }
  );
});

// GSAP Parallax for Project Images
gsap.utils.toArray('.project-visual').forEach(visual => {
  const img = visual.querySelector('.project-screenshot');
  if (img) {
    // Create a wrapper for parallax to avoid conflict with CSS hover scale
    const wrapper = document.createElement('div');
    wrapper.className = 'parallax-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.inset = '-15%'; // make it larger to have room for parallax
    wrapper.style.width = '130%';
    wrapper.style.height = '130%';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '0';
    
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    
    // adjust img to fit wrapper but act as original
    img.style.position = 'absolute';
    img.style.inset = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    
    gsap.fromTo(wrapper, 
      { yPercent: -10 },
      {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: visual,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      }
    );
  }
});

// Parallax for Hero Photo
const heroWrap = document.querySelector('.hero-photo-wrap');
if (heroWrap) {
  gsap.to(heroWrap, {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}


const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-link:not(.nav-link-cta)')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
sections.forEach((section) => sectionObserver.observe(section));

document.querySelectorAll('.project-visual').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.transform = `perspective(850px) rotateX(${y * -2}deg) rotateY(${x * 2}deg) translateY(-6px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

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

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

const themeToggle = document.querySelector('[data-theme-toggle]');
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
  };

  applyTheme(savedTheme === 'light' ? 'light' : 'dark');
  themeToggle.addEventListener('click', () => {
    const nextTheme = pageBody.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    try { window.localStorage.setItem('site-theme', nextTheme); } catch { /* keep the switch working without storage */ }
  });
}
