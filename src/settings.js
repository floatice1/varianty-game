const LANGS   = ['uk', 'en', 'pl'];
const THEMES  = ['dark', 'light'];

function detectDefaults() {
  const deviceLang  = (navigator.language || '').slice(0, 2).toLowerCase();
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return {
    lang:  LANGS.includes(deviceLang) ? deviceLang : 'en',
    theme: prefersDark ? 'dark' : 'light',
  };
}

export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('variants-settings') || 'null');
    if (s && LANGS.includes(s.lang) && THEMES.includes(s.theme)) return s;
  } catch {}
  return detectDefaults();
}

export function saveSettings(s) {
  localStorage.setItem('variants-settings', JSON.stringify(s));
}
