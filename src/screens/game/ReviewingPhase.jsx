import { startVoting } from '../../gameActions';
import { arrayFromFirebase } from '../../utils';
import { useT } from '../../i18n';

export default function ReviewingPhase({ game, session }) {
  const t = useT();
  const round   = game.round || {};
  const options = arrayFromFirebase(round.options);

  return (
    <div className="page">
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('options_label')}</p>
            <p className="font-display text-2xl text-g-text">{game.roundNumber}</p>
          </div>
          <span className="text-g-dim text-sm tabular-nums font-display">
            {t('options_count', {n: options.length})}
          </span>
        </div>

        <p className="text-g-muted text-sm">
          {session.isGM ? t('gm_review_sub') : t('player_review_sub')}
        </p>

        <div className="flex flex-col gap-3">
          {options.map((option, i) => (
            <div key={option.id} className="card px-4 py-4 border-2 border-g-border">
              <div className="flex gap-3 items-start">
                <span className="font-display font-bold text-g-dim text-sm mt-0.5 shrink-0 w-5">
                  {t('option_n', {n: i+1})}
                </span>
                <p className="text-g-text text-base leading-relaxed">{option.text}</p>
              </div>
            </div>
          ))}
        </div>

        {session.isGM && (
          <button className="btn-primary h-14 mt-2" onClick={() => startVoting(session.gameCode)}>
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
  );
}
