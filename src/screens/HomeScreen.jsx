import { useState, useEffect } from 'react';
import { createGame, joinGame } from '../gameActions';
import { useT } from '../i18n';
import SettingsModal from '../components/SettingsModal';

export default function HomeScreen({ onJoin, settings, onSettingsChange, kickNotice, onKickNoticeDismiss }) {
  const t = useT();
  const [mode,    setMode]    = useState(null);
  const [name,    setName]    = useState('');
  const [code,    setCode]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!kickNotice) return;
    const id = setTimeout(() => onKickNoticeDismiss?.(), 5000);
    return () => clearTimeout(id);
  }, [kickNotice, onKickNoticeDismiss]);

  function reset() { setMode(null); setName(''); setCode(''); setError(''); }

  async function handleCreate() {
    // GM creates game without a name
    setLoading(true); setError('');
    try {
      const { gameCode, playerId } = await createGame('');
      onJoin({ gameCode, playerId, playerName: '', isGM: true });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!name.trim()) return setError(t('home_err_name'));
    if (code.trim().length !== 6) return setError(t('home_err_code'));
    setLoading(true); setError('');
    try {
      const { playerId } = await joinGame(code.toUpperCase(), name);
      onJoin({ gameCode: code.toUpperCase(), playerId, playerName: name.trim(), isGM: false });
    } catch (e) {
      const msg = t(e.message, { name: e.name || name });
      setError(msg !== e.message ? msg : e.message);
    }
    finally { setLoading(false); }
  }

  // ── Join form — keyboard-friendly: positioned at top ────
  if (mode === 'join') {
    return (
      <div className="page pt-4">
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Compact header */}
          <div className="flex items-center justify-between pb-2">
            <h1 className="font-display text-2xl text-g-text tracking-tight">Варіанти</h1>
            <button onClick={reset} className="text-g-muted hover:text-g-text text-sm transition-colors px-2">
              {t('home_back')}
            </button>
          </div>

          <div>
            <label className="text-g-muted text-xs font-graffiti tracking-wider uppercase block mb-1.5">
              {t('home_your_name')}
            </label>
            <input className="input" placeholder={t('home_name_ph')} value={name}
              onChange={e => setName(e.target.value)} maxLength={20} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleJoin()} />
          </div>

          <div>
            <label className="text-g-muted text-xs font-graffiti tracking-wider uppercase block mb-1.5">
              {t('home_code_label')}
            </label>
            <input className="input text-center text-2xl font-display font-bold tracking-[0.3em] uppercase"
              placeholder="XXXXXX" value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6} inputMode="text" autoCapitalize="characters" />
          </div>

          {error && (
            <div className="bg-g-danger/10 border border-g-danger/30 rounded-lg px-4 py-3 text-g-danger text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button className="btn-primary py-4 text-base" onClick={handleJoin} disabled={loading}>
            {loading ? t('home_wait') : t('home_join_btn')}
          </button>
        </div>
      </div>
    );
  }

  // ── Main screen ──────────────────────────────────────────
  return (
    <div className="page justify-between">
      {/* Kick notice */}
      {kickNotice && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-40 animate-slide-up">
          <div className="bg-g-danger/15 border-2 border-g-danger/50 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-g-danger text-sm font-semibold">{t('host_left')}</p>
            <button className="text-g-danger text-lg shrink-0" onClick={onKickNoticeDismiss}>✕</button>
          </div>
        </div>
      )}

      {/* Settings button */}
      <div className="flex justify-end pt-0 pb-2">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-g-border text-g-muted hover:border-g-accent/40 hover:text-g-text transition-colors"
          onClick={() => setShowSettings(true)}
          aria-label={t('settings_title')}
        >⚙</button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center pt-4 pb-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-g-accent/20 border-2 border-g-accent/30 flex items-center justify-center mb-5 shadow-glow">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="font-display text-5xl text-g-text tracking-tight">Варіанти</h1>
        <p className="text-g-muted mt-2 text-sm text-center text-balance">{t('home_subtitle')}</p>
      </div>

      {/* Main actions */}
      <div className="flex flex-col gap-3 w-full animate-slide-up">
        <button className="btn-primary py-4 text-base" onClick={handleCreate} disabled={loading}>
          {loading ? t('home_wait') : t('home_create')}
        </button>
        <button className="btn-secondary py-4 text-base" onClick={() => setMode('join')}>
          {t('home_join')}
        </button>
        {error && (
          <div className="bg-g-danger/10 border border-g-danger/30 rounded-lg px-4 py-3 text-g-danger text-sm animate-fade-in">
            {error}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="mt-6 grid grid-cols-3 gap-2 text-center animate-fade-in animation-delay-200">
        {[['✏️','home_rule1'],['🧠','home_rule2'],['🪤','home_rule3']].map(([icon, key]) => (
          <div key={key} className="card p-3 flex flex-col items-center gap-1.5">
            <span className="text-xl">{icon}</span>
            <span className="text-g-muted text-[10px] leading-tight">{t(key)}</span>
          </div>
        ))}
      </div>

      {showSettings && (
        <SettingsModal settings={settings} onChange={onSettingsChange} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
