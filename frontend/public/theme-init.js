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

// Some phones (high resolution with a small "display size" setting) report a
// tablet/desktop-sized viewport, so the app gets the desktop layout at a tiny
// scale. On a phone-shaped screen held upright, lay the page out at a normal
// phone width instead and let the browser scale it up to fill the screen.
(function () {
  var PHONE_WIDTH = 420;
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta || !window.matchMedia) return;
  var portrait = window.matchMedia('(orientation: portrait)');
  var touch = window.matchMedia('(pointer: coarse)');

  function fit() {
    var short = Math.min(screen.width, screen.height);
    var long = Math.max(screen.width, screen.height);
    var phoneShaped = long / short >= 1.7;
    var tooWide = short > PHONE_WIDTH + 40;
    meta.setAttribute(
      'content',
      touch.matches && phoneShaped && tooWide && portrait.matches
        ? 'width=' + PHONE_WIDTH + ', viewport-fit=cover'
        : 'width=device-width, initial-scale=1.0, viewport-fit=cover'
    );
  }

  try {
    fit();
    if (portrait.addEventListener) portrait.addEventListener('change', fit);
  } catch (e) {
    /* keep the default viewport */
  }
})();
