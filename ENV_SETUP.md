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

