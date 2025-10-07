document.addEventListener('DOMContentLoaded', () => {

    // -----------------
    // --- 1. STATE VARIABLES ---
    // -----------------
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

    // -----------------
    // --- 2. FUNCTION DEFINITIONS ---
    // -----------------

    function addLog(message) {
        const logMessages = document.getElementById('log-messages');
        if (!logMessages) return;
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logMessages.prepend(logEntry);
        // Increased log length as requested
        if (logMessages.children.length > 100) {
            logMessages.removeChild(logMessages.lastChild);
        }
    }

    async function signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            showAuthError(error.message);
        }
    }

    async function signInWithEmail() {
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            showAuthError(error.message);
        }
    }

    async function signUpWithEmail() {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        try {
            await auth.createUserWithEmailAndPassword(email, password);
        } catch (error) {
            showAuthError(error.message);
        }
    }

    async function signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Sign out failed: ", error);
        }
    }

    function showAuthError(message) {
        const authError = document.getElementById('auth-error');
        authError.textContent = message;
        authError.classList.remove('d-none');
    }

    async function saveGameState() {
        if (!gameState.userId) return;
        try {
            await db.collection('users').doc(gameState.userId).set(gameState);
        } catch (error) {
            console.error("Error saving game state: ", error);
        }
    }

    async function loadGameState(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                Object.assign(gameState, doc.data());
                addLog('Save data loaded from cloud.');
            } else {
                addLog('No save data found. Creating a new game.');
                await saveGameState();
            }
        } catch (error) {
            console.error("Error loading game state: ", error);
            addLog('Error loading game. Check console.');
        }
    }

    async function startGame(user) {
        const userEmail = document.getElementById('user-email');
        const userInfo = document.getElementById('user-info');
        gameState.userId = user.uid;
        if(user.email) userEmail.textContent = user.email;
        userInfo.classList.remove('d-none');
        await loadGameState(user.uid);
        updateAllUI();
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameTick, 1000);
        addLog('Game started!');
        if(loginModal) loginModal.hide();
    }

    function resetGame() {
        const userInfo = document.getElementById('user-info');
        const userEmail = document.getElementById('user-email');
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = null;
        if(userInfo) userInfo.classList.add('d-none');
        if(userEmail) userEmail.textContent = '';
        document.getElementById('skills-list').innerHTML = '';
        document.getElementById('action-content').innerHTML = '<p>Select a skill from the left to begin.</p>';
        document.getElementById('inventory-content').innerHTML = '';
    }

    function gameTick() {
        const skill = gameState.skills[gameState.activeSkill];
        if (skill && skill.gatherRate > 0) {
            const resourcesGained = skill.gatherRate;
            gameState.inventory[skill.resource] += resourcesGained;
            gainXp(gameState.activeSkill, resourcesGained);
            updateInventory();
        }
        saveTicker++;
        if (saveTicker >= saveInterval) {
            saveTicker = 0;
            saveGameState();
        }
    }

    function levelUp(skillName) {
        const skill = gameState.skills[skillName];
        skill.level++;
        skill.xp -= skill.xpToNextLevel;
        skill.xpToNextLevel = Math.floor(skill.xpToNextLevel * 1.15);
        addLog(`Congratulations! Your ${skillName} level is now ${skill.level}!`);
        updateAllUI();
    }

    function gainXp(skillName, amount) {
        const skill = gameState.skills[skillName];
        const xpGained = skill.baseXp * amount;
        skill.xp += xpGained;
        while (skill.xp >= skill.xpToNextLevel) {
            levelUp(skillName);
        }
        updateSkillsList();
    }

    function updateAllUI() {
        updateSkillsList();
        updateInventory();
        setActiveSkill(gameState.activeSkill);
    }

    async function displayVersion() {
        try {
            const response = await fetch('package.json');
            const data = await response.json();
            document.getElementById('version-display').textContent = `v${data.version}`;
        } catch (error) {
            document.getElementById('version-display').textContent = 'v?.?.?';
        }
    }

    function updateSkillsList() {
        const skillsList = document.getElementById('skills-list');
        skillsList.innerHTML = '';
        for (const skillName in gameState.skills) {
            const skill = gameState.skills[skillName];
            const xpPercent = (skill.xp / skill.xpToNextLevel) * 100;
            const skillButton = document.createElement('div');
            skillButton.className = 'skill-button';
            skillButton.onclick = () => setActiveSkill(skillName);
            skillButton.innerHTML = `
                <div class="d-flex justify-content-between">
                    <span>${skillName.charAt(0).toUpperCase() + skillName.slice(1)}</span>
                    <span>Lvl ${skill.level}</span>
                </div>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-warning" role="progressbar" style="width: ${xpPercent}%;" aria-valuenow="${xpPercent}" aria-valuemin="0" aria-valuemax="100">
                        ${Math.floor(skill.xp)} / ${skill.xpToNextLevel}
                    </div>
                </div>
            `;
            skillsList.appendChild(skillButton);
        }
    }

    function updateInventory() {
        const inventoryContent = document.getElementById('inventory-content');
        inventoryContent.innerHTML = '';
        for (const item in gameState.inventory) {
            const amount = gameState.inventory[item];
            if (amount > 0) {
                const entry = document.createElement('div');
                entry.className = 'inventory-entry';
                entry.innerHTML = `<span>${item}:</span><span>${amount}</span>`;
                inventoryContent.appendChild(entry);
            }
        }
    }

    function setActiveSkill(skillName) {
        const actionPanelTitle = document.getElementById('action-panel-title');
        const actionContent = document.getElementById('action-content');
        gameState.activeSkill = skillName;
        const skill = gameState.skills[skillName];
        actionPanelTitle.textContent = skillName.charAt(0).toUpperCase() + skillName.slice(1);
        actionContent.innerHTML = `
            <p>Currently training ${skillName}.</p>
            <p>XP/sec: ${skill.gatherRate * skill.baseXp}</p>
        `;
    }

    // -----------------
    // --- 3. INITIALIZATION ---
    // -----------------
    function init() {
        addLog('DOM loaded. Initializing.');
        const loginModalElement = document.getElementById('loginModal');
        loginModal = new bootstrap.Modal(loginModalElement);

        document.getElementById('signin-btn').addEventListener('click', signInWithEmail);
        document.getElementById('signup-btn').addEventListener('click', signUpWithEmail);
        document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);
        document.getElementById('signout-btn').addEventListener('click', signOut);

        displayVersion();

        auth.onAuthStateChanged(user => {
            if (user) {
                startGame(user);
            } else {
                resetGame();
                loginModal.show();
            }
        });
    }

    init();
});