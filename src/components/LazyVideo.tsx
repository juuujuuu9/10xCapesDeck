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
	const [isIntersecting, setIsIntersecting] = useState(true); // Start as intersecting, will be updated by observer
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
		// Always load priority videos immediately
		if (priority || reducedMotion) {
			setShouldLoad(true);
		}

		const element = containerRef.current;
		if (!element) {
			return;
		}

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
			lazyLoadManager.unobserve(element);
		};
	}, [priority, reducedMotion]);

	// Ensure video is muted immediately when element is created, and set volume to 55% when unmuted
	useEffect(() => {
		const video = videoRef.current;
		if (video) {
			if (props.muted !== false) {
				video.muted = true;
				video.volume = 0;
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
		if (!video || !isIntersecting || !shouldLoad || reducedMotion) {
			return;
		}

		// Function to restore time and play
		const restoreAndPlay = (): void => {
			// Restore saved time if resuming
			if (savedTimeRef.current > 0) {
				// Wait for video to be ready before setting currentTime
				if (video.readyState >= 2) {
					// Video has loaded enough data
					video.currentTime = savedTimeRef.current;
				} else {
					// Wait for loadeddata event
					const handleLoadedData = (): void => {
						video.currentTime = savedTimeRef.current;
						video.removeEventListener('loadeddata', handleLoadedData);
					};
					video.addEventListener('loadeddata', handleLoadedData);
				}
			}

			// Use a promise to handle play() to avoid "play() request was interrupted" errors
			// Only autoplay if props.autoPlay is not false
			if (props.autoPlay !== false) {
				const playPromise = video.play();
				if (playPromise !== undefined) {
					playPromise.catch(() => {
						// Silently handle play failures (e.g., user interaction required)
					});
				}
			}
		};

		// If video is already loaded, restore and play immediately
		if (video.readyState >= 2) {
			restoreAndPlay();
		} else {
			// Wait for video to load first
			const handleCanPlay = (): void => {
				restoreAndPlay();
				video.removeEventListener('canplay', handleCanPlay);
			};
			video.addEventListener('canplay', handleCanPlay);
		}

		return () => {
			if (video && isIntersecting) {
				// Save current time before pausing
				savedTimeRef.current = video.currentTime;
				video.pause();
			}
		};
	}, [isIntersecting, shouldLoad, reducedMotion, props.autoPlay]);

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
					preload={priority ? 'auto' : 'none'} // RULE-014: Preload if priority
					className={`w-full h-full object-cover transition-opacity duration-700 ${
						isIntersecting ? 'opacity-100' : 'opacity-0'
					}`}
					muted={props.muted !== false} // Most browsers require muted for autoplay
					controls={!isMuted} // Show controls when unmuted
					playsInline
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

