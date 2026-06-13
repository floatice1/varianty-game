import { startVoting } from '../../gameActions';
import { arrayFromFirebase } from '../../utils';
import { useT } from '../../i18n';

export default function ReviewingPhase({ game, session }) {
  const t = useT();
  const round   = game.round || {};
  const options = arrayFromFirebase(round.options);

  return (
    <div className="page overflow-hidden" style={{ height: '100dvh' }}>
      <div className="flex flex-col gap-5 animate-fade-in h-full">
        <div className="flex items-center justify-between pt-2 shrink-0">
          <div>
            <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('options_label')}</p>
            <p className="font-display text-2xl text-g-text">{game.roundNumber}</p>
          </div>
          <span className="text-g-dim text-sm tabular-nums font-graffiti">
            {t('options_count', {n: options.length})}
          </span>
        </div>

        <p className="text-g-muted text-sm shrink-0">
          {session.isGM ? t('gm_review_sub') : t('player_review_sub')}
        </p>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-3">
          {options.map((option, i) => (
            <div key={option.id} className="card px-4 py-4">
              <div className="flex gap-3 items-start">
                <span className="font-graffiti font-bold text-g-dim text-sm mt-0.5 shrink-0 w-5">
                  {t('option_n', {n: i+1})}
                </span>
                <p className="text-g-text text-base leading-relaxed">{option.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          {session.isGM && (
            <button className="btn-primary h-14" onClick={() => startVoting(session.gameCode)}>
              {t('start_voting')}
            </button>
          )}
          {!session.isGM && (
            <div className="flex items-center justify-center gap-2 py-4 text-g-dim text-xs">
              <div className="w-3 h-3 border border-g-dim border-t-g-muted rounded-full animate-spin" />
              {t('waiting_voting')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
