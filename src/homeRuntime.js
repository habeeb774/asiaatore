/* homeRuntime.js
   بديل أصلي وظيفي عن سكربت خارجي (تمت كتابته من الصفر).
   استدعِ bootHome() بعد تحميل DOM.
*/

function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

export function initLazyImages() {
  const imgs = qsa('img.lazy-img:not(.is-loaded)');
  if (!imgs.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const src = el.dataset.src || el.getAttribute('data-src');
        if (src) {
          el.src = src;
          el.addEventListener('load', () => el.classList.add('is-loaded'), { once: true });
        }
        io.unobserve(el);
      }
    });
  }, { rootMargin: '200px 0px' });
  imgs.forEach(i => io.observe(i));
}

export function initRevealOnScroll() {
  const nodes = qsa('.reveal-up:not(.in-view)');
  if (!nodes.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  nodes.forEach(n => io.observe(n));
}

export function initCounters() {
  qsa('[data-counter]').forEach(el => {
    if (el.dataset.counterInit) return;
    el.dataset.counterInit = '1';
    const target = parseFloat(el.dataset.counter || el.textContent.replace(/[^\d.]/g, '')) || 0;
    const duration = parseInt(el.dataset.counterDuration || '1200', 10);
    const start = performance.now();
    const from = 0;
    const fmt = new Intl.NumberFormat(el.dataset.locale || 'ar-SA');
    function frame(t) {
      const prog = Math.min(1, (t - start) / duration);
      const val = from + (target - from) * prog;
      el.textContent = fmt.format(Math.round(val));
      if (prog < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

export function initCarousel(rootSel = '.carousel') {
  qsa(rootSel).forEach(carousel => {
    if (carousel.dataset.carouselInit) return;
    carousel.dataset.carouselInit = '1';
    const track = qs('.carousel__track', carousel);
    const items = qsa('.carousel__item', track);
    if (!track || items.length === 0) return;

    let index = 0;
    function update() {
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      const w = items[0].getBoundingClientRect().width + gap;
      track.style.transform = `translateX(${-index * w}px)`;
    }

    const nav = document.createElement('div');
    nav.className = 'carousel__nav';
    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'runtime-focusable';
    btnPrev.setAttribute('aria-label', 'Prev');
    btnPrev.innerHTML = '‹';
    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'runtime-focusable';
    btnNext.setAttribute('aria-label', 'Next');
    btnNext.innerHTML = '›';
    nav.append(btnPrev, btnNext);
    carousel.appendChild(nav);

    function clamp() {
      index = Math.max(0, Math.min(index, items.length - 1));
    }
    btnPrev.addEventListener('click', () => { index--; clamp(); update(); });
    btnNext.addEventListener('click', () => { index++; clamp(); update(); });

    window.addEventListener('resize', () => update());
    update();
  });
}

export function initProductCardActions() {
  qsa('[data-add-to-cart]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', e => {
      e.preventDefault();
      const id = btn.dataset.id;
      btn.disabled = true;
      btn.classList.add('loading');
      fakeAddToCart(id).then(() => {
        btn.textContent = 'تمت الإضافة';
        setTimeout(() => {
          btn.disabled = false;
          btn.classList.remove('loading');
          btn.textContent = 'أضف للسلة';
        }, 1400);
      });
    });
  });
}

function fakeAddToCart(id) {
  return new Promise(res => setTimeout(res, 600 + Math.random() * 600));
}

export function initAnnouncementBar() {
  const bar = qs('.announcement-bar');
  if (!bar) return;
  const close = bar.querySelector('.close-btn');
  if (close) {
    close.addEventListener('click', () => {
      bar.classList.add('hidden');
      try { localStorage.setItem('ann-bar-hidden', '1'); } catch {}
    });
  }
  try {
    if (localStorage.getItem('ann-bar-hidden') === '1') bar.classList.add('hidden');
  } catch {}
}

export function bootHome() {
  initAnnouncementBar();
  initLazyImages();
  initRevealOnScroll();
  initCounters();
  initCarousel();
  initProductCardActions();
  // إعادة تهيئة عند التنقل SPA (إن وجد):
  document.addEventListener('reinit:home', () => {
    initLazyImages();
    initRevealOnScroll();
    initCounters();
    initCarousel();
    initProductCardActions();
  });
}

// تشغيل تلقائي إذا كانت الصفحة الرئيسية مسجّلة عبر data-home-root
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.hasAttribute('data-home-root')) bootHome();
});
