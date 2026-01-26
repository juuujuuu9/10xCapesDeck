# Bunny CDN Troubleshooting Guide

## 403 Errors on Custom Domain (Images Work on Vercel Domain)

If images work on `*.vercel.app` but fail with 403 errors on your custom domain, this is a **Referrer Restrictions** (Hotlink Protection) issue.

### Step-by-Step Fix

1. **Log into Bunny CDN Dashboard**
   - Go to https://bunny.net
   - Sign in to your account

2. **Fix WordPress Pull Zone (`capeswp.b-cdn.net`)**
   - Click **Pull Zones** → Click on `capeswp`
   - Click **Security** tab (left sidebar)
   - Scroll to **Hotlink Protection** section
   - **Option A (Recommended): Disable Hotlink Protection**
     - Set **Enable Hotlink Protection** to **Disabled**
     - Click **Save** at the bottom
   - **Option B: Whitelist Your Domain**
     - Set **Enable Hotlink Protection** to **Enabled**
     - In **Allowed Referrers** field, add:
       ```
       capabilities.times10.net
       www.capabilities.times10.net
       ```
     - Leave **Blocked Referrers** empty
     - Click **Save**

3. **Fix Storage Pull Zone (`times-10-video-offload.b-cdn.net`)**
   - Repeat the same steps as above
   - Either disable hotlink protection OR add your domain to allowed referrers

4. **Clear Cache (Optional)**
   - In each pull zone, go to **Cache** tab
   - Click **Purge Cache** or **Purge All**
   - Wait 2-3 minutes for changes to propagate

5. **Test**
   - Visit `https://capabilities.times10.net`
   - Check browser console - 403 errors should be gone
   - Images should load correctly

### Where to Find Settings

If you can't find "Hotlink Protection" in Security tab:
- Look for **"Referrer Restrictions"** or **"Access Control"**
- Some Bunny CDN interfaces show it under **"Security"** → **"Hotlink Protection"**
- If still not found, check **"General"** tab for security settings

### Alternative: Check Account Status

If 403 errors persist after configuring referrer restrictions:
- Go to **Account** → **Billing**
- Ensure account balance is positive (not negative)
- Check for any account suspensions or payment issues

## 404 Errors (File Not Found)

### Video Poster Image 404
- Error: `Times10-Reel-AaronCut-V7-09012025.jpg` returns 404
- **Fix**: Upload the poster image to Bunny Storage
  1. Go to **Storage** → Select your storage zone
  2. Upload `Times10-Reel-AaronCut-V7-09012025.jpg` to the root
  3. Or update the code to use a different poster image path

### Missing Files in Storage
- Check that files exist in your Storage zone
- Paths are case-sensitive
- Ensure files are uploaded to the correct storage zone

## Astro Hydration Errors

If you see errors like `Failed to fetch dynamically imported module`:
- This is usually a Vercel deployment issue, not Bunny CDN
- Try redeploying your site
- Check Vercel build logs for errors
- Ensure environment variables are set correctly in Vercel

## Quick Checklist

- [ ] Hotlink Protection disabled OR custom domain added to allowed referrers
- [ ] Changes applied to BOTH pull zones (WordPress and Storage)
- [ ] Cache purged (optional but recommended)
- [ ] Account balance is positive
- [ ] Environment variables set in Vercel
- [ ] Site redeployed after Bunny CDN changes

## Still Not Working?

1. **Check Browser Console**
   - Open DevTools → Network tab
   - Look at the exact URL being requested
   - Check the response headers for clues

2. **Test Direct CDN URL**
   - Try accessing an image directly: `https://capeswp.b-cdn.net/wp-content/uploads/2025/02/brands_0018_universal.png?width=150&quality=75`
   - If this works, the issue is referrer restrictions
   - If this fails, check account status or file existence

3. **Contact Bunny CDN Support**
   - If settings look correct but still getting 403 errors
   - Provide them with:
     - Your pull zone names
     - Your custom domain
     - Example failing URL from browser console
