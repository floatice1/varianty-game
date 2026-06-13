import { useState, useEffect } from 'react';
import { getTimeLeft } from '../utils';

export default function Timer({ startedAt, duration, size = 'md' }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(startedAt, duration));

  useEffect(() => {
    setTimeLeft(getTimeLeft(startedAt, duration));

    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(startedAt, duration));
    }, 250);

    return () => clearInterval(id);
  }, [startedAt, duration]);

  const pct = Math.max(0, timeLeft / duration);
  const isDone = timeLeft === 0;
  const isLow = timeLeft > 0 && timeLeft <= 5;

  const color = isDone
    ? 'rgb(var(--g-dim))'
    : isLow
    ? 'rgb(var(--g-danger))'
    : 'rgb(var(--g-accent))';

  const textColor = isDone
    ? 'text-g-dim'
    : isLow
    ? 'text-g-danger'
    : 'text-g-text';

  const sizes = {
    sm: { svg: 48, r: 18, stroke: 3, text: 'text-sm' },
    md: { svg: 56, r: 21, stroke: 3, text: 'text-base' },
    lg: { svg: 72, r: 28, stroke: 4, text: 'text-2xl' },
  };
  const s = sizes[size] ?? sizes.md;
  const cx = s.svg / 2;
  const cyVal = s.svg / 2;
  const circ = 2 * Math.PI * s.r;
  const dash = circ * pct;

  return (
    <div className={`relative inline-flex items-center justify-center ${isLow && !isDone ? 'animate-pulse' : ''}`}>
      <svg width={s.svg} height={s.svg} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx}
          cy={cyVal}
          r={s.r}
          fill="none"
          stroke="rgb(var(--g-border))"
          strokeWidth={s.stroke}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cyVal}
          r={s.r}
          fill="none"
          stroke={color}
          strokeWidth={s.stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.25s linear, stroke 0.5s' }}
        />
      </svg>
      <span
        className={`absolute font-display font-bold tabular-nums ${s.text} ${textColor}`}
        style={{ transition: 'color 0.5s' }}
      >
        {isDone ? '✓' : timeLeft}
      </span>
    </div>
  );
}
