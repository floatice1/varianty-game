import { useT } from '../../i18n';
import SetupPhase from './SetupPhase';
import AnsweringPhase from './AnsweringPhase';
import ReviewingPhase from './ReviewingPhase';
import VotingPhase from './VotingPhase';
import RevealingPhase from './RevealingPhase';
import ResultsPhase from './ResultsPhase';
import FinalRound from './FinalRound';
import Scoreboard from '../../components/Scoreboard';

function EndedScreen({ game, onLeave }) {
  const t = useT();
  const sorted = Object.entries(game.players || {})
    .filter(([, p]) => !p.isGM)
    .sort(([, a], [, b]) => b.score - a.score);
  const medals = ['🥇','🥈','🥉'];

  return (
    <div className="page">
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col items-center text-center pt-8 pb-2">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="font-display font-bold text-3xl text-g-text mb-1">{t('game_over')}</h1>
          <p className="text-g-muted text-sm">{t('total_rounds', {n: game.roundNumber})}</p>
        </div>
        <div className="flex flex-col gap-2">
          {sorted.map(([id, p], i) => (
            <div key={id}
              className={`flex items-center justify-between card px-4 py-4 border-2 transition-all ${
                i===0 ? 'border-yellow-500/40 bg-yellow-500/5' :
                i===1 ? 'border-g-border/50' : i===2 ? 'border-g-border/30' : 'border-g-border'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{medals[i] ?? `${i+1}.`}</span>
                <p className="text-g-text font-semibold text-lg">{p.name}</p>
              </div>
              <span className="font-display font-bold text-2xl text-g-text tabular-nums">{p.score}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary h-14 mt-4" onClick={onLeave}>{t('new_game')}</button>
      </div>
    </div>
  );
}

export default function GameScreen({ game, session, onLeave }) {
  const { phase } = game;
  if (phase === 'ended')    return <EndedScreen game={game} session={session} onLeave={onLeave} />;
  const props = { game, session };
  if (phase === 'setup')     return <SetupPhase {...props} />;
  if (phase === 'answering') return <AnsweringPhase {...props} />;
  if (phase === 'reviewing') return <ReviewingPhase {...props} />;
  if (phase === 'voting')    return <VotingPhase {...props} />;
  if (phase === 'revealing') return <RevealingPhase {...props} />;
  if (phase === 'results')   return <ResultsPhase {...props} />;
  if (phase === 'final')     return <FinalRound {...props} />;
  return (
    <div className="page items-center justify-center">
      <div className="w-10 h-10 border-2 border-g-border border-t-g-accent rounded-full animate-spin" />
    </div>
  );
}
