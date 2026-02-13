// UI Manager - Handles all UI updates and screen transitions

const UIManager = {
    roleHideTimer: null,
    roleHideCountdownTimer: null,

    // Show a specific screen
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            GameState.currentScreen = screenId;
        }
    },

    // Show loading overlay
    showLoading() {
        document.getElementById('loading-overlay').classList.add('active');
    },

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Update lobby code display
    updateLobbyCode(code) {
        const element = document.getElementById('display-lobby-code');
        if (element) {
            element.textContent = code;
        }
    },

    // Update players list
    updatePlayersList(players) {
        const listElement = document.getElementById('players-list');
        const countElement = document.getElementById('player-count');
        
        if (!listElement || !countElement) return;

        // Update count
        countElement.textContent = players.length;

        // Clear current list
        listElement.innerHTML = '';

        // Add players
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            if (player.isHost) {
                playerDiv.classList.add('host');
            }
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = player.name;
            
            playerDiv.appendChild(nameSpan);
            listElement.appendChild(playerDiv);
        });

        // Enable/disable start button
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn && GameState.isHost) {
            startBtn.disabled = players.length < gameConfig.minPlayers;
        }
    },

    // Update topics list for voting
    updateTopicsList(topics, currentVote = null) {
        const listElement = document.getElementById('topics-list');
        if (!listElement) return;

        listElement.innerHTML = '';

        topics.forEach(topic => {
            const topicDiv = document.createElement('div');
            topicDiv.className = 'topic-item';
            topicDiv.textContent = topic;
            
            if (currentVote === topic) {
                topicDiv.classList.add('selected');
            }
            
            if (currentVote) {
                topicDiv.classList.add('voted');
            } else {
                topicDiv.addEventListener('click', () => {
                    LobbyManager.voteTopic(topic);
                });
            }
            
            listElement.appendChild(topicDiv);
        });
    },

    // Update voting status
    updateVotingStatus(votedCount, totalCount) {
        const statusElement = document.getElementById('voting-status-text');
        if (statusElement) {
            statusElement.textContent = `Votes: ${votedCount}/${totalCount}`;
        }
    },

    // Display role reveal
    displayRoleReveal(isChameleon, secretWord, topic) {
        const roleDisplay = document.getElementById('role-display');
        if (!roleDisplay) return;

        if (this.roleHideTimer) {
            clearTimeout(this.roleHideTimer);
            this.roleHideTimer = null;
        }
        if (this.roleHideCountdownTimer) {
            clearInterval(this.roleHideCountdownTimer);
            this.roleHideCountdownTimer = null;
        }

        roleDisplay.innerHTML = '';

        const roleTitle = document.createElement('div');
        roleTitle.className = 'role-title';
        
        if (isChameleon) {
            roleTitle.classList.add('role-chameleon');
            roleTitle.textContent = '🦎 You are the CHAMELEON!';
            
            const description = document.createElement('div');
            description.className = 'role-description';
            description.textContent = `Blend in! The topic is "${topic}" but you don't know the secret word. Try to avoid being caught!`;
            
            roleDisplay.appendChild(roleTitle);
            roleDisplay.appendChild(description);
        } else {
            roleTitle.classList.add('role-player');
            roleTitle.textContent = '🕵️ You are a PLAYER';
            
            const topicDiv = document.createElement('div');
            topicDiv.className = 'role-description';
            topicDiv.textContent = `Topic: ${topic}`;
            
            const wordDiv = document.createElement('div');
            wordDiv.className = 'secret-word';
            wordDiv.textContent = secretWord;
            
            const description = document.createElement('div');
            description.className = 'role-description';
            description.textContent = 'Find the Chameleon! But be careful not to reveal the secret word.';
            
            roleDisplay.appendChild(roleTitle);
            roleDisplay.appendChild(topicDiv);
            roleDisplay.appendChild(wordDiv);
            roleDisplay.appendChild(description);
        }

        const continueBtn = document.getElementById('continue-from-reveal-btn');
        if (continueBtn) {
            continueBtn.textContent = 'Continue';
        }

        const hideNotice = document.createElement('div');
        hideNotice.className = 'role-hide-notice';
        roleDisplay.appendChild(hideNotice);

        let secondsLeft = gameConfig.roleRevealTime || 12;
        const updateHideNotice = () => {
            hideNotice.textContent = `Role will auto-hide in ${secondsLeft}s`;
        };

        updateHideNotice();
        this.roleHideCountdownTimer = setInterval(() => {
            secondsLeft = Math.max(0, secondsLeft - 1);
            updateHideNotice();
            if (secondsLeft <= 0) {
                clearInterval(this.roleHideCountdownTimer);
                this.roleHideCountdownTimer = null;
            }
        }, 1000);

        this.roleHideTimer = setTimeout(() => {
            this.hideRoleReveal();
        }, (gameConfig.roleRevealTime || 12) * 1000);
    },

    // Hide role details after reveal timeout
    hideRoleReveal() {
        const roleDisplay = document.getElementById('role-display');
        if (!roleDisplay) return;

        if (this.roleHideTimer) {
            clearTimeout(this.roleHideTimer);
            this.roleHideTimer = null;
        }
        if (this.roleHideCountdownTimer) {
            clearInterval(this.roleHideCountdownTimer);
            this.roleHideCountdownTimer = null;
        }

        roleDisplay.innerHTML = '';

        const hiddenTitle = document.createElement('div');
        hiddenTitle.className = 'role-title';
        hiddenTitle.textContent = '🔒 Role Hidden';

        const hiddenText = document.createElement('div');
        hiddenText.className = 'role-description';
        hiddenText.textContent = 'Role information is now hidden to prevent peeking.';

        roleDisplay.appendChild(hiddenTitle);
        roleDisplay.appendChild(hiddenText);

        const continueBtn = document.getElementById('continue-from-reveal-btn');
        if (continueBtn) {
            continueBtn.textContent = 'Continue';
        }
    },

    // Update discussion timer
    updateDiscussionTimer(seconds) {
        const timerElement = document.getElementById('discussion-timer');
        if (timerElement) {
            timerElement.textContent = utils.formatTime(seconds);
        }
    },

    // Update current topic display
    updateCurrentTopic(topic) {
        const topicElement = document.getElementById('current-topic');
        if (topicElement) {
            topicElement.textContent = topic;
        }
    },

    // Update voting players list
    updateVotingPlayersList(players, currentVote = null) {
        const listElement = document.getElementById('voting-players-list');
        if (!listElement) return;

        listElement.innerHTML = '';

        players.forEach(player => {
            if (player.id === GameState.playerId) {
                return; // Can't vote for yourself
            }

            const playerDiv = document.createElement('div');
            playerDiv.className = 'vote-player-item';
            playerDiv.textContent = player.name;
            
            if (currentVote === player.id) {
                playerDiv.classList.add('selected');
            }
            
            if (!currentVote) {
                playerDiv.addEventListener('click', () => {
                    GameManager.votePlayer(player.id);
                });
            }
            
            listElement.appendChild(playerDiv);
        });
    },

    // Update vote status
    updateVoteStatus(votedCount, totalCount) {
        const statusElement = document.getElementById('vote-status-text');
        if (statusElement) {
            statusElement.textContent = `Votes: ${votedCount}/${totalCount}`;
        }
    },

    // Display game results
    displayResults(results) {
        const resultsDisplay = document.getElementById('results-display');
        if (!resultsDisplay) return;

        resultsDisplay.innerHTML = '';

        const isChameleon = results.chameleonId === GameState.playerId;
        const didWin = isChameleon ? !results.chameleonCaught : results.chameleonCaught;

        // Personalized outcome banner (top)
        const outcomeBanner = document.createElement('div');
        outcomeBanner.className = 'result-section';

        const outcomeTitle = document.createElement('div');
        outcomeTitle.className = `result-outcome-title ${didWin ? 'winner-text' : 'loser-text'}`;
        outcomeTitle.textContent = didWin ? 'You Won!' : 'You Lost';

        const outcomeContent = document.createElement('div');
        outcomeContent.className = 'result-content';
        if (isChameleon) {
            outcomeContent.textContent = didWin
                ? '🦎 You escaped detection as the Chameleon!'
                : '🕵️ You were caught as the Chameleon.';
        } else {
            outcomeContent.textContent = didWin
                ? '🎉 Your team caught the Chameleon!'
                : '😵 The Chameleon escaped this round.';
        }

        outcomeBanner.appendChild(outcomeTitle);
        outcomeBanner.appendChild(outcomeContent);

        // Chameleon reveal
        const chameleonSection = document.createElement('div');
        chameleonSection.className = 'result-section';
        
        const chameleonTitle = document.createElement('div');
        chameleonTitle.className = 'result-title';
        chameleonTitle.textContent = isChameleon ? 'You were the Chameleon' : 'The Chameleon was:';
        
        const chameleonName = document.createElement('div');
        chameleonName.className = 'result-content';
        chameleonName.textContent = `🦎 ${results.chameleonName}`;
        
        chameleonSection.appendChild(chameleonTitle);
        if (!isChameleon) {
            chameleonSection.appendChild(chameleonName);
        }

        // Secret word
        const wordSection = document.createElement('div');
        wordSection.className = 'result-section';
        
        const wordTitle = document.createElement('div');
        wordTitle.className = 'result-title';
        wordTitle.textContent = 'Secret Word:';
        
        const wordContent = document.createElement('div');
        wordContent.className = 'result-content';
        wordContent.textContent = results.secretWord;
        
        wordSection.appendChild(wordTitle);
        wordSection.appendChild(wordContent);

        // Most voted
        const votedSection = document.createElement('div');
        votedSection.className = 'result-section';
        
        const votedTitle = document.createElement('div');
        votedTitle.className = 'result-title';
        votedTitle.textContent = results.mostVotedId === GameState.playerId ? 'Players voted for you:' : 'Players voted for:';
        
        const votedContent = document.createElement('div');
        votedContent.className = 'result-content';
        votedContent.textContent = results.mostVotedId === GameState.playerId ? 'You' : results.mostVotedName;
        
        votedSection.appendChild(votedTitle);
        votedSection.appendChild(votedContent);
        resultsDisplay.appendChild(outcomeBanner);
        resultsDisplay.appendChild(chameleonSection);
        resultsDisplay.appendChild(wordSection);
        resultsDisplay.appendChild(votedSection);
    },

    // Update results action buttons based on host role
    updateResultsActions(isHost) {
        const playAgainBtn = document.getElementById('play-again-btn');
        if (!playAgainBtn) return;

        if (isHost) {
            playAgainBtn.disabled = false;
            playAgainBtn.textContent = 'Play Again';
            return;
        }

        playAgainBtn.disabled = true;
        playAgainBtn.textContent = 'Waiting For Host...';
    }
};
