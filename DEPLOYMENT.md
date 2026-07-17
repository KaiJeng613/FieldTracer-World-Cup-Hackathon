# Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. "Page couldn't load" Error

This is typically caused by one of these issues:

#### Missing Environment Variables
Make sure these are set in your deployment platform:

**Required for Solana (public - safe to expose):**
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Required for TxLINE (private - keep secret):**
```
TXLINE_API_ORIGIN=https://txline-dev.txodds.com
TXLINE_GUEST_JWT=your_jwt_token
TXLINE_API_TOKEN=your_api_token
```

**Note:** The app works without TxLINE credentials but shows demo data.

#### Deployment Platform Configuration

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Redeploy

**Netlify:**
1. Site settings → Environment variables
2. Add each variable
3. Redeploy

**Railway/Render:**
1. Environment → Variables
2. Add each variable
3. Redeploy

### 2. Wallet Adapter Issues

The Solana wallet adapters can cause hydration errors. We've added:
- Mounted state check to prevent SSR issues
- Error catching for wallet initialization
- `autoConnect={false}` to prevent auto-connect errors

### 3. Build Output

Ensure your deployment platform is configured for Next.js:
- Build command: `npm run build`
- Start command: `npm start`
- Node version: 18.x or higher
- Output directory: `.next` (default)

### 4. API Routes Not Working

If `/api/txline/*` routes return 404:
- Ensure your platform supports Next.js API routes
- Check that the deployment is using Next.js runtime (not static export)
- Verify routes are in `app/api/` directory structure

### 5. CORS Issues

If you see CORS errors:
- API routes are server-side, shouldn't have CORS issues
- If using a custom domain, ensure it's properly configured
- Check if your deployment platform has CORS restrictions

## Testing Deployment

1. **Check if site loads:**
   - You should see the FieldTracer loading screen
   - Then the main app with replay studio

2. **Check API status:**
   - Open browser console (F12)
   - Check Network tab for `/api/txline/status` request
   - Should return JSON with `configured: true/false`

3. **Check fixtures loading:**
   - Network tab should show `/api/txline/fixtures` request
   - Match cards should appear in left sidebar

4. **Test match switching:**
   - Click a match card
   - Should show loading overlay
   - Scoreboard should update with new team names

## Debugging Steps

1. **Check browser console (F12):**
   ```
   Look for:
   - Red error messages
   - Failed network requests
   - Hydration errors
   ```

2. **Check deployment logs:**
   - Most platforms show build/runtime logs
   - Look for error stack traces
   - Check for missing dependencies

3. **Test locally:**
   ```bash
   npm run build
   npm start
   ```
   If it works locally, issue is deployment-specific

4. **Check environment variables:**
   - Verify they're set in deployment platform
   - Restart/redeploy after adding them
   - Check for typos in variable names

## Platform-Specific Notes

### Vercel
- Works out of the box with Next.js
- Automatically detects build settings
- Great for this project

### Netlify
- May need custom build settings
- Build command: `npm run build`
- Publish directory: `.next`
- Use Netlify Next.js plugin

### Cloudflare Pages
- Supports Next.js with workers
- May need edge runtime configuration
- Check compatibility with Solana adapters

## Still Having Issues?

1. Check the error boundary at `/app/error.tsx`
2. Look at browser console for specific errors
3. Verify all files were uploaded/deployed
4. Try clearing deployment cache and rebuilding
5. Ensure Node.js version is 18.x or higher

## Success Checklist

- [ ] Environment variables added to deployment platform
- [ ] Build completes successfully
- [ ] Site loads without errors
- [ ] Match list appears in sidebar
- [ ] Can click and load different matches
- [ ] Wallet connect button works (optional)
