# Bunny CDN Setup Guide

This project uses Bunny CDN for optimized image and video delivery. Follow these steps to configure it.

## Setup Overview

This project uses a **hybrid approach**:
- **WordPress Pull Zone**: Existing content synced from WordPress site
- **Storage Zone**: New content uploaded directly to Bunny Storage for this site

## 1. Get Your Bunny CDN URLs

### WordPress Pull Zone (Existing Content)
1. Log into your [Bunny CDN dashboard](https://bunny.net)
2. Go to **Pull Zones** → Find your WordPress-synced pull zone
3. Copy the pull zone URL (format: `https://your-wordpress-pullzone.b-cdn.net`)
4. Make sure **Bunny Optimizer** is enabled for on-the-fly image transformations
5. This pull zone automatically syncs content from your WordPress site

### Storage Zone (New Content)
1. Go to **Storage** → Create a new storage zone (or use existing)
2. Create a **Pull Zone** that points to this storage zone
3. Copy the pull zone URL (format: `https://your-storage-pullzone.b-cdn.net`)
4. Upload new content directly to this storage zone via dashboard or API
5. Enable **Bunny Optimizer** on the pull zone for image transformations

### For Videos (Bunny Stream)
1. Go to **Stream** → **Library** in your Bunny dashboard
2. Copy your Stream URL (format: `https://vz-xxxxx.b-cdn.net`)
3. Upload your videos to the Stream library (not Storage)

## 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# WordPress pull zone (existing content)
PUBLIC_BUNNY_CDN_URL_WORDPRESS=https://your-wordpress-pullzone.b-cdn.net

# Storage pull zone (new content for this site)
PUBLIC_BUNNY_CDN_URL_STORAGE=https://your-storage-pullzone.b-cdn.net

# Default fallback (optional - set to WordPress if you want it as default)
PUBLIC_BUNNY_CDN_URL=https://your-wordpress-pullzone.b-cdn.net

# Bunny Stream (for videos)
PUBLIC_BUNNY_STREAM_URL=https://vz-xxxxx.b-cdn.net
```

**Important:** 
- Use `PUBLIC_` prefix so Astro exposes these to the client
- Don't include trailing slashes
- Never commit `.env` to git (already in `.gitignore`)

### Recommended Setup

For this project structure, we recommend:

```bash
# WordPress content (existing)
PUBLIC_BUNNY_CDN_URL_WORDPRESS=https://wp-content.b-cdn.net

# New site content (storage)
PUBLIC_BUNNY_CDN_URL_STORAGE=https://site-assets.b-cdn.net

# Default to WordPress for backward compatibility
PUBLIC_BUNNY_CDN_URL=https://wp-content.b-cdn.net

# Videos
PUBLIC_BUNNY_STREAM_URL=https://vz-xxxxx.b-cdn.net
```

**Usage in code:**

```typescript
// WordPress content (existing)
bunnyImage('/wp-content/uploads/2024/image.jpg', { 
  width: 1920, 
  pullZone: 'wordpress' 
});

// New site content (storage)
bunnyImage('/hero.jpg', { 
  width: 1920, 
  pullZone: 'storage' 
});

// Default (falls back to PUBLIC_BUNNY_CDN_URL)
bunnyImage('/image.jpg', { width: 1920 });
```

**Naming convention:** Environment variable names are converted to uppercase and special characters are replaced with underscores. For example:
- `pullZone: 'wordpress'` → `PUBLIC_BUNNY_CDN_URL_WORDPRESS`
- `pullZone: 'storage'` → `PUBLIC_BUNNY_CDN_URL_STORAGE`

## 3. Upload Your Assets

### WordPress Content (Existing)
- Content is automatically synced from your WordPress site
- Use paths as they appear in WordPress (e.g., `/wp-content/uploads/2024/image.jpg`)
- The pull zone handles syncing and caching automatically
- Use `pullZone: 'wordpress'` when referencing WordPress content

### New Site Content (Storage)
- Upload ONE master image (high-res, uncompressed) to your Storage zone
- Upload via Bunny dashboard or Storage API
- The CDN will handle all transformations on-the-fly via the pull zone
- Use paths relative to your storage root (e.g., `/hero.jpg`, `/assets/logo.png`)
- Use `pullZone: 'storage'` when referencing new content

### Videos

**Autoplay muted videos (backgrounds, heroes):**
- Upload MP4 files directly to your Storage zone
- Optimize for web: H.264 codec, reasonable file size
- Use `<AutoplayVideo>` component with direct file paths
- Faster load, no player overhead

**Videos with controls (user-initiated):**
- Upload videos to Bunny Stream library (NOT Storage)
- Bunny Stream automatically transcodes to multiple bitrates
- Use the video ID from the Stream library
- Use `<LazyVideo>` component for Stream embeds

## 4. Video Strategy: When to Use What

### Use Direct Video Files (CDN Storage) ✅
**For:** Autoplay muted videos, background videos, hero videos, short loops

**Why:**
- ⚡ Faster initial load (no player code)
- 🪶 Lighter weight (just the video file)
- 🎯 Better performance (RULE-014: Speed First)
- 💰 Lower cost (no Stream transcoding)

**Example:**
```astro
<AutoplayVideo 
  src="/videos/hero-background.mp4"
  pullZone="storage"
  priority={true}
/>
```

### Use Bunny Stream ✅
**For:** Videos with controls, longer content, adaptive bitrate needs

**Why:**
- 📺 Built-in player with controls
- 🔄 Adaptive bitrate streaming
- 📊 Multiple quality options
- 🎬 Better for user-controlled playback

**Example:**
```astro
<LazyVideo 
  videoId="stream-video-id"
  controls={true}
/>
```

## 5. Usage Examples

### Images

```astro
---
import { LazyImage } from '../components/LazyImage';
---

<!-- WordPress content (existing) -->
<LazyImage 
  src="/wp-content/uploads/2024/portfolio-image.jpg" 
  alt="Portfolio image from WordPress"
  width={1920}
  quality={85}
  pullZone="wordpress"
  client:visible
/>

<!-- New site content (storage) -->
<LazyImage 
  src="/hero.jpg" 
  alt="Hero image"
  width={1920}
  quality={85}
  pullZone="storage"
  priority={true}
  client:visible
/>

<!-- Default pull zone (falls back to PUBLIC_BUNNY_CDN_URL) -->
<LazyImage 
  src="/image.jpg" 
  alt="Image"
  width={1920}
  quality={85}
  client:visible
/>
```

### Videos

**For autoplay muted videos (backgrounds, heroes):**
Use direct video files from CDN - faster and lighter than Stream:

```astro
---
import { AutoplayVideo } from '../components/AutoplayVideo';
---

<AutoplayVideo 
  src="/videos/hero-background.mp4"
  poster="/images/hero-poster.jpg"
  priority={true}
  pullZone="storage"
  client:visible
/>
```

**For videos with controls (user-initiated playback):**
Use Bunny Stream for adaptive bitrate:

```astro
---
import { LazyVideo } from '../components/LazyVideo';
---

<LazyVideo 
  videoId="your-video-id"
  priority={false}
  autoplay={false}
  loop={true}
  muted={true}
  client:visible
/>
```

### Direct URL Generation

```typescript
import { bunnyImage, bunnyVideoEmbed } from '../lib/bunny-cdn';

// WordPress content
const wpImageUrl = bunnyImage('/wp-content/uploads/2024/image.jpg', { 
  width: 1920, 
  quality: 85,
  pullZone: 'wordpress'
});

// New site content (storage)
const storageImageUrl = bunnyImage('/hero.jpg', { 
  width: 1920, 
  quality: 85,
  pullZone: 'storage'
});

// Default pull zone
const defaultImageUrl = bunnyImage('/image.jpg', { 
  width: 1920, 
  quality: 85 
});

// Generate video embed URL
const videoUrl = bunnyVideoEmbed({
  videoId: 'your-video-id',
  autoplay: false,
  preload: 'none'
});
```

## 5. Verify Setup

The utilities will log warnings to the console if environment variables are missing. Check your browser console during development.

## Resources

- [Bunny CDN Documentation](https://docs.bunny.net/)
- [Bunny Optimizer (Image Transform API)](https://docs.bunny.net/docs/bunny-optimizer)
- [Bunny Stream Documentation](https://docs.bunny.net/stream/)

