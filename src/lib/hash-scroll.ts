/**
 * Hash Scroll Manager
 * Updates URL hash as user scrolls through sections
 * Uses Intersection Observer to detect visible sections
 */

export function initHashScroll(): void {
	// Track if we're updating hash programmatically (to prevent scroll loops)
	let isUpdatingHash = false;
	
	// Helper function to ensure all sections have IDs
	function ensureSectionIds(): void {
		const sections = document.querySelectorAll<HTMLElement>('section[class*="snap-start"]');
		sections.forEach((section, index) => {
			if (!section.id) {
				// Generate a slug from section content or use index
				const sectionId = generateSectionId(section, index);
				section.id = sectionId;
			}
		});
	}
	
	// Helper function to scroll to hash target
	function scrollToHash(hash: string): boolean {
		// Ensure IDs are generated before looking for the target
		ensureSectionIds();
		
		const targetSection = document.getElementById(hash);
		if (targetSection) {
			// Check for reduced motion preference (RULE-008, RULE-014)
			const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			
			// For mobile performance: Use single RAF if element is already in DOM
			// Double RAF only needed if layout might not be stable
			const scrollBehavior = prefersReducedMotion ? 'auto' : 'instant';
			
			// Optimize for mobile: Check if we can scroll immediately
			if (document.readyState === 'complete' && targetSection.offsetParent !== null) {
				// Element is visible and page is loaded - scroll immediately
				isUpdatingHash = true;
				targetSection.scrollIntoView({ behavior: scrollBehavior });
				setTimeout(() => {
					isUpdatingHash = false;
				}, prefersReducedMotion ? 50 : 100);
				return true;
			}
			
			// Otherwise, wait for next frame to ensure layout is stable
			requestAnimationFrame(() => {
				isUpdatingHash = true;
				targetSection.scrollIntoView({ behavior: scrollBehavior });
				setTimeout(() => {
					isUpdatingHash = false;
				}, prefersReducedMotion ? 50 : 100);
			});
			return true;
		}
		return false;
	}
	
	// Find all sections with snap-start class
	const sections = document.querySelectorAll<HTMLElement>('section[class*="snap-start"]');
	
	if (sections.length === 0) return;
	
	// Generate section IDs if they don't exist
	ensureSectionIds();
	
	// Handle initial hash on page load
	// This handles both same-page navigation and cross-page navigation
	// Check both URL hash and sessionStorage (for cross-page navigation prevention)
	const urlHash = window.location.hash.slice(1);
	const pendingHash = sessionStorage.getItem('pendingHashScroll');
	const initialHash = urlHash || pendingHash || '';
	
	if (initialHash) {
		// Clear pending hash from sessionStorage if it exists
		if (pendingHash) {
			sessionStorage.removeItem('pendingHashScroll');
		}
		
		// Simple, reliable scroll function
		function scrollToTarget(): void {
			ensureSectionIds();
			const targetSection = document.getElementById(initialHash);
			
			if (targetSection) {
				const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
				const scrollBehavior = prefersReducedMotion ? 'auto' : 'instant';
				
				isUpdatingHash = true;
				
				// Scroll directly to the target section
				// Use block: 'start' to align with top of viewport
				targetSection.scrollIntoView({ 
					behavior: scrollBehavior, 
					block: 'start',
					inline: 'nearest'
				});
				
				// Reset flag after scroll completes
				setTimeout(() => {
					isUpdatingHash = false;
					// Update hash to ensure URL is correct
					updateActiveSectionHash();
				}, prefersReducedMotion ? 100 : 300);
			}
		}
		
		// Wait for page to be fully loaded before scrolling
		// This ensures all sections are rendered and positioned correctly
		if (document.readyState === 'complete') {
			// Page already loaded - wait a bit for layout to stabilize
			setTimeout(() => {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						scrollToTarget();
					});
				});
			}, 100);
		} else {
			// Wait for window load event (all resources loaded)
			window.addEventListener('load', () => {
				setTimeout(() => {
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							scrollToTarget();
						});
					});
				}, 200);
			}, { once: true });
			
			// Also try after DOMContentLoaded as a fallback
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => {
					setTimeout(() => {
						requestAnimationFrame(() => {
							scrollToTarget();
						});
					}, 300);
				}, { once: true });
			}
		}
	}
	
	// Function to find and update the most visible section
	// This checks all sections to find which one is most visible in viewport
	function updateActiveSectionHash(): void {
		if (isUpdatingHash) return;
		
		// Ensure all sections have IDs before checking
		ensureSectionIds();
		
		// Refresh sections list in case DOM changed
		const currentSections = document.querySelectorAll<HTMLElement>('section[class*="snap-start"]');
		if (currentSections.length === 0) return;
		
		let maxScore = -1;
		let activeSection: HTMLElement | null = null;
		let fallbackSection: HTMLElement | null = null; // Fallback: section with most visible area
		let maxVisibleArea = 0;
		const viewportHeight = window.innerHeight;
		const viewportCenter = viewportHeight / 2;
		
		// Check all sections to find the one with most visible area
		for (const section of currentSections) {
			if (!section.id) continue; // Skip sections without IDs
			
			const rect = section.getBoundingClientRect();
			
			// Calculate visible area of section in viewport
			const visibleTop = Math.max(0, rect.top);
			const visibleBottom = Math.min(viewportHeight, rect.bottom);
			const visibleHeight = Math.max(0, visibleBottom - visibleTop);
			
			// Track fallback: section with most visible area (even if not fully visible)
			if (visibleHeight > maxVisibleArea) {
				maxVisibleArea = visibleHeight;
				fallbackSection = section;
			}
			
			// If section is not visible at all, skip it
			if (visibleHeight === 0) continue;
			
			// Calculate what percentage of the section is visible
			const sectionHeight = rect.height;
			const visibilityRatio = sectionHeight > 0 ? visibleHeight / sectionHeight : 0;
			
			// Calculate how centered the section is in viewport
			const sectionCenter = (rect.top + rect.bottom) / 2;
			const distanceFromCenter = Math.abs(sectionCenter - viewportCenter);
			// Normalize: sections at center get score of 1, sections at edge get lower score
			const centerScore = Math.max(0, 1 - (distanceFromCenter / viewportHeight));
			
			// For scroll-snap sections, prioritize sections that are:
			// 1. Mostly visible (snapped sections should be >80% visible)
			// 2. Centered in viewport (snapped sections should be well-centered)
			
			let score = 0;
			
			// If section is mostly visible and well-centered, it's likely snapped
			if (visibilityRatio > 0.7 && centerScore > 0.5) {
				// High priority: snapped section
				score = visibilityRatio * 0.5 + centerScore * 0.5;
				// Bonus for being very visible and centered
				if (visibilityRatio > 0.9 && centerScore > 0.7) {
					score += 0.3; // Extra bonus for perfectly snapped sections
				}
			} else {
				// Lower priority: partially visible section
				score = visibilityRatio * 0.6 + centerScore * 0.4;
			}
			
			if (score > maxScore) {
				maxScore = score;
				activeSection = section;
			}
		}
		
		// Use fallback if no section scored well
		if (!activeSection && fallbackSection) {
			activeSection = fallbackSection;
		}
		
		// Update hash if we found an active section
		// Always update if we found a section (no threshold - any visible section should update URL)
		if (activeSection && activeSection.id) {
			const newHash = `#${activeSection.id}`;
			const currentHash = window.location.hash;
			if (currentHash !== newHash) {
				// Preserve pathname and search params when updating hash
				const pathname = window.location.pathname;
				const search = window.location.search;
				const newUrl = pathname + search + newHash;
				
				try {
					// Use replaceState to update URL without page reload
					window.history.replaceState(null, '', newUrl);
				} catch (e) {
					// Fallback: just update hash directly if replaceState fails
					// This will cause a page scroll, but it's better than nothing
					window.location.hash = newHash;
				}
			}
		}
	}
	
	// Use Intersection Observer to detect visible sections
	// Optimized for mobile: Use multiple thresholds for better detection
	const observer = new IntersectionObserver(
		() => {
			// When any section's intersection changes, check all sections
			// This ensures we always get the most visible one
			requestAnimationFrame(updateActiveSectionHash);
		},
		{
			// Use multiple thresholds for better detection during scroll snap
			threshold: [0, 0.25, 0.5, 0.75, 1],
			// Smaller margin to trigger more frequently
			rootMargin: '-5% 0px -5% 0px'
		}
	);
	
	// Observe all sections
	sections.forEach((section) => observer.observe(section));
	
	// Add scroll event listener as fallback (throttled for performance)
	// This ensures URL updates even if Intersection Observer misses updates during fast scrolling
	let scrollTimeout: number | null = null;
	window.addEventListener('scroll', () => {
		if (isUpdatingHash) return;
		
		// Throttle scroll events to max 60fps (16.67ms) - RULE-019
		if (scrollTimeout === null) {
			scrollTimeout = window.requestAnimationFrame(() => {
				updateActiveSectionHash();
				scrollTimeout = null;
			});
		}
	}, { passive: true });
	
	// Also update on scroll end (for scroll snap completion)
	let scrollEndTimeout: number | null = null;
	window.addEventListener('scroll', () => {
		if (scrollEndTimeout !== null) {
			clearTimeout(scrollEndTimeout);
		}
		scrollEndTimeout = window.setTimeout(() => {
			updateActiveSectionHash();
		}, 150);
	}, { passive: true });
	
	// Set initial hash - always update to show current section
	// This ensures URL always reflects the visible section, even on initial load
	const setInitialHash = () => {
		// Use multiple RAFs to ensure layout is stable
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				updateActiveSectionHash();
			});
		});
	};
	
	if (document.readyState === 'complete') {
		// Page already loaded, set hash immediately
		setTimeout(setInitialHash, 50);
	} else if (document.readyState === 'interactive') {
		// DOM ready but resources still loading
		setTimeout(setInitialHash, 100);
	} else {
		// Wait for DOMContentLoaded
		document.addEventListener('DOMContentLoaded', () => {
			setTimeout(setInitialHash, 100);
		}, { once: true });
	}
	
	// Also update after all resources load
	window.addEventListener('load', () => {
		setTimeout(setInitialHash, 100);
	}, { once: true });
	
	// Periodic check to ensure hash stays updated (every 500ms)
	// This is a safety net in case scroll events or Intersection Observer miss updates
	const periodicCheck = setInterval(() => {
		if (!isUpdatingHash) {
			updateActiveSectionHash();
		}
	}, 500);
	
	// Clean up interval when page unloads
	window.addEventListener('beforeunload', () => {
		clearInterval(periodicCheck);
	});
	
	// Handle browser back/forward buttons
	// Respect prefers-reduced-motion (RULE-008)
	window.addEventListener('popstate', () => {
		const hash = window.location.hash.slice(1);
		if (hash) {
			const targetSection = document.getElementById(hash);
			if (targetSection) {
				const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
				isUpdatingHash = true;
				targetSection.scrollIntoView({ 
					behavior: prefersReducedMotion ? 'auto' : 'smooth' 
				});
				setTimeout(() => {
					isUpdatingHash = false;
				}, prefersReducedMotion ? 100 : 500);
			}
		}
	});
}

/**
 * Generate a URL-friendly ID for a section
 */
function generateSectionId(section: HTMLElement, index: number): string {
	// Try to find text content that could be used as ID
	const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
	if (heading) {
		const text = heading.textContent?.trim().toLowerCase() || '';
		if (text) {
			// Convert to slug: lowercase, replace spaces with hyphens, remove special chars
			const slug = text
				.replace(/[^\w\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.replace(/^-|-$/g, '');
			if (slug.length > 0) {
				return slug;
			}
		}
	}
	
	// Fallback to section-{index}
	return `section-${index + 1}`;
}
