# FieldTracer

Interactive football replay and match-intelligence MVP built with Next.js, TxLINE, and Solana wallet adapters.

## What is implemented

- Interactive pitch replay with play/pause, speed, timeline scrubbing, camera presets, player selection, and tactical overlays.
- Match events modeled from the supplied raw TxLINE fixture `18209181` capture.
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
- `GET /api/txline/fixture/:fixtureId` proxies TxLINE historical score data when credentials are configured.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
