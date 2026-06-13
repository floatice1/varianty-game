import { useState, useEffect, useRef } from 'react';
import { subscribeToGame, deleteGame, leaveGame } from './gameActions';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/game/GameScreen';
import { I18nProvider } from './i18n';
import { loadSettings, saveSettings } from './settings';

export default function App() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [kickNotice, setKickNotice] = useState(false);
  const lastPhaseRef = useRef(null);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.className = settings.theme;
  }, [settings.theme]);

  function updateSettings(s) { setSettings(s); saveSettings(s); }

  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('variants_session') || 'null'); }
    catch { return null; }
  });
  const [gameData,   setGameData]   = useState(null);
  const [connecting, setConnecting] = useState(!!session);

  useEffect(() => {
    if (!session?.gameCode) { setGameData(null); setConnecting(false); return; }
    setConnecting(true);
    const unsub = subscribeToGame(session.gameCode, data => {
      setConnecting(false);
      if (!data) {
        // Show notification only if game ended unexpectedly (not after normal game over)
        if (!session?.isGM && lastPhaseRef.current !== 'ended') setKickNotice(true);
        clearSession();
      } else if (!session.isGM && session.playerId && !data.players?.[session.playerId]) {
        // Session is stale — player's ID is no longer in the game.
        // Drop the session so the player can rejoin via HomeScreen (name + code).
        setSession(null); setGameData(null); setConnecting(false);
        localStorage.removeItem('variants_session');
      } else {
        lastPhaseRef.current = data.phase;
        setGameData(data);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.gameCode]);

  function saveSession(sess) {
    setSession(sess);
    localStorage.setItem('variants_session', JSON.stringify(sess));
  }
  async function clearSession() {
    if (session?.isGM && session?.gameCode) {
      try { await deleteGame(session.gameCode); } catch {}
    } else if (!session?.isGM && session?.gameCode && session?.playerId) {
      try { await leaveGame(session.gameCode, session.playerId); } catch {}
    }
    setSession(null); setGameData(null); setConnecting(false);
    localStorage.removeItem('variants_session');
  }
  function handleJoin({ gameCode, playerId, playerName, isGM }) {
    saveSession({ gameCode, playerId, playerName, isGM });
  }

  let content;
  if (!session) {
    content = <HomeScreen onJoin={handleJoin} settings={settings} onSettingsChange={updateSettings}
                kickNotice={kickNotice} onKickNoticeDismiss={() => setKickNotice(false)} />;
  } else if (connecting || !gameData) {
    content = (
      <div className="page items-center justify-center">
        <div className="w-12 h-12 border-2 border-g-border border-t-g-accent rounded-full animate-spin" />
      </div>
    );
  } else if (gameData.phase === 'lobby') {
    content = <LobbyScreen game={gameData} session={session} onLeave={clearSession} />;
  } else {
    content = <GameScreen game={gameData} session={session} onLeave={clearSession} />;
  }

  return <I18nProvider lang={settings.lang}>{content}</I18nProvider>;
}
