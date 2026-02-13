// Lobby Manager - Handles lobby creation, joining, and management

const LobbyManager = {
    currentVote: null,

    // Create a new lobby
    async createLobby(playerName) {
        UIManager.showLoading();
        
        try {
            // Validate player name
            const validation = utils.validatePlayerName(playerName);
            if (!validation.valid) {
                UIManager.showToast(validation.error, 'error');
                UIManager.hideLoading();
                return;
            }

            // Initialize player
            GameState.initPlayer(validation.name);

            // Generate unique lobby code
            let lobbyCode;
            let codeExists = true;
            let attempts = 0;
            
            while (codeExists && attempts < 10) {
                lobbyCode = utils.generateLobbyCode();
                codeExists = await FirebaseManager.lobbyExists(lobbyCode);
                attempts++;
            }

            if (codeExists) {
                UIManager.showToast('Failed to generate unique code. Try again.', 'error');
                UIManager.hideLoading();
                return;
            }

            // Create lobby in Firebase
            const result = await FirebaseManager.createLobby(
                lobbyCode,
                GameState.playerId,
                GameState.playerName
            );

            if (!result.success) {
                UIManager.showToast(result.error || 'Failed to create lobby', 'error');
                UIManager.hideLoading();
                return;
            }

            // Set lobby in game state
            GameState.setLobby(lobbyCode, true);

            // Watch lobby for changes
            this.startWatchingLobby(lobbyCode);

            // Show lobby screen
            UIManager.updateLobbyCode(lobbyCode);
            UIManager.showScreen('lobby-screen');
            UIManager.hideLoading();
            UIManager.showToast('Lobby created successfully!', 'success');

        } catch (error) {
            console.error('Create lobby error:', error);
            UIManager.showToast('An error occurred', 'error');
            UIManager.hideLoading();
        }
    },

    // Join an existing lobby
    async joinLobby(playerName, lobbyCode) {
        UIManager.showLoading();

        try {
            // Validate inputs
            const nameValidation = utils.validatePlayerName(playerName);
            if (!nameValidation.valid) {
                UIManager.showToast(nameValidation.error, 'error');
                UIManager.hideLoading();
                return;
            }

            const codeValidation = utils.validateLobbyCode(lobbyCode);
            if (!codeValidation.valid) {
                UIManager.showToast(codeValidation.error, 'error');
                UIManager.hideLoading();
                return;
            }

            // Initialize player
            GameState.initPlayer(nameValidation.name);

            // Join lobby in Firebase
            const result = await FirebaseManager.joinLobby(
                codeValidation.code,
                GameState.playerId,
                GameState.playerName
            );

            if (!result.success) {
                UIManager.showToast(result.error || 'Failed to join lobby', 'error');
                UIManager.hideLoading();
                return;
            }

            // Set lobby in game state
            GameState.setLobby(codeValidation.code, false);

            // Watch lobby for changes
            this.startWatchingLobby(codeValidation.code);

            // Show lobby screen
            UIManager.updateLobbyCode(codeValidation.code);
            UIManager.showScreen('lobby-screen');
            UIManager.hideLoading();
            UIManager.showToast('Joined lobby successfully!', 'success');

        } catch (error) {
            console.error('Join lobby error:', error);
            UIManager.showToast('An error occurred', 'error');
            UIManager.hideLoading();
        }
    },

    // Start watching lobby for real-time updates
    startWatchingLobby(lobbyCode) {
        GameState.unwatchLobby = FirebaseManager.watchLobby(lobbyCode, (lobbyData) => {
            if (!lobbyData) {
                // Lobby was deleted
                UIManager.showToast('Lobby was closed', 'error');
                this.exitToMenu();
                return;
            }

            // Update game state
            GameState.lobbyData = lobbyData;

            // Update UI based on lobby status
            this.handleLobbyUpdate(lobbyData);
        });
    },

    // Handle lobby data updates
    handleLobbyUpdate(lobbyData) {
        const status = lobbyData.status;
        const players = Object.entries(lobbyData.players || {}).map(([id, data]) => ({
            id,
            ...data
        }));

        // Always update players list if on lobby screen
        if (GameState.currentScreen === 'lobby-screen') {
            UIManager.updatePlayersList(players);
        }

        // Handle different game states
        if (status === 'voting') {
            this.handleVotingPhase(lobbyData, players);
        } else if (status === 'playing') {
            this.handlePlayingPhase(lobbyData, players);
        } else if (status === 'finished') {
            this.handleFinishedPhase(lobbyData);
        }
    },

    // Handle voting phase
    handleVotingPhase(lobbyData, players) {
        if (GameState.currentScreen !== 'topic-voting-screen') {
            UIManager.showScreen('topic-voting-screen');
            UIManager.updateTopicsList(lobbyData.game.topics);
        }

        // Update voting status
        const votes = lobbyData.game.votes || {};
        const votedCount = Object.keys(votes).length;
        UIManager.updateVotingStatus(votedCount, players.length);

        // Check if player has voted
        if (votes[GameState.playerId]) {
            this.currentVote = votes[GameState.playerId];
            UIManager.updateTopicsList(lobbyData.game.topics, this.currentVote);
        }

        // Check if all players voted (only host processes this)
        if (GameState.isHost && votedCount === players.length && votedCount > 0) {
            this.processTopicVotes(lobbyData.game.votes, lobbyData.game.topics, players);
        }
    },

    // Handle playing phase
    handlePlayingPhase(lobbyData, players) {
        const game = lobbyData.game;
        
        // Show role reveal if not seen yet
        if (GameState.currentScreen === 'topic-voting-screen') {
            const isChameleon = game.chameleon === GameState.playerId;
            const secretWord = game.secretWord;
            const topic = game.selectedTopic;
            
            UIManager.displayRoleReveal(isChameleon, secretWord, topic);
            UIManager.showScreen('role-reveal-screen');
            return;
        }

        // Handle player voting
        if (game.playerVotes) {
            if (GameState.currentScreen !== 'voting-screen') {
                UIManager.showScreen('voting-screen');
                UIManager.updateVotingPlayersList(players);
            }

            const votes = game.playerVotes || {};
            const votedCount = Object.keys(votes).length;
            UIManager.updateVoteStatus(votedCount, players.length);

            // Update UI if player has voted
            if (votes[GameState.playerId]) {
                UIManager.updateVotingPlayersList(players, votes[GameState.playerId]);
            }

            // Check if all voted (only host processes)
            if (GameState.isHost && votedCount === players.length && votedCount > 0) {
                GameManager.processVotingResults(votes, game.chameleon, players);
            }
        }
    },

    // Handle finished phase
    handleFinishedPhase(lobbyData) {
        if (GameState.currentScreen !== 'results-screen') {
            UIManager.displayResults(lobbyData.game.results);
            UIManager.showScreen('results-screen');
        }
    },

    // Start the game (host only)
    async startGame() {
        if (!GameState.isHost) return;

        const players = GameState.getPlayers();
        if (players.length < gameConfig.minPlayers) {
            UIManager.showToast(`Need at least ${gameConfig.minPlayers} players`, 'error');
            return;
        }

        UIManager.showLoading();

        // Get random topics for voting
        const topics = utils.getRandomTopics(5);

        const result = await FirebaseManager.startGame(GameState.lobbyCode, topics);

        if (result.success) {
            UIManager.hideLoading();
        } else {
            UIManager.showToast('Failed to start game', 'error');
            UIManager.hideLoading();
        }
    },

    // Vote for a topic
    async voteTopic(topic) {
        if (this.currentVote) return; // Already voted

        this.currentVote = topic;
        UIManager.updateTopicsList(GameState.lobbyData.game.topics, topic);

        const result = await FirebaseManager.submitTopicVote(
            GameState.lobbyCode,
            GameState.playerId,
            topic
        );

        if (!result.success) {
            UIManager.showToast('Failed to submit vote', 'error');
            this.currentVote = null;
        }
    },

    // Process topic votes and determine winner (host only)
    async processTopicVotes(votes, topics, players) {
        // Wait a moment for UI
        await utils.sleep(1000);

        // Count votes
        const voteCounts = {};
        Object.values(votes).forEach(topic => {
            voteCounts[topic] = (voteCounts[topic] || 0) + 1;
        });

        // Find topic with most votes
        let selectedTopic = topics[0];
        let maxVotes = 0;
        
        Object.entries(voteCounts).forEach(([topic, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                selectedTopic = topic;
            }
        });

        // Randomly assign chameleon
        const playerIds = players.map(p => p.id);
        const chameleonId = utils.getRandomElement(playerIds);

        // Get random secret word from selected topic
        const words = gameConfig.topics[selectedTopic];
        const secretWord = utils.getRandomElement(words);

        // Update game state
        await FirebaseManager.setTopicAndRoles(
            GameState.lobbyCode,
            selectedTopic,
            chameleonId,
            secretWord
        );

        this.currentVote = null;
    },

    // Leave lobby
    async leaveLobby() {
        UIManager.showLoading();
        
        await FirebaseManager.leaveLobby(GameState.lobbyCode, GameState.playerId);
        
        GameState.clearLobby();
        UIManager.hideLoading();
        UIManager.showScreen('welcome-screen');
    },

    // Exit to main menu
    exitToMenu() {
        if (GameState.unwatchLobby) {
            GameState.unwatchLobby();
        }
        GameState.clearAll();
        UIManager.showScreen('welcome-screen');
    }
};
