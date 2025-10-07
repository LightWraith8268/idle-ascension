document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE --- //
    let gameState = {
        userId: null,
        skills: {
            woodcutting: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Logs', gatherRate: 1, baseXp: 10 },
            mining: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Ore', gatherRate: 0, baseXp: 15 },
            fishing: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Fish', gatherRate: 0, baseXp: 12 }
        },
        inventory: { Logs: 0, Ore: 0, Fish: 0 },
        activeSkill: 'woodcutting'
    };

    let saveInterval = 15;
    let saveTicker = 0;
    let gameLoopInterval = null;
    let loginModal = null;

    // --- DOM ELEMENTS --- //
    const skillsList = document.getElementById('skills-list');
    const actionPanelTitle = document.getElementById('action-panel-title');
    const actionContent = document.getElementById('action-content');
    const logMessages = document.getElementById('log-messages');
    const inventoryContent = document.getElementById('inventory-content');
    const versionDisplay = document.getElementById('version-display');
    const authError = document.getElementById('auth-error');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');

    // Auth buttons
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');
    const googleSigninBtn = document.getElementById('google-signin-btn');
    const signoutBtn = document.getElementById('signout-btn');

    // --- FIREBASE AUTH --- //
    async function signInWithGoogle() { /* ... same as before ... */ }
    async function signInWithEmail() { /* ... same as before ... */ }
    async function signUpWithEmail() { /* ... same as before ... */ }
    async function signOut() {
        try {
            await auth.signOut();
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error("Sign out failed: ", error);
        }
    }

    function showAuthError(message) { /* ... same as before ... */ }

    // --- FIREBASE FUNCTIONS --- //
    async function saveGameState() { /* ... same as before ... */ }
    async function loadGameState(userId) { /* ... same as before ... */ }

    // --- GAME INITIALIZATION & CORE LOGIC --- //
    async function startGame(user) {
        gameState.userId = user.uid;
        userEmail.textContent = user.email;
        userInfo.classList.remove('d-none');

        addLog('Connected! Loading save data...');
        await loadGameState(user.uid);

        updateSkillsList();
        updateInventory();
        setActiveSkill(gameState.activeSkill);

        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameTick, 1000);
        addLog('Game started!');
        if(loginModal) loginModal.hide();
    }

    function resetGame() {
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = null;
        userInfo.classList.add('d-none');
        userEmail.textContent = '';
        // Clear UI panels
        skillsList.innerHTML = '';
        actionContent.innerHTML = '<p>Select a skill from the left to begin.</p>';
        inventoryContent.innerHTML = '';
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            startGame(user);
        } else {
            resetGame();
            if(loginModal) loginModal.show();
            addLog('Please sign in to play.');
        }
    });

    // --- GAME LOOP & LOGIC (mostly unchanged) --- //
    function gameTick() { /* ... same as before ... */ }
    function levelUp(skillName) { /* ... same as before ... */ }
    function gainXp(skillName, amount) { /* ... same as before ... */ }

    // --- UI UPDATE FUNCTIONS (mostly unchanged) --- //
    async function displayVersion() { /* ... same as before ... */ }
    function addLog(message) { /* ... same as before ... */ }
    function updateSkillsList() { /* ... same as before ... */ }
    function updateInventory() { /* ... same as before ... */ }
    function setActiveSkill(skillName) { /* ... same as before ... */ }

    // --- INITIALIZATION --- //
    function init() {
        const loginModalElement = document.getElementById('loginModal');
        loginModal = new bootstrap.Modal(loginModalElement);

        displayVersion();
        addLog('Checking authentication status...');
        
        // Add event listeners to auth buttons
        signinBtn.addEventListener('click', signInWithEmail);
        signupBtn.addEventListener('click', signUpWithEmail);
        googleSigninBtn.addEventListener('click', signInWithGoogle);
        signoutBtn.addEventListener('click', signOut);
    }

    init();
});