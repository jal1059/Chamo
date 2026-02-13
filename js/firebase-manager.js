// Firebase Manager - Handles all Firebase operations

const FirebaseManager = {
    db: null,
    
    // Initialize Firebase
    init() {
        try {
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            UIManager.showToast('Failed to connect to server', 'error');
            return false;
        }
    },

    // Create a new lobby
    async createLobby(lobbyCode, hostId, hostName) {
        try {
            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            
            await lobbyRef.set({
                host: hostId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                status: 'waiting', // waiting, voting, playing, finished
                players: {
                    [hostId]: {
                        name: hostName,
                        isHost: true,
                        joinedAt: firebase.database.ServerValue.TIMESTAMP
                    }
                }
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error creating lobby:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if lobby exists
    async lobbyExists(lobbyCode) {
        try {
            const snapshot = await this.db.ref(`lobbies/${lobbyCode}`).once('value');
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking lobby:', error);
            return false;
        }
    },

    // Join an existing lobby
    async joinLobby(lobbyCode, playerId, playerName) {
        try {
            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            const snapshot = await lobbyRef.once('value');
            
            if (!snapshot.exists()) {
                return { success: false, error: 'Lobby not found' };
            }

            const lobby = snapshot.val();
            
            if (lobby.status !== 'waiting') {
                return { success: false, error: 'Game already started' };
            }

            const playerCount = Object.keys(lobby.players || {}).length;
            if (playerCount >= gameConfig.maxPlayers) {
                return { success: false, error: 'Lobby is full' };
            }

            await lobbyRef.child(`players/${playerId}`).set({
                name: playerName,
                isHost: false,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });

            return { success: true };
        } catch (error) {
            console.error('Error joining lobby:', error);
            return { success: false, error: error.message };
        }
    },

    // Leave lobby
    async leaveLobby(lobbyCode, playerId) {
        try {
            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            const snapshot = await lobbyRef.once('value');
            
            if (!snapshot.exists()) {
                return { success: true }; // Already gone
            }

            const lobby = snapshot.val();
            
            // Remove player
            await lobbyRef.child(`players/${playerId}`).remove();

            // If host left, assign new host or delete lobby
            if (lobby.host === playerId) {
                const remainingPlayers = Object.keys(lobby.players || {}).filter(id => id !== playerId);
                
                if (remainingPlayers.length === 0) {
                    // No players left, delete lobby
                    await lobbyRef.remove();
                } else {
                    // Assign new host
                    const newHostId = remainingPlayers[0];
                    await lobbyRef.child('host').set(newHostId);
                    await lobbyRef.child(`players/${newHostId}/isHost`).set(true);
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
        const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
        lobbyRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            } else {
                callback(null); // Lobby deleted
            }
        });
        return () => lobbyRef.off('value');
    },

    // Start game (update status and set topics)
    async startGame(lobbyCode, topics) {
        try {
            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            
            await lobbyRef.update({
                status: 'voting',
                game: {
                    topics: topics,
                    votes: {},
                    startedAt: firebase.database.ServerValue.TIMESTAMP
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error starting game:', error);
            return { success: false, error: error.message };
        }
    },

    // Submit topic vote
    async submitTopicVote(lobbyCode, playerId, topic) {
        try {
            await this.db.ref(`lobbies/${lobbyCode}/game/votes/${playerId}`).set(topic);
            return { success: true };
        } catch (error) {
            console.error('Error submitting vote:', error);
            return { success: false, error: error.message };
        }
    },

    // Set selected topic and assign roles
    async setTopicAndRoles(lobbyCode, selectedTopic, chameleonId, secretWord) {
        try {
            const lobbyRef = this.db.ref(`lobbies/${lobbyCode}`);
            
            await lobbyRef.update({
                status: 'playing',
                'game/selectedTopic': selectedTopic,
                'game/chameleon': chameleonId,
                'game/secretWord': secretWord,
                'game/votes': null // Clear votes
            });

            return { success: true };
        } catch (error) {
            console.error('Error setting topic and roles:', error);
            return { success: false, error: error.message };
        }
    },

    // Submit player vote
    async submitPlayerVote(lobbyCode, voterId, votedPlayerId) {
        try {
            await this.db.ref(`lobbies/${lobbyCode}/game/playerVotes/${voterId}`).set(votedPlayerId);
            return { success: true };
        } catch (error) {
            console.error('Error submitting player vote:', error);
            return { success: false, error: error.message };
        }
    },

    // Set game results
    async setGameResults(lobbyCode, results) {
        try {
            await this.db.ref(`lobbies/${lobbyCode}`).update({
                status: 'finished',
                'game/results': results
            });
            return { success: true };
        } catch (error) {
            console.error('Error setting results:', error);
            return { success: false, error: error.message };
        }
    },

    // Reset game for new round
    async resetGame(lobbyCode) {
        try {
            await this.db.ref(`lobbies/${lobbyCode}`).update({
                status: 'waiting',
                game: null
            });
            return { success: true };
        } catch (error) {
            console.error('Error resetting game:', error);
            return { success: false, error: error.message };
        }
    }
};
