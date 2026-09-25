// Long-scroll reader on wide screens; one page at a time with a page-turn animation on phones.
const pages = [...document.querySelectorAll('.comic figure')];
const comic = document.querySelector('.comic');
const chapter = document.getElementById('chapter');
const bar = document.getElementById('progress-bar');
const toTop = document.getElementById('to-top');
const counter = document.getElementById('pager-count');
const prevBtn = document.getElementById('pager-prev');
const nextBtn = document.getElementById('pager-next');
const pagerQuery = matchMedia('(max-width: 699px), (max-height: 500px)');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const FLIP_MS = 700;

let current = Math.max(0, pages.findIndex(p => '#' + p.id === location.hash));
let busy = false;

const isPager = () => document.documentElement.classList.contains('pager');
const zoomed = () => window.visualViewport && visualViewport.scale > 1.05;

// Size each page to fit the stage, so the flip hinges on the page's own left edge.
function layout() {
  const W = comic.clientWidth, H = comic.clientHeight;
  for (const fig of pages) {
    const img = fig.querySelector('img');
    const w = +img.getAttribute('width'), h = +img.getAttribute('height');
    const s = Math.min(W / w, H / h);
    Object.assign(fig.style, {
      width: w * s + 'px', height: h * s + 'px',
      left: (W - w * s) / 2 + 'px', top: (H - h * s) / 2 + 'px',
    });
  }
}

function show() {
  pages.forEach((p, i) => p.classList.toggle('current', i === current));
  // Warm up the pages the reader is likely to turn to next.
  for (let i = current - 1; i <= current + 2; i++) {
    const img = pages[i] && pages[i].querySelector('img');
    if (img) { img.loading = 'eager'; new Image().src = img.src; }
  }
  counter.textContent = `${current + 1} / ${pages.length}`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === pages.length - 1;
  bar.style.width = (current / (pages.length - 1) * 100).toFixed(1) + '%';
  history.replaceState(null, '', '#' + pages[current].id);
}

function go(target, animate = true) {
  target = Math.min(pages.length - 1, Math.max(0, target));
  if (target === current || busy) return;
  document.documentElement.classList.add('turned');
  const from = pages[current], to = pages[target];
  if (!animate || reduceMotion.matches) {
    current = target;
    show();
    return;
  }
  // Forward: the current page lifts away to reveal the next one.
  // Back: the previous page swings back down on top.
  busy = true;
  const forward = target > current;
  const mover = forward ? from : to;
  if (forward) to.classList.add('under');
  mover.classList.add(forward ? 'flip-out' : 'flip-in');
  setTimeout(() => {
    mover.classList.remove('flip-out', 'flip-in');
    to.classList.remove('under');
    current = target;
    busy = false;
    show();
  }, FLIP_MS);
}

function applyMode(initial) {
  const on = pagerQuery.matches;
  document.documentElement.classList.toggle('pager', on);
  if (on) {
    layout();
    show();
  } else {
    pages.forEach(p => {
      p.removeAttribute('style');
      p.classList.remove('current', 'under', 'flip-out', 'flip-in');
    });
    if (!initial) pages[current].scrollIntoView();
    onScroll();
  }
}

function onScroll() {
  if (isPager()) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (max > 0 ? scrollY / max * 100 : 0).toFixed(1) + '%';
  toTop.classList.toggle('show', scrollY > innerHeight);
  // Remember the page at the top, so switching to the pager keeps the reader's place.
  const i = pages.findIndex(p => p.getBoundingClientRect().bottom > 60);
  if (i >= 0) current = i;
}

chapter.addEventListener('change', () => {
  const i = pages.findIndex(p => p.id === chapter.value);
  if (i >= 0) {
    if (isPager()) go(i, false);
    else {
      pages[i].scrollIntoView();
      history.replaceState(null, '', '#' + chapter.value);
    }
  }
  chapter.value = '';
});

// Swipe left/right to turn; ignored while pinch-zoomed so the reader can pan around.
let sx = 0, sy = 0, multi = false;
comic.addEventListener('touchstart', e => {
  multi = e.touches.length > 1;
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
}, { passive: true });
comic.addEventListener('touchend', e => {
  if (!isPager() || multi || zoomed()) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(current + (dx < 0 ? 1 : -1));
});

// Tap the right or left side of the page to turn.
comic.addEventListener('click', e => {
  if (!isPager() || zoomed()) return;
  const x = e.clientX / innerWidth;
  if (x > 0.65) go(current + 1);
  else if (x < 0.35) go(current - 1);
});

prevBtn.addEventListener('click', () => go(current - 1));
nextBtn.addEventListener('click', () => go(current + 1));

addEventListener('keydown', e => {
  if (!isPager() || e.target === chapter) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(current + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(current - 1); }
});

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { if (isPager()) layout(); });
pagerQuery.addEventListener('change', () => applyMode(false));
applyMode(true);
