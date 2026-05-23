/* ═══════════════════════════════════════════════════════════════════
   STUDIOS RIBA — script.js
   All vanilla JS, no imports/exports, single file.
   ═══════════════════════════════════════════════════════════════════ */

const PAGE = document.body.dataset.page; // 'index' | 'studios-riba' | 'srp'

/* ═══════════════════════════════════════════════════════════════════
   CURSOR MANAGER
   ═══════════════════════════════════════════════════════════════════ */
class CursorManager {
  constructor() {
    this.dot   = document.getElementById('cursor-dot');
    this.trail = document.getElementById('cursor-trail');
    this.mouseX = 0; this.mouseY = 0;
    this.trailX = 0; this.trailY = 0;
    this.prevX  = 0; this.prevY  = 0;
    this._raf = null;
    this._bound = this._onMove.bind(this);
    this._expand = this._onExpand.bind(this);
    this._shrink = this._onShrink.bind(this);
    this.init();
  }

  init() {
    document.addEventListener('mousemove', this._bound);
    document.querySelectorAll('a, button, [data-cursor="expand"], .sr-tech-item, .sr-game-card, .srp-film-main, .srp-film-secondary-top, .srp-film-secondary-bottom').forEach(el => {
      el.addEventListener('mouseenter', this._expand);
      el.addEventListener('mouseleave', this._shrink);
    });
    this._tick();
  }

  _onMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    if (this.dot) {
      this.dot.style.left = e.clientX + 'px';
      this.dot.style.top  = e.clientY + 'px';
    }
  }

  _tick() {
    this.trailX += (this.mouseX - this.trailX) * 0.09;
    this.trailY += (this.mouseY - this.trailY) * 0.09;
    if (this.trail) {
      this.trail.style.left = this.trailX + 'px';
      this.trail.style.top  = this.trailY + 'px';
      if (PAGE === 'srp') {
        // Stretch trail in direction of movement
        const dx = this.mouseX - this.prevX;
        const dy = this.mouseY - this.prevY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const stretch = Math.min(1 + speed * 0.05, 1.5);
        this.trail.style.transform = `translate(-50%,-50%) rotate(${angle}deg) scaleX(${stretch})`;
      } else {
        // Restore base transform for SR/index pages
        this.trail.style.transform = 'translate(-50%,-50%)';
      }
    }
    this.prevX = this.mouseX; this.prevY = this.mouseY;
    this._raf = requestAnimationFrame(this._tick.bind(this));
  }

  _onExpand() { if (this.dot) this.dot.classList.add('expanded'); }
  _onShrink() { if (this.dot) this.dot.classList.remove('expanded'); }
  destroy()   { document.removeEventListener('mousemove', this._bound); cancelAnimationFrame(this._raf); }
}

/* ═══════════════════════════════════════════════════════════════════
   PARTICLE SYSTEM
   ═══════════════════════════════════════════════════════════════════ */
class ParticleSystem {
  constructor() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mode = (PAGE === 'srp') ? 'dust' : 'static';
    this._raf = null;
    this._mouseOffsetX = 0;
    this.resize();
    this.createParticles();
    this.render();
    window.addEventListener('resize', this.resize.bind(this));
    if (PAGE === 'srp') {
      window.addEventListener('mousemove', (e) => {
        this._mouseOffsetX = (e.clientX / window.innerWidth - 0.5) * 10;
        this.canvas.style.transform = `translateX(${this._mouseOffsetX}px)`;
      });
    }
  }

  resize() {
    if (!this.canvas) return;
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const N = this.mode === 'dust' ? 55 : 32;
    for (let i = 0; i < N; i++) this.particles.push(this._spawn());
  }

  _spawn(fromBottom = false) {
    if (this.mode === 'static') {
      return {
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        flickerTimer: Math.random() * 200,
      };
    } else {
      return {
        x: Math.random() * this.W,
        y: fromBottom ? this.H + 5 : Math.random() * this.H,
        size: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.22 + 0.06,
        vy: -(Math.random() * 0.3 + 0.15),
        vx: (Math.random() - 0.5) * 0.12,
        baseOpacity: Math.random() * 0.22 + 0.06,
      };
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    for (let p of this.particles) {
      if (this.mode === 'static') {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = this.W; if (p.x > this.W) p.x = 0;
        if (p.y < 0) p.y = this.H; if (p.y > this.H) p.y = 0;
        p.flickerTimer--;
        if (p.flickerTimer <= 0) {
          p.opacity = Math.random() < 0.5 ? 0.85 : Math.random() * 0.3 + 0.05;
          p.flickerTimer = Math.random() * 300 + 100;
        }
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      } else {
        p.x += p.vx; p.y += p.vy;
        const ratio = 1 - (p.y / this.H);
        p.opacity = p.baseOpacity * ratio;
        if (p.y < -5 || p.opacity < 0.005) Object.assign(p, this._spawn(true));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,200,200,${Math.max(0, p.opacity)})`;
        ctx.fill();
      }
    }

    this._raf = requestAnimationFrame(this.render.bind(this));
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE TRANSITION
   ═══════════════════════════════════════════════════════════════════ */
class PageTransition {
  constructor() {
    this.flash = document.getElementById('page-flash');
    this._intercept();
  }

  _intercept() {
    document.querySelectorAll('[data-transition]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.navigateTo(link.getAttribute('href'));
      });
    });
  }

  navigateTo(url) {
    const f = this.flash;
    if (!f) { window.location.href = url; return; }
    f.style.display = 'block';
    f.style.opacity = '0';
    // Force reflow
    f.offsetHeight; // eslint-disable-line
    f.style.transition = 'opacity 0.25s ease';
    f.style.opacity = '1';
    setTimeout(() => { window.location.href = url; }, 270);
  }

  onLoad() {
    const f = this.flash;
    if (!f) return;
    f.style.display = 'block';
    f.style.opacity = '1';
    f.style.transition = 'none';
    // Force reflow
    f.offsetHeight; // eslint-disable-line
    f.style.transition = 'opacity 0.4s ease';
    f.style.opacity = '0';
    setTimeout(() => { f.style.display = 'none'; }, 450);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   LOADER
   ═══════════════════════════════════════════════════════════════════ */
class Loader {
  constructor() {
    this.el = document.getElementById('loader');
    this._onLoadCallback = null;
  }

  onDOMReady(callback) {
    this._onLoadCallback = callback;
    const visited = sessionStorage.getItem('sr_visited');
    if (!this.el) { this._done(); return; }

    if (visited) {
      // Skip loader on internal navigation
      this.el.style.display = 'none';
      this._done();
      return;
    }
    sessionStorage.setItem('sr_visited', '1');
    setTimeout(() => this._exit(), 1200);
  }

  _exit() {
    if (!this.el) { this._done(); return; }
    this.el.classList.add('exit');
    setTimeout(() => {
      this.el.style.display = 'none';
      this._done();
    }, 850);
  }

  _done() {
    if (typeof this._onLoadCallback === 'function') this._onLoadCallback();
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════════════ */
class ScrollReveal {
  constructor() {
    this.observer = new IntersectionObserver(
      this._onIntersect.bind(this),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    // Stagger reveal groups
    document.querySelectorAll('.reveal-group').forEach(group => {
      const children = group.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      children.forEach((el, i) => {
        if (!el.style.getPropertyValue('--delay')) {
          el.style.setProperty('--delay', `${i * 0.1}s`);
        }
      });
    });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      this.observer.observe(el);
    });
  }

  _onIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        this.observer.unobserve(entry.target);
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   NAV CONTROLLER
   ═══════════════════════════════════════════════════════════════════ */
class NavController {
  constructor() {
    this.nav = document.querySelector('nav');
    if (!this.nav) return;
    this._scrollHandler = this._onScroll.bind(this);
    window.addEventListener('scroll', this._scrollHandler, { passive: true });

    // Build mobile menu
    this._buildMobileMenu();
    const ham = this.nav.querySelector('.nav-hamburger');
    if (ham) ham.addEventListener('click', () => this._toggleMobile());
  }

  _onScroll() {
    if (!this.nav) return;
    if (window.scrollY > 60) this.nav.classList.add('scrolled');
    else                      this.nav.classList.remove('scrolled');
  }

  _buildMobileMenu() {
    const links = this.nav.querySelector('.nav-links');
    const switchLink = this.nav.querySelector('.nav-switch');
    if (!links) return;

    const menu = document.createElement('div');
    menu.className = 'nav-mobile-menu';

    // Clone links
    links.querySelectorAll('a').forEach(a => {
      const clone = a.cloneNode(true);
      clone.addEventListener('click', () => this._closeMobile());
      menu.appendChild(clone);
    });
    if (switchLink) {
      const clone = switchLink.cloneNode(true);
      clone.style.cssText = '';
      menu.appendChild(clone);
    }
    this.nav.appendChild(menu);
    this._mobileMenu = menu;
  }

  _toggleMobile() {
    const ham = this.nav.querySelector('.nav-hamburger');
    const isOpen = ham.classList.toggle('open');
    if (isOpen) this._mobileMenu.classList.add('open');
    else        this._mobileMenu.classList.remove('open');
  }

  _closeMobile() {
    const ham = this.nav.querySelector('.nav-hamburger');
    if (ham) ham.classList.remove('open');
    if (this._mobileMenu) this._mobileMenu.classList.remove('open');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SPLIT SCREEN CONTROLLER (index)
   ═══════════════════════════════════════════════════════════════════ */
class SplitScreenController {
  constructor(transition) {
    this.transition = transition;
    this.left  = document.querySelector('.split-left');
    this.right = document.querySelector('.split-right');
    if (!this.left || !this.right) return;
    this._init();
  }

  _init() {
    // Click navigation
    this.left.addEventListener('click',  () => this._navigate('sr'));
    this.right.addEventListener('click', () => this._navigate('srp'));

    // Keyboard
    [this.left, this.right].forEach(el => {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._navigate(el.dataset.side);
        }
      });
    });

    // Mobile: single tap to "select", second tap or enter btn to navigate
    let selectedSide = null;
    [this.left, this.right].forEach(el => {
      el.addEventListener('touchstart', () => {
        if (selectedSide === el.dataset.side) {
          this._navigate(el.dataset.side);
        } else {
          selectedSide = el.dataset.side;
          this.left.classList.toggle('active',   el === this.left);
          this.right.classList.toggle('active', el === this.right);
          setTimeout(() => { selectedSide = null; }, 3000);
        }
      }, { passive: true });
    });
  }

  _navigate(side) {
    const url = side === 'sr' ? 'studiosriba.html' : 'studiosribaproductions.html';
    this.transition.navigateTo(url);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SR HERO ANIMATOR
   ═══════════════════════════════════════════════════════════════════ */
class SRHeroAnimator {
  constructor() {
    this.logo     = document.querySelector('.sr-hero-logo');
    this.subtitle = document.querySelector('.sr-hero-subtitle');
    if (!this.logo) return;
    this._animate();
  }

  _animate() {
    // Fade + scale in the logo image
    requestAnimationFrame(() => {
      this.logo.classList.add('visible');
    });

    // After logo settles, pulse it and start typewriter
    setTimeout(() => {
      this.logo.classList.add('pulse-once');
      if (this.subtitle) {
        this._typewriter(this.subtitle, 'DESARROLLADORA INDEPENDIENTE DE VIDEOJUEGOS', 38);
      }
    }, 950);

    this._initParallax();
  }

  _typewriter(el, text, speed) {
    el.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }

  _initParallax() {
    const bg      = document.querySelector('.sr-hero-bg');
    const content = document.querySelector('.sr-hero-content');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (bg)      bg.style.transform      = `translateY(${y * 0.3}px)`;
      if (content) content.style.transform = `translateY(${y * -0.1}px)`;
    }, { passive: true });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SRP HERO ANIMATOR
   ═══════════════════════════════════════════════════════════════════ */
class SRPHeroAnimator {
  constructor() {
    this.logo      = document.querySelector('.srp-hero-logo');
    this.tagline   = document.querySelector('.srp-tagline');
    this.scrollLine = document.querySelector('.srp-scroll-line');
    this._sequence();
  }

  _sequence() {
    // Logo image: scale up from 0.35→1 with dramatic entrance
    setTimeout(() => {
      if (this.logo) this.logo.classList.add('visible');
    }, 300);

    // Tagline fades in after logo settles
    setTimeout(() => {
      if (this.tagline) this.tagline.classList.add('visible');
    }, 1400);

    // Scroll indicator
    setTimeout(() => {
      if (this.scrollLine) this.scrollLine.classList.add('visible');
    }, 1900);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PIXEL ART CANVAS (SR About)
   ═══════════════════════════════════════════════════════════════════ */
class PixelArtRenderer {
  constructor() {
    this.canvas = document.querySelector('.sr-pixel-art');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.frame = 0;
    this._raf = null;

    // Mouse tracking for interaction
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.rotX = 0;
    this.rotY = 0;

    // We attach events to the parent container for a better hit area
    const container = this.canvas.parentElement;
    if (container) {
      container.addEventListener('mousemove', this._onMouseMove.bind(this));
      container.addEventListener('mouseleave', this._onMouseLeave.bind(this));
    }

    this._draw();
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;

    // Parallax tilt calculation
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offsetX = e.clientX - rect.left - centerX;
    const offsetY = e.clientY - rect.top - centerY;

    this.targetRotY = (offsetX / centerX) * 15; // Max 15 degrees tilt Y
    this.targetRotX = -(offsetY / centerY) * 15; // Max 15 degrees tilt X
  }

  _onMouseLeave() {
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.targetRotX = 0;
    this.targetRotY = 0;
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const px = 16; // Grid cell size
    ctx.clearRect(0, 0, W, H);

    // Smooth CSS 3D tilt interpolation
    this.rotX += (this.targetRotX - this.rotX) * 0.1;
    this.rotY += (this.targetRotY - this.rotY) * 0.1;
    this.canvas.style.transform = `perspective(800px) rotateX(${this.rotX}deg) rotateY(${this.rotY}deg) scale(1.05)`;

    const cols = Math.ceil(W / px);
    const rows = Math.ceil(H / px);

    // Draw the fluid reactive matrix grid
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cx = c * px + px / 2;
        const cy = r * px + px / 2;

        // Distance from mouse to the center of the current grid cell
        const dx = this.mouseX - cx;
        const dy = this.mouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Interactive hover effect (radius of ~100px)
        const hoverEffect = Math.max(0, 1 - dist / 100);
        
        // Base idle organic wave pattern moving across the grid
        const wave = (Math.sin(this.frame * 0.03 + c * 0.15 + r * 0.25) + 1) / 2;
        
        // Blend base alpha with intense exponential glow on hover
        const baseAlpha = 0.02 + wave * 0.04;
        const hoverAlpha = hoverEffect * hoverEffect * hoverEffect; // Steeper curve for punchy center
        const alpha = baseAlpha + hoverAlpha * 0.85;

        // Draw inner pixel
        ctx.fillStyle = `rgba(220, 10, 10, ${Math.min(1, alpha)})`;
        ctx.fillRect(c * px, r * px, px - 1, px - 1);

        // Outline grid
        ctx.strokeStyle = `rgba(220, 10, 10, ${Math.min(1, 0.05 + wave * 0.05 + hoverAlpha * 0.6)})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(c * px + 0.5, r * px + 0.5, px - 2, px - 2);

        // Add heavy shadow glow to nearby pixels
        if (hoverAlpha > 0.1) {
          ctx.shadowBlur = hoverAlpha * 30;
          ctx.shadowColor = 'rgba(255, 20, 20, 1)';
          ctx.fillRect(c * px, r * px, px - 1, px - 1);
          ctx.shadowBlur = 0; // Reset for next element
        }
      }
    }

    this.frame++;
    this._raf = requestAnimationFrame(this._draw.bind(this));
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PROCESS STEP ACTIVATOR (SRP)
   ═══════════════════════════════════════════════════════════════════ */
class ProcessStepActivator {
  constructor() {
    this.steps = document.querySelectorAll('.srp-process-step');
    if (!this.steps.length) return;
    this.observer = new IntersectionObserver(
      this._onIntersect.bind(this),
      { threshold: 0.4 }
    );
    this.steps.forEach(s => this.observer.observe(s));
  }

  _onIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const step = entry.target;
        const dot  = step.querySelector('.srp-step-dot');
        // Use data-step attribute for deterministic stagger order
        const stepNum = parseInt(step.dataset.step || '1', 10);
        setTimeout(() => {
          if (dot) dot.classList.add('active');
          step.classList.add('active');
        }, (stepNum - 1) * 160);
        this.observer.unobserve(step);
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   DATABASE RENDERER
   ═══════════════════════════════════════════════════════════════════ */
class DatabaseRenderer {
  constructor() {
    this.gamesGrid = document.getElementById('sr-games-grid');
    this.moviesContainer = document.getElementById('srp-movies-container');
    
    if (this.gamesGrid && PAGE === 'studios-riba') {
      this.renderGames();
    }
    
    if (this.moviesContainer && PAGE === 'srp') {
      this.renderMovies();
    }
  }

  async renderGames() {
    try {
      const res = await fetch('database/games.json');
      const games = await res.json();
      
      let html = '';
      games.sort((a, b) => a.order - b.order).forEach((game, index) => {
        const delay = index * 0.07;
        const numStr = (index + 1).toString().padStart(2, '0');
        const badgeHtml = game.badge ? `<span class="sr-game-badge">${game.badge}</span>` : '';
        
        html += `
          <article class="sr-game-card reveal" data-cursor="expand" style="--delay:${delay}s"
                   aria-label="${game.title} — Studios Riba">
            <div class="sr-game-card-img"
                 style="background-image: url('${game.coverImage}');"
                 aria-hidden="true"></div>
            <div class="sr-game-card-overlay" aria-hidden="true"></div>
            <div class="sr-game-number" aria-hidden="true">${numStr}</div>
            <div class="sr-game-card-info">
              ${badgeHtml}
              <h3 class="sr-game-title">${game.title.toUpperCase()}</h3>
              <p class="sr-game-desc">${game.synopsis}</p>
              <a href="${game.itchUrl}"
                 target="_blank" rel="noopener noreferrer"
                 class="sr-game-play-link" id="sr-game-play-${game.id}">
                <span class="sr-game-play-icon" aria-hidden="true">↗</span>
                JUGAR AHORA
              </a>
            </div>
          </article>
        `;
      });
      
      // Append static 'VER MÁS' card
      const moreDelay = games.length * 0.07;
      html += `
        <article class="sr-game-card sr-game-card-more reveal" data-cursor="expand" style="--delay:${moreDelay}s"
                 aria-label="Ver todos los juegos en itch.io">
          <div class="sr-game-card-more-bg" aria-hidden="true"></div>
          <a href="https://studiosriba.itch.io"
             target="_blank" rel="noopener noreferrer"
             class="sr-game-more-inner"
             id="sr-game-more-link">
            <span class="sr-game-more-label">VER MÁS</span>
            <span class="sr-game-more-arrow" aria-hidden="true">↗</span>
            <span class="sr-game-more-sub">Todos nuestros juegos en itch.io</span>
          </a>
        </article>
      `;
      
      this.gamesGrid.innerHTML = html;
      
      // Re-trigger scroll reveal and cursor events for newly added elements
      if (window.cursorManager) this._attachCursorEvents(this.gamesGrid);
      // Let the ScrollReveal class handle the newly added .reveal elements on next scroll
    } catch (err) {
      console.error('Failed to load games database:', err);
    }
  }

  async renderMovies() {
    try {
      const res = await fetch('database/movies.json');
      const movies = await res.json();
      
      let html = '';
      movies.forEach((movie, index) => {
        const delay = index * 0.1;
        const nexoBtn = movie.links?.nexoTv ? `
          <a href="${movie.links.nexoTv}" target="_blank" rel="noopener noreferrer"
             class="srp-film-link srp-film-link-primary" id="srp-film-link-nexo-${index}">
            <span class="srp-film-link-icon" aria-hidden="true">▶</span>VER EN NEXO.TV
          </a>` : '';
          
        const tmdbBtn = movie.links?.tmdb ? `
          <a href="${movie.links.tmdb}" target="_blank" rel="noopener noreferrer"
             class="srp-film-link srp-film-link-secondary" id="srp-film-link-tmdb-${index}">
            <span class="srp-film-link-icon" aria-hidden="true">↗</span>VER EN TMDB
          </a>` : '';
          
        html += `
          <div class="srp-film-showcase reveal-scale" style="--delay:${delay}s; margin-bottom: 80px;">
            <div class="srp-film-poster">
              <img src="${movie.posterImage}" alt="${movie.title} — Studios Riba Productions" class="srp-film-poster-img">
              <div class="srp-film-poster-glow" aria-hidden="true"></div>
            </div>
            <div class="srp-film-detail">
              <span class="srp-film-eyebrow">${movie.type} · ${movie.year}</span>
              <h3 class="srp-film-detail-title">${movie.title}</h3>
              <div class="srp-film-divider" aria-hidden="true"></div>
              <p class="srp-film-synopsis">${movie.synopsis}</p>
              <div class="srp-film-links">
                ${nexoBtn}
                ${tmdbBtn}
              </div>
            </div>
          </div>
        `;
      });
      
      this.moviesContainer.innerHTML = html;
      
    } catch (err) {
      console.error('Failed to load movies database:', err);
    }
  }
  
  _attachCursorEvents(container) {
    const expandels = container.querySelectorAll('a, button, [data-cursor="expand"], .sr-game-card');
    expandels.forEach(el => {
      el.addEventListener('mouseenter', window.cursorManager._expand);
      el.addEventListener('mouseleave', window.cursorManager._shrink);
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const loader     = new Loader();
  const cursor     = new CursorManager();
  const particles  = new ParticleSystem();
  const transition = new PageTransition();
  const nav        = new NavController();
  
  // Make cursor available globally for dynamically added elements
  window.cursorManager = cursor;

  loader.onDOMReady(() => {
    // Render dynamic database content before initializing ScrollReveal
    new DatabaseRenderer();
    
    // Give DOM a tick to insert HTML before observing
    setTimeout(() => {
      const scrollReveal = new ScrollReveal();
  
      if (PAGE === 'index') {
        new SplitScreenController(transition);
      }
  
      if (PAGE === 'studios-riba') {
        new SRHeroAnimator();
        new PixelArtRenderer();
      }
  
      if (PAGE === 'srp') {
        new SRPHeroAnimator();
        new ProcessStepActivator();
      }
  
      transition.onLoad();
    }, 50);
  });
});

