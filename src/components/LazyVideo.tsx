/**
 * Lazy-loaded video component with progressive loading
 * RULE-020: Standardized lazy-load component structure
 * RULE-018: Progressive asset loading with Intersection Observer
 * RULE-014: Video lazy loading with preload="none"
 * RULE-008: Respect prefers-reduced-motion
 */

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { lazyLoadManager } from '../lib/intersection-observer';
import { bunnyImage, bunnyVideoFile, bunnyVideoPoster, bunnyVideoUrl } from '../lib/bunny-cdn';

export interface LazyVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
	src?: string;
	videoId?: string;
	poster?: string;
	priority?: boolean;
	pullZone?: string;
	className?: string;
	showUnmuteButton?: boolean;
	unmuteButtonText?: string;
}

export function LazyVideo({
	src,
	videoId,
	poster: customPoster,
	priority = false,
	pullZone = 'storage',
	className = '',
	showUnmuteButton = false,
	unmuteButtonText = 'unmute',
	...props
}: LazyVideoProps): React.JSX.Element {
	const [shouldLoad, setShouldLoad] = useState(priority);
	const [isIntersecting, setIsIntersecting] = useState(false); // Start as NOT intersecting
	const [reducedMotion, setReducedMotion] = useState(false);
	const [isMuted, setIsMuted] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const savedTimeRef = useRef<number>(0);

	// Determine final URLs
	const videoUrl = videoId 
		? bunnyVideoUrl(videoId) 
		: (src 
			? (src.startsWith('http://') || src.startsWith('https://') 
				? src 
				: bunnyVideoFile(src, pullZone))
			: '');
	
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
		const element = containerRef.current;
		if (!element) {
			return;
		}

		// Always load priority videos immediately and mark as intersecting
		if (priority || reducedMotion) {
			setShouldLoad(true);
			setIsIntersecting(true);
		}

		// Check if element is already in viewport (fixes mobile gray box issue)
		// Use multiple checks with delays to ensure layout is complete on mobile
		const checkInitialIntersection = (): void => {
			const rect = element.getBoundingClientRect();
			// More lenient check: element is in viewport or very close to it
			const isInViewport = rect.top < window.innerHeight * 1.5 && rect.bottom > -window.innerHeight * 0.5;
			if (isInViewport) {
				setIsIntersecting(true);
				// If already in viewport, load immediately (especially important for mobile)
				setShouldLoad(true);
			}
		};

		// Check immediately and after delays (for mobile layout completion)
		checkInitialIntersection();
		const timeoutId1 = setTimeout(checkInitialIntersection, 100);
		const timeoutId2 = setTimeout(checkInitialIntersection, 300);
		const timeoutId3 = setTimeout(checkInitialIntersection, 500);

		// Always observe for intersection to handle pause/resume, even for priority videos
		lazyLoadManager.observe(element, (entry) => {
			if (entry.isIntersecting) {
				// Video scrolled into view
				setIsIntersecting(true);
				setShouldLoad(true);
			} else {
				// Video scrolled out of view - pause and save time
				setIsIntersecting(false);
				
				// Save current time and pause before unloading
				if (videoRef.current) {
					savedTimeRef.current = videoRef.current.currentTime;
					videoRef.current.pause();
				}

				// RULE-018: Unload videos from sections >2 viewports away
				// Only unload if not priority (keep priority videos loaded)
				if (!priority && !reducedMotion) {
					setShouldLoad(false);
				}
			}
		});

		return () => {
			clearTimeout(timeoutId1);
			clearTimeout(timeoutId2);
			clearTimeout(timeoutId3);
			lazyLoadManager.unobserve(element);
		};
	}, [priority, reducedMotion]);

	// Ensure video is muted immediately when element is created, and set volume to 55% when unmuted
	useEffect(() => {
		const video = videoRef.current;
		if (video && shouldLoad) {
			if (props.muted !== false) {
				video.muted = true;
				video.volume = 0;
				// Set attributes to ensure mobile compatibility
				video.setAttribute('muted', '');
				video.setAttribute('playsinline', '');
			} else {
				// Set volume to 55% when not muted
				video.volume = 0.55;
			}
		}
	}, [shouldLoad, props.muted]);

	// Listen for unmute events and set volume to 55%
	useEffect(() => {
		const video = videoRef.current;
		if (!video || !shouldLoad) return;

		const handleVolumeChange = (): void => {
			// Update muted state for button visibility
			setIsMuted(video.muted);
			
			// When video is unmuted, set volume to 55%
			if (!video.muted && video.volume > 0 && video.volume < 0.1) {
				video.volume = 0.55;
			}
		};

		// Set initial muted state
		setIsMuted(video.muted);

		video.addEventListener('volumechange', handleVolumeChange);
		
		return () => {
			video.removeEventListener('volumechange', handleVolumeChange);
		};
	}, [shouldLoad]);

	// Handle unmute button click
	const handleUnmute = (): void => {
		const video = videoRef.current;
		if (video) {
			video.muted = false;
			video.volume = 0.55;
		}
	};

	// Handle play/pause and resume for native video
	useEffect(() => {
		const video = videoRef.current;
		if (!video || !shouldLoad || reducedMotion) {
			return;
		}

		// Pause video when not intersecting
		if (!isIntersecting) {
			savedTimeRef.current = video.currentTime;
			video.pause();
			return;
		}

		// Function to restore time and play
		const restoreAndPlay = (): void => {
			// Ensure video is properly muted before attempting play (critical for mobile)
			if (props.muted !== false) {
				video.muted = true;
				video.volume = 0;
			}

			// Restore saved time if resuming
			if (savedTimeRef.current > 0 && video.readyState >= 2) {
				video.currentTime = savedTimeRef.current;
			}

			// Only autoplay if props.autoPlay is not false
			if (props.autoPlay !== false) {
				// Use a promise to handle play() to avoid "play() request was interrupted" errors
				const playPromise = video.play();
				if (playPromise !== undefined) {
					playPromise.catch((error) => {
						console.log('Video autoplay failed, will retry:', error.message);
						// On mobile, sometimes play fails even with muted. Retry with a slight delay
						setTimeout(() => {
							if (video.muted && video.readyState >= 2) {
								video.play().catch((retryError) => {
									console.log('Video autoplay retry failed:', retryError.message);
									// Final fallback: ensure video can be played on user interaction
									// Silently fail - user can tap to play if needed
								});
							}
						}, 200);
					});
				}
			}
		};

		// Wait for video to have enough data loaded
		if (video.readyState >= 3) { // HAVE_FUTURE_DATA - enough data to play
			restoreAndPlay();
		} else {
			// Wait for video to load enough data
			const handleCanPlayThrough = (): void => {
				restoreAndPlay();
				video.removeEventListener('canplaythrough', handleCanPlayThrough);
			};
			video.addEventListener('canplaythrough', handleCanPlayThrough);
			
			return () => {
				video.removeEventListener('canplaythrough', handleCanPlayThrough);
			};
		}
	}, [isIntersecting, shouldLoad, reducedMotion, props.autoPlay, props.muted]);

	return (
		<div 
			ref={containerRef} 
			className={`relative overflow-hidden bg-black/5 ${className}`}
			style={{ 
				aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined,
				height: props.width && props.height ? undefined : '100%',
				width: '100%'
			}}
		>
			{/* RULE-020: Show poster → video stream transition */}
			{posterUrl && (
				<img
					src={posterUrl}
					alt=""
					aria-hidden="true"
					crossOrigin="anonymous" // Required for mobile browsers CORS (iOS Safari)
					className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
						// Hide poster when video is visible (fixes mobile gray box)
						shouldLoad && (isIntersecting || priority || reducedMotion) ? 'opacity-0 pointer-events-none' : 'opacity-100'
					}`}
					loading={priority ? 'eager' : 'lazy'}
				/>
			)}

			{shouldLoad && (
				<video
					ref={videoRef}
					src={videoUrl}
					poster={posterUrl}
					preload={priority ? 'auto' : 'metadata'} // RULE-014: Use metadata for non-priority
					crossOrigin="anonymous" // Required for mobile browsers CORS (iOS Safari)
					className={`w-full h-full object-cover transition-opacity duration-700 ${
						// Show video when intersecting OR when priority/reducedMotion (fixes mobile gray box)
						isIntersecting || priority || reducedMotion ? 'opacity-100' : 'opacity-0'
					}`}
					muted // Always muted for autoplay compatibility
					controls={!isMuted} // Show controls when unmuted
					playsInline // Required for iOS autoplay
					autoPlay={props.autoPlay !== false}
					loop={props.loop}
					{...props}
				/>
			)}

			{/* Unmute button for full page reel elements */}
			{showUnmuteButton && isMuted && shouldLoad && (
				<button
					type="button"
					onClick={handleUnmute}
					className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white text-[20px] lowercase italic font-bold pb-4 z-10 hover:opacity-80 transition-opacity"
					aria-label="Unmute audio"
				>
					{unmuteButtonText}
				</button>
			)}
		</div>
	);
}

