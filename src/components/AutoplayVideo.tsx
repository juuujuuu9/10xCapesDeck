/**
 * Autoplay muted video component for background/hero videos
 * Uses direct video files from CDN (not Stream) for better performance
 * RULE-014: Speed First - direct video files are faster than Stream player
 * RULE-018: Progressive asset loading with Intersection Observer
 */

import { useEffect, useRef, useState } from 'react';
import { lazyLoadManager } from '../lib/intersection-observer';
import { bunnyVideoFile } from '../lib/bunny-cdn';

export interface AutoplayVideoProps extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
	src: string;
	poster?: string;
	priority?: boolean;
	pullZone?: string;
}

export function AutoplayVideo({
	src,
	poster,
	priority = false,
	pullZone = 'storage',
	className = '',
	...props
}: AutoplayVideoProps): JSX.Element {
	const [shouldLoad, setShouldLoad] = useState(priority);
	const [reducedMotion, setReducedMotion] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// RULE-008: Respect prefers-reduced-motion
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReducedMotion(mediaQuery.matches);

		const handleChange = (e: MediaQueryListEvent): void => {
			setReducedMotion(e.matches);
			if (e.matches && !shouldLoad) {
				setShouldLoad(true);
			}
		};

		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	}, [shouldLoad]);

	useEffect(() => {
		if (priority || reducedMotion || shouldLoad) {
			return;
		}

		const element = containerRef.current;
		if (!element) return;

		// RULE-018: Use singleton lazyLoadManager
		lazyLoadManager.observe(element, (entry) => {
			if (entry.isIntersecting) {
				setShouldLoad(true);
				lazyLoadManager.unobserve(element);
			}
		});

		return () => {
			if (element) {
				lazyLoadManager.unobserve(element);
			}
		};
	}, [priority, reducedMotion, shouldLoad]);

	const videoUrl = bunnyVideoFile(src, pullZone);

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			{!shouldLoad && poster && (
				<img
					src={poster}
					alt=""
					aria-hidden="true"
					className="absolute inset-0 w-full h-full object-cover"
					loading="lazy"
				/>
			)}
			{shouldLoad && (
				<video
					ref={videoRef}
					src={videoUrl}
					poster={poster}
					autoPlay
					muted
					loop
					playsInline
					preload={priority ? 'auto' : 'none'}
					className="w-full h-full object-cover"
					{...props}
				/>
			)}
		</div>
	);
}

