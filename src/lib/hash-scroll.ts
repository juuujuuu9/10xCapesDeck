/**
 * Hash Scroll Manager
 * Updates URL hash as user scrolls through sections
 * Uses Intersection Observer to detect visible sections
 */

export function initHashScroll(): void {
	// Find all sections with snap-start class
	const sections = document.querySelectorAll<HTMLElement>('section[class*="snap-start"]');
	
	if (sections.length === 0) return;
	
	// Track if we're updating hash programmatically (to prevent scroll loops)
	let isUpdatingHash = false;
	
	// Generate section IDs if they don't exist
	sections.forEach((section, index) => {
		if (!section.id) {
			// Generate a slug from section content or use index
			const sectionId = generateSectionId(section, index);
			section.id = sectionId;
		}
	});
	
	// Handle initial hash on page load
	const initialHash = window.location.hash.slice(1); // Remove #
	if (initialHash) {
		const targetSection = document.getElementById(initialHash);
		if (targetSection) {
			// Small delay to ensure layout is complete
			setTimeout(() => {
				isUpdatingHash = true;
				targetSection.scrollIntoView({ behavior: 'instant' });
				// Reset flag after scroll completes
				setTimeout(() => {
					isUpdatingHash = false;
				}, 100);
			}, 100);
		}
	}
	
	// Use Intersection Observer to detect visible sections
	const observer = new IntersectionObserver(
		(entries) => {
			// Don't update hash if we're programmatically scrolling
			if (isUpdatingHash) return;
			
			// Find the section with highest intersection ratio
			let maxRatio = 0;
			let activeSection: HTMLElement | null = null;
			
			entries.forEach((entry) => {
				if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
					maxRatio = entry.intersectionRatio;
					activeSection = entry.target as HTMLElement;
				}
			});
			
			// Update hash if we found an active section
			if (activeSection && activeSection.id) {
				const newHash = `#${activeSection.id}`;
				if (window.location.hash !== newHash) {
					// Use replaceState to avoid adding history entries
					window.history.replaceState(null, '', newHash);
				}
			}
		},
		{
			// Trigger when section is mostly visible (50%+)
			threshold: [0.5, 0.75, 1.0],
			// Add some margin to trigger slightly before section is fully visible
			rootMargin: '-10% 0px -10% 0px'
		}
	);
	
	// Observe all sections
	sections.forEach((section) => observer.observe(section));
	
	// Handle browser back/forward buttons
	window.addEventListener('popstate', () => {
		const hash = window.location.hash.slice(1);
		if (hash) {
			const targetSection = document.getElementById(hash);
			if (targetSection) {
				isUpdatingHash = true;
				targetSection.scrollIntoView({ behavior: 'smooth' });
				setTimeout(() => {
					isUpdatingHash = false;
				}, 500);
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
