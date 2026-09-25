// Chapter menu, reading progress bar, back-to-top button.
const chapter = document.getElementById('chapter');
const bar = document.getElementById('progress-bar');
const toTop = document.getElementById('to-top');

chapter.addEventListener('change', () => {
  const target = document.getElementById(chapter.value);
  if (target) {
    target.scrollIntoView();
    history.replaceState(null, '', '#' + chapter.value);
  }
  chapter.value = '';
});

function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const ratio = max > 0 ? scrollY / max : 0;
  bar.style.width = (ratio * 100).toFixed(1) + '%';
  toTop.classList.toggle('show', scrollY > innerHeight);
}

addEventListener('scroll', onScroll, { passive: true });
onScroll();
