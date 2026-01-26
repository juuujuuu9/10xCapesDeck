# Bunny CDN Troubleshooting Guide

## ⚠️ CRITICAL: Pull Zone Origin URL Issue

**If your pull zone origin is set to `capabilities.times10.net` but that domain now points to your new Vercel site (not WordPress), this will cause 403/404 errors!**

### The Problem
- Pull zone origin: `capabilities.times10.net` (was WordPress, now Vercel)
- When Bunny CDN tries to fetch WordPress images, it requests from Vercel instead
- Vercel doesn't have WordPress files → 403/404 errors

### The Fix: Update Pull Zone Origin URL

1. **Find Your WordPress Site's Actual URL**
   - Where is WordPress actually hosted now?
   - Could be: `wordpress.times10.net`, `wp.times10.net`, or a different server
   - Check your WordPress hosting provider or DNS settings

2. **Update Pull Zone Origin**
   - Go to Bunny CDN Dashboard → **Pull Zones** → `capeswp`
   - Click **General** tab (or **Origin** tab)
   - Find **Origin URL** or **Pull From** field
   - Change from: `https://capabilities.times10.net`
   - Change to: `https://[your-actual-wordpress-url]` (e.g., `https://wordpress.times10.net`)
   - Click **Save**

3. **Purge Cache**
   - Go to **Cache** tab → Click **Purge Cache** or **Purge All**
   - Wait 2-3 minutes for changes to propagate

4. **Test**
   - Images should now load correctly
   - Bunny CDN will pull from the correct WordPress origin

### Alternative: If WordPress Is No Longer Accessible

If WordPress is completely gone and you can't access it:

1. **Migrate Images to Bunny Storage**
   - Download all WordPress images from your old backup
   - Upload them to Bunny Storage zone
   - Update code to use `pullZone: 'storage'` instead of `pullZone: 'wordpress'`

2. **Or Use Storage Pull Zone for Everything**
   - Upload WordPress images to Storage
   - Keep same folder structure: `/wp-content/uploads/...`
   - Update environment variables to use storage pull zone

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

### Where to Find Settings (If Hotlink Protection Not Visible)

The Bunny CDN interface may vary. Try these locations:

1. **Check All Tabs in Pull Zone:**
   - **General** tab → Look for "Security" or "Access" settings
   - **Security** tab → Look for "Hotlink Protection", "Referrer", or "Access Control"
   - **Settings** tab → Check for security options
   - **Advanced** tab → May contain security settings

2. **Alternative Names to Look For:**
   - "Hotlink Protection"
   - "Referrer Restrictions"
   - "Access Control"
   - "Domain Restrictions"
   - "Allowed Domains"
   - "Whitelist"

3. **If Still Not Found - Use Edge Rules (Alternative Solution):**
   - Go to your pull zone → **Edge Rules** tab
   - Create a new rule to allow your domain:
     ```
     Condition: Request Header Referer contains "capabilities.times10.net"
     Action: Allow
     ```
   - Or create a rule to remove referrer restrictions entirely

4. **Contact Bunny CDN Support:**
   - If you can't find these settings anywhere
   - Ask them: "How do I disable referrer restrictions or allow my custom domain `capabilities.times10.net` to access my pull zone?"
   - They can guide you to the exact location or configure it for you

### Alternative: Check Other Security Settings

If you can't find Hotlink Protection, check these other settings that might cause 403 errors:

1. **IP Access Control**
   - Location: Pull Zone → **Security** tab → **IP Access Control**
   - Should be **Disabled** or **Allow All**
   - If enabled, make sure your server IPs are whitelisted

2. **Token Authentication**
   - Location: Pull Zone → **Security** tab → **Token Authentication**
   - Should be **Disabled** (unless you're using tokens)
   - If enabled, images need token parameters in URLs

3. **Country Blocking**
   - Location: Pull Zone → **Security** tab → **Country Blocking**
   - Should be **Disabled** (unless you want geographic restrictions)

4. **Edge Rules**
   - Location: Pull Zone → **Edge Rules** tab
   - Check if any rules are blocking requests
   - Look for rules that check Referer header

5. **Account Status**
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
   - If you can't find hotlink protection settings OR still getting 403 errors
   - Ask: "How do I allow my custom domain `capabilities.times10.net` to access my pull zones?"
   - Provide them with:
     - Your pull zone names: `capeswp` and `times-10-video-offload`
     - Your custom domain: `capabilities.times10.net`
     - Example failing URL from browser console
     - Screenshot of your Security tab (if possible)

### Quick Test: Is It Really Referrer Restrictions?

Before spending time finding settings, test if referrer restrictions are the issue:

1. **Open a new incognito/private browser window**
2. **Visit your custom domain**: `https://capabilities.times10.net`
3. **Open browser console** (F12) → Network tab
4. **Try accessing an image directly** by typing this in the address bar:
   ```
   https://capeswp.b-cdn.net/wp-content/uploads/2025/02/brands_0018_universal.png?width=150&quality=75
   ```
5. **Check the result:**
   - ✅ **If image loads**: Referrer restrictions ARE the issue - you need to configure Bunny CDN
   - ❌ **If image fails with 403**: Could be account balance, IP restrictions, or other security settings
   - ❌ **If image fails with 404**: File doesn't exist in pull zone
