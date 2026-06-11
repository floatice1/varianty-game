import { useT } from '../i18n';

function getOptionMeta(option, players, t) {
  if (option.id === 'gm_correct') return { cardClass:'answer-card-correct', label: t('ar_correct'), labelClass:'text-g-success' };
  if (option.id === 'gm_wrong')   return { cardClass:'answer-card-wrong',   label: t('ar_trap'),    labelClass:'text-g-danger'  };
  const name = players[option.id]?.name ?? '?';
  return { cardClass:'answer-card-neutral', label: t('ar_player', {name}), labelClass:'text-g-muted' };
}

export default function AnswerReveal({ options, votes, players }) {
  const t = useT();
  const votesByOption = {};
  Object.entries(votes || {}).forEach(([vid, cid]) => {
    if (!votesByOption[cid]) votesByOption[cid] = [];
    votesByOption[cid].push(vid);
  });

  return (
    <div className="flex flex-col gap-3">
      {options.map(option => {
        const meta      = getOptionMeta(option, players, t);
        const voterNames = (votesByOption[option.id] || []).map(id => players[id]?.name).filter(Boolean);
        return (
          <div key={option.id} className={meta.cardClass}>
            <p className="text-g-text text-base leading-relaxed">{option.text}</p>
            <p className={`text-xs mt-1.5 font-medium ${meta.labelClass}`}>{meta.label}</p>
            {voterNames.length > 0 && (
              <p className="text-g-dim text-xs mt-1">{t('ar_chosen', {names: voterNames.join(', ')})}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
