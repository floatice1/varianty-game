import { useState, useEffect, useRef, useMemo } from 'react';
import { saveFinalPlayers, saveFinalRoundQuestions, endFinalRound, backToResults } from '../../gameActions';
import { arrayFromFirebase, shuffle } from '../../utils';
import { useT } from '../../i18n';

const TOTAL_Q = 3;

// ─── Countdown ────────────────────────────────────────────
function Countdown({ start }) {
  const [left, setLeft] = useState(30);
  useEffect(() => {
    if (!start) return;
    const tick = () => setLeft(Math.max(0, 30 - Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [start]);
  const pct = (left / 30) * 100;
  const color = left <= 5 ? 'rgb(var(--g-danger))' : left <= 10 ? 'rgb(var(--g-accent))' : 'rgb(var(--g-text))';
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 absolute">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(var(--g-border))" strokeWidth="4"/>
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={c*(1-pct/100)}
          strokeLinecap="round" style={{transition:'stroke-dashoffset .5s linear,stroke .3s'}}/>
      </svg>
      <span className="font-display text-xl tabular-nums" style={{color}}>{left===0?'✕':left}</span>
    </div>
  );
}

// ─── Transition ───────────────────────────────────────────
function Transition({ icon, title, sub, btnLabel, onContinue }) {
  return (
    <div className="page items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center animate-fade-in px-6">
        <div className="text-5xl">{icon}</div>
        <div>
          <p className="font-display text-2xl text-g-text tracking-wider uppercase">{title}</p>
          {sub && <p className="text-g-muted text-sm mt-2 leading-relaxed">{sub}</p>}
        </div>
        <button className="btn-primary h-14 w-full max-w-xs" onClick={onContinue}>{btnLabel}</button>
      </div>
    </div>
  );
}

// ─── AnsweringStep — records player's 3 options ───────────
function AnsweringStep({ t, label, qIdx, accent, timer, opts, setOpts, onAdvance, advanceLabel, correctAns, questionText }) {
  function updateOpt(optI, val) {
    setOpts(prev => { const next = prev.map(r=>[...r]); next[qIdx][optI]=val; return next; });
  }

  const dups = opts[qIdx].map(o =>
    o.trim().length > 0 && o.trim().toLowerCase() === correctAns.trim().toLowerCase()
  );
  const hasDup = dups.some(Boolean);

  return (
    <div className="page overflow-hidden" style={{ height: '100dvh' }}>
      <div className="flex flex-col gap-5 animate-fade-in h-full">
        <div className="flex items-center justify-between pt-2 pb-4 shrink-0 border-b-2 border-g-border">
          <div>
            <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('fin_q_label',{name:label})}</p>
            <p className="font-display text-3xl text-g-text">{qIdx+1} / {TOTAL_Q}</p>
          </div>
          <Countdown start={timer} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-4">
          {questionText && (
            <div className={`card px-4 py-3 border-2 ${accent}`}>
              <p className="text-g-muted text-xs font-graffiti tracking-wider uppercase mb-1">{t('question_label')}</p>
              <p className="text-g-text text-base font-medium leading-relaxed">{questionText}</p>
            </div>
          )}
          {correctAns && (
            <div className="card px-3 py-2.5 border-2 border-g-success/50 bg-g-success/5">
              <p className="text-g-success text-xs font-graffiti tracking-wider uppercase mb-0.5">{t('fin_correct_ref')}</p>
              <p className="text-g-text text-sm font-medium">{correctAns}</p>
            </div>
          )}
          {!questionText && (
            <div className={`card px-4 py-3 border-2 ${accent}`}>
              <p className="text-g-muted text-xs font-graffiti tracking-wider uppercase">{t('plan_q_n',{n:qIdx+1})}</p>
              <p className="text-g-dim text-xs mt-0.5">{t('fin_q_hint')}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {[0,1,2].map(i => (
              <div key={i}>
                <input
                  className={`input ${dups[i] ? 'border-g-danger' : ''}`}
                  placeholder={`${i+1}. …`}
                  value={opts[qIdx][i]}
                  onChange={e => updateOpt(i, e.target.value)}
                  maxLength={200}
                />
                {dups[i] && (
                  <p className="text-g-danger text-xs mt-1 font-graffiti tracking-wider uppercase">
                    {t('fin_dup_error')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0 border-t-2 border-g-border pt-4">
          <button className="btn-primary h-14" onClick={onAdvance} disabled={hasDup}>
            {advanceLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GuessingStep — GM records which option player said ───
function GuessingStep({ t, label, qIdx, correctAns, questionText, playerOpts, guesses, scores, setGuesses, setScores, onAdvance, advanceLabel }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allOpts = useMemo(() => shuffle([...playerOpts, correctAns]), [qIdx]);
  const chosen  = guesses[qIdx];

  function pick(i) {
    const ng=[...guesses], ns=[...scores];
    if (chosen===i) { ng[qIdx]=null; ns[qIdx]=null; }
    else { ng[qIdx]=i; ns[qIdx]=allOpts[i].trim().toLowerCase()===correctAns.trim().toLowerCase()?5:0; }
    setGuesses(ng); setScores(ns);
  }

  return (
    <div className="page overflow-hidden" style={{ height: '100dvh' }}>
      <div className="flex flex-col gap-5 animate-fade-in h-full">
        <div className="pt-2 pb-4 shrink-0 border-b-2 border-g-border">
          <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{label} · {t('plan_q_n',{n:qIdx+1})}</p>
          <p className="font-display text-3xl text-g-text">{qIdx+1} / {TOTAL_Q}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-2">
          {questionText && (
            <div className="card px-4 py-3 border-2 border-g-border mb-2">
              <p className="text-g-text text-base font-medium leading-relaxed">{questionText}</p>
            </div>
          )}
          <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase shrink-0">
            {t('fin_which',{name:label.split(' ')[0]})}
          </p>
          {allOpts.map((opt,i) => {
            const isCorrect = opt.trim().toLowerCase()===correctAns.trim().toLowerCase();
            const isChosen  = chosen===i;
            return (
              <button key={i}
                className={`rounded-lg border-2 px-4 py-3.5 text-left transition-all active:scale-[.98]
                  ${isChosen&&isCorrect  ?'border-g-success bg-g-success/20':
                    isChosen&&!isCorrect ?'border-g-danger  bg-g-danger/10' :
                    isCorrect            ?'border-g-success bg-g-success/8' :
                                          'border-g-border bg-g-card hover:border-g-accent/40'}`}
                onClick={()=>pick(i)}>
                <p className="text-g-text text-sm font-medium">{opt||'—'}</p>
                {isCorrect&&!isChosen && <p className="text-g-success/70 text-xs mt-0.5 font-graffiti tracking-wider uppercase">{t('fin_correct_mark')}</p>}
                {isChosen&&isCorrect  && <p className="text-g-success text-xs mt-0.5 font-graffiti tracking-wider uppercase">{t('fin_plus5')} {t('fin_cancel')}</p>}
                {isChosen&&!isCorrect && <p className="text-g-danger  text-xs mt-0.5 font-graffiti tracking-wider uppercase">{t('fin_zero')} {t('fin_cancel')}</p>}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <div className="flex flex-col gap-3 shrink-0 border-t-2 border-g-border pt-4">
            <button className="btn-primary h-14" onClick={onAdvance}>{advanceLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function FinalRound({ game, session }) {
  const t = useT();
  const players   = game.players   || {};
  const finalPrep = game.finalPrep || {};
  const fr        = game.finalRound || {};

  // Use confirmed questions from the active round (finalRound.questionsA/B written by confirmSetup).
  // If none yet (first time entering setup), fall back to PlanningPanel's pre-planned questions.
  const confirmedA = arrayFromFirebase(fr.questionsA);
  const confirmedB = arrayFromFirebase(fr.questionsB);
  const questionsA = confirmedA.some(q => q?.a)
    ? confirmedA.slice(0, TOTAL_Q)
    : arrayFromFirebase(finalPrep.questionsA).slice(0, TOTAL_Q);
  const questionsB = confirmedB.some(q => q?.a)
    ? confirmedB.slice(0, TOTAL_Q)
    : arrayFromFirebase(finalPrep.questionsB).slice(0, TOTAL_Q);

  const topPlayers = Object.entries(players)
    .filter(([,p]) => !p.isGM)
    .sort(([,a],[,b]) => b.score-a.score)
    .slice(0, 2);

  const [phase,  setPhase]  = useState('setup');
  const [qIdx,   setQIdx]   = useState(0);
  const [timerA, setTimerA] = useState(null);
  const [timerB, setTimerB] = useState(null);
  const [p1Id,   setP1Id]   = useState(()=>fr.player1Id||topPlayers[0]?.[0]||'');
  const [p2Id,   setP2Id]   = useState(()=>fr.player2Id||topPlayers[1]?.[0]||'');

  // Local answer state — editable in setup, saves to Firebase on confirm
  const [localQA, setLocalQA] = useState(()=>
    Array(3).fill(null).map((_,i)=>({ q:questionsA[i]?.q||'', a:questionsA[i]?.a||'' }))
  );
  const [localQB, setLocalQB] = useState(()=>
    Array(3).fill(null).map((_,i)=>({ q:questionsB[i]?.q||'', a:questionsB[i]?.a||'' }))
  );
  const [showErrors, setShowErrors] = useState(false);

  // Sync from Firebase if local state was empty on mount (late load)
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || phase !== 'setup') return;
    const hasA = questionsA.some(q=>q?.a);
    const hasB = questionsB.some(q=>q?.a);
    if (hasA || hasB) {
      if (localQA.every(q=>!q.a)) setLocalQA(Array(3).fill(null).map((_,i)=>({q:questionsA[i]?.q||'',a:questionsA[i]?.a||''})));
      if (localQB.every(q=>!q.a)) setLocalQB(Array(3).fill(null).map((_,i)=>({q:questionsB[i]?.q||'',a:questionsB[i]?.a||''})));
      synced.current = true;
    }
  }, [questionsA, questionsB, phase]);

  const [aOpts, setAOpts] = useState([['','',''],['','',''],['','','']]);
  const [bOpts, setBOpts] = useState([['','',''],['','',''],['','','']]);
  const [bGuesses, setBGuesses] = useState([null,null,null]);
  const [aGuesses, setAGuesses] = useState([null,null,null]);
  const [bScore,   setBScore]   = useState([null,null,null]);
  const [aScore,   setAScore]   = useState([null,null,null]);

  const p1Name = players[p1Id]?.name || 'A';
  const p2Name = players[p2Id]?.name || 'B';

  const allAnswersFilled =
    localQA.every(q=>q.a.trim()) &&
    localQB.every(q=>q.a.trim());

  const canStart = p1Id && p2Id && p1Id!==p2Id && allAnswersFilled;

  async function confirmSetup() {
    // Save confirmed questions to finalRound (separate from PlanningPanel's finalPrep)
    // so that starting a new final round always begins with a clean slate.
    await saveFinalRoundQuestions(
      session.gameCode,
      localQA.map(q=>({q:q.q.trim(),a:q.a.trim()})),
      localQB.map(q=>({q:q.q.trim(),a:q.a.trim()})),
    );
    await saveFinalPlayers(session.gameCode, p1Id, p2Id);
    setPhase('exit_b');
  }

  function handleConfirmSetup() {
    if (!canStart) { setShowErrors(true); return; }
    confirmSetup();
  }

  async function finalize() {
    const p1E = aScore.reduce((s,v)=>s+(v??0),0);
    const p2E = bScore.reduce((s,v)=>s+(v??0),0);
    await endFinalRound(session.gameCode, {
      [p1Id]: (players[p1Id]?.score??0)+p1E,
      [p2Id]: (players[p2Id]?.score??0)+p2E,
    });
  }

  // Player waiting
  if (!session.isGM) {
    return (
      <div className="page items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
          <div className="font-display text-5xl text-g-accent tracking-widest">★</div>
          <p className="font-display text-2xl text-g-text tracking-widest uppercase">{t('fin_waiting')}</p>
          <p className="text-g-muted text-sm">{t('fin_waiting_sub')}</p>
        </div>
      </div>
    );
  }

  // ── Setup ─────────────────────────────────────────────
  if (phase === 'setup') {
    const renderAnswers = (label, qs, setQs, accent) => (
      <div className="flex flex-col gap-2">
        <p className={`text-xs font-graffiti tracking-wider uppercase ${accent}`}>{label}</p>
        {qs.map((q,i) => {
          const missing = showErrors && !q.a.trim();
          return (
            <div key={i} className="bg-g-surface rounded-lg border-2 border-g-border px-3 pt-2.5 pb-3 flex flex-col gap-2">
              <p className="text-g-dim text-xs font-graffiti tracking-wider uppercase">{t('plan_q_n',{n:i+1})}</p>
              <input className="input py-2 text-sm" placeholder={t('plan_question_ph')}
                value={q.q} maxLength={300}
                onChange={e=>setQs(p=>p.map((r,j)=>j===i?{...r,q:e.target.value}:r))}/>
              <div>
                <input
                  className={`input py-2 text-sm ${
                    missing
                      ? 'border-g-danger bg-g-danger/5'
                      : q.a.trim()
                      ? 'border-g-success/50'
                      : ''
                  }`}
                  placeholder={`${t('plan_ans_ph')} *`}
                  value={q.a} maxLength={200}
                  onChange={e=>setQs(p=>p.map((r,j)=>j===i?{...r,a:e.target.value}:r))}/>
                {missing && (
                  <p className="text-g-danger text-xs mt-1 font-graffiti tracking-wider uppercase">
                    ⚠ {t('fin_ans_required')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );

    return (
      <div className="flex flex-col bg-g-bg" style={{height:'100dvh', maxWidth:'448px', margin:'0 auto'}}>

        {/* Sticky header */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b-2 border-g-border">
          <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('final_gm_label')}</p>
          <p className="font-display text-3xl text-g-text tracking-wider">{t('final_round_title')}</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <div className="flex flex-col gap-5">

            {/* Finalist selectors */}
            {[
              [p1Id,setP1Id,p2Id,setP2Id,t('fin_pa'),'text-g-accent','border-g-accent','bg-g-accent/10'],
              [p2Id,setP2Id,p1Id,setP1Id,t('fin_pb'),'text-g-pink',  'border-g-pink',  'bg-g-pink/10'],
            ].map(([selId,setSel,otherId,setOther,lbl,tc,bc,bg]) => (
              <div key={lbl} className={`card px-4 py-3 border-2 ${bc}/40`}>
                <p className={`text-xs font-graffiti tracking-wider uppercase mb-2 ${tc}`}>{lbl}</p>
                <div className="flex flex-col gap-1.5">
                  {topPlayers.map(([id,p]) => (
                    <button key={id}
                      className={`px-3 py-2 rounded-lg border-2 text-left text-sm font-graffiti transition-all
                        ${selId===id?`${bc} ${bg} text-g-text`:'border-g-border text-g-muted'}`}
                      onClick={()=>{setSel(id);if(otherId===id)setOther(topPlayers.find(([tid])=>tid!==id)?.[0]??'');}}>
                      {p.name} — {p.score}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Answer setup */}
            {renderAnswers(p1Id ? p1Name : t('fin_answers_for',{name:'A'}), localQA, setLocalQA, 'text-g-accent')}
            {renderAnswers(p2Id ? p2Name : t('fin_answers_for',{name:'B'}), localQB, setLocalQB, 'text-g-pink')}

          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 px-4 py-4 border-t-2 border-g-border bg-g-bg flex flex-col gap-3">
          {showErrors && !allAnswersFilled && (
            <p className="text-g-danger text-xs font-graffiti tracking-wider uppercase text-center">
              {t('fin_fill_answers')}
            </p>
          )}
          <button className="btn-primary h-14 w-full" onClick={handleConfirmSetup}>
            {t('fin_confirm_setup')}
          </button>
          <button className="btn-ghost h-11 w-full" onClick={() => backToResults(session.gameCode)}>
            {t('confirm_back')}
          </button>
        </div>

      </div>
    );
  }

  // Transitions
  if (phase==='exit_b')   return <Transition icon="🚪" title={t('fin_exit_title',{name:p2Name})} sub={t('fin_exit_sub',{name:p2Name,other:p1Name})} btnLabel={t('fin_start_q')} onContinue={()=>{setPhase('a_ans');setQIdx(0);setTimerA(Date.now());}}/>;
  if (phase==='invite_b') return <Transition icon="👋" title={t('fin_invite_title',{name:p2Name})} sub={t('fin_invite_sub')} btnLabel={t('fin_invite_btn',{name:p2Name})} onContinue={()=>{setPhase('b_guess');setQIdx(0);}}/>;
  if (phase==='exit_a')   return <Transition icon="🚪" title={t('fin_exit_title',{name:p1Name})} sub={t('fin_exit_sub',{name:p1Name,other:p2Name})} btnLabel={t('fin_start_q')} onContinue={()=>{setPhase('b_ans');setQIdx(0);setTimerB(Date.now());}}/>;
  if (phase==='invite_a') return <Transition icon="👋" title={t('fin_invite_title',{name:p1Name})} sub={t('fin_invite_sub')} btnLabel={t('fin_invite_btn',{name:p1Name})} onContinue={()=>{setPhase('a_guess');setQIdx(0);}}/>;

  if (phase==='a_ans') return (
    <AnsweringStep t={t} label={p1Name} qIdx={qIdx} accent="border-g-accent/40" timer={timerA}
      opts={aOpts} setOpts={setAOpts}
      correctAns={localQA[qIdx]?.a??''} questionText={localQA[qIdx]?.q||''}
      advanceLabel={qIdx<TOTAL_Q-1?t('fin_next_q'):t('fin_invite_btn',{name:p2Name})}
      onAdvance={()=>{if(qIdx<TOTAL_Q-1)setQIdx(qIdx+1);else{setPhase('invite_b');setQIdx(0);}}}/>
  );

  if (phase==='b_guess') return (
    <GuessingStep t={t} label={p2Name} qIdx={qIdx}
      correctAns={localQA[qIdx]?.a??''} questionText={localQA[qIdx]?.q||''}
      playerOpts={aOpts[qIdx]}
      guesses={bGuesses} scores={bScore} setGuesses={setBGuesses} setScores={setBScore}
      advanceLabel={qIdx<TOTAL_Q-1?t('fin_next_q'):t('fin_exit_label',{name:p1Name})}
      onAdvance={()=>{if(qIdx<TOTAL_Q-1)setQIdx(qIdx+1);else{setPhase('exit_a');setQIdx(0);}}}/>
  );

  if (phase==='b_ans') return (
    <AnsweringStep t={t} label={p2Name} qIdx={qIdx} accent="border-g-pink/40" timer={timerB}
      opts={bOpts} setOpts={setBOpts}
      correctAns={localQB[qIdx]?.a??''} questionText={localQB[qIdx]?.q||''}
      advanceLabel={qIdx<TOTAL_Q-1?t('fin_next_q'):t('fin_invite_btn',{name:p1Name})}
      onAdvance={()=>{if(qIdx<TOTAL_Q-1)setQIdx(qIdx+1);else{setPhase('invite_a');setQIdx(0);}}}/>
  );

  if (phase==='a_guess') return (
    <GuessingStep t={t} label={p1Name} qIdx={qIdx}
      correctAns={localQB[qIdx]?.a??''} questionText={localQB[qIdx]?.q||''}
      playerOpts={bOpts[qIdx]}
      guesses={aGuesses} scores={aScore} setGuesses={setAGuesses} setScores={setAScore}
      advanceLabel={qIdx<TOTAL_Q-1?t('fin_next_q'):t('fin_summary')}
      onAdvance={()=>{if(qIdx<TOTAL_Q-1)setQIdx(qIdx+1);else setPhase('preview');}}/>
  );

  // Preview
  if (phase==='preview') {
    const p1E=aScore.reduce((s,v)=>s+(v??0),0);
    const p2E=bScore.reduce((s,v)=>s+(v??0),0);
    const p1B=players[p1Id]?.score??0;
    const p2B=players[p2Id]?.score??0;

    const renderGroup=(name,questions,playerOpts,guesses,scores)=>(
      <div className="flex flex-col gap-2">
        <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('fin_guessed',{name})}</p>
        {questions.map((q,i)=>{
          const allOpts=[...playerOpts[i],q?.a??''];
          return (
            <div key={i} className={`card px-3 py-3 border-2 ${scores[i]===5?'border-g-success bg-g-success/8':'border-g-border'}`}>
              {q?.q && <p className="text-g-text text-sm font-medium mb-1.5">{q.q}</p>}
              <p className="text-g-dim text-xs font-graffiti tracking-wider uppercase mb-0.5">{t('plan_q_n',{n:i+1})}</p>
              <p className="text-g-muted text-xs">{t('fin_options',{opts:allOpts.filter(Boolean).join(' · ')||'—'})}</p>
              <p className="text-g-muted text-xs mt-0.5">{t('fin_correct_was')} <span className="text-g-success font-medium">{q?.a||'—'}</span></p>
              {guesses[i]!==null&&(
                <p className={`text-xs font-graffiti tracking-wider uppercase mt-1.5 ${scores[i]===5?'text-g-success':'text-g-muted'}`}>
                  {t('fin_named',{opt:allOpts[guesses[i]]||'?'})} {scores[i]===5?t('fin_plus5'):t('fin_zero')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );

    return (
      <div className="flex flex-col bg-g-bg animate-fade-in" style={{height:'100dvh',maxWidth:'448px',margin:'0 auto'}}>
        <div className="shrink-0 px-4 pt-6 pb-4 border-b-2 border-g-border">
          <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('fin_summary_title')}</p>
          <p className="font-display text-3xl text-g-text tracking-wider">{t('final_round_title')}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <div className="flex flex-col gap-5">
            {renderGroup(p1Name,localQB,bOpts,aGuesses,aScore)}
            {renderGroup(p2Name,localQA,aOpts,bGuesses,bScore)}
            <div className="card px-4 py-4 border-2 border-g-border">
              <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase mb-3">{t('fin_final_score')}</p>
              {[[p1Id,p1Name,p1B,p1E],[p2Id,p2Name,p2B,p2E]].map(([id,name,base,earned])=>(
                <div key={id} className="flex items-center justify-between py-1">
                  <span className="text-g-text font-graffiti">{name}</span>
                  <span className="font-display text-lg tabular-nums">
                    <span className="text-g-muted">{base}</span>
                    {earned>0&&<span className="text-g-success"> +{earned}</span>}
                    <span className="text-g-text ml-1">= {base+earned}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 px-4 py-4 border-t-2 border-g-border bg-g-bg">
          <button className="btn-primary h-14 w-full" onClick={finalize}>{t('fin_announce')}</button>
        </div>
      </div>
    );
  }

  return null;
}
