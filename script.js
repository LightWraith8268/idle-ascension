document.addEventListener('DOMContentLoaded', () => {
    function addLog(message) {
        const logMessages = document.getElementById('log-messages');
        if (!logMessages) return;
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logMessages.prepend(logEntry);
    }

    addLog('DOM content loaded. Initializing script.');

    // --- GAME STATE --- //
    let gameState = { /* ... */ };
    let saveInterval = 15;
    let saveTicker = 0;
    let gameLoopInterval = null;
    let loginModal = null;

    // --- DOM ELEMENTS --- //
    // ... (references will be assigned in init)

    // --- AUTH & GAME LOGIC --- //
    // All functions are now defined before being used.

    // --- INITIALIZATION --- //
    function init() {
        addLog('init() called.');
        
        // Assign DOM elements here, safely inside init
        const skillsList = document.getElementById('skills-list');
        // ... assign all other DOM elements ...
        const signoutBtn = document.getElementById('signout-btn');
        const loginModalElement = document.getElementById('loginModal');
        loginModal = new bootstrap.Modal(loginModalElement);

        // Set up auth listener here, safely inside init
        addLog('Setting up auth listener...');
        auth.onAuthStateChanged(user => {
            addLog('Auth state changed.');
            if (user) {
                addLog(`Auth listener: User found with UID: ${user.uid}`);
                startGame(user);
            } else {
                addLog('Auth listener: User not found.');
                resetGame();
                if(loginModal) {
                    addLog('Showing login modal.');
                    loginModal.show();
                } else {
                    addLog('ERROR: loginModal object is null.');
                }
            }
        });

        displayVersion();
        
        // Add event listeners to auth buttons
        signinBtn.addEventListener('click', signInWithEmail);
        signupBtn.addEventListener('click', signUpWithEmail);
        googleSigninBtn.addEventListener('click', signInWithGoogle);
        signoutBtn.addEventListener('click', signOut);
        addLog('Event listeners added.');
    }

    init();
});