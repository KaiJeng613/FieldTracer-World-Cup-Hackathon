# FieldTracer

Interactive football replay and match-intelligence MVP built with Next.js, TxLINE, and Solana wallet adapters.

## What is implemented

- Interactive pitch replay with play/pause, speed, timeline scrubbing, camera presets, player selection, and tactical overlays.
- Match events modeled from the supplied raw TxLINE fixture `18209181` capture.
- **Dynamic fixture loading**: Click any match in the "Recent Matches" list to load and display that fixture's data from TxLINE.
- **Real-time data integration**: Fetches live fixture list and individual match data from TxLINE API.
- **Automatic data parsing**: Parses TxLINE event-stream format to extract teams, scores, events, goals, and lineups.
- Server-only TxLINE credential handling and historical-score proxy.
- Automatic demo fallback when TxLINE credentials are not configured.
- Phantom and Solflare wallet connections on Solana devnet.
- Wallet-signed replay proof message.
- Responsive replay studio, tactical analyst, metrics, event timeline, and match explorer.

TxLINE provides match events, scores, odds, and validation data. The supplied captures do not contain continuous player coordinates, so the MVP labels its player movement as reconstructed rather than provider-authentic.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Enable the TxLINE free tier

Complete the free-tier subscription and activation flow described in the [TxLINE World Cup guide](https://txline.txodds.com/documentation/worldcup). Then add the activated credentials to `.env.local`:

```dotenv
TXLINE_API_ORIGIN=https://txline-dev.txodds.com
TXLINE_GUEST_JWT=your_guest_jwt
TXLINE_API_TOKEN=your_activated_api_token
```

Never use `NEXT_PUBLIC_` for these credentials. The browser calls FieldTracer's server route, which adds the required `Authorization` and `X-Api-Token` headers upstream.

## Data routes

- `GET /api/txline/status` reports whether the server is in live or demo mode.
- `GET /api/txline/fixtures` fetches the list of available fixtures from TxLINE (or returns demo data if not configured).
- `GET /api/txline/fixture/:fixtureId` proxies TxLINE historical score data when credentials are configured.

## How match switching works

1. When the app loads, it fetches the fixture list from `/api/txline/fixtures`
2. Matches appear in the "Recent Matches" sidebar - click any match to load it
3. When clicked, the app fetches that fixture's full data from `/api/txline/fixture/:fixtureId`
4. The TxLINE parser (`lib/txline-parser.ts`) converts the event-stream format into replay data
5. The scoreboard, players, events, and pitch update to show the selected match
6. A loading overlay appears during data fetching

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
