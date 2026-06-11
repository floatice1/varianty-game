import { useState, useEffect } from 'react';
import { submitAnswer, startReviewing } from '../../gameActions';
import { useT } from '../../i18n';
import Timer from '../../components/Timer';

export default function AnsweringPhase({ game, session }) {
  const t = useT();
  const [answer,     setAnswer]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const round   = game.round   || {};
  const players = game.players || {};
  const answers = round.answers || {};
  const nonGMPlayers  = Object.entries(players).filter(([, p]) => !p.isGM);
  const submittedCount = nonGMPlayers.filter(([id]) => !!answers[id]).length;
  const hasSubmitted   = !!answers[session.playerId];

  const deadline = (round.answerTimerStart || 0) + (round.timerDuration || 30) * 1000;
  const [expired, setExpired] = useState(() => Date.now() >= deadline);
  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => { if (Date.now() >= deadline) setExpired(true); }, 500);
    return () => clearInterval(id);
  }, [deadline, expired]);

  async function handleSubmit() {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    try { await submitAnswer(session.gameCode, session.playerId, answer); }
    catch (e) { console.error(e); setSubmitting(false); }
  }

  // ── GM ───────────────────────────────────────────────────
  if (session.isGM) {
    return (
      <div className="page">
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('round_label')}</p>
              <p className="font-display text-2xl text-g-text">{game.roundNumber}</p>
            </div>
            <Timer startedAt={round.answerTimerStart} duration={round.timerDuration ?? 30} size="lg" />
          </div>
          <div className="card px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-g-text font-semibold">{t('responses_label')}</p>
              <p className="font-display font-bold text-g-accent text-xl tabular-nums">
                {submittedCount}<span className="text-g-dim text-base">/{nonGMPlayers.length}</span>
              </p>
            </div>
            <div className="w-full bg-g-surface rounded-full h-1.5 mb-3">
              <div className="bg-g-accent h-1.5 rounded-full transition-all duration-500"
                style={{width: nonGMPlayers.length > 0 ? `${(submittedCount/nonGMPlayers.length)*100}%` : '0%'}} />
            </div>
            <div className="flex flex-col gap-1.5">
              {nonGMPlayers.map(([id, p]) => (
                <div key={id} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${answers[id] ? 'bg-g-success/10' : 'bg-g-surface'}`}>
                  <span className="text-g-text text-sm">{p.name}</span>
                  {answers[id] ? <span className="text-g-success font-bold">✓</span> : <span className="text-g-dim text-xs">{t('waiting_dot')}</span>}
                </div>
              ))}
            </div>
          </div>
          <button className="btn-primary h-14" onClick={() => startReviewing(session.gameCode, round.answers, round.correctAnswer, round.wrongAnswer)}>
            {t('show_options')}
          </button>
          <p className="text-g-dim text-xs text-center">{t('no_ans_note')}</p>
        </div>
      </div>
    );
  }

  // ── Player — expired ─────────────────────────────────────
  if (expired && !hasSubmitted) {
    return (
      <div className="page items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <Timer startedAt={round.answerTimerStart} duration={round.timerDuration ?? 30} size="lg" />
          <p className="font-display text-xl text-g-danger tracking-widest uppercase">{t('time_up')}</p>
          <p className="text-g-muted text-sm">{t('not_counted')}</p>
        </div>
      </div>
    );
  }

  // ── Player — submitted ───────────────────────────────────
  if (hasSubmitted) {
    return (
      <div className="page items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-fade-in text-center w-full">
          <Timer startedAt={round.answerTimerStart} duration={round.timerDuration ?? 30} size="lg" />
          <div className="card px-8 py-10 flex flex-col items-center gap-4 w-full">
            <div className="w-14 h-14 rounded-full bg-g-success/15 border border-g-success/30 flex items-center justify-center">
              <span className="text-g-success text-3xl">✓</span>
            </div>
            <div>
              <p className="text-g-text font-semibold text-xl">{t('sent_title')}</p>
              <p className="text-g-muted text-sm mt-1">{t('waiting_others')}</p>
            </div>
          </div>
          <p className="text-g-dim text-xs">{t('answered', {n: submittedCount, total: nonGMPlayers.length})}</p>
        </div>
      </div>
    );
  }

  // ── Player — answering ───────────────────────────────────
  return (
    <div className="page">
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('round_label')}</p>
            <p className="font-display text-2xl text-g-text">{game.roundNumber}</p>
          </div>
          <Timer startedAt={round.answerTimerStart} duration={round.timerDuration ?? 30} size="lg" />
        </div>
        <div>
          <p className="text-g-text font-semibold text-base mb-1">{t('your_answer')}</p>
          <p className="text-g-muted text-sm">{t('answer_sub')}</p>
        </div>
        <textarea className="input resize-none text-base leading-relaxed" style={{height:'120px'}}
          placeholder={t('answer_ph')} value={answer}
          onChange={e => setAnswer(e.target.value)} maxLength={200} autoFocus />
        <button className="btn-primary h-14" onClick={handleSubmit} disabled={!answer.trim() || submitting}>
          {submitting ? t('submitting') : t('submit_btn')}
        </button>
        <p className="text-g-dim text-xs text-center">
          {t('already_answered', {n: submittedCount, total: nonGMPlayers.length})}
        </p>
      </div>
    </div>
  );
}
