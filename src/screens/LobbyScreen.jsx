import { useState } from 'react';
import { startGame } from '../gameActions';
import { arrayFromFirebase } from '../utils';
import { useT } from '../i18n';
import PlanningPanel from '../components/PlanningPanel';

export default function LobbyScreen({ game, session, onLeave }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  // Show only non-GM players
  const allPlayers  = Object.entries(game.players || {});
  const players     = allPlayers.filter(([, p]) => !p.isGM);
  const isGM        = session.isGM;
  const canStart    = players.length >= 2;
  const presets     = arrayFromFirebase(game.presetRounds);
  const finalPrep   = game.finalPrep || {};

  async function copyCode() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(session.gameCode);
      } else {
        const el = document.createElement('textarea');
        el.value = session.gameCode;
        el.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(el);
        el.focus();
        el.setSelectionRange(0, 99999);
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="page overflow-hidden" style={{ height: '100dvh' }}>
      <div className="flex flex-col gap-5 animate-fade-in h-full">
        {/* Code — clickable to copy */}
        <div className="flex flex-col items-center py-5 shrink-0">
          <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase mb-4">{t('code_title')}</p>
          <button onClick={copyCode} className="flex gap-1.5 mb-3 active:scale-95 transition-transform">
            {session.gameCode.split('').map((ch, i) => (
              <div key={i} className={`w-12 h-16 flex items-center justify-center rounded-lg bg-g-surface border-2 transition-colors ${copied ? 'border-g-success shadow-glow-success' : 'border-g-accent shadow-glow'}`}>
                <span className={`font-display text-4xl leading-none ${copied ? 'text-g-success' : 'text-g-accent'}`}>{ch}</span>
              </div>
            ))}
          </button>
          <p className={`text-xs font-graffiti tracking-wider uppercase h-4 transition-colors ${copied ? 'text-g-success' : 'text-g-muted'}`}>
            {copied ? t('code_copied') : t('share_code')}
          </p>
        </div>

        {/* Players only (no GM) — scrollable if list is long */}
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('players_label')}</p>
            <p className="text-g-dim text-xs">{players.length} / 8</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-2">
            {players.map(([id, p]) => (
              <div key={id}
                className={`card flex items-center justify-between px-4 py-3 animate-slide-up ${id === session.playerId ? 'border-g-accent/30' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${id === session.playerId ? 'bg-g-accent' : 'bg-g-dim'}`} />
                  <span className="text-g-text font-graffiti text-base">{p.name}</span>
                  {id === session.playerId && <span className="text-g-dim text-xs font-graffiti tracking-wider uppercase">{t('you')}</span>}
                </div>
              </div>
            ))}
            {players.length === 0 && (
              <div className="card px-4 py-3 border-dashed flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-g-dim animate-ping-slow" />
                <span className="text-g-dim text-sm">{t('waiting_players')}</span>
              </div>
            )}
          </div>
          {!canStart && players.length > 0 && (
            <p className="text-center text-g-dim text-xs shrink-0">{t('min_players')}</p>
          )}
        </div>

        {/* Bottom — fixed: planning panel (GM) + action buttons */}
        <div className="flex flex-col gap-3 shrink-0">
          {isGM && <PlanningPanel existingPresets={presets} existingFinalPrep={finalPrep} gameCode={session.gameCode} />}
          {isGM ? (
            <button className="btn-primary py-4 text-base" onClick={() => startGame(session.gameCode)} disabled={!canStart}>
              {t('start_game')}
            </button>
          ) : (
            <div className="card px-4 py-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-g-accent animate-ping-slow" />
                <span className="text-g-muted text-sm">{t('waiting_gm')}</span>
              </div>
            </div>
          )}
          <button className="btn-ghost py-3 text-sm" onClick={onLeave}>{t('leave_game')}</button>
        </div>
      </div>
    </div>
  );
}
