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

    // --- DOM ELEMENTS --- //
    const skillsList = document.getElementById('skills-list');
    const actionPanelTitle = document.getElementById('action-panel-title');
    const actionContent = document.getElementById('action-content');
    const logMessages = document.getElementById('log-messages');
    const inventoryContent = document.getElementById('inventory-content');
    const versionDisplay = document.getElementById('version-display');
    const loginModalElement = document.getElementById('loginModal');
    const loginModal = new bootstrap.Modal(loginModalElement);
    const authError = document.getElementById('auth-error');

    // Auth buttons
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');
    const googleSigninBtn = document.getElementById('google-signin-btn');

    // --- FIREBASE AUTH --- //
    async function signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            showAuthError(error.message);
        }
    }

    async function signInWithEmail() {
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            showAuthError(error.message);
        }
    }

    async function signUpWithEmail() {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            showAuthError(error.message);
        }
    }

    function showAuthError(message) {
        authError.textContent = message;
        authError.classList.remove('d-none');
    }

    // --- FIREBASE FUNCTIONS --- //
    async function saveGameState() { /* ... same as before ... */ }
    async function loadGameState(userId) { /* ... same as before ... */ }

    // --- GAME INITIALIZATION & CORE LOGIC --- //
    async function startGame(userId) {
        gameState.userId = userId;
        addLog('Connected! Loading save data...');
        await loadGameState(userId);

        updateSkillsList();
        updateInventory();
        setActiveSkill(gameState.activeSkill);

        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameTick, 1000);
        addLog('Game started!');
        loginModal.hide();
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            startGame(user.uid);
        } else {
            // User is signed out
            if (gameLoopInterval) clearInterval(gameLoopInterval);
            loginModal.show();
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
        displayVersion();
        addLog('Checking authentication status...');
        // Add event listeners to auth buttons
        signinBtn.addEventListener('click', signInWithEmail);
        signupBtn.addEventListener('click', signUpWithEmail);
        googleSigninBtn.addEventListener('click', signInWithGoogle);
    }

    init();
});