import { db } from './firebase';
import { ref, set, update, get, remove, onValue, onDisconnect } from 'firebase/database';
import { generateGameCode, generatePlayerId, buildAnswerOptions, computeScoreChanges } from './utils';

// ─────────────────────────────────────────────────────────
// Join / Create
// ─────────────────────────────────────────────────────────

export async function createGame(gmName) {
  const gameCode = generateGameCode();
  const playerId = generatePlayerId();

  await set(ref(db, `games/${gameCode}`), {
    phase: 'lobby',
    gmId: playerId,
    roundNumber: 0,
    createdAt: Date.now(),
    players: {
      [playerId]: { name: (gmName || '').trim(), score: 0, isGM: true },
    },
  });

  return { gameCode, playerId };
}

export async function deleteGame(gameCode) {
  // Cancel onDisconnect then explicitly remove
  onDisconnect(ref(db, `games/${gameCode}`)).cancel();
  await remove(ref(db, `games/${gameCode}`));
}

export async function leaveGame(gameCode, playerId) {
  await remove(ref(db, `games/${gameCode}/players/${playerId}`));
}

export async function joinGame(gameCode, playerName) {
  const snap = await get(ref(db, `games/${gameCode}`));
  if (!snap.exists()) throw new Error('err_not_found');

  const game = snap.val();
  if (game.phase !== 'lobby') throw new Error('err_started');

  const playerCount = Object.values(game.players || {}).filter(p => !p.isGM).length;
  if (playerCount >= 8) throw new Error('err_full');

  // Check for duplicate name (case-insensitive, non-GM players)
  const nameTaken = Object.values(game.players || {})
    .filter(p => !p.isGM)
    .some(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase());
  if (nameTaken) throw Object.assign(new Error('err_name_taken'), { name: playerName.trim() });

  const playerId = generatePlayerId();
  await update(ref(db, `games/${gameCode}/players`), {
    [playerId]: { name: playerName.trim(), score: 0, isGM: false },
  });

  return { playerId };
}

// ─────────────────────────────────────────────────────────
// Phase transitions (GM only)
// ─────────────────────────────────────────────────────────

export async function startGame(gameCode) {
  await update(ref(db, `games/${gameCode}`), { phase: 'setup' });
}

export async function startRound(gameCode, roundNumber, correctAnswer, wrongAnswer, timerDuration) {
  const updates = {
    phase: 'answering',
    roundNumber: roundNumber + 1,
    'round/timerDuration':    timerDuration,
    'round/answerTimerStart': Date.now(),
    'round/voteTimerStart':   null,
    'round/correctAnswer':    correctAnswer.trim(),
    'round/wrongAnswer':      wrongAnswer.trim(),
    'round/answers':          null,
    'round/options':          null,
    'round/votes':            null,
    'round/scoreChanges':     null,
  };
  await update(ref(db, `games/${gameCode}`), updates);
}

// Transition: answering → reviewing (builds shuffled options, displays them before voting)
export async function startReviewing(gameCode, answers, correctAnswer, wrongAnswer) {
  const options = buildAnswerOptions(answers || {}, correctAnswer, wrongAnswer);
  await update(ref(db, `games/${gameCode}`), {
    phase: 'reviewing',
    'round/options': options,
  });
}

// Transition: reviewing → voting (GM explicitly starts the vote + timer)
export async function startVoting(gameCode) {
  await update(ref(db, `games/${gameCode}`), {
    phase: 'voting',
    'round/voteTimerStart': Date.now(),
    'round/votes': null,
  });
}

export async function finalizeResults(gameCode, players, votes) {
  // Guard: only proceed if still in voting phase
  const snap = await get(ref(db, `games/${gameCode}/phase`));
  if (snap.val() !== 'voting') return;

  const nonGMIds = Object.entries(players || {})
    .filter(([, p]) => !p.isGM)
    .map(([id]) => id);

  // Normalize votes: extract optionId from { o, r } objects (or pass through legacy strings)
  const flatVotes = {};
  Object.entries(votes || {}).forEach(([pid, v]) => {
    flatVotes[pid] = (v && typeof v === 'object') ? v.o : v;
  });
  const changes = computeScoreChanges(flatVotes, nonGMIds);

  const updates = {
    phase: 'revealing',       // GM sees results first; players wait
    'round/scoreChanges': changes,
  };

  nonGMIds.forEach((id) => {
    updates[`players/${id}/score`] = (players[id]?.score ?? 0) + (changes[id] ?? 0);
  });

  await update(ref(db, `games/${gameCode}`), updates);
}

export async function showResults(gameCode) {
  await update(ref(db, `games/${gameCode}`), { phase: 'results' });
}

export async function nextRound(gameCode) {
  await update(ref(db, `games/${gameCode}`), { phase: 'setup' });
}

export async function backToResults(gameCode) {
  await update(ref(db, `games/${gameCode}`), { phase: 'results' });
}

export async function endGame(gameCode) {
  await update(ref(db, `games/${gameCode}`), { phase: 'ended' });
}

// ─────────────────────────────────────────────────────────
// Player actions
// ─────────────────────────────────────────────────────────

export async function submitAnswer(gameCode, playerId, answer) {
  await set(ref(db, `games/${gameCode}/round/answers/${playerId}`), answer.trim());
}

export async function submitVote(gameCode, playerId, optionId, roundNumber) {
  await set(ref(db, `games/${gameCode}/round/votes/${playerId}`), { o: optionId, r: roundNumber });
}

export async function removeVote(gameCode, playerId) {
  await remove(ref(db, `games/${gameCode}/round/votes/${playerId}`));
}

// ─────────────────────────────────────────────────────────
// Pre-planned round answers (GM only, before game starts)
// ─────────────────────────────────────────────────────────

export async function savePresetRounds(gameCode, rounds) {
  await set(ref(db, `games/${gameCode}/presetRounds`), rounds);
}

export async function saveFinalPrep(gameCode, prep) {
  // prep: { questionsA: [{q,a},...], questionsB: [{q,a},...] }
  await set(ref(db, `games/${gameCode}/finalPrep`), prep);
}

// ─────────────────────────────────────────────────────────
// Final round (GM only)
// ─────────────────────────────────────────────────────────

export async function startFinalRound(gameCode) {
  await update(ref(db, `games/${gameCode}`), { phase: 'final' });
}

export async function saveFinalPlayers(gameCode, player1Id, player2Id) {
  await update(ref(db, `games/${gameCode}/finalRound`), { player1Id, player2Id });
}

export async function endFinalRound(gameCode, scoreUpdates) {
  // scoreUpdates: { playerId: newTotalScore }
  const updates = { phase: 'ended' };
  Object.entries(scoreUpdates).forEach(([id, score]) => {
    updates[`players/${id}/score`] = score;
  });
  await update(ref(db, `games/${gameCode}`), updates);
}

// ─────────────────────────────────────────────────────────
// Score adjustment (GM only, during results phase)
// ─────────────────────────────────────────────────────────

export async function setPlayerScore(gameCode, playerId, newScore) {
  await set(ref(db, `games/${gameCode}/players/${playerId}/score`), newScore);
}

// ─────────────────────────────────────────────────────────
// Real-time subscription
// ─────────────────────────────────────────────────────────

export function subscribeToGame(gameCode, callback) {
  return onValue(ref(db, `games/${gameCode}`), (snap) => {
    callback(snap.val());
  });
}
