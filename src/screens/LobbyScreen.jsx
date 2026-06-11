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
      await navigator.clipboard.writeText(session.gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="page">
      {/* Code — clickable to copy */}
      <div className="flex flex-col items-center py-8 animate-fade-in">
        <p className="text-g-dim text-xs font-display tracking-widest uppercase mb-3">{t('code_title')}</p>
        <button onClick={copyCode} className="flex gap-2 mb-2 active:scale-95 transition-transform">
          {session.gameCode.split('').map((ch, i) => (
            <div key={i} className={`w-10 h-12 flex items-center justify-center rounded-xl bg-g-card border-2 transition-colors ${copied ? 'border-g-success' : 'border-g-accent/30 shadow-glow-sm'}`}>
              <span className={`font-display font-bold text-xl ${copied ? 'text-g-success' : 'text-g-accent'}`}>{ch}</span>
            </div>
          ))}
        </button>
        <p className="text-g-dim text-xs h-4">
          {copied ? t('code_copied') : t('share_code')}
        </p>
      </div>

      {/* Players only (no GM) */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('players_label')}</p>
          <p className="text-g-dim text-xs">{players.length} / 8</p>
        </div>
        <div className="flex flex-col gap-2">
          {players.map(([id, p]) => (
            <div key={id}
              className={`card flex items-center justify-between px-4 py-3 animate-slide-up ${id === session.playerId ? 'border-g-accent/30' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${id === session.playerId ? 'bg-g-accent' : 'bg-g-dim'}`} />
                <span className="text-g-text font-medium">{p.name}</span>
                {id === session.playerId && <span className="text-g-dim text-xs">{t('you')}</span>}
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
          <p className="text-center text-g-dim text-xs mt-4">{t('min_players')}</p>
        )}
      </div>

      {isGM && (
        <div className="mt-6">
          <PlanningPanel existingPresets={presets} existingFinalPrep={finalPrep} gameCode={session.gameCode} />
        </div>
      )}

      <div className="flex flex-col gap-3 mt-4">
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
  );
}
