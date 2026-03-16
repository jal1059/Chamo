// UI Manager - Handles all UI updates and screen transitions

const UIManager = {
    roleHideTimer: null,
    roleHideCountdownTimer: null,
    discussionWordsHidden: false,
    discussionWordsTopic: null,

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

            if (typeof TypewriterManager !== 'undefined') {
                TypewriterManager.animateScreen(screen);
            }

            // Refresh session score whenever lobby is shown
            if (screenId === 'lobby-screen') {
                this.updateScoreDisplay();
            }
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

    // Update lobby text clue mode toggle visibility and state
    updateLobbyTextClueMode(enabled, isHost) {
        const settingsSection = document.getElementById('lobby-settings');
        const toggle = document.getElementById('text-clue-mode-toggle');
        if (!settingsSection || !toggle) return;

        settingsSection.classList.remove('hidden');
        toggle.checked = !!enabled;
        toggle.disabled = !isHost || GameState.getGameStatus() !== 'waiting';
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
        const topicWords = Array.isArray(gameConfig.topics?.[topic]) ? gameConfig.topics[topic] : [];

        const topicSheet = document.createElement('div');
        topicSheet.className = 'topic-sheet';

        const topicSheetTitle = document.createElement('div');
        topicSheetTitle.className = 'topic-sheet-title';
        topicSheetTitle.textContent = `Topic Sheet: ${topic}`;

        const topicWordsGrid = document.createElement('div');
        topicWordsGrid.className = 'topic-words-grid';

        topicWords.forEach((word) => {
            const wordPill = document.createElement('span');
            wordPill.className = 'topic-word-pill';
            wordPill.textContent = word;

            if (!isChameleon && word === secretWord) {
                wordPill.classList.add('secret');
            }

            topicWordsGrid.appendChild(wordPill);
        });

        topicSheet.appendChild(topicSheetTitle);
        topicSheet.appendChild(topicWordsGrid);
        
        if (isChameleon) {
            roleTitle.classList.add('role-chameleon');
            roleTitle.textContent = '🦎 You are the CHAMELEON!';
            
            const description = document.createElement('div');
            description.className = 'role-description';
            description.textContent = `Blend in! The topic is "${topic}" but you don't know the secret word. Try to avoid being caught!`;
            
            roleDisplay.appendChild(roleTitle);
            roleDisplay.appendChild(description);
            roleDisplay.appendChild(topicSheet);
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
            roleDisplay.appendChild(topicSheet);
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
        const timerDisplay = document.querySelector('.timer-display');
        if (timerElement) {
            timerElement.textContent = utils.formatTime(seconds);
        }
        if (timerDisplay) {
            timerDisplay.classList.toggle('urgent', seconds <= 30 && seconds > 0);
        }
    },

    // Update current topic display
    updateCurrentTopic(topic) {
        const topicElement = document.getElementById('current-topic');
        if (topicElement) {
            topicElement.textContent = topic;
        }
    },

    // Render topic sheet during discussion and keep hide/show state
    updateDiscussionTopicSheet(topic, isChameleon, secretWord) {
        const sheetEl = document.getElementById('discussion-topic-sheet');
        const titleEl = document.getElementById('discussion-topic-sheet-title');
        const wordsEl = document.getElementById('discussion-topic-words');
        const toggleBtn = document.getElementById('toggle-discussion-words-btn');

        if (!sheetEl || !titleEl || !wordsEl) {
            return;
        }

        const rawTopic = (topic || '').toString().trim();
        const topicKeys = Object.keys(gameConfig.topics || {});
        const resolvedTopicKey = topicKeys.find((key) => key === rawTopic)
            || topicKeys.find((key) => key.toLowerCase() === rawTopic.toLowerCase())
            || rawTopic;

        if (this.discussionWordsTopic !== resolvedTopicKey) {
            this.discussionWordsHidden = false;
            this.discussionWordsTopic = resolvedTopicKey;
        }

        titleEl.textContent = `Topic Sheet: ${resolvedTopicKey}`;

        const topicWords = Array.isArray(gameConfig.topics?.[resolvedTopicKey])
            ? gameConfig.topics[resolvedTopicKey]
            : [];
        wordsEl.innerHTML = '';

        topicWords.forEach((word) => {
            const wordPill = document.createElement('span');
            wordPill.className = 'topic-word-pill';
            wordPill.textContent = word;

            if (!isChameleon && word === secretWord) {
                wordPill.classList.add('secret');
            }

            wordsEl.appendChild(wordPill);
        });

        sheetEl.classList.toggle('hidden', this.discussionWordsHidden);
        if (toggleBtn) {
            toggleBtn.textContent = this.discussionWordsHidden ? 'Show Word List' : 'Hide Word List';
        }
    },

    // Toggle discussion topic sheet visibility
    toggleDiscussionTopicSheet() {
        this.discussionWordsHidden = !this.discussionWordsHidden;

        const sheetEl = document.getElementById('discussion-topic-sheet');
        const toggleBtn = document.getElementById('toggle-discussion-words-btn');

        if (sheetEl) {
            sheetEl.classList.toggle('hidden', this.discussionWordsHidden);
        }
        if (toggleBtn) {
            toggleBtn.textContent = this.discussionWordsHidden ? 'Show Word List' : 'Hide Word List';
        }
    },

    // Update discussion action controls for host/non-host
    updateDiscussionActions(isHost, clueModeActive = false) {
        const skipRoundBtn = document.getElementById('skip-round-btn');
        const readyBtn = document.getElementById('ready-to-vote-btn');
        const cluePanel = document.getElementById('clue-phase-panel');
        const timerDisplay = document.querySelector('.timer-display');
        const instruction = document.querySelector('#discussion-screen .instruction-text');
        if (!skipRoundBtn) return;

        if (isHost) {
            skipRoundBtn.classList.remove('hidden');
        } else {
            skipRoundBtn.classList.add('hidden');
        }

        if (readyBtn) {
            readyBtn.classList.toggle('hidden', clueModeActive);
        }

        if (cluePanel) {
            cluePanel.classList.toggle('hidden', !clueModeActive);
        }

        if (timerDisplay) {
            timerDisplay.classList.toggle('hidden', clueModeActive);
        }

        if (instruction) {
            instruction.textContent = clueModeActive
                ? 'Submit one clue in turn order. Voting starts after all clues are in.'
                : 'Discuss and figure out who the Chameleon is!';
        }
    },

    // Render clue turn state for turn-based text clue mode
    renderClueTurnState(clueState, players, currentPlayerId) {
        const statusEl = document.getElementById('clue-turn-status');
        const messagesEl = document.getElementById('clue-messages');
        const inputEl = document.getElementById('clue-input');
        const submitBtn = document.getElementById('submit-clue-btn');

        if (!statusEl || !messagesEl || !inputEl || !submitBtn) {
            return;
        }

        const playerMap = new Map(players.map((player) => [player.id, player.name]));
        const turnOrder = Array.isArray(clueState?.turnOrder) ? clueState.turnOrder : [];
        const currentTurnIndex = Number.isInteger(clueState?.currentTurnIndex) ? clueState.currentTurnIndex : 0;
        const currentRound = Number.isInteger(clueState?.currentRound) ? clueState.currentRound : 1;
        const totalRounds = Number.isInteger(clueState?.totalRounds) ? clueState.totalRounds : 1;
        const clues = clueState?.clues || {};
        const currentTurnPlayerId = turnOrder[currentTurnIndex];
        const isCompleted = !!clueState?.completed;
        const isCurrentPlayersTurn = currentTurnPlayerId === currentPlayerId;

        if (isCompleted) {
            statusEl.textContent = 'All clues submitted. Opening voting...';
        } else if (!currentTurnPlayerId) {
            statusEl.textContent = 'Waiting for clue phase to initialize...';
        } else {
            const currentTurnName = playerMap.get(currentTurnPlayerId) || 'Player';
            statusEl.textContent = isCurrentPlayersTurn
                ? `Round ${currentRound}/${totalRounds}: your turn to submit a clue.`
                : `Round ${currentRound}/${totalRounds}: waiting for ${currentTurnName}.`;
        }

        messagesEl.innerHTML = '';
        Object.keys(clues)
            .sort((left, right) => Number(left) - Number(right))
            .forEach((clueKey) => {
            const clueEntry = clues[clueKey];
            if (!clueEntry) {
                return;
            }

            const messageItem = document.createElement('div');
            messageItem.className = 'clue-message';

            const authorSpan = document.createElement('span');
            authorSpan.className = 'clue-author';
            const cluePlayerId = clueEntry.playerId;
            const clueRound = Number.isInteger(clueEntry.round) ? clueEntry.round : 1;
            authorSpan.textContent = `[R${clueRound}] ${clueEntry.playerName || playerMap.get(cluePlayerId) || 'Player'}:`;

            const textSpan = document.createElement('span');
            textSpan.textContent = clueEntry.text || '';

            messageItem.appendChild(authorSpan);
            messageItem.appendChild(textSpan);
            messagesEl.appendChild(messageItem);
        });

        messagesEl.scrollTop = messagesEl.scrollHeight;

        const canSubmit = !isCompleted && isCurrentPlayersTurn;
        inputEl.disabled = !canSubmit;
        submitBtn.disabled = !canSubmit;

        if (canSubmit && inputEl.value.trim().length === 0) {
            inputEl.focus();
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

        // Record and display session score
        this.recordSessionResult(didWin);
        this.updateScoreDisplay();

        // Trigger confetti for winners
        if (didWin && typeof Confetti !== 'undefined') {
            Confetti.burst();
        }

        // Personalized outcome banner (top)
        const outcomeBanner = document.createElement('div');
        outcomeBanner.className = 'result-section';

        const outcomeTitle = document.createElement('div');
        outcomeTitle.className = `result-outcome-title ${didWin ? 'winner-text' : 'loser-text'}`;
        outcomeTitle.textContent = didWin ? 'You Won!' : 'You Lost';

        const outcomeContent = document.createElement('div');
        outcomeContent.className = 'result-content';
        if (isChameleon) {
            if (results.chameleonGuessedCorrectly) {
                outcomeContent.textContent = '🦎 You guessed the secret word and escaped!';
            } else if (results.chameleonGuessedWord && !results.chameleonGuessedCorrectly) {
                outcomeContent.textContent = '🕵️ You were caught and your guess was wrong.';
            } else if (didWin) {
                outcomeContent.textContent = '🦎 You escaped detection as the Chameleon!';
            } else {
                outcomeContent.textContent = '🕵️ You were caught as the Chameleon.';
            }
        } else {
            if (!results.chameleonCaught && results.chameleonGuessedCorrectly) {
                outcomeContent.textContent = '😮 The Chameleon guessed the word and escaped at the last second!';
            } else if (didWin) {
                outcomeContent.textContent = '🎉 Your team caught the Chameleon!';
            } else {
                outcomeContent.textContent = '😵 The Chameleon escaped this round.';
            }
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

        // Chameleon's final guess (if there was one)
        let guessSection = null;
        if (results.chameleonGuessedWord) {
            guessSection = document.createElement('div');
            guessSection.className = 'result-section';

            const guessTitleEl = document.createElement('div');
            guessTitleEl.className = 'result-title';
            guessTitleEl.textContent = 'Chameleon\'s Final Guess:';

            const guessContentEl = document.createElement('div');
            guessContentEl.className = results.chameleonGuessedCorrectly
                ? 'result-content result-guess-correct'
                : 'result-content result-guess-wrong';
            guessContentEl.textContent = results.chameleonGuessedCorrectly
                ? `✅ "${results.chameleonGuessedWord}" — Correct!`
                : `❌ "${results.chameleonGuessedWord}" — Wrong!`;

            guessSection.appendChild(guessTitleEl);
            guessSection.appendChild(guessContentEl);
        }

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

        // Vote breakdown with staggered reveal animation
        const voteBreakdownSection = document.createElement('div');
        voteBreakdownSection.className = 'result-section';

        const voteBreakdownTitle = document.createElement('div');
        voteBreakdownTitle.className = 'result-title';
        voteBreakdownTitle.textContent = 'Who Voted For Who';

        const voteBreakdownList = document.createElement('div');
        voteBreakdownList.className = 'vote-breakdown-list';

        const voteDetails = Array.isArray(results.voteDetails) ? results.voteDetails : [];
        voteDetails.forEach((detail, index) => {
            const row = document.createElement('div');
            row.className = 'vote-breakdown-item';

            const voterName = detail.voterId === GameState.playerId ? 'You' : (detail.voterName || 'Unknown');
            const votedName = detail.votedId === GameState.playerId ? 'You' : (detail.votedName || 'Unknown');
            row.textContent = `${voterName} → ${votedName}`;

            // Staggered reveal animation
            row.style.opacity = '0';
            row.style.animation = `voteReveal 0.4s ease forwards`;
            row.style.animationDelay = `${0.4 + index * 0.18}s`;

            voteBreakdownList.appendChild(row);
        });

        if (voteDetails.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'result-content';
            emptyRow.textContent = 'No vote details available for this round.';
            voteBreakdownList.appendChild(emptyRow);
        }

        voteBreakdownSection.appendChild(voteBreakdownTitle);
        voteBreakdownSection.appendChild(voteBreakdownList);

        resultsDisplay.appendChild(outcomeBanner);
        resultsDisplay.appendChild(chameleonSection);
        resultsDisplay.appendChild(wordSection);
        if (guessSection) resultsDisplay.appendChild(guessSection);
        resultsDisplay.appendChild(votedSection);
        resultsDisplay.appendChild(voteBreakdownSection);
    },

    // Show chameleon guess phase UI
    showChameleonGuessPhase(isChameleon, deadlineAt) {
        const container = document.getElementById('chameleon-guess-container');
        if (!container) return;

        container.innerHTML = '';

        if (isChameleon) {
            const title = document.createElement('div');
            title.className = 'role-title role-chameleon';
            title.textContent = '🦎 You\'ve been caught!';

            const desc = document.createElement('div');
            desc.className = 'role-description';
            desc.textContent = 'Last chance to escape: guess the secret word. If you\'re right, you win!';

            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'chameleon-guess-input';
            input.className = 'input-field';
            input.placeholder = 'Type the secret word...';
            input.maxLength = 60;
            input.autocomplete = 'off';
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') GameManager.submitChameleonGuess();
            });

            const btn = document.createElement('button');
            btn.id = 'submit-chameleon-guess-btn';
            btn.className = 'btn btn-primary';
            btn.textContent = 'Submit Guess';
            btn.addEventListener('click', () => GameManager.submitChameleonGuess());

            container.appendChild(title);
            container.appendChild(desc);
            container.appendChild(input);
            container.appendChild(btn);
        } else {
            const title = document.createElement('div');
            title.className = 'role-title';
            title.textContent = '⚠️ The Chameleon was caught!';

            const desc = document.createElement('div');
            desc.className = 'chameleon-waiting-text';
            desc.textContent = 'They\'ve been voted out, but they get one final chance to guess the secret word and escape...';

            container.appendChild(title);
            container.appendChild(desc);
        }

        const timerEl = document.createElement('div');
        timerEl.className = 'chameleon-guess-timer';
        timerEl.id = 'chameleon-guess-timer';
        const initialSeconds = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
        timerEl.textContent = initialSeconds;
        container.appendChild(timerEl);
    },

    // Update the chameleon guess countdown display
    updateChameleonGuessTimer(seconds) {
        const el = document.getElementById('chameleon-guess-timer');
        if (el) {
            el.textContent = seconds;
            el.classList.toggle('urgent', seconds <= 5 && seconds > 0);
        }
    },

    // Session score helpers (stored in sessionStorage)
    getSessionScore() {
        try {
            return JSON.parse(sessionStorage.getItem('chamoScore') || '{"wins":0,"losses":0}');
        } catch {
            return { wins: 0, losses: 0 };
        }
    },

    recordSessionResult(didWin) {
        const score = this.getSessionScore();
        if (didWin) score.wins++; else score.losses++;
        sessionStorage.setItem('chamoScore', JSON.stringify(score));
    },

    updateScoreDisplay() {
        const el = document.getElementById('session-score');
        if (!el) return;
        const { wins, losses } = this.getSessionScore();
        const total = wins + losses;
        if (total === 0) {
            el.classList.add('hidden');
            return;
        }
        el.textContent = `Session: ${wins}W — ${losses}L`;
        el.classList.remove('hidden');
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
