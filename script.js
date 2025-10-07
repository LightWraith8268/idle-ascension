document.addEventListener('DOMContentLoaded', () => {

    // -----------------
    // --- 1. STATE VARIABLES ---
    // -----------------
    let userProfile = {
        userId: null,
        currentSlot: 0,
        slots: []
    };
    let gameState = {}; // This will now hold the state of the current slot
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

    function getNewGameState() {
        return {
            ascensionPoints: 0,
            lastSaveTimestamp: null,
            skillTree: {
                nodes: {
                    root: { purchased: true, cost: 0, description: 'The journey begins.' },
                    xp_boost_1: { purchased: false, cost: 1, requires: 'root', description: '+10% XP from all sources.' },
                    resource_boost_1: { purchased: false, cost: 1, requires: 'root', description: '+10% resources from all sources.' },
                    xp_boost_2: { purchased: false, cost: 3, requires: 'xp_boost_1', description: 'A further +15% XP from all sources.' }
                }
            },
            skills: {
                woodcutting: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Logs', gatherRate: 1, baseXp: 10 },
                mining: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Ore', gatherRate: 0, baseXp: 15 },
                fishing: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Fish', gatherRate: 0, baseXp: 12 }
            },
            inventory: { Logs: 0, Ore: 0, Fish: 0 },
            activeSkill: 'woodcutting'
        };
    }

    async function saveGameState() {
        if (!userProfile.userId) return;
        // Update the current slot in the profile before saving
        userProfile.slots[userProfile.currentSlot] = gameState;
        gameState.lastSaveTimestamp = Date.now();
        try {
            await db.collection('users').doc(userProfile.userId).set(userProfile);
        } catch (error) {
            console.error("Error saving game state: ", error);
        }
    }

    async function loadGameState(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const loadedData = doc.data();

                // Migration for old save format
                if (!loadedData.slots) {
                    addLog('Old save format detected. Migrating to new format...');
                    const newProfile = {
                        userId: userId,
                        currentSlot: 0,
                        slots: [loadedData] // The old data is the first slot
                    };
                    await db.collection('users').doc(userId).set(newProfile);
                    location.reload(); // Reload the page to apply the new structure
                    return; // Stop execution to prevent errors
                }

                userProfile = loadedData;

                if (userProfile.slots.length === 0) {
                    userProfile.slots.push(getNewGameState());
                }
                gameState = userProfile.slots[userProfile.currentSlot];

                if (gameState.lastSaveTimestamp) {
                    const offlineTime = Date.now() - gameState.lastSaveTimestamp;
                    calculateOfflineProgress(offlineTime / 1000); // pass seconds
                }
                addLog(`Save data loaded for slot ${userProfile.currentSlot + 1}.`);
            } else {
                addLog('No save data found. Creating a new game.');
                userProfile.userId = userId;
                userProfile.slots.push(getNewGameState());
                gameState = userProfile.slots[0];
                await saveGameState();
            }
        } catch (error) {
            console.error("Error loading game state: ", error);
            addLog('Error loading game. Check console.');
        }
    }

    function calculateOfflineProgress(offlineSeconds) {
        const maxOfflineTime = 2 * 60 * 60; // 2 hours in seconds
        const offlineTime = Math.min(offlineSeconds, maxOfflineTime);

        if (offlineTime <= 0) return;

        const skill = gameState.skills[gameState.activeSkill];
        if (!skill || skill.gatherRate <= 0) return;

        let resourcesGained = skill.gatherRate * offlineTime;
        if (gameState.skillTree.nodes.resource_boost_1.purchased) {
            resourcesGained *= 1.10;
        }

        gameState.inventory[skill.resource] += resourcesGained;
        gainXp(gameState.activeSkill, resourcesGained);

        addLog(`Welcome back! You were offline for ${Math.floor(offlineTime / 60)} minutes and earned ${Math.floor(resourcesGained)} ${skill.resource}.`);
    }

    async function startGame(user) {
        const userEmail = document.getElementById('user-email');
        userProfile.userId = user.uid;
        if(user.email) userEmail.textContent = user.email;
        await loadGameState(user.uid);
        updateAllUI();
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameTick, 1000);
        addLog('Game started!');
        if(loginModal) loginModal.hide();
    }

    function resetGame() {
        const userEmail = document.getElementById('user-email');
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = null;
        if(userEmail) userEmail.textContent = '';
        document.getElementById('skills-list').innerHTML = '';
        document.getElementById('action-content').innerHTML = '<p>Select a skill from the left to begin.</p>';
        document.getElementById('inventory-content').innerHTML = '';
    }

    function gameTick() {
        const skill = gameState.skills[gameState.activeSkill];
        if (skill && skill.gatherRate > 0) {
            let resourcesGained = skill.gatherRate;

            // Apply skill tree bonuses
            if (gameState.skillTree.nodes.resource_boost_1.purchased) {
                resourcesGained *= 1.10;
            }

            gameState.inventory[skill.resource] += resourcesGained;
            gainXp(gameState.activeSkill, resourcesGained);
            updateInventory();
        }
        saveTicker++;
        if (saveTicker >= saveInterval) {
            saveTicker = 0;
            saveGameState();
        }

        updateAscendButton();
    }

    function calculateAscensionPoints() {
        // For now, 1 AP for every 10 total levels.
        const totalLevels = Object.values(gameState.skills).reduce((sum, skill) => sum + skill.level, 0);
        return Math.floor(totalLevels / 10);
    }

    function ascend() {
        const pointsGained = calculateAscensionPoints();
        if (pointsGained <= 0) {
            addLog("You need to make more progress before ascending.");
            return;
        }

        addLog(`You have ascended and gained ${pointsGained} Ascension Points!`)

        const currentAscensionPoints = gameState.ascensionPoints;
        gameState = getNewGameState(); // Reset the slot
        gameState.ascensionPoints = currentAscensionPoints + pointsGained;

        saveGameState();
        updateAllUI();
    }

    function updateAscendButton() {
        const ascendBtn = document.getElementById('ascend-btn');
        const pointsGained = calculateAscensionPoints();
        if (pointsGained > 0) {
            ascendBtn.disabled = false;
            ascendBtn.textContent = `Ascend for ${pointsGained} AP`;
        } else {
            ascendBtn.disabled = true;
            ascendBtn.textContent = 'Ascend';
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
        let xpGained = skill.baseXp * amount;

        // Apply skill tree bonuses
        if (gameState.skillTree.nodes.xp_boost_1.purchased) {
            xpGained *= 1.10;
        }
        if (gameState.skillTree.nodes.xp_boost_2.purchased) {
            xpGained *= 1.15;
        }

        skill.xp += xpGained;
        while (skill.xp >= skill.xpToNextLevel) {
            levelUp(skillName);
        }
        updateSkillsList();
    }

    function updateAllUI() {
        updateSkillsList();
        updateInventory();
        updateStats();
        setActiveSkill(gameState.activeSkill);
        updateSkillTreeUI();
        updateSlotSwitcherUI();
    }

    function switchSlot(slotIndex) {
        if (slotIndex >= 3) {
            addLog("You can have a maximum of 3 save slots.");
            return;
        }

        if (slotIndex === userProfile.currentSlot) return;

        if (slotIndex >= userProfile.slots.length) {
            userProfile.slots.push(getNewGameState());
        }

        userProfile.currentSlot = slotIndex;
        saveGameState();
        location.reload();
    }

    function updateSlotSwitcherUI() {
        const slotList = document.getElementById('slot-list');
        const slotSwitcherBtn = document.getElementById('slot-switcher-btn');
        slotList.innerHTML = '';

        slotSwitcherBtn.textContent = `Save Slot ${userProfile.currentSlot + 1}`;

        for (let i = 0; i < 3; i++) {
            const slotItem = document.createElement('li');
            const slotLink = document.createElement('a');
            slotLink.className = 'dropdown-item';
            slotLink.href = '#';

            if (i < userProfile.slots.length) {
                slotLink.textContent = `Slot ${i + 1}`;
                if (i === userProfile.currentSlot) {
                    slotLink.classList.add('active');
                }
            } else {
                if (userProfile.slots.length < 3) {
                    slotLink.textContent = 'New Slot';
                } else {
                    continue; // Don't show 'New Slot' if we are at the limit
                }
            }

            slotLink.onclick = () => switchSlot(i);
            slotItem.appendChild(slotLink);
            slotList.appendChild(slotItem);
        }
    }

    function purchaseSkillTreeNode(nodeId) {
        const node = gameState.skillTree.nodes[nodeId];
        const requiredNode = gameState.skillTree.nodes[node.requires];

        if (node.purchased) {
            addLog("You have already purchased this upgrade.");
            return;
        }

        if (gameState.ascensionPoints < node.cost) {
            addLog("You do not have enough Ascension Points.");
            return;
        }

        if (requiredNode && !requiredNode.purchased) {
            addLog("You must purchase the prerequisite upgrade first.");
            return;
        }

        gameState.ascensionPoints -= node.cost;
        node.purchased = true;
        addLog(`Purchased upgrade: ${node.description}`);
        updateAllUI();
        saveGameState();
    }

    function updateSkillTreeUI() {
        const skillTreeContent = document.getElementById('skill-tree-content');
        skillTreeContent.innerHTML = '';

        for (const nodeId in gameState.skillTree.nodes) {
            const node = gameState.skillTree.nodes[nodeId];
            const requiredNode = gameState.skillTree.nodes[node.requires];

            const button = document.createElement('button');
            button.className = 'btn m-2';
            button.innerHTML = `${node.description}<br><small>Cost: ${node.cost} AP</small>`;
            button.onclick = () => purchaseSkillTreeNode(nodeId);

            if (node.purchased) {
                button.classList.add('btn-success');
                button.disabled = true;
            } else if ((requiredNode && requiredNode.purchased) && gameState.ascensionPoints >= node.cost) {
                button.classList.add('btn-primary');
            } else {
                button.classList.add('btn-secondary');
                button.disabled = true;
            }

            skillTreeContent.appendChild(button);
        }
    }

    function updateStats() {
        document.getElementById('ascension-points-display').textContent = gameState.ascensionPoints;
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
        document.getElementById('ascend-btn').addEventListener('click', ascend);

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