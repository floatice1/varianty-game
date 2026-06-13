import { useState, useEffect, useRef } from 'react';
import { savePresetRounds, saveFinalPrep } from '../gameActions';
import { useT } from '../i18n';

function RoundsTab({ t, count, entries, onCountChange, onEntryChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('plan_count_label')}</p>
        <div className="flex items-center gap-4">
          {[[-1,'−'],[1,'+']].map(([d, sym]) => (
            <button key={d}
              className="w-11 h-11 rounded-lg bg-g-surface border-2 border-g-border text-g-text font-display text-xl
                         hover:border-g-accent/50 active:scale-95 transition-all disabled:opacity-30"
              onClick={() => onCountChange(count + d)}
              disabled={d < 0 ? count <= 1 : count >= 15}
            >{sym}</button>
          ))}
          <span className="font-display text-3xl text-g-text w-10 text-center tabular-nums">{count}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {entries.map((e, i) => (
          <div key={i} className="bg-g-surface rounded-lg px-3 pt-2.5 pb-3 flex flex-col gap-2 border-2 border-g-border">
            <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{t('plan_round_n', {n: i+1})}</p>
            <input className="input py-2 text-sm" placeholder={t('plan_question_ph')}
              value={e.question || ''} maxLength={300}
              onChange={ev => onEntryChange(i, 'question', ev.target.value)} />
            <input className="input py-2 text-sm" placeholder={t('plan_correct_ph')}
              value={e.correct} maxLength={200}
              onChange={ev => onEntryChange(i, 'correct', ev.target.value)} />
            <input className="input py-2 text-sm" placeholder={t('plan_trap_ph')}
              value={e.wrong} maxLength={200}
              onChange={ev => onEntryChange(i, 'wrong', ev.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalTab({ t, qA, qB, onQA, onQB }) {
  const renderGroup = (label, qs, onChange) => (
    <div className="flex flex-col gap-2.5">
      <p className="text-g-muted text-xs font-graffiti tracking-widest uppercase">{label}</p>
      {qs.map((q, i) => (
        <div key={i} className="bg-g-surface rounded-lg px-3 pt-2.5 pb-3 flex flex-col gap-2 border-2 border-g-border">
          <p className="text-g-accent text-xs font-graffiti tracking-widest uppercase">{t('plan_q_n', {n: i+1})}</p>
          <input className="input py-2 text-sm" placeholder={t('plan_question_ph')}
            value={q.q || ''} maxLength={300}
            onChange={e => onChange(i, 'q', e.target.value)} />
          <input className="input py-2 text-sm" placeholder={t('plan_ans_ph')}
            value={q.a || ''} maxLength={200}
            onChange={e => onChange(i, 'a', e.target.value)} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      <p className="text-g-muted text-sm leading-relaxed">{t('plan_final_desc')}</p>
      {renderGroup(t('plan_pa'), qA, onQA)}
      {renderGroup(t('plan_pb'), qB, onQB)}
    </div>
  );
}

// ── localStorage cache for finalPrep — persists across games ──────────────
const FINAL_PREP_CACHE_KEY = 'variants_last_final_prep';

function loadCachedFinalPrep() {
  try { return JSON.parse(localStorage.getItem(FINAL_PREP_CACHE_KEY)) || null; }
  catch { return null; }
}

function saveCachedFinalPrep(data) {
  try { localStorage.setItem(FINAL_PREP_CACHE_KEY, JSON.stringify(data)); }
  catch {}
}

function finalPrepGroupHasContent(group) {
  if (!group) return false;
  return Object.values(group).some(q => q?.q || q?.a);
}

export default function PlanningPanel({ existingPresets, existingFinalPrep, gameCode }) {
  const t = useT();
  const hasPresets = existingPresets.length > 0;
  const hasFinal   = !!(existingFinalPrep?.questionsA?.length);
  const initCount  = Math.max(hasPresets ? existingPresets.length : 5, 1);

  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(`plan_expanded_${gameCode}`) === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(`plan_expanded_${gameCode}`, String(expanded)); }
    catch {}
  }, [expanded, gameCode]);
  const [tab,      setTab]      = useState('rounds');
  const [saving,   setSaving]   = useState(false);

  const [count,   setCountVal] = useState(initCount);
  const [entries, setEntries]  = useState(() =>
    Array(initCount).fill(null).map((_, i) => ({
      question: existingPresets[i]?.question  || '',
      correct:  existingPresets[i]?.correctAnswer || '',
      wrong:    existingPresets[i]?.wrongAnswer   || '',
    }))
  );

  // If Firebase has no finalPrep for this game, fall back to the last saved prep
  const [qA, setQA] = useState(() => {
    const srcA = finalPrepGroupHasContent(existingFinalPrep?.questionsA)
      ? existingFinalPrep.questionsA
      : (loadCachedFinalPrep()?.questionsA ?? null);
    return Array(3).fill(null).map((_, i) => ({
      q: srcA?.[i]?.q || '',
      a: srcA?.[i]?.a || '',
    }));
  });
  const [qB, setQB] = useState(() => {
    const srcB = finalPrepGroupHasContent(existingFinalPrep?.questionsB)
      ? existingFinalPrep.questionsB
      : (loadCachedFinalPrep()?.questionsB ?? null);
    return Array(3).fill(null).map((_, i) => ({
      q: srcB?.[i]?.q || '',
      a: srcB?.[i]?.a || '',
    }));
  });

  const entriesInitRef = useRef(false);
  const finalInitRef   = useRef(false);

  useEffect(() => {
    if (!entriesInitRef.current) { entriesInitRef.current = true; return; }
    const id = setTimeout(() => {
      savePresetRounds(gameCode, entries.map(e => ({
        question: e.question.trim(), correctAnswer: e.correct.trim(), wrongAnswer: e.wrong.trim(),
      }))).catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, [entries, gameCode]);

  useEffect(() => {
    if (!finalInitRef.current) { finalInitRef.current = true; return; }
    const id = setTimeout(() => {
      saveFinalPrep(gameCode, {
        questionsA: qA.map(q => ({ q: q.q.trim(), a: q.a.trim() })),
        questionsB: qB.map(q => ({ q: q.q.trim(), a: q.a.trim() })),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, [qA, qB, gameCode]);

  function changeCount(n) {
    const c = Math.max(1, Math.min(15, n));
    setCountVal(c);
    setEntries(prev => c > prev.length
      ? [...prev, ...Array(c - prev.length).fill(null).map(() => ({ question:'', correct:'', wrong:'' }))]
      : prev.slice(0, c)
    );
  }

  function updateEntry(i, f, v) { setEntries(p => p.map((e,j) => j===i ? {...e,[f]:v} : e)); }
  function updateQA(i, f, v)    { setQA(p => p.map((q,j) => j===i ? {...q,[f]:v} : q)); }
  function updateQB(i, f, v)    { setQB(p => p.map((q,j) => j===i ? {...q,[f]:v} : q)); }

  async function handleSave() {
    setSaving(true);
    try {
      const finalPrepData = {
        questionsA: qA.map(q => ({ q: q.q.trim(), a: q.a.trim() })),
        questionsB: qB.map(q => ({ q: q.q.trim(), a: q.a.trim() })),
      };
      await Promise.all([
        savePresetRounds(gameCode, entries.map(e => ({
          question: e.question.trim(), correctAnswer: e.correct.trim(), wrongAnswer: e.wrong.trim(),
        }))),
        saveFinalPrep(gameCode, finalPrepData),
      ]);
      saveCachedFinalPrep(finalPrepData);
      setExpanded(false);
    } finally { setSaving(false); }
  }

  if (!expanded) {
    const sub = [hasPresets && t('plan_sub_rounds', {n: existingPresets.length}), hasFinal && t('plan_sub_final')]
      .filter(Boolean).join(' · ') || t('plan_sub_empty');
    return (
      <button className="card w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:border-g-accent/30 transition-colors"
        onClick={() => setExpanded(true)}>
        <div className="flex items-center gap-3 text-left">
          <span className="text-xl shrink-0">📝</span>
          <div>
            <p className="text-g-text text-sm font-graffiti">{t('plan_btn_title')}</p>
            <p className="text-g-dim text-xs mt-0.5">{sub}</p>
          </div>
        </div>
        <span className="text-g-dim shrink-0">›</span>
      </button>
    );
  }

  return (
    <div
      className="fixed top-0 bottom-0 z-50 bg-g-bg flex flex-col overflow-hidden"
      style={{
        width: '100%',
        maxWidth: '448px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center justify-between px-4 pt-6 pb-4 border-b-2 border-g-border shrink-0">
        <p className="font-display text-xl text-g-text tracking-widest uppercase">{t('prep_title')}</p>
        <button className="w-10 h-10 flex items-center justify-center text-g-muted hover:text-g-text text-xl transition-colors"
          onClick={() => setExpanded(false)}>✕</button>
      </div>

      <div className="flex border-b-2 border-g-border shrink-0">
        {['rounds','final'].map(tab_ => (
          <button key={tab_}
            className={`flex-1 py-3.5 font-graffiti text-sm tracking-widest uppercase transition-colors border-b-2 -mb-0.5
              ${tab === tab_ ? 'text-g-accent border-g-accent' : 'text-g-muted border-transparent'}`}
            onClick={() => setTab(tab_)}>
            {tab_ === 'rounds' ? t('plan_tab_rounds') : t('plan_tab_final')}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {tab === 'rounds'
          ? <RoundsTab t={t} count={count} entries={entries} onCountChange={changeCount} onEntryChange={updateEntry} />
          : <FinalTab  t={t} qA={qA} qB={qB} onQA={updateQA} onQB={updateQB} />
        }
      </div>

      <div className="px-4 py-4 border-t-2 border-g-border bg-g-bg shrink-0">
        <button className="btn-primary h-14" onClick={handleSave} disabled={saving}>
          {saving ? t('plan_saving') : t('plan_save')}
        </button>
      </div>
    </div>
  );
}
