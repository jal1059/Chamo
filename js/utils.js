// Utility functions

const utils = {
    // Generate a random lobby code
    generateLobbyCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < gameConfig.lobbyCodeLength; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    },

    // Generate a unique player ID
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    },

    // Validate player name
    validatePlayerName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Name is required' };
        }
        const trimmedName = name.trim();
        if (trimmedName.length < 2) {
            return { valid: false, error: 'Name must be at least 2 characters' };
        }
        if (trimmedName.length > 20) {
            return { valid: false, error: 'Name must be at most 20 characters' };
        }
        return { valid: true, name: trimmedName };
    },

    // Validate lobby code
    validateLobbyCode(code) {
        if (!code || typeof code !== 'string') {
            return { valid: false, error: 'Code is required' };
        }
        const trimmedCode = code.trim().toUpperCase();
        if (trimmedCode.length !== gameConfig.lobbyCodeLength) {
            return { valid: false, error: `Code must be ${gameConfig.lobbyCodeLength} characters` };
        }
        if (!/^[A-Z]+$/.test(trimmedCode)) {
            return { valid: false, error: 'Code must contain letters only' };
        }
        return { valid: true, code: trimmedCode };
    },

    // Shuffle an array (Fisher-Yates algorithm)
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // Get random element from array
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Get random topics for voting
    getRandomTopics(count = 5) {
        const allTopics = Object.keys(gameConfig.topics);
        const shuffled = this.shuffleArray(allTopics);
        return shuffled.slice(0, Math.min(count, allTopics.length));
    },

    // Format time (seconds to MM:SS)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Delay/sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Sanitize HTML to prevent XSS
    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
