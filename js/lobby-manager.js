// Lobby Manager - Handles lobby creation, joining, and management

const LobbyManager = {
    currentVote: null,

    // Create a new lobby
    async createLobby(playerName, preferredLobbyCode = '') {
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

            // Validate optional custom lobby code from host
            const trimmedPreferredCode = preferredLobbyCode.trim();
            let lobbyCode;

            if (trimmedPreferredCode) {
                const preferredCodeValidation = utils.validateLobbyCode(trimmedPreferredCode);
                if (!preferredCodeValidation.valid) {
                    UIManager.showToast(preferredCodeValidation.error, 'error');
                    UIManager.hideLoading();
                    return;
                }

                const codeExists = await FirebaseManager.lobbyExists(preferredCodeValidation.code);
                if (codeExists) {
                    UIManager.showToast('That lobby code is already taken. Try another.', 'error');
                    UIManager.hideLoading();
                    return;
                }

                lobbyCode = preferredCodeValidation.code;
            } else {
                // Generate unique lobby code
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
            GameManager.stopDiscussionTimer();
            GameManager.stopVotingLockCountdown();
            this.handleVotingPhase(lobbyData, players);
        } else if (status === 'playing') {
            this.handlePlayingPhase(lobbyData, players);
        } else if (status === 'finished') {
            GameManager.stopDiscussionTimer();
            GameManager.stopVotingLockCountdown();
            this.handleFinishedPhase(lobbyData);
        } else if (status === 'waiting') {
            GameManager.stopDiscussionTimer();
            GameManager.stopVotingLockCountdown();
            this.currentVote = null;
            UIManager.updateLobbyCode(GameState.lobbyCode);
            UIManager.showScreen('lobby-screen');
            UIManager.updatePlayersList(players);
        } else {
            GameManager.stopDiscussionTimer();
            GameManager.stopVotingLockCountdown();
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

        // Handle player voting
        if (game.votingOpenedAt || game.playerVotes) {
            GameManager.stopDiscussionTimer();
            if (GameState.currentScreen !== 'voting-screen') {
                UIManager.showScreen('voting-screen');
                UIManager.updateVotingPlayersList(players);
            }

            const votes = game.playerVotes || {};
            const votedCount = Object.keys(votes).length;
            GameManager.startVotingLockCountdown(votedCount, players.length);

            // Update UI if player has voted
            if (votes[GameState.playerId]) {
                UIManager.updateVotingPlayersList(players, votes[GameState.playerId]);
            }

            // Check if all voted (only host processes)
            if (GameState.isHost && votedCount === players.length && votedCount > 0) {
                GameManager.processVotingResults(votes, game.chameleon, players);
            }
            return;
        }

        // Handle synchronized discussion timer phase
        if (game.discussionStartedAt) {
            UIManager.updateCurrentTopic(game.selectedTopic);
            if (GameState.currentScreen !== 'discussion-screen') {
                UIManager.showScreen('discussion-screen');
            }
            GameManager.startDiscussionPhase(game.discussionStartedAt, game.discussionDuration || gameConfig.discussionTime);
            return;
        }
        
        // Show role reveal if not seen yet
        if (GameState.currentScreen === 'topic-voting-screen') {
            const isChameleon = game.chameleon === GameState.playerId;
            const secretWord = game.secretWord;
            const topic = game.selectedTopic;
            
            UIManager.displayRoleReveal(isChameleon, secretWord, topic);
            UIManager.showScreen('role-reveal-screen');
            return;
        }
    },

    // Handle finished phase
    handleFinishedPhase(lobbyData) {
        if (GameState.currentScreen !== 'results-screen') {
            UIManager.displayResults(lobbyData.game.results);
            UIManager.showScreen('results-screen');
        }

        UIManager.updateResultsActions(GameState.isHost);
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

        // Find top-voted topics and randomly break ties
        const maxVotes = Math.max(...Object.values(voteCounts));
        const topTopics = Object.entries(voteCounts)
            .filter(([, count]) => count === maxVotes)
            .map(([topic]) => topic);
        const selectedTopic = utils.getRandomElement(topTopics);

        // Randomly assign chameleon
        const playerIds = players.map(p => p.id);
        const shuffledPlayerIds = utils.shuffleArray(playerIds);
        const chameleonId = shuffledPlayerIds[0];

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
    async exitToMenu() {
        const lobbyCode = GameState.lobbyCode;
        const playerId = GameState.playerId;

        if (lobbyCode && playerId) {
            UIManager.showLoading();
            await FirebaseManager.leaveLobby(lobbyCode, playerId);
            UIManager.hideLoading();
        }

        if (GameState.unwatchLobby) {
            GameState.unwatchLobby();
        }
        GameState.clearAll();
        UIManager.showScreen('welcome-screen');
    }
};
