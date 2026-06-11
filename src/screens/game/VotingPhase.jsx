import { useState, useEffect } from 'react';
import { submitVote, finalizeResults, removeVote } from '../../gameActions';
import { arrayFromFirebase } from '../../utils';
import { useT } from '../../i18n';
import Timer from '../../components/Timer';

export default function VotingPhase({ game, session }) {
  const t = useT();
  const round   = game.round   || {};
  const players = game.players || {};
  const options = arrayFromFirebase(round.options);
  const votes   = round.votes  || {};

  const myVote       = votes[session.playerId];
  const nonGMPlayers = Object.entries(players).filter(([, p]) => !p.isGM);
  const votedCount   = nonGMPlayers.filter(([id]) => !!votes[id]).length;

  const voteDeadline = (round.voteTimerStart || 0) + 20 * 1000;
  const [expired, setExpired] = useState(() => Date.now() >= voteDeadline);
  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => { if (Date.now() >= voteDeadline) setExpired(true); }, 500);
    return () => clearInterval(id);
  }, [voteDeadline, expired]);

  async function handleVote(optionId) {
    if (expired || optionId === session.playerId) return;
    if (myVote === optionId) await removeVote(session.gameCode, session.playerId);
    else await submitVote(session.gameCode, session.playerId, optionId);
  }

  // ── GM ───────────────────────────────────────────────────
  if (session.isGM) {
    return (
      <div className="page">
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('voting_label')}</p>
              <p className="font-display text-2xl text-g-text">{game.roundNumber}</p>
            </div>
            <Timer startedAt={round.voteTimerStart} duration={20} size="lg" />
          </div>
          <div className="card px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-g-text font-semibold">{t('votes_label')}</p>
              <p className="font-display font-bold text-g-accent text-xl tabular-nums">
                {votedCount}<span className="text-g-dim text-base">/{nonGMPlayers.length}</span>
              </p>
            </div>
            <div className="w-full bg-g-surface rounded-full h-1.5 mb-3">
              <div className="bg-g-accent h-1.5 rounded-full transition-all duration-500"
                style={{width: nonGMPlayers.length > 0 ? `${(votedCount/nonGMPlayers.length)*100}%` : '0%'}} />
            </div>
            <div className="flex flex-col gap-1.5">
              {nonGMPlayers.map(([id, p]) => (
                <div key={id} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${votes[id] ? 'bg-g-accent/10' : 'bg-g-surface'}`}>
                  <span className="text-g-text text-sm">{p.name}</span>
                  {votes[id] ? <span className="text-g-accent font-bold">✓</span> : <span className="text-g-dim text-xs">{t('voting_dot')}</span>}
                </div>
              ))}
            </div>
          </div>
          <button className="btn-primary h-14" onClick={() => finalizeResults(session.gameCode, players, votes)}>
            {t('show_results')}
          </button>
        </div>
      </div>
    );
  }

  // ── Player ───────────────────────────────────────────────
  return (
    <div className="page">
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('voting_label')}</p>
            <p className="font-display text-2xl text-g-text">{game.roundNumber}</p>
          </div>
          <Timer startedAt={round.voteTimerStart} duration={20} size="lg" />
        </div>

        <p className="text-g-muted text-sm">
          {expired ? t('time_up_voting') : t('choose_ans')}
        </p>

        <div className="flex flex-col gap-3">
          {options.map(option => {
            const isOwn      = option.id === session.playerId;
            const isSelected = myVote === option.id;
            const blocked    = expired || isOwn;
            let cardClass = isOwn ? 'answer-card-own' : isSelected ? 'answer-card-selected' : 'answer-card-idle';
            return (
              <div key={option.id} className={`${cardClass} ${blocked ? 'pointer-events-none' : ''}`}
                onClick={() => handleVote(option.id)}>
                <p className="text-g-text text-base leading-relaxed">{option.text}</p>
                {isOwn && <p className="text-g-dim text-xs mt-2 font-medium">{t('own_ans')}</p>}
                {isSelected && !isOwn && (
                  <p className="text-g-accent text-xs mt-2 font-semibold">
                    {expired ? t('selected') : t('selected_cancel')}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!expired && myVote && <p className="text-g-dim text-xs text-center pb-2">{t('change_hint')}</p>}
        {expired && !myVote && <p className="text-g-danger text-xs text-center pb-2 font-display tracking-wider uppercase">{t('no_vote')}</p>}
      </div>
    </div>
  );
}
