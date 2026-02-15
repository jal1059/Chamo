// Game State Manager - Maintains current game state

const GameState = {
    playerId: null,
    playerName: null,
    lobbyCode: null,
    isHost: false,
    currentScreen: 'welcome',
    lobbyData: null,
    unwatchLobby: null,

    // Initialize player
    initPlayer(name, playerId = null) {
        this.playerId = playerId || utils.generatePlayerId();
        this.playerName = name;
        // Store in session storage for page refresh
        sessionStorage.setItem('playerId', this.playerId);
        sessionStorage.setItem('playerName', name);
    },

    // Restore from session storage
    restoreFromSession() {
        this.playerId = sessionStorage.getItem('playerId');
        this.playerName = sessionStorage.getItem('playerName');
        this.lobbyCode = sessionStorage.getItem('lobbyCode');
        this.isHost = sessionStorage.getItem('isHost') === 'true';
    },

    // Set lobby
    setLobby(lobbyCode, isHost) {
        this.lobbyCode = lobbyCode;
        this.isHost = isHost;
        sessionStorage.setItem('lobbyCode', lobbyCode);
        sessionStorage.setItem('isHost', isHost.toString());
    },

    // Clear lobby
    clearLobby() {
        if (this.unwatchLobby) {
            this.unwatchLobby();
            this.unwatchLobby = null;
        }
        this.lobbyCode = null;
        this.isHost = false;
        this.lobbyData = null;
        sessionStorage.removeItem('lobbyCode');
        sessionStorage.removeItem('isHost');
    },

    // Clear all state
    clearAll() {
        this.clearLobby();
        this.playerId = null;
        this.playerName = null;
        sessionStorage.clear();
    },

    // Get player list from lobby data
    getPlayers() {
        if (!this.lobbyData || !this.lobbyData.players) {
            return [];
        }
        return Object.entries(this.lobbyData.players).map(([id, data]) => ({
            id,
            ...data
        }));
    },

    // Check if player is chameleon
    isChameleon() {
        return this.lobbyData?.game?.chameleon === this.playerId;
    },

    // Get secret word (null if chameleon)
    getSecretWord() {
        if (this.isChameleon()) {
            return null;
        }
        return this.lobbyData?.game?.secretWord;
    },

    // Get selected topic
    getSelectedTopic() {
        return this.lobbyData?.game?.selectedTopic;
    },

    // Get game status
    getGameStatus() {
        return this.lobbyData?.status || 'waiting';
    }
};
