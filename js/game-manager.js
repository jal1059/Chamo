// Game Manager - Handles game flow and logic

const GameManager = {
    discussionTimer: null,
    discussionTimeLeft: 0,
    discussionStartAt: null,
    votingLockTimer: null,

    // Continue from role reveal to discussion
    async continueFromReveal() {
        const game = GameState.lobbyData?.game || {};

        if (game.discussionStartedAt) {
            return;
        }

        if (!GameState.isHost) {
            UIManager.showToast('Waiting for host to start discussion', 'error');
            return;
        }

        UIManager.showLoading();
        const result = await FirebaseManager.startDiscussion(GameState.lobbyCode);
        UIManager.hideLoading();

        if (!result.success) {
            UIManager.showToast(result.error || 'Failed to start discussion', 'error');
        }
    },

    // Start discussion phase with synchronized timer
    startDiscussionPhase(discussionStartedAt, discussionDuration = gameConfig.discussionTime) {
        if (!discussionStartedAt) return;

        if (this.discussionTimer && this.discussionStartAt === discussionStartedAt) {
            return;
        }

        this.discussionStartAt = discussionStartedAt;

        const updateTimer = () => {
            const endTime = discussionStartedAt + (discussionDuration * 1000);
            const remainingMs = endTime - Date.now();
            this.discussionTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));
            UIManager.updateDiscussionTimer(this.discussionTimeLeft);

            if (this.discussionTimeLeft <= 0) {
                this.stopDiscussionTimer();
                this.readyToVote();
            }
        };

        // Clear any existing timer
        this.stopDiscussionTimer();

        updateTimer();

        // Start countdown
        this.discussionTimer = setInterval(() => {
            updateTimer();
        }, 1000);
    },

    // Stop current discussion timer
    stopDiscussionTimer() {
        if (this.discussionTimer) {
            clearInterval(this.discussionTimer);
            this.discussionTimer = null;
        }
        this.discussionStartAt = null;
    },

    // Get remaining voting lock time in seconds
    getVoteLockRemainingSeconds() {
        const game = GameState.lobbyData?.game;
        if (!game?.votingOpenedAt) {
            return 0;
        }

        const voteLockTime = game.voteLockTime || gameConfig.voteLockTime;
        const lockAnchor = game.discussionStartedAt || game.votingOpenedAt;
        const voteUnlockAt = lockAnchor + (voteLockTime * 1000);
        const remainingMs = voteUnlockAt - Date.now();

        return Math.max(0, Math.ceil(remainingMs / 1000));
    },

    // Start/update voting lock countdown text
    startVotingLockCountdown(votedCount, totalCount) {
        const updateStatus = () => {
            const game = GameState.lobbyData?.game;
            if (!game?.votingOpenedAt) {
                const statusElement = document.getElementById('vote-status-text');
                if (statusElement) {
                    statusElement.textContent = `Waiting for voting to open... (${votedCount}/${totalCount} votes)`;
                }
                return;
            }

            const remaining = this.getVoteLockRemainingSeconds();
            if (remaining > 0) {
                const statusElement = document.getElementById('vote-status-text');
                if (statusElement) {
                    statusElement.textContent = `Voting opens in ${remaining}s (${votedCount}/${totalCount} votes)`;
                }
                return;
            }

            UIManager.updateVoteStatus(votedCount, totalCount);
            this.stopVotingLockCountdown();
        };

        updateStatus();

        if (this.votingLockTimer) {
            return;
        }

        this.votingLockTimer = setInterval(() => {
            updateStatus();
        }, 1000);
    },

    // Stop voting lock countdown
    stopVotingLockCountdown() {
        if (this.votingLockTimer) {
            clearInterval(this.votingLockTimer);
            this.votingLockTimer = null;
        }
    },

    // Player indicates ready to vote
    async readyToVote() {
        this.stopDiscussionTimer();

        // Show voting screen
        const players = GameState.getPlayers();
        const votes = GameState.lobbyData?.game?.playerVotes || {};
        UIManager.updateVotingPlayersList(players);
        UIManager.showScreen('voting-screen');

        const votedCount = Object.keys(votes).length;
        this.startVotingLockCountdown(votedCount, players.length);

        const result = await FirebaseManager.openVotingPhase(GameState.lobbyCode);
        if (!result.success) {
            UIManager.showToast(result.error || 'Failed to open voting phase', 'error');
        }
    },

    // Vote for a player
    async votePlayer(playerId) {
        const game = GameState.lobbyData?.game;
        if (!game?.votingOpenedAt) {
            UIManager.showToast('Voting has not opened yet', 'error');
            return;
        }

        const voteLockRemaining = this.getVoteLockRemainingSeconds();
        if (voteLockRemaining > 0) {
            UIManager.showToast(`You can vote in ${voteLockRemaining}s`, 'error');
            return;
        }

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

        this.stopDiscussionTimer();
        this.stopVotingLockCountdown();

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
        this.stopDiscussionTimer();
        this.stopVotingLockCountdown();
        LobbyManager.exitToMenu();
    }
};
