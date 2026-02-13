// Firebase Configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Game Configuration
const gameConfig = {
    minPlayers: 3,
    maxPlayers: 8,
    discussionTime: 180, // 3 minutes in seconds
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
