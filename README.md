# Варіанти — Party Game

Multiplayer web party game for 2–8 players. Built with Vite + React + Firebase Realtime Database.

## Tech Stack

- **Frontend:** Vite 5 + React 18
- **Realtime sync:** Firebase Realtime Database
- **Styling:** Tailwind CSS + Space Grotesk / Inter fonts
- **Deployment:** Vercel (static SPA)

---

## Setup Guide

### 1. Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project
2. In the sidebar: **Build → Realtime Database → Create Database**
   - Pick a region (e.g. `europe-west1`)
   - Start in **test mode** (you'll tighten rules in the next step)
3. Go to **Realtime Database → Rules** and paste:

```json
{
  "rules": {
    "games": {
      "$gameCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

4. Go to **Project Settings (⚙) → Your apps → Add app → Web**
5. Copy your Firebase config — you'll need it in the next step

---

### 2. Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **Important:** `VITE_FIREBASE_DATABASE_URL` must be your Realtime Database URL (visible on the Database page in Firebase Console — it looks like `https://your-project-default-rtdb.regioncode.firebasedatabase.app`).

---

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

To test multiplayer locally, open the same URL in multiple tabs or on multiple devices on the same network.

---

### 4. Deploy to Vercel

**Option A — Vercel CLI (quickest):**

```bash
npm run build
npx vercel --prod
```

When prompted, add your `VITE_FIREBASE_*` environment variables.

**Option B — GitHub Integration:**

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. In **Environment Variables**, add all 7 `VITE_FIREBASE_*` keys from your `.env`
4. Click **Deploy**

The `vercel.json` already includes the SPA rewrite rule so all routes resolve correctly.

---

## How to Play

### Roles

- **Ведучий (GM)** — creates the game, controls each phase
- **Гравці** — join with the 6-character code

### Round Flow

| Phase | Who acts | What happens |
|-------|----------|-------------|
| **Підготовка** | GM | Announces the question verbally; enters correct answer + trap answer; picks timer (20s or 30s) |
| **Відповіді** | Players | Type their answer within the timer; GM sees who submitted |
| **Голосування** | Players | All answers are shown anonymously (shuffled); players pick the one they think is correct (20s) |
| **Результати** | GM | All answers are revealed with attribution; scores updated; GM may adjust scores before continuing |

### Scoring

| Action | Points |
|--------|--------|
| Chose the correct answer | **+2** |
| Another player chose your answer | **+1** per vote |
| Chose GM's trap answer | **−1** |
| Own answer / didn't answer | 0 |

### Score Adjustments (GM)

During the **Results** phase, the GM can manually adjust any player's score using **±1** or **±5** buttons. Each adjustment requires confirmation before it's applied. The GM cannot start the next round or make another adjustment until the current one is confirmed or cancelled.

---

## Project Structure

```
src/
  firebase.js          — Firebase init
  utils.js             — Game logic helpers (shuffle, scoring, etc.)
  gameActions.js       — All Firebase read/write operations
  App.jsx              — Session management + top-level routing
  index.css            — Tailwind + design system CSS classes
  components/
    Timer.jsx          — SVG circular countdown
    Scoreboard.jsx     — Sorted player score list
  screens/
    HomeScreen.jsx     — Join / create game
    LobbyScreen.jsx    — Waiting room
    game/
      GameScreen.jsx   — Phase router + EndedScreen
      SetupPhase.jsx   — GM prepares answers
      AnsweringPhase.jsx  — Players submit answers
      VotingPhase.jsx  — Players vote
      ResultsPhase.jsx — Reveal + score adjustment
```
