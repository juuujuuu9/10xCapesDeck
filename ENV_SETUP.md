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

**If you see "Failed to load resource: You do not have permission to access the requested resource":**
This is typically a CORS (Cross-Origin Resource Sharing) issue. Fix it by:

1. **Enable CORS in Bunny CDN Dashboard:**
   - Log into [Bunny CDN Dashboard](https://bunny.net)
   - Go to **Pull Zones** → Select your pull zone
   - Navigate to **Security** tab
   - Under **CORS**, enable **Enable CORS**
   - Add your domain(s) to **Allowed Origins** (or use `*` for all origins during development)
   - Click **Save**

2. **For WordPress Pull Zone (`capeswp.b-cdn.net`):**
   - Enable CORS and add your site domain(s)
   - Example allowed origins: `https://yourdomain.com`, `https://www.yourdomain.com`

3. **For Storage Pull Zone (`times-10-video-offload.b-cdn.net`):**
   - Enable CORS and add your site domain(s)
   - Same domain configuration as above

4. **Verify the URLs:**
   - Check browser console Network tab to see which exact URL is failing
   - Verify the URL format matches: `https://{pullzone}.b-cdn.net/{path}`
   - Ensure the path exists in your pull zone

5. **Check Access Restrictions:**
   - In Bunny CDN Dashboard → Pull Zone → **Security**
   - Ensure **Access Control** is not blocking requests
   - If using IP restrictions, make sure your server/client IPs are allowed

**Common CORS Configuration:**
```
Enable CORS: ✅ Enabled
Allowed Origins: *
Allowed Methods: GET, HEAD, OPTIONS
Allowed Headers: *
Expose Headers: *
Max Age: 86400
```

The code will log warnings to the browser console if CDN URLs aren't configured.

