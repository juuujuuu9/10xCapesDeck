/**
 * Singleton Intersection Observer manager for progressive asset loading
 * RULE-018: Use single Intersection Observer instance (singleton pattern)
 */

type IntersectionCallback = (entry: IntersectionObserverEntry) => void;

interface ObserverEntry {
	element: Element;
	callback: IntersectionCallback;
}

class LazyLoadManager {
	private observer: IntersectionObserver | null = null;
	private entries: Map<Element, ObserverEntry> = new Map();
	private readonly config: IntersectionObserverInit = {
		rootMargin: '50vh 0px',
		threshold: 0.01,
	};

	private createObserver(): IntersectionObserver {
		return new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const stored = this.entries.get(entry.target);
				if (stored) {
					stored.callback(entry);
				}
			});
		}, this.config);
	}

	/**
	 * Observe an element for intersection
	 */
	observe(element: Element, callback: IntersectionCallback): void {
		if (!this.observer) {
			this.observer = this.createObserver();
		}

		this.entries.set(element, { element, callback });
		this.observer.observe(element);
	}

	/**
	 * Stop observing an element
	 */
	unobserve(element: Element): void {
		if (this.observer) {
			this.observer.unobserve(element);
			this.entries.delete(element);
		}
	}

	/**
	 * Disconnect the observer and clean up
	 */
	disconnect(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
			this.entries.clear();
		}
	}
}

// Singleton instance
export const lazyLoadManager = new LazyLoadManager();

