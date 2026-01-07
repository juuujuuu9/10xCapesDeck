/**
 * Lazy-loaded video component with progressive loading
 * RULE-020: Standardized lazy-load component structure
 * RULE-018: Progressive asset loading with Intersection Observer
 * RULE-014: Video lazy loading with preload="none"
 * RULE-008: Respect prefers-reduced-motion
 */

import { useEffect, useRef, useState } from 'react';
import { lazyLoadManager } from '../lib/intersection-observer';
import { bunnyImage, bunnyVideoFile, bunnyVideoPoster, bunnyVideoUrl } from '../lib/bunny-cdn';
// Import CSS statically (CSS doesn't cause SSR issues)
import 'plyr/dist/plyr.css';

// Type for Plyr (will be dynamically imported)
type PlyrInstance = {
	currentTime: number;
	play(): Promise<void>;
	pause(): void;
	destroy(): void;
	on(event: string, callback: () => void): void;
};

export interface LazyVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
	src?: string;
	videoId?: string;
	poster?: string;
	priority?: boolean;
	pullZone?: string;
	className?: string;
	usePlyr?: boolean;
}

export function LazyVideo({
	src,
	videoId,
	poster: customPoster,
	priority = false,
	pullZone = 'storage',
	className = '',
	usePlyr = false,
	...props
}: LazyVideoProps): JSX.Element {
	const [shouldLoad, setShouldLoad] = useState(priority);
	const [isIntersecting, setIsIntersecting] = useState(priority);
	const [reducedMotion, setReducedMotion] = useState(false);
	const [plyrReady, setPlyrReady] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const plyrRef = useRef<PlyrInstance | null>(null);
	const savedTimeRef = useRef<number>(0);

	// Determine final URLs
	const videoUrl = videoId ? bunnyVideoUrl(videoId) : (src ? bunnyVideoFile(src, pullZone) : '');
	
	// RULE-015: Use Bunny Optimizer for dynamic resizing/format conversion
	const posterUrl = videoId 
		? bunnyVideoPoster(videoId) 
		: (customPoster ? (customPoster.startsWith('http') ? customPoster : bunnyImage(customPoster, { quality: 85 })) : undefined);

	useEffect(() => {
		// RULE-008: Respect prefers-reduced-motion
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReducedMotion(mediaQuery.matches);

		const handleChange = (e: MediaQueryListEvent): void => {
			setReducedMotion(e.matches);
			if (e.matches) {
				setShouldLoad(true);
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	useEffect(() => {
		console.log('[LazyVideo] Intersection effect:', { usePlyr, priority, reducedMotion, shouldLoad, isIntersecting });
		
		// If Plyr is enabled, always load and show the video (Plyr needs it to initialize)
		// Still use intersection observer to know when it's visible for autoplay
		if (usePlyr) {
			console.log('[LazyVideo] Plyr enabled - setting shouldLoad and isIntersecting to true');
			setShouldLoad(true);
			setIsIntersecting(true); // Show video immediately when Plyr is enabled
		}

		if (priority || reducedMotion) {
			console.log('[LazyVideo] Priority or reduced motion - loading immediately');
			setShouldLoad(true);
			setIsIntersecting(true);
			return;
		}

		const element = containerRef.current;
		if (!element) {
			console.log('[LazyVideo] No container element found');
			return;
		}

		// Set up intersection observer for all videos
		// Handles both Plyr and non-Plyr cases
		const observerLabel = usePlyr ? 'Plyr' : 'non-Plyr';
		console.log(`[LazyVideo] Setting up intersection observer (${observerLabel})`);
		
		lazyLoadManager.observe(element, (entry) => {
			console.log(`[LazyVideo] Intersection change (${observerLabel}):`, { isIntersecting: entry.isIntersecting });
			
			if (entry.isIntersecting) {
				// Video scrolled into view
				setIsIntersecting(true);
				
				// For non-Plyr videos, also set shouldLoad
				if (!usePlyr) {
					setShouldLoad(true);
				}
				
				// Autoplay will be handled by the separate useEffect hooks
			} else {
				// Video scrolled out of view - pause and save time
				setIsIntersecting(false);
				
				// Save current time and pause
				if (usePlyr && plyrRef.current) {
					// Save Plyr's current time
					savedTimeRef.current = plyrRef.current.currentTime;
					plyrRef.current.pause();
					console.log('[LazyVideo] Paused Plyr video, saved time:', savedTimeRef.current);
				} else if (videoRef.current) {
					// Save native video's current time
					savedTimeRef.current = videoRef.current.currentTime;
					videoRef.current.pause();
					console.log('[LazyVideo] Paused native video, saved time:', savedTimeRef.current);
				}

				// RULE-018: Unload non-Plyr videos from sections >2 viewports away
				// Keep Plyr videos loaded (Plyr needs the video element)
				if (!usePlyr) {
					setShouldLoad(false);
				}
			}
		});

		return () => {
			lazyLoadManager.unobserve(element);
		};
	}, [priority, reducedMotion, usePlyr]);

	// Initialize Plyr (client-side only)
	useEffect(() => {
		console.log('[LazyVideo] Plyr init effect:', { usePlyr, shouldLoad, hasVideo: !!videoRef.current, hasPlyr: !!plyrRef.current, window: typeof window });
		
		if (!usePlyr || typeof window === 'undefined') {
			console.log('[LazyVideo] Skipping Plyr init - usePlyr:', usePlyr, 'window:', typeof window);
			return;
		}
		
		// Don't re-initialize if Plyr already exists
		if (plyrRef.current) {
			console.log('[LazyVideo] Plyr already initialized, skipping');
			return;
		}
		
		// Wait for video element to be available
		if (!videoRef.current || !shouldLoad) {
			console.log('[LazyVideo] Waiting for video element or shouldLoad:', { hasVideo: !!videoRef.current, shouldLoad });
			return;
		}

		let plyrInstance: PlyrInstance | null = null;
		let isCleanedUp = false;

		// Small delay to ensure video element is fully rendered
		const initTimer = setTimeout(() => {
			if (!videoRef.current || isCleanedUp) {
				console.log('[LazyVideo] Video ref not available or cleaned up');
				return;
			}

			console.log('[LazyVideo] Importing Plyr...');
			// Dynamically import Plyr only on client side
			import('plyr').then(({ default: Plyr }) => {
				if (!videoRef.current || isCleanedUp) {
					console.log('[LazyVideo] Video ref lost during Plyr import or cleaned up');
					return;
				}

				// Check again if Plyr was already initialized
				if (plyrRef.current) {
					console.log('[LazyVideo] Plyr was initialized during import, skipping');
					return;
				}

				console.log('[LazyVideo] Initializing Plyr with config:', {
					autoplay: props.autoPlay !== false,
					muted: props.muted !== false,
					loop: props.loop
				});

				// Initialize Plyr
				plyrInstance = new Plyr(videoRef.current, {
					controls: [
						'play-large',
						'play',
						'progress',
						'current-time',
						'mute',
						'volume',
						'captions',
						'settings',
						'pip',
						'airplay',
						'fullscreen'
					],
					autoplay: props.autoPlay !== false, // Default to true if not explicitly false
					muted: props.muted !== false, // Default to true for autoplay
					loop: { active: props.loop },
				});

				plyrRef.current = plyrInstance;
				setPlyrReady(true); // Mark Plyr as ready so autoplay effect can trigger
				console.log('[LazyVideo] Plyr initialized successfully, ref set:', !!plyrRef.current, 'isIntersecting:', isIntersecting);

				// If video is already in view, trigger autoplay immediately
				if (isIntersecting && props.autoPlay !== false && !isCleanedUp) {
					console.log('[LazyVideo] Video already intersecting, triggering immediate autoplay');
					setTimeout(() => {
						if (plyrRef.current && !isCleanedUp) {
							plyrRef.current.play().then(() => {
								console.log('[LazyVideo] Immediate autoplay succeeded');
							}).catch((error) => {
								console.log('[LazyVideo] Immediate autoplay failed:', error);
							});
						}
					}, 300);
				}
			}).catch((error) => {
				console.error('[LazyVideo] Failed to load Plyr:', error);
			});
		}, 100);

		return () => {
			isCleanedUp = true;
			clearTimeout(initTimer);
			setPlyrReady(false); // Reset ready state on cleanup
			if (plyrInstance) {
				console.log('[LazyVideo] Cleaning up Plyr instance');
				plyrInstance.destroy();
				plyrInstance = null;
			}
			plyrRef.current = null;
		};
	}, [usePlyr, shouldLoad, props.autoPlay, props.muted, props.loop]);

	// Handle play/pause and resume for native video (when NOT using Plyr)
	useEffect(() => {
		// Skip this effect entirely when Plyr is enabled - Plyr has its own effect
		if (usePlyr) return;

		const video = videoRef.current;
		if (!video || !isIntersecting || !shouldLoad || reducedMotion) {
			console.log('[LazyVideo] Native video play skipped:', { hasVideo: !!video, isIntersecting, shouldLoad, reducedMotion });
			return;
		}

		console.log('[LazyVideo] Native video scrolled into view, preparing to play');

		// Restore saved time if resuming
		if (savedTimeRef.current > 0 && Math.abs(video.currentTime - savedTimeRef.current) > 0.1) {
			console.log('[LazyVideo] Restoring native video time:', savedTimeRef.current);
			video.currentTime = savedTimeRef.current;
		}

		// Use a promise to handle play() to avoid "play() request was interrupted" errors
		// Only autoplay if props.autoPlay is not false
		if (props.autoPlay !== false) {
			console.log('[LazyVideo] Attempting to play native video');
			const playPromise = video.play();
			if (playPromise !== undefined) {
				playPromise.then(() => {
					console.log('[LazyVideo] Native video play() succeeded');
				}).catch((error) => {
					console.log('[LazyVideo] Native video play() failed:', error);
				});
			}
		} else {
			console.log('[LazyVideo] Native video autoplay disabled via props');
		}

		return () => {
			if (video && isIntersecting) {
				console.log('[LazyVideo] Pausing native video (cleanup)');
				video.pause();
			}
		};
	}, [isIntersecting, shouldLoad, reducedMotion, usePlyr, props.autoPlay]);

	// Handle Plyr autoplay/pause when video scrolls into/out of view
	useEffect(() => {
		console.log('[LazyVideo] Plyr autoplay effect:', { 
			usePlyr, 
			hasPlyr: !!plyrRef.current,
			plyrReady,
			isIntersecting, 
			shouldLoad, 
			reducedMotion,
			autoPlay: props.autoPlay 
		});
		
		if (!usePlyr) return;
		
		// If scrolled out of view, pause
		if (!isIntersecting) {
			const plyr = plyrRef.current;
			if (plyr) {
				console.log('[LazyVideo] Pausing Plyr video (out of view)');
				plyr.pause();
			}
			return;
		}
		
		if (!shouldLoad || reducedMotion) {
			console.log('[LazyVideo] Conditions not met for Plyr autoplay:', { shouldLoad, reducedMotion });
			return;
		}

		// Wait for Plyr to be ready with retry mechanism
		const attemptPlay = () => {
			const plyr = plyrRef.current;
			if (!plyr) {
				console.log('[LazyVideo] Plyr not ready yet, will retry');
				return false;
			}

			// Video scrolled into view - restore time and play
			console.log('[LazyVideo] Plyr video scrolled into view, preparing to play');
			
			// Restore saved time if resuming
			if (savedTimeRef.current > 0 && Math.abs(plyr.currentTime - savedTimeRef.current) > 0.1) {
				console.log('[LazyVideo] Restoring Plyr video time:', savedTimeRef.current);
				plyr.currentTime = savedTimeRef.current;
			}

			// When video scrolls into view and Plyr is ready, trigger autoplay
			if (props.autoPlay !== false) {
				console.log('[LazyVideo] Attempting to play Plyr video');
				plyr.play().then(() => {
					console.log('[LazyVideo] Plyr play() succeeded');
				}).catch((error) => {
					console.log('[LazyVideo] Plyr play() failed:', error);
				});
			} else {
				console.log('[LazyVideo] Plyr autoplay disabled via props');
			}
			return true;
		};

		// Try immediately
		if (attemptPlay()) {
			return;
		}

		// If Plyr not ready, retry a few times
		let retryCount = 0;
		const maxRetries = 10;
		const retryInterval = setInterval(() => {
			retryCount++;
			if (attemptPlay() || retryCount >= maxRetries) {
				clearInterval(retryInterval);
			}
		}, 200);

		return () => {
			clearInterval(retryInterval);
			// Cleanup: pause when effect dependencies change (e.g., scrolled out of view)
			const plyr = plyrRef.current;
			if (plyr && !isIntersecting) {
				console.log('[LazyVideo] Pausing Plyr video (cleanup)');
				plyr.pause();
			}
		};
	}, [isIntersecting, shouldLoad, reducedMotion, usePlyr, props.autoPlay, plyrReady]);

	console.log('[LazyVideo] Render:', { shouldLoad, isIntersecting, usePlyr, hasVideo: !!videoRef.current, hasPlyr: !!plyrRef.current });

	return (
		<div 
			ref={containerRef} 
			className={`relative overflow-hidden bg-black/5 ${className} ${usePlyr ? 'plyr-enabled' : ''}`}
			style={{ 
				aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined,
				height: props.width && props.height ? undefined : '100%',
				width: '100%'
			}}
		>
			<style dangerouslySetInnerHTML={{ __html: `
				.plyr-enabled {
					height: 100%;
					width: 100%;
					--plyr-color-main: rgb(202, 44, 30);
				}
				.plyr-enabled .plyr {
					height: 100%;
					width: 100%;
				}
				.plyr-enabled .plyr__video-wrapper {
					height: 100%;
					width: 100%;
				}
				.plyr-enabled .plyr video {
					object-fit: cover;
					height: 100%;
					width: 100%;
				}
				.plyr-enabled .plyr__controls {
					background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 50%, transparent 100%);
				}
			`}} />
			{/* RULE-020: Show poster → video stream transition */}
			{posterUrl && (
				<img
					src={posterUrl}
					alt=""
					aria-hidden="true"
					className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
						isIntersecting ? 'opacity-0 pointer-events-none' : 'opacity-100'
					}`}
					loading={priority ? 'eager' : 'lazy'}
				/>
			)}

			{shouldLoad && (
				<video
					ref={videoRef}
					src={videoUrl}
					poster={posterUrl}
					preload={priority || usePlyr ? 'auto' : 'none'} // RULE-014: Preload if priority or Plyr enabled
					className={`w-full h-full object-cover transition-opacity duration-700 ${
						// When Plyr is enabled, always show video (Plyr will handle visibility)
						// Otherwise, use intersection state
						(usePlyr || isIntersecting) ? 'opacity-100' : 'opacity-0'
					}`}
					muted={props.muted !== false} // Most browsers require muted for autoplay
					playsInline
					{...props}
					autoPlay={usePlyr ? false : props.autoPlay} // Let Plyr handle autoplay when enabled, otherwise use prop
				/>
			)}
		</div>
	);
}

