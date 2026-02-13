// Firebase Configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyAKbry-LtdWXLqTRxf5MmR5-t0aKi7G7Uk",
    authDomain: "chameleon-c5230.firebaseapp.com",
    databaseURL: "https://chameleon-c5230-default-rtdb.firebaseio.com",
    projectId: "chameleon-c5230",
    storageBucket: "chameleon-c5230.firebasestorage.app",
    messagingSenderId: "620652027822",
    appId: "1:620652027822:web:81e2bba1017a61d929f23f"
};

// Game Configuration
const gameConfig = {
    minPlayers: 3,
    maxPlayers: 8,
    roleRevealTime: 12, // seconds role details remain visible
    minDiscussionBeforeVote: 15, // minimum seconds before players can click Ready to Vote
    discussionTime: 180, // 3 minutes in seconds
    voteLockTime: 15, // seconds players must wait before voting opens
    lobbyCodeLength: 6,
    
    // Available topics with their associated words
    topics: {
        'Animals': ['Lion', 'Elephant', 'Giraffe', 'Zebra', 'Monkey', 'Tiger', 'Bear', 'Dolphin', 'Penguin', 'Kangaroo'],
        'Food': ['Pizza', 'Burger', 'Sushi', 'Pasta', 'Taco', 'Salad', 'Sandwich', 'Soup', 'Steak', 'Ice Cream'],
        'Colors': ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Brown'],
        'Countries': ['USA', 'Japan', 'France', 'Brazil', 'Australia', 'Canada', 'Italy', 'Spain', 'Germany', 'China'],
        'Sports': ['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Swimming', 'Golf', 'Hockey', 'Volleyball', 'Cricket', 'Rugby']
    }
};
