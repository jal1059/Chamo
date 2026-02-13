// Main App - Entry point and event handlers

const App = {
    // Initialize the application
    init() {
        console.log('Initializing Chamo Game...');

        // Initialize Firebase
        if (!FirebaseManager.init()) {
            UIManager.showToast('Failed to initialize. Please refresh.', 'error');
            return;
        }

        // Restore session if exists
        GameState.restoreFromSession();

        // Set up event listeners
        this.setupEventListeners();

        // Check if we should restore to lobby
        if (GameState.lobbyCode && GameState.playerId) {
            this.restoreSession();
        } else {
            UIManager.showScreen('welcome-screen');
        }

        console.log('App initialized successfully');
    },

    // Set up all event listeners
    setupEventListeners() {
        // Welcome screen buttons
        document.getElementById('create-lobby-btn')?.addEventListener('click', () => {
            UIManager.showScreen('create-lobby-screen');
        });

        document.getElementById('join-lobby-btn')?.addEventListener('click', () => {
            UIManager.showScreen('join-lobby-screen');
        });

        // Create lobby screen
        document.getElementById('confirm-create-btn')?.addEventListener('click', () => {
            const nameInput = document.getElementById('player-name-create');
            LobbyManager.createLobby(nameInput.value);
        });

        document.getElementById('back-from-create-btn')?.addEventListener('click', () => {
            UIManager.showScreen('welcome-screen');
        });

        // Join lobby screen
        document.getElementById('confirm-join-btn')?.addEventListener('click', () => {
            const nameInput = document.getElementById('player-name-join');
            const codeInput = document.getElementById('lobby-code');
            LobbyManager.joinLobby(nameInput.value, codeInput.value);
        });

        document.getElementById('back-from-join-btn')?.addEventListener('click', () => {
            UIManager.showScreen('welcome-screen');
        });

        // Lobby screen
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            LobbyManager.startGame();
        });

        document.getElementById('leave-lobby-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to leave the lobby?')) {
                LobbyManager.leaveLobby();
            }
        });

        // Role reveal screen
        document.getElementById('continue-from-reveal-btn')?.addEventListener('click', () => {
            GameManager.continueFromReveal();
        });

        // Discussion screen
        document.getElementById('ready-to-vote-btn')?.addEventListener('click', () => {
            GameManager.readyToVote();
        });

        // Results screen
        document.getElementById('play-again-btn')?.addEventListener('click', () => {
            GameManager.playAgain();
        });

        document.getElementById('exit-to-menu-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to exit to main menu?')) {
                GameManager.exitToMenu();
            }
        });

        // Handle Enter key on input fields
        document.getElementById('player-name-create')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirm-create-btn')?.click();
            }
        });

        document.getElementById('player-name-join')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const codeInput = document.getElementById('lobby-code');
                codeInput?.focus();
            }
        });

        document.getElementById('lobby-code')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirm-join-btn')?.click();
            }
        });

        // Auto-uppercase lobby code input
        document.getElementById('lobby-code')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
        });

        // Handle page visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && GameState.lobbyCode) {
                // Refresh connection when user returns to tab
                console.log('Tab visible again, connection maintained');
            }
        });

        // Handle page unload (cleanup)
        window.addEventListener('beforeunload', () => {
            if (GameState.lobbyCode && GameState.playerId) {
                // Note: Firebase will handle cleanup automatically
                // We're just cleaning up local state
                if (GameState.unwatchLobby) {
                    GameState.unwatchLobby();
                }
            }
        });
    },

    // Restore previous session
    async restoreSession() {
        console.log('Attempting to restore session...');
        UIManager.showLoading();

        try {
            // Check if lobby still exists
            const exists = await FirebaseManager.lobbyExists(GameState.lobbyCode);
            
            if (exists) {
                // Rejoin the lobby by watching it
                LobbyManager.startWatchingLobby(GameState.lobbyCode);
                UIManager.updateLobbyCode(GameState.lobbyCode);
                
                // The watch callback will handle showing the appropriate screen
                UIManager.hideLoading();
                console.log('Session restored successfully');
            } else {
                // Lobby no longer exists
                console.log('Lobby no longer exists');
                GameState.clearAll();
                UIManager.hideLoading();
                UIManager.showScreen('welcome-screen');
                UIManager.showToast('Previous session expired', 'error');
            }
        } catch (error) {
            console.error('Session restore error:', error);
            GameState.clearAll();
            UIManager.hideLoading();
            UIManager.showScreen('welcome-screen');
        }
    }
};

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
