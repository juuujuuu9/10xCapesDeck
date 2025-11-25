# Using WordPress Content Examples

Your WordPress pull zone is synced to: `https://capeswp.b-cdn.net`

## Setup

Add to your `.env` file:
```bash
PUBLIC_BUNNY_CDN_URL_WORDPRESS=https://capeswp.b-cdn.net
PUBLIC_BUNNY_CDN_URL=https://capeswp.b-cdn.net
```

## Usage Examples

### Images from WordPress

```astro
---
import { LazyImage } from '../components/LazyImage';
---

<!-- WordPress content -->
<LazyImage 
  src="/wp-content/uploads/2024/image.jpg" 
  alt="WordPress image"
  width={1920}
  quality={85}
  pullZone="wordpress"
  client:visible
/>
```

### Direct URL Generation

```typescript
import { bunnyImage } from '../lib/bunny-cdn';

// WordPress image with transforms
const wpImageUrl = bunnyImage('/wp-content/uploads/2024/image.jpg', {
  width: 1920,
  quality: 85,
  pullZone: 'wordpress'
});
```

## Finding WordPress Content Paths

WordPress typically stores uploads in:
- `/wp-content/uploads/YYYY/MM/filename.jpg`
- `/wp-content/themes/theme-name/assets/...`

Check your WordPress site's media library or inspect the source to find the exact paths.

## Notes

- WordPress pull zone automatically syncs content from your WordPress site
- Use `pullZone: 'wordpress'` to explicitly use WordPress content
- Paths should match exactly as they appear in WordPress
- Bunny Optimizer handles all image transformations automatically

