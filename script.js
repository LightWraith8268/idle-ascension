document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE --- //
    // This is the default state for a new player.
    // It will be overwritten by data loaded from Firebase.
    let gameState = {
        userId: null,
        skills: {
            woodcutting: {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                resource: 'Logs',
                gatherRate: 1, // logs per second
                baseXp: 10 // xp per log
            },
            mining: {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                resource: 'Ore',
                gatherRate: 0,
                baseXp: 15
            },
            fishing: {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                resource: 'Fish',
                gatherRate: 0,
                baseXp: 12
            }
        },
        inventory: {
            Logs: 0,
            Ore: 0,
            Fish: 0
        },
        activeSkill: 'woodcutting'
    };

    let saveInterval = 15; // Save every 15 seconds
    let saveTicker = 0;

    // --- DOM ELEMENTS --- //
    const skillsList = document.getElementById('skills-list');
    const actionPanelTitle = document.getElementById('action-panel-title');
    const actionContent = document.getElementById('action-content');
    const logMessages = document.getElementById('log-messages');
    const inventoryContent = document.getElementById('inventory-content');

    // --- FIREBASE FUNCTIONS --- //
    async function saveGameState() {
        if (!gameState.userId) return; // Can't save if we don't have a user ID
        try {
            await db.collection('users').doc(gameState.userId).set(gameState);
            addLog('Game saved!');
        } catch (error) {
            console.error("Error saving game state: ", error);
            addLog('Error saving game. Check console.');
        }
    }

    async function loadGameState(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                // If a save exists, load it.
                gameState = doc.data();
                addLog('Save data loaded from cloud.');
            } else {
                // This is a new player, create their first save.
                addLog('No save data found. Creating a new game.');
                await saveGameState();
            }
        } catch (error) {
            console.error("Error loading game state: ", error);
            addLog('Error loading game. Check console.');
        }
    }

    // --- GAME LOGIC --- //
    function levelUp(skillName) {
        const skill = gameState.skills[skillName];
        skill.level++;
        skill.xp -= skill.xpToNextLevel;
        skill.xpToNextLevel = Math.floor(skill.xpToNextLevel * 1.15);
        addLog(`Congratulations! Your ${skillName} level is now ${skill.level}!`);
        updateSkillsList();
        setActiveSkill(skillName);
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

    // --- GAME LOOP --- //
    function gameTick() {
        const skillName = gameState.activeSkill;
        const skill = gameState.skills[skillName];
        if (skill && skill.gatherRate > 0) {
            const resourcesGained = skill.gatherRate;
            gameState.inventory[skill.resource] += resourcesGained;
            gainXp(skillName, resourcesGained);
            updateInventory();
        }

        // Handle periodic saving
        saveTicker++;
        if (saveTicker >= saveInterval) {
            saveTicker = 0;
            saveGameState();
        }
    }

    // --- UI UPDATE FUNCTIONS --- //
    function addLog(message) {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logMessages.prepend(logEntry);
        if (logMessages.children.length > 20) {
            logMessages.removeChild(logMessages.lastChild);
        }
    }

    function updateSkillsList() {
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
        gameState.activeSkill = skillName;
        const skill = gameState.skills[skillName];
        actionPanelTitle.textContent = skillName.charAt(0).toUpperCase() + skillName.slice(1);
        actionContent.innerHTML = `
            <p>Currently training ${skillName}.</p>
            <p>XP/sec: ${skill.gatherRate * skill.baseXp}</p>
        `;
    }

    // --- INITIALIZATION --- //
    async function init() {
        addLog('Connecting to server...');
        try {
            const userCredential = await auth.signInAnonymously();
            gameState.userId = userCredential.user.uid;
            addLog('Connected! Loading save data...');
            await loadGameState(gameState.userId);

            // Update UI with loaded data
            updateSkillsList();
            updateInventory();
            setActiveSkill(gameState.activeSkill);

            // Start the game loop *after* loading is complete
            setInterval(gameTick, 1000);
            addLog('Game started!');

        } catch (error) {
            console.error("Authentication failed: ", error);
            addLog('Could not connect to server. Please refresh.');
        }
    }

    init();
});