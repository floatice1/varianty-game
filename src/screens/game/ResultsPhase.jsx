import { useState } from 'react';
import { nextRound, endGame, startFinalRound } from '../../gameActions';
import { useT } from '../../i18n';
import Scoreboard from '../../components/Scoreboard';

export default function ResultsPhase({ game, session }) {
  const t = useT();
  const round   = game.round   || {};
  const players = game.players || {};
  const changes = round.scoreChanges || {};
  const [confirmEnd, setConfirmEnd] = useState(false);

  const header = (
    <div className="pt-2">
      <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('results_label')}</p>
      <p className="font-display text-3xl text-g-text">{game.roundNumber}</p>
    </div>
  );

  // ── Players ──────────────────────────────────────────────
  if (!session.isGM) {
    return (
      <div className="page overflow-hidden" style={{ height: '100dvh' }}>
        <div className="flex flex-col gap-5 animate-fade-in h-full">
          <div className="shrink-0 border-b-2 border-g-border pb-4">{header}</div>
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <p className="font-display text-sm tracking-widest uppercase text-g-muted shrink-0">{t('score_label')}</p>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
              <Scoreboard players={players} changes={changes} />
            </div>
          </div>
          <p className="text-g-dim text-xs text-center border-t-2 border-g-border pt-4 shrink-0">{t('waiting_host')}</p>
        </div>
      </div>
    );
  }

  // ── GM ───────────────────────────────────────────────────
  return (
    <div className="page overflow-hidden" style={{ height: '100dvh' }}>
      <div className="flex flex-col gap-5 animate-fade-in h-full">
        <div className="shrink-0 border-b-2 border-g-border pb-4">{header}</div>

        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <p className="font-display text-sm tracking-widest uppercase text-g-muted shrink-0">{t('score_label')}</p>
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            <Scoreboard players={players} changes={changes} />
          </div>
        </div>

        <div className="shrink-0 border-t-2 border-g-border pt-4">
          {confirmEnd ? (
            <div className="flex flex-col gap-3">
              <p className="text-g-text font-semibold text-center">{t('confirm_end')}</p>
              <button className="btn-danger h-14" onClick={() => endGame(session.gameCode)}>{t('end_game')}</button>
              <button className="btn-ghost h-12" onClick={() => setConfirmEnd(false)}>{t('confirm_back')}</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button className="btn-primary h-14" onClick={() => nextRound(session.gameCode)}>{t('next_round')}</button>
              <button className="btn-secondary h-14" onClick={() => startFinalRound(session.gameCode)}>{t('final_round_btn')}</button>
              <button className="btn-danger h-12" onClick={() => setConfirmEnd(true)}>{t('end_game')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
