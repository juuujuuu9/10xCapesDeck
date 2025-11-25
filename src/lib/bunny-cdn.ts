/**
 * Bunny CDN utility functions for image and video URL generation
 * RULE-017: Standardized CDN URL structure with typed utilities
 * 
 * This project uses a hybrid approach:
 * - WordPress Pull Zone: Existing content synced from WordPress (use pullZone: 'wordpress')
 * - Storage Pull Zone: New content uploaded to Bunny Storage (use pullZone: 'storage')
 * 
 * Environment variables:
 * - PUBLIC_BUNNY_CDN_URL_WORDPRESS: WordPress pull zone URL
 * - PUBLIC_BUNNY_CDN_URL_STORAGE: Storage pull zone URL
 * - PUBLIC_BUNNY_CDN_URL: Default fallback (recommended: set to WordPress)
 */

const getCdnUrl = (pullZone?: string): string => {
	// If specific pull zone requested, check for named env var
	if (pullZone) {
		const envKey = `PUBLIC_BUNNY_CDN_URL_${pullZone.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
		const url = import.meta.env[envKey];
		if (url) {
			return url.replace(/\/$/, ''); // Remove trailing slash
		}
		console.warn(`[Bunny CDN] ${envKey} not set, falling back to default`);
	}

	// Default pull zone
	const url = import.meta.env.PUBLIC_BUNNY_CDN_URL;
	if (!url) {
		if (typeof window !== 'undefined') {
			// Client-side: log error to console
			console.error('[Bunny CDN] PUBLIC_BUNNY_CDN_URL not set. Images will use raw paths. Set environment variables in Vercel.');
		}
		return '';
	}
	return url.replace(/\/$/, ''); // Remove trailing slash
};


export interface BunnyImageOptions {
	width?: number;
	height?: number;
	quality?: number;
	aspectRatio?: string;
	pullZone?: string; // Optional: specify a named pull zone (e.g., "images", "assets")
}

/**
 * Generate Bunny CDN image URL with transform parameters
 * RULE-015: Use Transform API for responsive sizes
 * 
 * @param path - Image path relative to pull zone root
 * @param options - Image options including optional pullZone name
 * @example
 * bunnyImage('/hero.jpg', { width: 1920, pullZone: 'images' })
 * // Uses PUBLIC_BUNNY_CDN_URL_IMAGES if set, otherwise falls back to PUBLIC_BUNNY_CDN_URL
 */
export function bunnyImage(path: string, options: BunnyImageOptions = {}): string {
	const { width, height, quality, aspectRatio, pullZone } = options;
	const cdnUrl = getCdnUrl(pullZone);
	if (!cdnUrl) {
		// CDN URL not configured - return raw path (will fail to load unless served from origin)
		if (typeof window !== 'undefined') {
			console.warn(`[Bunny CDN] CDN URL not configured for pullZone "${pullZone || 'default'}". Image will use raw path: ${path}`);
		}
		return path;
	}

	// Validate inputs
	if (width !== undefined && (typeof width !== 'number' || width <= 0)) {
		throw new Error('Width must be a positive number');
	}
	if (height !== undefined && (typeof height !== 'number' || height <= 0)) {
		throw new Error('Height must be a positive number');
	}
	if (quality !== undefined && (quality < 1 || quality > 100)) {
		throw new Error('Quality must be between 1 and 100');
	}

	const params = new URLSearchParams();
	if (width) params.set('width', width.toString());
	if (height) params.set('height', height.toString());
	if (quality) params.set('quality', quality.toString());
	if (aspectRatio) params.set('aspect_ratio', aspectRatio);

	const queryString = params.toString();
	const cleanPath = path.startsWith('/') ? path : `/${path}`;

	return queryString ? `${cdnUrl}${cleanPath}?${queryString}` : `${cdnUrl}${cleanPath}`;
}

/**
 * Generate srcset for responsive images
 * RULE-015: Use Transform API for responsive sizes
 */
export function bunnyImageSrcset(
	path: string,
	widths: number[],
	options: Omit<BunnyImageOptions, 'width'> = {}
): string {
	const srcset = widths
		.map((width) => {
			const url = bunnyImage(path, { ...options, width });
			return `${url} ${width}w`;
		})
		.join(', ');

	return srcset;
}

/**
 * Generate thumbnail URL with blur effect
 * RULE-018: Load blurred placeholder first
 * 
 * @param path - Image path relative to pull zone root
 * @param width - Thumbnail width (default: 50)
 * @param pullZone - Optional pull zone name
 */
export function bunnyThumbnail(path: string, width: number = 50, pullZone?: string): string {
	return bunnyImage(path, { width, quality: 20, pullZone });
}


/**
 * Generate direct video file URL from CDN (Storage/Pull Zone)
 * Use this for autoplay muted background videos - faster and lighter than Stream
 * RULE-014: Speed First - direct video files are faster than Stream player
 * 
 * @param path - Video file path relative to pull zone root (e.g., '/videos/hero.mp4')
 * @param pullZone - Optional pull zone name (default: 'storage')
 * @example
 * bunnyVideoFile('/videos/hero-background.mp4', 'storage')
 */
export function bunnyVideoFile(path: string, pullZone: string = 'storage'): string {
	const cdnUrl = getCdnUrl(pullZone);
	if (!cdnUrl) {
		console.warn(`Pull zone "${pullZone}" not configured, returning path as-is`);
		return path;
	}

	const cleanPath = path.startsWith('/') ? path : `/${path}`;
	return `${cdnUrl}${cleanPath}`;
}

