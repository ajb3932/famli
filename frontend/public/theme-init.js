(function () {
  try {
    var mode = localStorage.getItem('theme') || 'system';
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#121b26');
    }
  } catch (e) {
    /* storage unavailable: fall back to light */
  }
})();
