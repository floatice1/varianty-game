import { useT } from '../i18n';

export default function Scoreboard({ players, changes = {}, compact = false }) {
  const t = useT();
  const sorted = Object.entries(players || {})
    .filter(([, p]) => !p.isGM)
    .sort(([, a], [, b]) => b.score - a.score);

  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      {sorted.map(([id, p]) => {
        const delta = changes[id];
        return (
          <div key={id}
            className={`flex items-center justify-between rounded-lg border-2 border-g-border bg-g-card transition-colors ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-g-text font-graffiti ${compact ? 'text-sm' : 'text-base'} truncate`}>{p.name}</span>
              {p.isGM && <span className="badge-gm">{t('gm_badge')}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {delta !== undefined && delta !== 0 && (
                <span className={`text-xs font-graffiti font-bold tabular-nums ${delta > 0 ? 'text-g-success' : 'text-g-danger'}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
              <span className={`font-display font-bold tabular-nums text-g-text ${compact ? 'text-base' : 'text-lg'}`}>
                {p.score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
