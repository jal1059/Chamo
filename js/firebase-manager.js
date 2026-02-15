// Firebase Manager - Handles all Firebase operations

const FirebaseManager = {
    db: null,
    auth: null,
    currentUser: null,
    requestTimeoutMs: 10000,

    // Validate Firebase config values are set
    hasValidConfig() {
        const requiredKeys = [
            'apiKey',
            'authDomain',
            'databaseURL',
            'projectId',
            'storageBucket',
            'messagingSenderId',
            'appId'
        ];

        if (!firebaseConfig) return false;

        return requiredKeys.every((key) => {
            const value = firebaseConfig[key];
            return typeof value === 'string' &&
                value.trim().length > 0 &&
                !value.includes('YOUR_');
        });
    },

    // Ensure database is available before making calls
    ensureDb() {
        return !!this.db;
    },

    // Add timeout to Firebase operations to avoid hanging UI
    withTimeout(promise, operation, timeoutMs = this.requestTimeoutMs) {
        let timeoutId;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`${operation} timed out. Check Firebase configuration/network.`));
            }, timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]).finally(() => {
            clearTimeout(timeoutId);
        });
    },
    
    // Initialize Firebase
    init() {
        try {
            if (!this.hasValidConfig()) {
                UIManager.showToast('Firebase is not configured. Update js/config.js', 'error');
                return false;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.database();
            this.auth = firebase.auth();
            this.currentUser = this.auth.currentUser;

            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user || null;
            });

            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            UIManager.showToast('Failed to connect to server', 'error');
            return false;
        }
    },

    // Ensure current browser session is signed in anonymously
    async ensureSignedIn() {
        try {
            if (!this.auth) {
                return { success: false, error: 'Auth is not initialized' };
            }

            if (this.auth.currentUser) {
                this.currentUser = this.auth.currentUser;
                return { success: true, uid: this.currentUser.uid };
            }

            const credential = await this.withTimeout(
                this.auth.signInAnonymously(),
                'Anonymous sign-in'
            );

            this.currentUser = credential.user;
            return { success: true, uid: this.currentUser?.uid || null };
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current authenticated user id
    getCurrentUserId() {
        return this.currentUser?.uid || this.auth?.currentUser?.uid || null;
    },

    // Create a new lobby
    async createLobby(lobbyCode, hostId, hostName) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            
            await this.withTimeout(lobbyRef.set({
                host: hostId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'waiting', // waiting, voting, playing, finished
                settings: {
                    textClueModeEnabled: false
                },
                players: {
                    [hostId]: {
                        name: hostName,
                        isHost: true,
                        joinedAt: firebase.database.ServerValue.TIMESTAMP
                    }
                }
            }), 'Create lobby');
            
            return { success: true };
        } catch (error) {
            console.error('Error creating lobby:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if lobby exists
    async lobbyExists(lobbyCode) {
        try {
            if (!this.ensureDb()) {
                return false;
            }

            const snapshot = await this.withTimeout(
                this.db.ref(`lobbies/${lobbyCode}`).once('value'),
                'Check lobby'
            );
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking lobby:', error);
            return false;
        }
    },

    // Join an existing lobby
    async joinLobby(lobbyCode, playerId, playerName) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            const snapshot = await this.withTimeout(lobbyRef.once('value'), 'Join lobby');
            
            if (!snapshot.exists()) {
                return { success: false, error: 'Lobby not found' };
            }

            const lobby = snapshot.val();

            if (lobby.players && lobby.players[playerId]) {
                return {
                    success: false,
                    error: 'This browser is already in that lobby. Use incognito or a different browser/device for player 2.'
                };
            }
            
            if (lobby.status !== 'waiting') {
                return { success: false, error: 'Game already started' };
            }

            const playerCount = Object.keys(lobby.players || {}).length;
            if (playerCount >= gameConfig.maxPlayers) {
                return { success: false, error: 'Lobby is full' };
            }

            await this.withTimeout(lobbyRef.child(`players/${playerId}`).set({
                name: playerName,
                isHost: false,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }), 'Join lobby');

            return { success: true };
        } catch (error) {
            console.error('Error joining lobby:', error);
            return { success: false, error: error.message };
        }
    },

    // Leave lobby
    async leaveLobby(lobbyCode, playerId) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            const snapshot = await this.withTimeout(lobbyRef.once('value'), 'Leave lobby');
            
            if (!snapshot.exists()) {
                return { success: true }; // Already gone
            }

            const lobby = snapshot.val();
            
            // Remove player
            await this.withTimeout(lobbyRef.child(`players/${playerId}`).remove(), 'Leave lobby');

            // If host left, assign new host or delete lobby
            if (lobby.host === playerId) {
                const remainingPlayers = Object.keys(lobby.players || {}).filter(id => id !== playerId);
                
                if (remainingPlayers.length === 0) {
                    // No players left, delete lobby
                    await this.withTimeout(lobbyRef.remove(), 'Delete lobby');
                } else {
                    // Assign new host
                    const newHostId = remainingPlayers[0];
                    await this.withTimeout(lobbyRef.child('host').set(newHostId), 'Assign host');
                    await this.withTimeout(lobbyRef.child(`players/${newHostId}/isHost`).set(true), 'Assign host');
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error leaving lobby:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to lobby changes
    watchLobby(lobbyCode, callback) {
        if (!this.ensureDb()) {
            callback(null, new Error('Database is not initialized'));
            return () => {};
        }

        const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);

        const onValue = (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val(), null);
            } else {
                callback(null, null); // Lobby deleted
            }
        };

        const onError = (error) => {
            console.error('Lobby watch error:', error);
            callback(null, error);
        };

        lobbyRef.on('value', onValue, onError);
        return () => lobbyRef.off('value');
    },

    // Start game (update status and set topics)
    async startGame(lobbyCode, topics) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            
            await this.withTimeout(lobbyRef.update({
                status: 'voting',
                game: {
                    topics: topics,
                    votes: {},
                    startedAt: firebase.database.ServerValue.TIMESTAMP
                }
            }), 'Start game');

            return { success: true };
        } catch (error) {
            console.error('Error starting game:', error);
            return { success: false, error: error.message };
        }
    },

    // Submit topic vote
    async submitTopicVote(lobbyCode, playerId, topic) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            await this.withTimeout(
                this.db.ref(`lobbies/${lobbyCode}/game/votes/${playerId}`).set(topic),
                'Submit topic vote'
            );
            return { success: true };
        } catch (error) {
            console.error('Error submitting vote:', error);
            return { success: false, error: error.message };
        }
    },

    // Set selected topic and assign roles
    async setTopicAndRoles(lobbyCode, selectedTopic, chameleonId, secretWord) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            
            await this.withTimeout(lobbyRef.update({
                status: 'playing',
                'game/selectedTopic': selectedTopic,
                'game/chameleon': chameleonId,
                'game/secretWord': secretWord,
                'game/votes': null // Clear votes
            }), 'Set topic and roles');

            return { success: true };
        } catch (error) {
            console.error('Error setting topic and roles:', error);
            return { success: false, error: error.message };
        }
    },

    // Start synchronized discussion timer
    async startDiscussion(lobbyCode) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const lobbySnapshot = await this.withTimeout(
                this.db.ref(`lobbies/${lobbyCode}`).once('value'),
                'Load lobby settings'
            );

            if (!lobbySnapshot.exists()) {
                return { success: false, error: 'Lobby not found' };
            }

            const lobby = lobbySnapshot.val();
            const textClueModeEnabled = !!lobby?.settings?.textClueModeEnabled;

            let clueState = null;
            if (textClueModeEnabled) {
                const players = Object.entries(lobby.players || {})
                    .sort(([, a], [, b]) => (a.joinedAt || 0) - (b.joinedAt || 0))
                    .map(([id]) => id);

                clueState = {
                    enabled: true,
                    turnOrder: players,
                    currentTurnIndex: 0,
                    clues: {},
                    completed: false
                };
            }

            await this.withTimeout(this.db.ref(`lobbies/${lobbyCode}`).update({
                'game/discussionStartedAt': firebase.database.ServerValue.TIMESTAMP,
                'game/discussionDuration': gameConfig.discussionTime,
                'game/voteLockTime': gameConfig.voteLockTime,
                'game/votingOpenedAt': null,
                'game/playerVotes': null,
                'game/clueState': clueState
            }), 'Start discussion');

            return { success: true };
        } catch (error) {
            console.error('Error starting discussion:', error);
            return { success: false, error: error.message };
        }
    },

    // Update lobby setting for host-controlled text clue mode
    async updateTextClueModeSetting(lobbyCode, enabled) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            await this.withTimeout(
                this.db.ref(`lobbies/${lobbyCode}/settings/textClueModeEnabled`).set(!!enabled),
                'Update text clue mode setting'
            );

            return { success: true };
        } catch (error) {
            console.error('Error updating text clue mode:', error);
            return { success: false, error: error.message };
        }
    },

    // Submit one clue during turn-based clue mode and advance turn atomically
    async submitClueTurn(lobbyCode, playerId, playerName, clueText) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const clueStateRef = this.db.ref(`lobbies/${lobbyCode}/game/clueState`);
            const transactionResult = await this.withTimeout(
                clueStateRef.transaction((state) => {
                    if (!state || !state.enabled || state.completed) {
                        return;
                    }

                    const turnOrder = Array.isArray(state.turnOrder) ? state.turnOrder : [];
                    const currentTurnIndex = Number.isInteger(state.currentTurnIndex) ? state.currentTurnIndex : 0;
                    const currentPlayerId = turnOrder[currentTurnIndex];

                    if (!currentPlayerId || currentPlayerId !== playerId) {
                        return;
                    }

                    const clues = state.clues || {};
                    if (clues[playerId]) {
                        return;
                    }

                    clues[playerId] = {
                        playerName,
                        text: clueText,
                        submittedAt: firebase.database.ServerValue.TIMESTAMP
                    };

                    const nextIndex = currentTurnIndex + 1;
                    state.clues = clues;
                    state.currentTurnIndex = nextIndex;
                    state.completed = nextIndex >= turnOrder.length;

                    return state;
                }),
                'Submit clue turn'
            );

            if (!transactionResult.committed) {
                return { success: false, error: 'Not your turn or clue phase unavailable' };
            }

            return { success: true };
        } catch (error) {
            console.error('Error submitting clue turn:', error);
            return { success: false, error: error.message };
        }
    },

    // Open voting phase (idempotent)
    async openVotingPhase(lobbyCode) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            const votingRef = this.db.ref(`lobbies/${lobbyCode}/game/votingOpenedAt`);
            const snapshot = await this.withTimeout(votingRef.once('value'), 'Open voting phase');

            if (!snapshot.exists()) {
                await this.withTimeout(votingRef.set(firebase.database.ServerValue.TIMESTAMP), 'Open voting phase');
            }

            return { success: true };
        } catch (error) {
            console.error('Error opening voting phase:', error);
            return { success: false, error: error.message };
        }
    },

    // Submit player vote
    async submitPlayerVote(lobbyCode, voterId, votedPlayerId) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            await this.withTimeout(
                this.db.ref(`lobbies/${lobbyCode}/game/playerVotes/${voterId}`).set(votedPlayerId),
                'Submit player vote'
            );
            return { success: true };
        } catch (error) {
            console.error('Error submitting player vote:', error);
            return { success: false, error: error.message };
        }
    },

    // Set game results
    async setGameResults(lobbyCode, results) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            await this.withTimeout(this.db.ref(`lobbies/${lobbyCode}`).update({
                status: 'finished',
                'game/results': results
            }), 'Set game results');
            return { success: true };
        } catch (error) {
            console.error('Error setting results:', error);
            return { success: false, error: error.message };
        }
    },

    // Reset game for new round
    async resetGame(lobbyCode) {
        try {
            if (!this.ensureDb()) {
                return { success: false, error: 'Database is not initialized' };
            }

            await this.withTimeout(this.db.ref(`lobbies/${lobbyCode}`).update({
                status: 'waiting',
                game: null
            }), 'Reset game');
            return { success: true };
        } catch (error) {
            console.error('Error resetting game:', error);
            return { success: false, error: error.message };
        }
    }
};
