document.addEventListener('DOMContentLoaded', () => {
    addLog('DOM content loaded. Initializing script.');

    // --- GAME STATE --- //
    let gameState = { /* ... same as before ... */ };
    let saveInterval = 15;
    let saveTicker = 0;
    let gameLoopInterval = null;
    let loginModal = null;

    // --- DOM ELEMENTS --- //
    const skillsList = document.getElementById('skills-list');
    /* ... same as before ... */
    const signoutBtn = document.getElementById('signout-btn');

    // --- FIREBASE AUTH --- //
    /* ... same as before ... */

    // --- FIREBASE FUNCTIONS --- //
    /* ... same as before ... */

    // --- GAME INITIALIZATION & CORE LOGIC --- //
    async function startGame(user) {
        addLog(`startGame() called for user: ${user.uid}`);
        gameState.userId = user.uid;
        userEmail.textContent = user.email;
        userInfo.classList.remove('d-none');

        addLog('Loading save data...');
        await loadGameState(user.uid);

        updateSkillsList();
        updateInventory();
        setActiveSkill(gameState.activeSkill);

        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameTick, 1000);
        addLog('Game loop started!');
        if(loginModal) loginModal.hide();
    }

    function resetGame() {
        addLog('resetGame() called.');
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = null;
        userInfo.classList.add('d-none');
        userEmail.textContent = '';
        skillsList.innerHTML = '';
        actionContent.innerHTML = '<p>Select a skill from the left to begin.</p>';
        inventoryContent.innerHTML = '';
    }

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

    // --- GAME LOOP & LOGIC (mostly unchanged) --- //
    /* ... same as before ... */

    // --- UI UPDATE FUNCTIONS (mostly unchanged) --- //
    /* ... same as before ... */

    // --- INITIALIZATION --- //
    function init() {
        addLog('init() called.');
        const loginModalElement = document.getElementById('loginModal');
        loginModal = new bootstrap.Modal(loginModalElement);

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