/** Generate a 6-char game code (no ambiguous chars) */
export function generateGameCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Generate a unique player ID */
export function generatePlayerId() {
  return `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Fisher-Yates shuffle */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build shuffled voting options from player answers + GM correct/wrong answers.
 * Returns array of { id, text } — id is playerId | 'gm_correct' | 'gm_wrong'.
 */
export function buildAnswerOptions(answers, correctAnswer, wrongAnswer) {
  const options = Object.entries(answers || {}).map(([playerId, text]) => ({
    id: playerId,
    text: String(text).trim(),
  }));
  options.push({ id: 'gm_correct', text: correctAnswer.trim() });
  options.push({ id: 'gm_wrong', text: wrongAnswer.trim() });
  return shuffle(options);
}

/**
 * Compute score changes after voting.
 * Rules:
 *   gm_correct chosen  → voter +2
 *   gm_wrong chosen    → voter -1
 *   playerId chosen    → that player +1  (voter gets 0, self-vote ignored)
 */
export function computeScoreChanges(votes, nonGMPlayerIds) {
  const changes = {};
  nonGMPlayerIds.forEach((id) => (changes[id] = 0));

  Object.entries(votes || {}).forEach(([voterId, choice]) => {
    if (choice === 'gm_correct') {
      changes[voterId] = (changes[voterId] ?? 0) + 2;
    } else if (choice === 'gm_wrong') {
      changes[voterId] = (changes[voterId] ?? 0) - 1;
    } else if (choice !== voterId && changes[choice] !== undefined) {
      // Voted for another player's answer — that player gets +1
      changes[choice] = (changes[choice] ?? 0) + 1;
    }
  });

  return changes;
}

/**
 * Convert Firebase "array-as-object" (keys: "0","1","2"…) back to a JS array.
 * Firebase drops consecutive integer keys into numbered object keys.
 */
export function arrayFromFirebase(fbObj) {
  if (!fbObj) return [];
  if (Array.isArray(fbObj)) return fbObj;
  return Object.keys(fbObj)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => fbObj[k]);
}

/** Seconds remaining on a timer; 0 if expired */
export function getTimeLeft(startedAt, duration) {
  if (!startedAt) return duration;
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, duration - elapsed);
}

/** Format seconds as mm:ss or just s */
export function formatTime(seconds) {
  return seconds <= 0 ? '0' : String(seconds);
}
