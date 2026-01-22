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
	// Optimized for mobile: Don't wait for full page load if element exists
	const initialHash = window.location.hash.slice(1); // Remove #
	if (initialHash) {
		// Try immediately - most elements exist in DOM even before load completes
		let hasScrolled = false;
		
		function attemptScroll(): boolean {
			if (hasScrolled) return true;
			const scrolled = scrollToHash(initialHash);
			if (scrolled) {
				hasScrolled = true;
			}
			return scrolled;
		}
		
		// Try immediately if DOM is ready
		if (document.readyState !== 'loading') {
			if (!attemptScroll()) {
				// Element not found yet, try after DOMContentLoaded
				document.addEventListener('DOMContentLoaded', () => {
					if (!attemptScroll()) {
						// Still not found, retry after short delay (for dynamically added content)
						setTimeout(() => {
							attemptScroll();
						}, 200);
					}
				}, { once: true });
			}
		} else {
			// DOM still loading, wait for DOMContentLoaded (faster than 'load' event)
			document.addEventListener('DOMContentLoaded', () => {
				if (!attemptScroll()) {
					// Retry after short delay
					setTimeout(() => {
						attemptScroll();
					}, 200);
				}
			}, { once: true });
		}
		
		// Fallback: If still not found after load event (for very slow pages)
		window.addEventListener('load', () => {
			if (!hasScrolled) {
				attemptScroll();
			}
		}, { once: true });
	}
	
	// Use Intersection Observer to detect visible sections
	// Optimized for mobile: Use single threshold and passive observation
	const observer = new IntersectionObserver(
		(entries) => {
			// Don't update hash if we're programmatically scrolling
			if (isUpdatingHash) return;
			
			// Find the section with highest intersection ratio
			let maxRatio = 0;
			let activeSection: HTMLElement | null = null;
			
			// Use for...of for better performance than forEach
			for (const entry of entries) {
				if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
					maxRatio = entry.intersectionRatio;
					activeSection = entry.target as HTMLElement;
				}
			}
			
			// Update hash if we found an active section
			// Use requestAnimationFrame to batch DOM updates (better for mobile)
			if (activeSection && activeSection.id) {
				requestAnimationFrame(() => {
					if (!isUpdatingHash && activeSection && activeSection.id) {
						const newHash = `#${activeSection.id}`;
						if (window.location.hash !== newHash) {
							// Use replaceState to avoid adding history entries
							window.history.replaceState(null, '', newHash);
						}
					}
				});
			}
		},
		{
			// Optimized threshold: Single value is faster than array on mobile
			threshold: 0.5,
			// Add some margin to trigger slightly before section is fully visible
			rootMargin: '-10% 0px -10% 0px'
		}
	);
	
	// Observe all sections
	sections.forEach((section) => observer.observe(section));
	
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
