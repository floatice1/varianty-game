import { useState, useEffect, useRef } from 'react';
import { startRound } from '../../gameActions';
import { arrayFromFirebase } from '../../utils';
import { useT } from '../../i18n';
import Scoreboard from '../../components/Scoreboard';

export default function SetupPhase({ game, session }) {
  const t = useT();
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [wrongAnswer,   setWrongAnswer]   = useState('');
  const [timerDuration, setTimerDuration] = useState(30);
  const [autoFilled,    setAutoFilled]    = useState(false);
  const [loading,       setLoading]       = useState(false);

  const nextRoundNum  = game.roundNumber + 1;
  const isFirstRound  = game.roundNumber === 0;
  const presets       = arrayFromFirebase(game.presetRounds);
  const currentPreset = presets[game.roundNumber];

  const didFill = useRef(false);
  useEffect(() => {
    if (didFill.current) return;
    if (currentPreset?.correctAnswer || currentPreset?.wrongAnswer) {
      setCorrectAnswer(currentPreset.correctAnswer || '');
      setWrongAnswer(currentPreset.wrongAnswer   || '');
      setAutoFilled(true);
      didFill.current = true;
    }
  }, [currentPreset]);

  async function handleStart() {
    if (!correctAnswer.trim() || !wrongAnswer.trim() || loading) return;
    setLoading(true);
    try { await startRound(session.gameCode, game.roundNumber, correctAnswer, wrongAnswer, timerDuration); }
    catch (e) { console.error(e); setLoading(false); }
  }

  // ── Player view ──────────────────────────────────────────
  if (!session.isGM) {
    return (
      <div className="page">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('preparing_label')}</p>
              <p className="font-display text-2xl text-g-text">{t('round_label')} {nextRoundNum}</p>
            </div>
            <p className="text-g-dim text-xs">{Object.keys(game.players || {}).length} {t('players_label').toLowerCase()}</p>
          </div>
          <div className="card px-6 py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-10 h-10 border-2 border-g-border border-t-g-accent rounded-full animate-spin" />
            <div>
              <p className="text-g-text font-semibold text-lg">{t('gm_preparing')}</p>
              <p className="text-g-muted text-sm mt-1">{t('listen_hint')}</p>
            </div>
          </div>
          {!isFirstRound && (
            <div className="flex flex-col gap-3">
              <h2 className="font-display font-bold text-g-text text-base">{t('current_score')}</h2>
              <Scoreboard players={game.players} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── GM view ──────────────────────────────────────────────
  const canStart = correctAnswer.trim().length > 0 && wrongAnswer.trim().length > 0 && !loading;

  return (
    <div className="page">
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('host_round')}</p>
            <p className="font-display text-2xl text-g-text">{nextRoundNum}</p>
          </div>
          <span className="badge-gm">{t('gm_badge')}</span>
        </div>

        {/* Question reference (GM only) — shown if pre-prepared */}
        {currentPreset?.question && (
          <div className="card px-4 py-3 border-2 border-g-accent/50 bg-g-accent/5">
            <p className="text-g-accent text-xs font-display tracking-wider uppercase mb-1">{t('question_label')}</p>
            <p className="text-g-text text-base font-medium leading-relaxed">{currentPreset.question}</p>
          </div>
        )}

        <p className="text-g-muted text-sm leading-relaxed">{t('inst_text')}</p>

        {autoFilled && (
          <div className="flex items-center gap-1.5 text-g-dim text-xs">
            <span className="text-g-success/50">✓</span>{t('autofill_note')}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-g-text font-semibold text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-g-success/20 flex items-center justify-center text-xs">✓</span>
            {t('correct_label')}
          </label>
          <textarea className="input resize-none" style={{height:'80px'}} placeholder={t('correct_ph')}
            value={correctAnswer} maxLength={200}
            onChange={e => { setCorrectAnswer(e.target.value); setAutoFilled(false); }} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-g-text font-semibold text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-g-danger/20 flex items-center justify-center text-xs text-g-danger">✕</span>
            {t('trap_label')}
          </label>
          <textarea className="input resize-none" style={{height:'80px'}} placeholder={t('trap_ph')}
            value={wrongAnswer} maxLength={200}
            onChange={e => { setWrongAnswer(e.target.value); setAutoFilled(false); }} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-g-text font-semibold text-sm">{t('timer_label')}</label>
          <div className="flex gap-3">
            {[20, 30].map(s => (
              <button key={s}
                className={`flex-1 h-12 rounded-2xl font-display font-bold text-xl transition-all duration-150 active:scale-95
                  ${timerDuration === s ? 'bg-g-accent text-black shadow-glow-sm' : 'bg-g-card border-2 border-g-border text-g-muted hover:border-g-accent/40'}`}
                onClick={() => setTimerDuration(s)}>{s}s</button>
            ))}
          </div>
        </div>

        {!isFirstRound && (
          <div className="flex flex-col gap-2">
            <p className="text-g-dim text-xs font-display tracking-widest uppercase">{t('round_score')}</p>
            <Scoreboard players={game.players} compact />
          </div>
        )}

        <button className="btn-primary h-14 mt-1" onClick={handleStart} disabled={!canStart}>
          {loading ? t('starting') : t('start_round')}
        </button>
      </div>
    </div>
  );
}
