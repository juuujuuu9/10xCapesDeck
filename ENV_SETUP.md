# Environment Variables Setup

Copy this to your `.env` file in the project root:

```bash
# WordPress pull zone (existing content from WordPress)
PUBLIC_BUNNY_CDN_URL_WORDPRESS=https://capeswp.b-cdn.net

# Storage pull zone (new content for this site)
PUBLIC_BUNNY_CDN_URL_STORAGE=https://times-10-video-offload.b-cdn.net

# Default fallback (set to WordPress)
PUBLIC_BUNNY_CDN_URL=https://capeswp.b-cdn.net
```

## Quick Start

1. Create `.env` file in project root
2. Copy all the URLs above (WordPress and Storage are ready)
3. Add your Bunny Stream URL when ready
4. Restart dev server: `npm run dev`

## Testing

Visit `http://localhost:4321/test-bunny` to verify your setup.

## Vercel Deployment

**IMPORTANT:** You must set these environment variables in Vercel for images to work correctly in production.

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
PUBLIC_BUNNY_CDN_URL_WORDPRESS=https://capeswp.b-cdn.net
PUBLIC_BUNNY_CDN_URL_STORAGE=https://times-10-video-offload.b-cdn.net
PUBLIC_BUNNY_CDN_URL=https://capeswp.b-cdn.net
```

4. Make sure to set them for **Production**, **Preview**, and **Development** environments
5. **Redeploy** your site after adding the variables

### Troubleshooting

**If images show raw paths like `/wp-content/uploads/2025/08/image.png` in production:**
- ✅ Check that environment variables are set in Vercel
- ✅ Verify they're set for the correct environment (Production/Preview)
- ✅ Redeploy after adding variables
- ✅ Check browser console for `[Bunny CDN]` warnings/errors

**If you see "Failed to load resource: You do not have permission to access the requested resource" (403 errors):**
This is typically a **Referrer Restrictions** (Hotlinking Protection) issue. Fix it by:

1. **Configure Referrer Restrictions in Bunny CDN Dashboard:**
   - Log into [Bunny CDN Dashboard](https://bunny.net)
   - Go to **Pull Zones** → Select your pull zone (e.g., `capeswp`)
   - Navigate to **Security** tab
   - Find **Hotlink Protection** or **Referrer Restrictions** section
   - **Option A: Disable Hotlink Protection** (easiest - allows all domains)
     - Set **Enable Hotlink Protection** to **Disabled**
   - **Option B: Allow Your Domain** (more secure)
     - Set **Enable Hotlink Protection** to **Enabled**
     - In **Allowed Referrers** or **Whitelist**, add your domain(s):
       - `capabilities.times10.net`
       - `www.capabilities.times10.net` (if you use www)
       - `*.times10.net` (wildcard for all subdomains, if needed)
     - Leave **Blocked Referrers** empty (or add domains you want to block)
   - Click **Save**

2. **For WordPress Pull Zone (`capeswp.b-cdn.net`):**
   - Follow steps above to configure referrer restrictions
   - Add your production domain: `capabilities.times10.net`

3. **For Storage Pull Zone (`times-10-video-offload.b-cdn.net`):**
   - Follow same steps as WordPress pull zone
   - Add your production domain: `capabilities.times10.net`

4. **Verify the URLs:**
   - Check browser console Network tab to see which exact URL is failing
   - Verify the URL format matches: `https://{pullzone}.b-cdn.net/{path}`
   - Ensure the path exists in your pull zone

5. **Check Other Access Restrictions:**
   - In Bunny CDN Dashboard → Pull Zone → **Security**
   - Ensure **IP Access Control** is not blocking requests (should be disabled or allow all)
   - Check **Country Blocking** is not enabled (unless you want geographic restrictions)
   - Verify **Edge Rules** don't have restrictions blocking your domain

**Common Referrer Configuration:**
```
Hotlink Protection: Disabled (allows all domains)
OR
Hotlink Protection: Enabled
Allowed Referrers: capabilities.times10.net, www.capabilities.times10.net
Blocked Referrers: (empty)
```

The code will log warnings to the browser console if CDN URLs aren't configured.

