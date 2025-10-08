
document.addEventListener('DOMContentLoaded', () => {
    addLog('DOM loaded. Initializing.');

    // Assign DOM elements here
    dom.logMessages = document.getElementById('log-messages');
    dom.authError = document.getElementById('auth-error');
    dom.signinEmail = document.getElementById('signin-email');
    dom.signinPassword = document.getElementById('signin-password');
    dom.signinBtn = document.getElementById('signin-btn');
    dom.signupEmail = document.getElementById('signup-email');
    dom.signupPassword = document.getElementById('signup-password');
    dom.signupBtn = document.getElementById('signup-btn');
    dom.googleSigninBtn = document.getElementById('google-signin-btn');
    dom.signoutBtn = document.getElementById('signout-btn');
    dom.ascendBtn = document.getElementById('ascend-btn');
    dom.skillsList = document.getElementById('skills-list');
    dom.storageContent = document.getElementById('storage-content');
    dom.actionPanelTitle = document.getElementById('action-panel-title');
    dom.actionContent = document.getElementById('action-content');
    dom.ascensionPointsDisplay = document.getElementById('ascension-points-display');
    dom.skillTreeContent = document.getElementById('prestige-skill-tree-content');
    dom.slotList = document.getElementById('slot-list');
    dom.slotSwitcherBtn = document.getElementById('slot-switcher-btn');
    dom.openPrestigeBtn = document.getElementById('open-prestige-btn');
    dom.resetGameBtn = document.getElementById('reset-game-btn');
    dom.autosaveIntervalInput = document.getElementById('autosave-interval');

    // Initialize Bootstrap Modals here
    dom.loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    dom.prestigeModal = new bootstrap.Modal(document.getElementById('prestigeModal'));

    dom.signinBtn.addEventListener('click', signInWithEmail);
    dom.signupBtn.addEventListener('click', signUpWithEmail);
    dom.googleSigninBtn.addEventListener('click', signInWithGoogle);
    dom.signoutBtn.addEventListener('click', signOut);
    dom.ascendBtn.addEventListener('click', ascend);
    dom.openPrestigeBtn.addEventListener('click', () => dom.prestigeModal.show());
    dom.resetGameBtn.addEventListener('click', resetGame);

    dom.autosaveIntervalInput.addEventListener('change', () => {
        const newInterval = parseInt(dom.autosaveIntervalInput.value);
        if (!isNaN(newInterval) && newInterval > 0) {
            gameState.autosaveInterval = newInterval;
            addLog(`Autosave interval set to ${newInterval} seconds.`);
        } else {
            dom.autosaveIntervalInput.value = gameState.autosaveInterval;
        }
    });

    dom.actionContent.addEventListener('click', (e) => {
        if (e.target.id === 'start-fishing-btn') {
            startFishing();
        }
        if (e.target.id === 'stop-fishing-btn') {
            stopFishing();
        }
        if (e.target.id === 'start-mining-btn') {
            startMining();
        }
        if (e.target.id === 'stop-mining-btn') {
            stopMining();
        }
        if (e.target.id === 'start-woodcutting-btn') {
            startWoodcutting();
        }
        if (e.target.id === 'stop-woodcutting-btn') {
            stopWoodcutting();
        }
    });

    dom.actionContent.addEventListener('change', (e) => {
        if (e.target.id === 'fishing-area-select') {
            gameState.fishing.currentArea = e.target.value;
            setActiveSkill('fishing');
        }
        if (e.target.id === 'mining-zone-select') {
            gameState.mining.currentZone = e.target.value;
            setActiveSkill('mining');
        }
        if (e.target.id === 'woodcutting-area-select') {
            gameState.woodcutting.currentArea = e.target.value;
            setActiveSkill('woodcutting');
        }
    });

    displayVersion();

    auth.onAuthStateChanged(user => {
        if (user) {
            startGame(user);
        } else {
            resetGame();
            dom.loginModal.show();
        }
    });
});
