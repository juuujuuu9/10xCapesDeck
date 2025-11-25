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

If images show raw paths like `/wp-content/uploads/2025/08/image.png` in production:
- ✅ Check that environment variables are set in Vercel
- ✅ Verify they're set for the correct environment (Production/Preview)
- ✅ Redeploy after adding variables
- ✅ Check browser console for `[Bunny CDN]` warnings/errors

The code will log warnings to the browser console if CDN URLs aren't configured.

