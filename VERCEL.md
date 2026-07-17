# Vercel Deployment Guide

## Quick Deploy

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub/GitLab repository
   - Vercel auto-detects Next.js settings

2. **Environment Variables (Optional)**
   
   The app works **without** TxLINE credentials using demo data. To enable live TxLINE data:

   Go to Project Settings → Environment Variables and add:

   ```
   TXLINE_API_ORIGIN=https://txline-dev.txodds.com
   TXLINE_GUEST_JWT=your_jwt_token_here
   TXLINE_API_TOKEN=your_api_token_here
   ```

   For Solana (these are public, already in code):
   ```
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Your app is live!

## How It Works on Vercel

### Without TxLINE Credentials
✅ Shows France vs Morocco match with full replay data (hardcoded)
✅ Shows 5 other demo matches in sidebar
✅ Other matches clickable but show limited data
✅ Wallet features work (save moments to Solana)
✅ All UI features functional

### With TxLINE Credentials
✅ Everything above, plus:
✅ Live fixture data from TxLINE API
✅ Real match details when clicking other fixtures
✅ Up-to-date scores and lineups

## Default Match Priority

The app **always** shows France vs Morocco (fixture 18209181) as the first match with full data:
- ✅ Complete player names and positions
- ✅ Correct team colors (blue/red jerseys)
- ✅ Goal highlights with scorers
- ✅ Event timeline
- ✅ All camera angles and features

This ensures the app looks great even without TxLINE credentials.

## Troubleshooting

### Issue: White player jerseys / Missing player names

**Cause:** App tried to load fixture data but couldn't

**Solution:** 
1. Check browser console (F12) for errors
2. Verify France vs Morocco is first in match list
3. Clear browser cache and hard reload (Ctrl+F5)
4. Redeploy on Vercel

### Issue: "No highlights available"

**Cause:** Wrong fixture selected on load

**Solution:**
1. Click on "France vs Morocco" match in sidebar
2. Should immediately show 2 goal highlights
3. If not, redeploy with latest code

### Issue: TxLINE API not working

**Solution:**
1. Verify environment variables are set in Vercel
2. Check variable names (no typos)
3. Redeploy after adding/changing variables
4. Test `/api/txline/status` endpoint:
   ```
   https://your-app.vercel.app/api/txline/status
   ```
   Should return:
   ```json
   {
     "configured": true,
     "mode": "live",
     "network": "devnet",
     "message": "TxLINE credentials are configured server-side."
   }
   ```

### Issue: Build fails on Vercel

**Common causes:**
1. TypeScript errors → Run `npm run typecheck` locally first
2. Missing dependencies → Run `npm install` and commit package-lock.json
3. ESLint errors → Run `npm run lint` locally

**Solution:**
1. Check build logs in Vercel dashboard
2. Fix errors locally
3. Push fixes to repository
4. Vercel auto-redeploys

## Testing Deployment

After deployment, verify:

1. **Main page loads** - Should see France vs Morocco with colored jerseys
2. **Players visible** - Should see player names and numbers
3. **Highlights work** - Should see 2 goal cards (59' and 65')
4. **Match switching** - Click other matches (loads if TxLINE configured)
5. **Wallet connect** - Connect Phantom/Solflare wallet
6. **Save moment** - Click "Save Moment" button (requires connected wallet)

## Performance on Vercel

- ⚡ **Cold start:** ~500ms (serverless functions)
- ⚡ **API routes:** ~200-800ms (depending on TxLINE)
- ⚡ **Static assets:** Instant (Edge CDN)
- ⚡ **Client hydration:** ~1-2s

## Custom Domain

1. Go to Project Settings → Domains
2. Add your domain (e.g., `fieldtracer.app`)
3. Follow DNS instructions
4. SSL certificate auto-configured

## Monitoring

Vercel provides:
- **Analytics:** User visits, page views
- **Speed Insights:** Core Web Vitals
- **Function Logs:** API route debugging
- **Build Logs:** Deployment history

Access at: `vercel.com/your-project/analytics`

## Costs

- **Hobby Plan:** FREE
  - ✅ Unlimited deployments
  - ✅ 100GB bandwidth/month
  - ✅ Automatic HTTPS
  - ✅ Perfect for this project

- **Pro Plan:** $20/month
  - More bandwidth
  - Team features
  - Analytics

## Environment-Specific Configs

### Development
```bash
npm run dev
# Uses local .env.local file
```

### Production (Vercel)
```bash
# Uses Vercel environment variables
# Set in Project Settings → Environment Variables
```

### Preview Deployments
- Every pull request gets a preview URL
- Test changes before merging to main
- Inherits environment variables from production

## Support

If issues persist:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for general troubleshooting
2. Review Vercel logs: Project → Deployments → [Latest] → View Logs
3. Test locally with `npm run build && npm start`
4. Ensure you're on latest commit

## Success Checklist

Before going live, verify:
- [ ] France vs Morocco shows with blue/red jerseys
- [ ] Player names visible on pitch
- [ ] 2 goal highlights appear
- [ ] Can play/pause replay
- [ ] Wallet connect button works
- [ ] "Save Moment" button visible
- [ ] Other matches clickable
- [ ] No console errors (F12)
- [ ] Mobile responsive (test on phone)
