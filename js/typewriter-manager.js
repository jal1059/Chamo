// Typewriter Manager - animates marked text when screens are shown

const TypewriterManager = {
    activeIntervals: new Map(),
    charDelayMs: 18,

    animateScreen(screenEl) {
        if (!screenEl) return;

        const targets = screenEl.querySelectorAll('[data-typewriter]');
        targets.forEach((element, index) => {
            const original = element.dataset.originalText || element.textContent;
            element.dataset.originalText = original;
            this.animateElement(element, original, index * 120);
        });
    },

    animateElement(element, text, delayMs = 0) {
        if (!element) return;

        const existing = this.activeIntervals.get(element);
        if (existing) {
            clearInterval(existing);
            this.activeIntervals.delete(element);
        }

        element.textContent = '';
        element.classList.add('typing-cursor');

        setTimeout(() => {
            let position = 0;

            const intervalId = setInterval(() => {
                position += 1;
                element.textContent = text.slice(0, position);

                if (position >= text.length) {
                    clearInterval(intervalId);
                    this.activeIntervals.delete(element);
                    element.classList.remove('typing-cursor');
                }
            }, this.charDelayMs);

            this.activeIntervals.set(element, intervalId);
        }, delayMs);
    }
};
