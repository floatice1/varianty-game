import { nextRound, endGame, startFinalRound } from '../../gameActions';
import { useT } from '../../i18n';
import Scoreboard from '../../components/Scoreboard';

export default function ResultsPhase({ game, session }) {
  const t = useT();
  const round   = game.round   || {};
  const players = game.players || {};
  const changes = round.scoreChanges || {};

  const header = (
    <div className="pt-2">
      <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('results_label')}</p>
      <p className="font-display text-3xl text-g-text">{game.roundNumber}</p>
    </div>
  );

  // ── Players ──────────────────────────────────────────────
  if (!session.isGM) {
    return (
      <div className="page">
        <div className="flex flex-col gap-5 animate-fade-in">
          {header}
          <div className="flex flex-col gap-2">
            <p className="font-display text-sm tracking-widest uppercase text-g-muted">{t('score_label')}</p>
            <Scoreboard players={players} changes={changes} />
          </div>
          <p className="text-g-dim text-xs text-center pb-2">{t('waiting_host')}</p>
        </div>
      </div>
    );
  }

  // ── GM ───────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="flex flex-col gap-5 animate-fade-in">
        {header}

        <div className="flex flex-col gap-2">
          <p className="font-display text-sm tracking-widest uppercase text-g-muted">{t('score_label')}</p>
          <Scoreboard players={players} changes={changes} />
        </div>

        <div className="flex flex-col gap-3 mt-1">
          <button className="btn-primary h-14" onClick={() => nextRound(session.gameCode)}>{t('next_round')}</button>
          <button className="btn-secondary h-14" onClick={() => startFinalRound(session.gameCode)}>{t('final_round_btn')}</button>
          <button className="btn-danger h-12" onClick={() => endGame(session.gameCode)}>{t('end_game')}</button>
        </div>
      </div>
    </div>
  );
}
