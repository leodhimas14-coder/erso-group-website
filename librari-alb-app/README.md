# Librari Alb

Librari Alb is a Twitter/X-style microblogging app for Albania: short
public posts, replies, likes, follows — plus two features X doesn't have
out of the box:

- an **admin-only "Tema e Ditës" (Topic of the Day)**, a message the admin
  pins/pings to the top of *everyone's* feed in real time, e.g. to set a
  discussion topic for the day.
- a **"Fjala e Ditës" (Word of the Day) language game**: the admin posts a
  word (often a foreign loanword used in everyday Albanian, e.g.
  "frigorifer"), and users suggest and vote on a more genuinely Albanian
  alternative (e.g. "kuti ngrirëse"), with a comment thread to discuss.
  Reachable from a small draggable button the user can drag anywhere on
  screen.
- a **category picker**, opened from the Home button in the navbar: four
  fixed shortcuts (Lajmet e Fundit, Lajme Urgjente, Protesta, Tema e Ditës)
  plus a flat list of general topics (Sport, Kafshë, Politikë, Makina,
  Anime & Manga, ...). Posts can optionally be tagged with one of these when
  written, and picking a category filters the feed to just that topic.

This is the **Phase 1 scaffold**: project structure, a working feed/post/
reply/follow flow, JWT auth, the admin topic-of-the-day ping, and the
word-of-the-day game, all with live delivery over WebSockets. See the
[project brief](../README.md) — this app is separate from and unrelated to
the parent ERSO GROUP SHPK website; it just happens to live in the same
repository (following the same pattern as `../fast-food-ordering-system`).

## Structure

```
librari-alb-app/
  backend/     Node.js + Express API (auth, posts, replies, follows, daily topic, word game) + Socket.IO
  frontend/    React app (feed, profile, post detail, admin panel, word-of-the-day game)
```

## Tech stack

- **Frontend**: React 18 + Vite, react-router, socket.io-client
- **Backend**: Node.js + Express, Mongoose (MongoDB), JWT auth, socket.io
- **Hosting** (suggested, not wired up yet): Netlify (frontend) + Render/Railway (backend) + MongoDB Atlas

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in a MongoDB URI and a JWT secret
npm install
npm run dev             # http://localhost:4000
```

To post a "Tema e Ditës" ping, an account needs the `admin` role. Register
a normal account through the app first, then promote it:

```bash
cd backend
node src/scripts/makeAdmin.js <username>
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Everything is public to read; posting, liking, replying and following
require an account (`/regjistrohu` to register, `/hyrje` to log in). The
admin panel lives at `/admin` and is only reachable by an admin account.

## What's implemented vs. stubbed

- **Implemented**: registration/login (JWT), a public feed with pagination,
  posting (280-char limit), liking, threaded replies, follow/unfollow with
  follower/following counts, public profile pages, and the admin daily-topic
  ping — set via `POST /api/topics/daily`, broadcast instantly to every
  connected client over Socket.IO (`topic:updated`) and persisted so it's
  still shown to anyone who loads the app later. New posts also broadcast
  live (`post:created`) so open feeds update without a refresh.
- **"Fjala e Ditës" word game**: the admin sets a word + optional note via
  `POST /api/word-of-day` (`/admin` page), broadcast live over Socket.IO
  (`word:updated`). Users submit suggestions
  (`POST /api/word-of-day/:wordId/suggestions`), vote them up or down
  (`POST /api/word-of-day/suggestions/:suggestionId/vote`, toggled, one vote
  per user per suggestion), with vote changes broadcast live
  (`word:suggestion_updated`) and the current leader highlighted. A comment
  thread underneath (`GET`/`POST /api/word-of-day/:wordId/comments`) is for
  general discussion/opinions rather than suggestions themselves. The game
  is opened from `FloatingWordWidget`, a small square button rendered above
  every page that the user can drag anywhere on screen (position kept in
  `localStorage`, per browser).
- **Not built in Phase 1**: avatars/image uploads, direct messages,
  push notifications (the "ping"/word broadcasts are in-app/real-time only,
  not a device push), search, hashtags/trending, an in-app way to grant the
  `admin` role (use `makeAdmin.js` for now), rate limiting/spam controls,
  moderation tools (report/block/delete post), a limit of one suggestion
  per user per word round, and a formal "round closes, winner locked in" step
  (right now the leaderboard is just live vote counts, with no cutoff).
- **Natural next steps**: seed script for demo data, mobile-responsive
  polish, push notifications for the daily topic/word, a moderation queue
  for the admin panel, closing word-of-day rounds on a schedule.
