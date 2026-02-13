# 🦎 Chamo Game

A mobile-first multiplayer social deduction game built with HTML, CSS, vanilla JavaScript, and Firebase.

## 🎮 Game Description

Chamo is a social deduction game where players try to identify who among them is the "Chameleon" - the only player who doesn't know the secret word. The Chameleon must blend in and avoid detection!

### How to Play

1. **Create or Join a Lobby**: One player creates a lobby with a unique code, others join using that code
2. **Vote on a Topic**: Players vote on a category (Animals, Food, Colors, etc.)
3. **Receive Your Role**: 
   - Regular players see the secret word
   - The Chameleon only sees the topic
4. **Discussion Phase**: Players discuss the word without revealing it, trying to identify the Chameleon
5. **Vote**: Players vote for who they think is the Chameleon
6. **Results**: Find out if the Chameleon was caught!

## 🚀 Setup Instructions

### Prerequisites

- A Firebase account and project
- A web server to host the files (or use locally with a simple HTTP server)

### Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Realtime Database** in your Firebase project
3. Set up database rules for your Realtime Database:

```json
{
  "rules": {
    "lobbies": {
      "$lobbyId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

4. Get your Firebase configuration from Project Settings > General > Your apps
5. Update the configuration in `js/config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Running the Game

#### Option 1: Simple HTTP Server (Python)

```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

#### Option 2: Node.js HTTP Server

```bash
npx http-server -p 8000

# Then open http://localhost:8000 in your browser
```

#### Option 3: Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase use chameleon-c5230
firebase deploy --only hosting
```

If this is your first deployment in this repo, the required hosting config files are already included:
- `firebase.json`
- `.firebaserc`

#### Option 4: Auto-deploy on push (GitHub Actions)

This repo includes `.github/workflows/firebase-hosting-deploy.yml` to deploy Hosting automatically when you push to `main`.

One-time setup:
1. In Firebase Console, go to **Project Settings → Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. In GitHub, open your repo → **Settings → Secrets and variables → Actions**.
4. Add a **New repository secret** named:
  - `FIREBASE_SERVICE_ACCOUNT_CHAMELEON_C5230`
5. Paste the entire service account JSON as the secret value.

After that, every push to `main` triggers deploy automatically.

## 📁 Project Structure

```
Chamo/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # All styles (mobile-first)
├── js/
│   ├── config.js          # Firebase & game configuration
│   ├── utils.js           # Utility functions
│   ├── firebase-manager.js # Firebase operations
│   ├── game-state.js      # Game state management
│   ├── ui-manager.js      # UI updates and screen transitions
│   ├── lobby-manager.js   # Lobby creation/joining logic
│   ├── game-manager.js    # Game flow and logic
│   └── app.js             # Main app initialization
└── README.md
```

## ✨ Features

- ✅ Mobile-first responsive design
- ✅ Create/join lobby with unique codes
- ✅ Real-time player list synchronization
- ✅ Topic voting (3-5 options)
- ✅ Random Chameleon assignment
- ✅ Secret word from topic pool
- ✅ Private role reveal screens
- ✅ Discussion phase with timer
- ✅ Player voting phase
- ✅ Results reveal
- ✅ Play again functionality
- ✅ Host skip-round control during discussion
- ✅ Session restoration on page refresh

## 🎨 Customization

### Topics and Words

Edit `js/config.js` to add or modify topics:

```javascript
topics: {
    'Your Topic': ['Word1', 'Word2', 'Word3', ...],
    // Add more topics
}
```

### Game Settings

Modify game parameters in `js/config.js`:

```javascript
const gameConfig = {
    minPlayers: 3,           // Minimum players to start
    maxPlayers: 8,           // Maximum players in lobby
  roleRevealTime: 12,      // Role reveal auto-hide time (seconds)
  minDiscussionBeforeVote: 15, // Minimum discussion before Ready to Vote
    discussionTime: 180,     // Discussion time in seconds
  voteLockTime: 15,        // Delay before voting opens
  lobbyCodeLength: 6,      // Default generated lobby code length
  lobbyCodeMinLength: 3,   // Minimum allowed lobby code length
  lobbyCodeMaxLength: 8,   // Maximum allowed lobby code length
    // ...
};
```

## 🔧 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Optimization

The game is designed with mobile-first principles:
- Touch-friendly buttons and inputs
- Optimized for portrait orientation
- Responsive design adapts to all screen sizes
- Smooth animations and transitions

## 🐛 Troubleshooting

**Issue**: "Failed to initialize. Please refresh."
- Solution: Check Firebase configuration in `js/config.js`

**Issue**: Lobby not found
- Solution: Ensure the lobby code is correct and the lobby hasn't been closed

**Issue**: Players not updating in real-time
- Solution: Check Firebase Realtime Database rules and internet connection

## 📄 License

MIT License - feel free to use and modify for your own projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Enjoy playing Chamo! 🦎