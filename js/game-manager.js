// Game Manager - Handles game flow and logic

const GameManager = {
    discussionTimer: null,
    discussionTimeLeft: 0,

    // Continue from role reveal to discussion
    continueFromReveal() {
        const topic = GameState.getSelectedTopic();
        UIManager.updateCurrentTopic(topic);
        
        // Start discussion phase
        this.startDiscussionPhase();
        UIManager.showScreen('discussion-screen');
    },

    // Start discussion phase with timer
    startDiscussionPhase() {
        this.discussionTimeLeft = gameConfig.discussionTime;
        UIManager.updateDiscussionTimer(this.discussionTimeLeft);

        // Clear any existing timer
        if (this.discussionTimer) {
            clearInterval(this.discussionTimer);
        }

        // Start countdown
        this.discussionTimer = setInterval(() => {
            this.discussionTimeLeft--;
            UIManager.updateDiscussionTimer(this.discussionTimeLeft);

            if (this.discussionTimeLeft <= 0) {
                clearInterval(this.discussionTimer);
                this.discussionTimer = null;
                // Auto-advance to voting
                this.readyToVote();
            }
        }, 1000);
    },

    // Player indicates ready to vote
    readyToVote() {
        if (this.discussionTimer) {
            clearInterval(this.discussionTimer);
            this.discussionTimer = null;
        }

        // Show voting screen
        const players = GameState.getPlayers();
        UIManager.updateVotingPlayersList(players);
        UIManager.showScreen('voting-screen');
    },

    // Vote for a player
    async votePlayer(playerId) {
        const result = await FirebaseManager.submitPlayerVote(
            GameState.lobbyCode,
            GameState.playerId,
            playerId
        );

        if (result.success) {
            const players = GameState.getPlayers();
            UIManager.updateVotingPlayersList(players, playerId);
        } else {
            UIManager.showToast('Failed to submit vote', 'error');
        }
    },

    // Process voting results (host only)
    async processVotingResults(votes, chameleonId, players) {
        // Wait a moment for UI
        await utils.sleep(1000);

        // Count votes
        const voteCounts = {};
        Object.values(votes).forEach(votedId => {
            voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
        });

        // Find player with most votes
        let mostVotedId = Object.keys(voteCounts)[0];
        let maxVotes = 0;

        Object.entries(voteCounts).forEach(([playerId, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVotedId = playerId;
            }
        });

        // Determine if chameleon was caught
        const chameleonCaught = mostVotedId === chameleonId;

        // Get player names
        const chameleonPlayer = players.find(p => p.id === chameleonId);
        const votedPlayer = players.find(p => p.id === mostVotedId);

        // Prepare results
        const results = {
            chameleonId: chameleonId,
            chameleonName: chameleonPlayer?.name || 'Unknown',
            mostVotedId: mostVotedId,
            mostVotedName: votedPlayer?.name || 'Unknown',
            chameleonCaught: chameleonCaught,
            secretWord: GameState.lobbyData.game.secretWord,
            votes: voteCounts
        };

        // Set results in Firebase
        await FirebaseManager.setGameResults(GameState.lobbyCode, results);
    },

    // Play again (reset game)
    async playAgain() {
        if (!GameState.isHost) {
            UIManager.showToast('Only host can start new game', 'error');
            return;
        }

        UIManager.showLoading();

        const result = await FirebaseManager.resetGame(GameState.lobbyCode);

        if (result.success) {
            UIManager.hideLoading();
            UIManager.showScreen('lobby-screen');
            UIManager.showToast('Ready for new game!', 'success');
        } else {
            UIManager.showToast('Failed to reset game', 'error');
            UIManager.hideLoading();
        }
    },

    // Exit to main menu
    exitToMenu() {
        LobbyManager.exitToMenu();
    }
};
