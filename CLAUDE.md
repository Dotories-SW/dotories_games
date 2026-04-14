# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server on 0.0.0.0:3000 with Turbopack
npm run build    # Production build (static export to /out)
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture

**Next.js 15 App Router** with static export. Five browser-based Korean educational games, each fully self-contained in its own folder under `app/`.

### Game Folder Convention

Every game follows this exact pattern:

```
app/[game_name]/
├── page.tsx          # "use client" React component (UI only)
├── use[GameName].ts  # Custom hook — all game state & logic
├── types.ts          # TypeScript interfaces
└── utils.ts          # Pure helper functions (question gen, scoring, etc.)
```

The hook owns all state (`useState`, `useRef`, `useCallback`, `useEffect`). The page component only renders and calls the hook.

### Shared Utilities

- `app/_api/gameApi.ts` — Axios client for the backend API (`https://api.braincash.dotories.com/v1`). Two endpoints: `getGameCompleted()` and `patchCompletedGame()`.
- `app/_hooks/useGameTimer.ts` — Timer hook tracking session duration.
- `app/_component/` — Shared UI components (e.g., `LoadingSpinner`).
- `app/constants/constants.ts` — `BASE_LOGIN_ID` and other global constants.

### Game Features Pattern

All games share these features:
- Difficulty levels (Easy / Normal / Hard) with different coin rewards
- Backend score sync via `gameApi.ts`
- Sound effects managed via React refs (`/public/sounds/[game_name]/`)
- Ad-watching mechanic for doubled coin rewards
- Mobile-first responsive UI with Tailwind CSS 4

### Physics Game

`box_stacking_game/` uses **Planck.js (`planck-js`)** for physics simulation with a Canvas-based renderer — unlike the other four games which are pure React state. It runs a fixed-timestep physics loop, handles device tilt and touch input, and renders dust/score effects on the canvas.

### Deployment

- Static export (`next.config.ts` sets `output: 'export'`)
- GitHub Actions deploys to two self-hosted Ubuntu servers via SSH + PM2 (`npx serve out -l 3000`)
- Environment variables in `.env.local`: `NEXT_PUBLIC_BACK_API_URL`, `NEXT_PUBLIC_AUTHORIZATION_NAME`, `NEXT_PUBLIC_AUTHORIZATION_PASSWORD`
