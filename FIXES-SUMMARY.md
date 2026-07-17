# Fixes Summary - White Jerseys & Missing Data

## Problems Fixed

### 1. ❌ White Player Jerseys
**Cause:** App was trying to load fixture 18209181 from TxLINE API on Vercel, but credentials not configured
**Fix:** Always use hardcoded data for France vs Morocco match (18209181), never fetch from API

### 2. ❌ Missing Player Names
**Cause:** Empty player array when fixture data couldn't load
**Fix:** Always use default player data for fixture 18209181

### 3. ❌ Missing Highlights
**Cause:** Empty highlights array when using fetched data
**Fix:** Always use default 2 goal highlights for fixture 18209181

## Changes Made

### `components/fieldtracer-app.tsx`
- **Line ~144-150:** Changed data fallback logic to use defaults for fixture 18209181
- **Line ~160-175:** Added check to skip API fetch for fixture 18209181
- **Line ~157:** Initialize `selectedHighlightId` with default value

### `app/api/txline/fixtures/route.ts`
- **Line ~30-40:** Ensure France vs Morocco is always first in response
- **Line ~55-75:** When live data available, sort to put 18209181 first

### `app/api/txline/fixture/[fixtureId]/route.ts`
- **Line ~15-25:** Return success message for fixture 18209181 when credentials missing
- Tells client to use hardcoded data instead of failing

## How It Works Now

```
User visits site
   ↓
App loads
   ↓
Fetches /api/txline/fixtures → Returns list with France first
   ↓
Selected fixture = 18209181 (France)
   ↓
useEffect checks: Is this 18209181?
   ↓
   YES → Use hardcoded data (players, highlights, events)
   NO  → Fetch from /api/txline/fixture/[id]
   ↓
Display replay with colored jerseys, names, highlights ✅
```

## Testing Locally

```bash
# Without TxLINE credentials
npm run dev
# Should show France match with full data

# With TxLINE credentials in .env.local
TXLINE_GUEST_JWT=your_jwt
TXLINE_API_TOKEN=your_token
npm run dev
# Should show France match + load other matches from API
```

## Vercel Deployment

### Without TxLINE credentials (Demo Mode)
✅ France vs Morocco works perfectly
✅ Shows 5 other demo matches
✅ Other matches show basic info only

### With TxLINE credentials
✅ France vs Morocco works perfectly
✅ Shows real fixtures from TxLINE
✅ Other matches load full data when clicked

## Environment Variables on Vercel

**Optional (for live TxLINE data):**
```
TXLINE_API_ORIGIN=https://txline-dev.txodds.com
TXLINE_GUEST_JWT=your_jwt_token
TXLINE_API_TOKEN=your_api_token
```

**Already in code (public):**
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## What Users See

### ✅ Working (Default Match)
- Blue jerseys for France
- Red jerseys for Morocco
- Player names: Mbappé, Dembélé, Griezmann, etc.
- 2 goal highlights (59' and 65')
- Full event timeline
- All camera angles
- Save moment feature

### ⚠️ Limited (Other Matches Without TxLINE)
- Match cards visible in sidebar
- Basic scores and team names
- Clicking loads but shows limited data
- No highlights or detailed events

### ✅ Full (Other Matches With TxLINE)
- Real-time fixture data
- Complete match details
- Goals and events from TxLINE
- Parsed lineup data

## Files to Deploy

Make sure these files are committed and pushed:

```
✅ components/fieldtracer-app.tsx (updated logic)
✅ app/api/txline/fixtures/route.ts (sorting logic)
✅ app/api/txline/fixture/[fixtureId]/route.ts (demo mode handling)
✅ lib/replay-moments.ts (save moment feature)
✅ components/save-moment-dialog.tsx (UI dialog)
✅ app/replay/[signature]/page.tsx (view saved moments)
```

## Verification Steps

After deploying to Vercel:

1. **Open site** - Should load without errors
2. **Check jerseys** - France blue, Morocco red
3. **Check names** - "Mbappé", "Dembélé" visible on hover
4. **Check highlights** - 2 goal cards showing
5. **Check console** - No red errors (F12)
6. **Test wallet** - Connect Phantom wallet
7. **Test save** - Click "Save Moment" button
8. **Test switching** - Click other matches (loads partially)

## Rollback Plan

If issues persist after deploying:

```bash
# Revert to last working commit
git log --oneline  # Find last good commit
git revert <commit-hash>
git push origin main

# Vercel auto-redeploys
```

## Support

If problems continue:
1. Check Vercel deployment logs
2. Verify build succeeded
3. Test API endpoints directly:
   - `https://your-app.vercel.app/api/txline/status`
   - `https://your-app.vercel.app/api/txline/fixtures`
4. Clear browser cache (Ctrl+Shift+Del)
5. Try incognito/private window

## Success Indicators

✅ No white jerseys
✅ Player names visible
✅ Goal highlights showing
✅ Timeline has events
✅ "Save Moment" button present
✅ Wallet connect works
✅ No console errors
