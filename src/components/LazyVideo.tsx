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

export interface LazyVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
	src?: string;
	videoId?: string;
	poster?: string;
	priority?: boolean;
	pullZone?: string;
	className?: string;
}

export function LazyVideo({
	src,
	videoId,
	poster: customPoster,
	priority = false,
	pullZone = 'storage',
	className = '',
	...props
}: LazyVideoProps): JSX.Element {
	const [shouldLoad, setShouldLoad] = useState(priority);
	const [isIntersecting, setIsIntersecting] = useState(priority);
	const [reducedMotion, setReducedMotion] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

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
		if (priority || reducedMotion) {
			setShouldLoad(true);
			setIsIntersecting(true);
			return;
		}

		const element = containerRef.current;
		if (!element) return;

		// RULE-018: Use singleton lazyLoadManager
		// Load when 50vh away, unload when far away
		lazyLoadManager.observe(element, (entry) => {
			if (entry.isIntersecting) {
				setShouldLoad(true);
				setIsIntersecting(true);
			} else {
				setIsIntersecting(false);
				// RULE-018: Unload videos from sections >2 viewports away
				// With rootMargin: '50vh', isIntersecting=false means it's >50vh away.
				// For radical memory saving, we unload as soon as it's off-screen (+ margin)
				setShouldLoad(false);
			}
		});

		return () => {
			lazyLoadManager.unobserve(element);
		};
	}, [priority, reducedMotion]);

	return (
		<div 
			ref={containerRef} 
			className={`relative overflow-hidden bg-black/5 ${className}`}
			style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined }}
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
					src={videoUrl}
					poster={posterUrl}
					preload={priority ? 'auto' : 'none'} // RULE-014
					className={`w-full h-full object-cover transition-opacity duration-700 ${
						isIntersecting ? 'opacity-100' : 'opacity-0'
					}`}
					muted // Most browsers require muted for autoplay
					playsInline
					{...props}
				/>
			)}
		</div>
	);
}

