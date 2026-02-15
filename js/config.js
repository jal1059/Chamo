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
    clueMaxLength: 60,
    clueRounds: 2, // number of full clue rounds (set to 3 for longer rounds)
    lobbyCodeLength: 6,
    lobbyCodeMinLength: 3,
    lobbyCodeMaxLength: 8,
    
    // Available topics with their associated words
    topics: {
        'Animals': ['Lion', 'Elephant', 'Giraffe', 'Zebra', 'Monkey', 'Tiger', 'Bear', 'Dolphin', 'Penguin', 'Kangaroo'],
        'Food': ['Pizza', 'Burger', 'Sushi', 'Pasta', 'Taco', 'Salad', 'Sandwich', 'Soup', 'Steak', 'Ice Cream'],
        'Colors': ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Brown'],
        'Countries': ['USA', 'Japan', 'France', 'Brazil', 'Australia', 'Canada', 'Italy', 'Spain', 'Germany', 'China'],
        'Sports': ['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Swimming', 'Golf', 'Hockey', 'Volleyball', 'Cricket', 'Rugby'],
        'Movies': ['Inception', 'Titanic', 'Avatar', 'Gladiator', 'Jaws', 'Frozen', 'Shrek', 'Rocky', 'Moana', 'Up'],
        'TV Shows': ['Friends', 'Seinfeld', 'Breaking Bad', 'Lost', 'The Office', 'Sherlock', 'Stranger Things', 'Narcos', 'Suits', 'Wednesday'],
        'Jobs': ['Doctor', 'Teacher', 'Engineer', 'Chef', 'Pilot', 'Nurse', 'Lawyer', 'Farmer', 'Firefighter', 'Artist'],
        'School': ['Homework', 'Exam', 'Pencil', 'Backpack', 'Locker', 'Classroom', 'Recess', 'Principal', 'Notebook', 'Chalkboard'],
        'Technology': ['Laptop', 'Smartphone', 'Keyboard', 'Mouse', 'WiFi', 'Bluetooth', 'Drone', 'Robot', 'Server', 'Headphones'],
        'Video Games': ['Minecraft', 'Fortnite', 'Tetris', 'Pac-Man', 'Zelda', 'Mario', 'Sonic', 'Pokemon', 'Among Us', 'Portal'],
        'Music': ['Guitar', 'Piano', 'Drums', 'Violin', 'Trumpet', 'Microphone', 'Concert', 'Playlist', 'DJ', 'Singer'],
        'Transportation': ['Car', 'Bus', 'Train', 'Bicycle', 'Motorcycle', 'Helicopter', 'Subway', 'Taxi', 'Boat', 'Scooter'],
        'Weather': ['Rain', 'Snow', 'Thunder', 'Lightning', 'Cloud', 'Wind', 'Fog', 'Hurricane', 'Tornado', 'Sunshine'],
        'Nature': ['Mountain', 'River', 'Ocean', 'Forest', 'Desert', 'Volcano', 'Waterfall', 'Island', 'Cave', 'Beach'],
        'Household Items': ['Chair', 'Table', 'Lamp', 'Pillow', 'Blanket', 'Mirror', 'Toaster', 'Fridge', 'Spoon', 'Clock'],
        'Clothing': ['Jacket', 'T-Shirt', 'Jeans', 'Sneakers', 'Hat', 'Scarf', 'Gloves', 'Socks', 'Dress', 'Hoodie'],
        'Body Parts': ['Head', 'Shoulder', 'Knee', 'Toe', 'Elbow', 'Wrist', 'Ankle', 'Back', 'Finger', 'Nose'],
        'Emotions': ['Happy', 'Sad', 'Angry', 'Excited', 'Nervous', 'Calm', 'Confused', 'Proud', 'Jealous', 'Surprised'],
        'Fantasy': ['Dragon', 'Wizard', 'Knight', 'Castle', 'Spell', 'Potion', 'Elf', 'Orc', 'Unicorn', 'Phoenix'],
        'Space': ['Planet', 'Star', 'Moon', 'Rocket', 'Astronaut', 'Galaxy', 'Comet', 'Meteor', 'Satellite', 'Alien'],
        'Holidays': ['Christmas', 'Halloween', 'Easter', 'Thanksgiving', 'Birthday', 'New Year', 'Valentine', 'Fireworks', 'Pumpkin', 'Parade'],
        'Places in a City': ['Hospital', 'Library', 'Airport', 'Museum', 'Stadium', 'Park', 'Restaurant', 'Mall', 'Bank', 'School'],
        'Kitchen': ['Oven', 'Pan', 'Knife', 'Fork', 'Blender', 'Microwave', 'Plate', 'Cup', 'Kettle', 'Cutting Board'],
        'Farm': ['Barn', 'Tractor', 'Hay', 'Cow', 'Sheep', 'Pig', 'Chicken', 'Horse', 'Fence', 'Rooster'],
        'Ocean Life': ['Shark', 'Whale', 'Octopus', 'Jellyfish', 'Crab', 'Lobster', 'Seal', 'Starfish', 'Coral', 'Seahorse'],
        'Superheroes': ['Superman', 'Batman', 'Spider-Man', 'Iron Man', 'Hulk', 'Thor', 'Wonder Woman', 'Flash', 'Aquaman', 'Black Panther'],
        'Mythology': ['Zeus', 'Hades', 'Poseidon', 'Athena', 'Apollo', 'Hercules', 'Medusa', 'Pegasus', 'Minotaur', 'Cyclops'],
        'Board Games': ['Chess', 'Monopoly', 'Scrabble', 'Clue', 'Risk', 'Checkers', 'Uno', 'Catan', 'Battleship', 'Jenga']
    }
};
