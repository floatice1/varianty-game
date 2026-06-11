import { showResults } from '../../gameActions';
import { arrayFromFirebase } from '../../utils';
import { useT } from '../../i18n';
import Scoreboard from '../../components/Scoreboard';

function getOptionStyle(option) {
  if (option.id === 'gm_correct') return { border:'border-g-success', bg:'bg-g-success/8', label:'✅', labelClass:'text-g-success', voterBadge:'bg-g-success/15 text-g-success border border-g-success/40' };
  if (option.id === 'gm_wrong')   return { border:'border-g-danger',  bg:'bg-g-danger/8',  label:'❌', labelClass:'text-g-danger',  voterBadge:'bg-g-danger/15 text-g-danger border border-g-danger/40' };
  return { border:'border-g-border', bg:'bg-g-surface', label:'👤', labelClass:'text-g-muted', voterBadge:'bg-g-card text-g-text border border-g-border' };
}

export default function RevealingPhase({ game, session }) {
  const t = useT();
  const round   = game.round   || {};
  const players = game.players || {};
  const options = arrayFromFirebase(round.options);
  const votes   = round.votes  || {};
  const changes = round.scoreChanges || {};

  const votesByOption = {};
  Object.entries(votes).forEach(([vid, cid]) => {
    if (!votesByOption[cid]) votesByOption[cid] = [];
    votesByOption[cid].push(vid);
  });

  if (!session.isGM) {
    return (
      <div className="page items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
          <div className="w-12 h-12 border-2 border-g-border border-t-g-accent rounded-full animate-spin" />
          <div>
            <p className="font-display text-xl text-g-text tracking-widest uppercase">{t('host_reviewing')}</p>
            <p className="text-g-muted text-sm mt-1">{t('results_soon')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-g-bg" style={{height:'100dvh', maxWidth:'448px', margin:'0 auto'}}>
      <div className="shrink-0 flex items-center justify-between px-4 pt-6 pb-4 border-b-2 border-g-border">
        <div>
          <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('preview_label')}</p>
          <p className="font-display text-3xl text-g-text">{game.roundNumber}</p>
        </div>
        <span className="badge-gm">{t('host_only')}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="font-display text-sm tracking-widest uppercase text-g-muted">{t('score_label')}</p>
            <Scoreboard players={players} changes={changes} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-display text-sm tracking-widest uppercase text-g-muted">{t('reveal_options') || t('options_label').split(' ·')[0]}</p>
            <div className="flex flex-col gap-3">
              {options.map(option => {
                const s      = getOptionStyle(option);
                const voters = votesByOption[option.id] || [];
                return (
                  <div key={option.id} className={`rounded-lg border-2 px-4 py-4 ${s.border} ${s.bg}`}>
                    <p className="text-g-text text-base font-medium leading-relaxed">{option.text}</p>
                    <p className={`text-xs font-bold uppercase tracking-wider mt-2 ${s.labelClass}`}>{s.label}</p>
                    <div className="mt-3">
                      {voters.length > 0 ? (
                        <>
                          <p className="text-g-muted text-xs font-display tracking-wider uppercase mb-1.5">
                            {t('chosen_n', {n: voters.length})}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {voters.map(id => (
                              <span key={id} className={`px-2.5 py-1 rounded-sm text-sm font-bold uppercase tracking-wide ${s.voterBadge}`}>
                                {players[id]?.name ?? '?'}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-g-dim text-xs font-display tracking-wider uppercase">{t('none_chosen')}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 py-4 border-t-2 border-g-border bg-g-bg">
        <button className="btn-primary h-14 w-full" onClick={() => showResults(session.gameCode)}>
          {t('announce_results')}
        </button>
      </div>
    </div>
  );
}
