
// -----------------
// --- Constants ---
// -----------------
const SAVE_INTERVAL_SECONDS = 15;
const MAX_LOG_MESSAGES = 100;
const MAX_SAVE_SLOTS = 3;
const OFFLINE_PROGRESS_MAX_HOURS = 2;
const OFFLINE_PROGRESS_SKILL_TREE_BOOST_HOURS = 1;
const ASCENSION_POINTS_PER_TEN_LEVELS = 1;

// -----------------
// --- DOM Elements ---
// -----------------
const dom = {
    logMessages: document.getElementById('log-messages'),
    authError: document.getElementById('auth-error'),
    signinEmail: document.getElementById('signin-email'),
    signinPassword: document.getElementById('signin-password'),
    signinBtn: document.getElementById('signin-btn'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupBtn: document.getElementById('signup-btn'),
    googleSigninBtn: document.getElementById('google-signin-btn'),
    signoutBtn: document.getElementById('signout-btn'),
    ascendBtn: document.getElementById('ascend-btn'),
    versionDisplay: document.getElementById('version-display'),
    skillsList: document.getElementById('skills-list'),
    inventoryContent: document.getElementById('inventory-content'),
    actionPanelTitle: document.getElementById('action-panel-title'),
    actionContent: document.getElementById('action-content'),
    ascensionPointsDisplay: document.getElementById('ascension-points-display'),
    skillTreeContent: document.getElementById('skill-tree-content'),
    slotList: document.getElementById('slot-list'),
    slotSwitcherBtn: document.getElementById('slot-switcher-btn'),
    openPrestigeBtn: document.getElementById('open-prestige-btn'),
    loginModal: new bootstrap.Modal(document.getElementById('loginModal')),
    prestigeModal: new bootstrap.Modal(document.getElementById('prestigeModal'))
};

// -----------------
// --- State Variables ---
// -----------------
let userProfile = {
    userId: null,
    currentSlot: 0,
    slots: []
};
let saveTicker = 0;
let gameLoopInterval = null;

// -----------------
// --- Utility Functions ---
// -----------------
const addLog = (message) => {
    if (!dom.logMessages) return;
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    dom.logMessages.prepend(logEntry);
    if (dom.logMessages.children.length > MAX_LOG_MESSAGES) {
        dom.logMessages.removeChild(dom.logMessages.lastChild);
    }
};

const showAuthError = (message) => {
    dom.authError.textContent = message;
    dom.authError.classList.remove('d-none');
};

const getNewGameState = () => ({
    ascensionPoints: 0,
    lastSaveTimestamp: null,
    skillTree: {
        nodes: {
            root: { purchased: true, cost: 0, description: 'The journey begins.' },
            xp_boost_1: { purchased: false, cost: 1, requires: 'root', description: '+10% XP from all sources.' },
            resource_boost_1: { purchased: false, cost: 1, requires: 'root', description: '+10% resources from all sources.' },
            xp_boost_2: { purchased: false, cost: 3, requires: 'xp_boost_1', description: 'A further +15% XP from all sources.' },
            xp_boost_3: { purchased: false, cost: 5, requires: 'xp_boost_2', description: 'Even further +20% XP from all sources.' },
            resource_boost_2: { purchased: false, cost: 5, requires: 'resource_boost_1', description: 'Even further +20% resources from all sources.' },
            offline_time_boost_1: { purchased: false, cost: 3, requires: 'root', description: 'Increase max offline time by 1 hour.' },
            autosave_interval_reduction_1: { purchased: false, cost: 2, requires: 'root', description: 'Reduce auto-save interval by 5 seconds.' },
            woodcutting_efficiency_1: { purchased: false, cost: 2, requires: 'xp_boost_1', description: '+1 gather rate for Woodcutting.' },
            woodcutting_xp_boost_1: { purchased: false, cost: 2, requires: 'woodcutting_efficiency_1', description: '+10% XP for Woodcutting.' },
            unlock_mining: { purchased: false, cost: 1, requires: 'root', description: 'Unlock the Mining skill.' },
            unlock_fishing: { purchased: false, cost: 1, requires: 'root', description: 'Unlock the Fishing skill.' }
        }
    },
    skills: {
        woodcutting: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Logs', gatherRate: 1, baseXp: 10 },
        mining: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Ore', gatherRate: 0, baseXp: 15, locked: true },
        fishing: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Fish', gatherRate: 0, baseXp: 12, locked: true }
    },
    inventory: { Logs: 0, Ore: 0, Fish: 0 },
    activeSkill: 'woodcutting'
});

let gameState = getNewGameState();

// -----------------
const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        addLog('Signed in with Google successfully!');
    } catch (error) {
        showAuthError(error.message);
    }
};

const signInWithEmail = async () => {
    const email = dom.signinEmail.value;
    const password = dom.signinPassword.value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        addLog('Signed in with email successfully!');
    } catch (error) {
        showAuthError(error.message);
    }
};

const signUpWithEmail = async () => {
    const email = dom.signupEmail.value;
    const password = dom.signupPassword.value;
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        addLog('Signed up with email successfully!');
    } catch (error) {
        showAuthError(error.message);
    }
};

const signOut = async () => {
    try {
        await auth.signOut();
        addLog('Signed out successfully!');
    } catch (error) {
        // Error handling for sign out can be minimal as it's less critical
    }
};

// -----------------
// --- Game State Management ---
// -----------------
const saveGameState = async () => {
    if (!userProfile.userId) return;
    userProfile.slots[userProfile.currentSlot] = { ...gameState, lastSaveTimestamp: Date.now() };
    try {
        await db.collection('users').doc(userProfile.userId).set(userProfile);
    } catch (error) {
        // Error handling for saving game state
    }
};

const loadGameState = async (userId) => {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            const loadedData = doc.data();

            if (!loadedData.slots) {
                addLog('Old save format detected. Migrating to new format...');
                const baseGameState = getNewGameState();
                const mergedGameState = { ...baseGameState, ...loadedData };
                const newProfile = {
                    userId: userId,
                    currentSlot: 0,
                    slots: [mergedGameState]
                };
                await db.collection('users').doc(userId).set(newProfile);
                location.reload();
                return;
            }

            userProfile = loadedData;

            userProfile.slots = userProfile.slots.map(slot => {
                const baseGameState = getNewGameState();
                const mergedSkillTreeNodes = { ...baseGameState.skillTree.nodes, ...(slot.skillTree ? slot.skillTree.nodes : {}) };
                const mergedSkillTree = { ...baseGameState.skillTree, nodes: mergedSkillTreeNodes };
                return { ...baseGameState, ...slot, skillTree: mergedSkillTree };
            });

            if (userProfile.slots.length === 0) {
                userProfile.slots.push(getNewGameState());
            }
            gameState = userProfile.slots[userProfile.currentSlot];

            if (gameState.lastSaveTimestamp) {
                const offlineTime = Date.now() - gameState.lastSaveTimestamp;
                calculateOfflineProgress(offlineTime / 1000);
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
        addLog('Error loading game. Please try again.');
    }
};

const switchSlot = (slotIndex) => {
    if (slotIndex >= MAX_SAVE_SLOTS) {
        addLog(`You can have a maximum of ${MAX_SAVE_SLOTS} save slots.`);
        return;
    }

    if (slotIndex === userProfile.currentSlot) return;

    if (slotIndex >= userProfile.slots.length) {
        userProfile.slots.push(getNewGameState());
    }

    userProfile.currentSlot = slotIndex;
    saveGameState();
    location.reload();
};

// -----------------
// --- Game Logic ---
// -----------------
const levelUp = (skillName) => {
    const skill = gameState.skills[skillName];
    skill.level++;
    skill.xp -= skill.xpToNextLevel;
    skill.xpToNextLevel = Math.floor(skill.xpToNextLevel * 1.15);
    addLog(`Congratulations! Your ${skillName} level is now ${skill.level}!`);
    updateAllUI();
};

const gainXp = (skillName, amount) => {
    const skill = gameState.skills[skillName];
    let xpGained = skill.baseXp * amount;

    if (gameState.skillTree.nodes.xp_boost_1.purchased) xpGained *= 1.10;
    if (gameState.skillTree.nodes.xp_boost_2.purchased) xpGained *= 1.15;
    if (gameState.skillTree.nodes.xp_boost_3.purchased) xpGained *= 1.20;
    if (skillName === 'woodcutting' && gameState.skillTree.nodes.woodcutting_xp_boost_1.purchased) xpGained *= 1.10;

    skill.xp += xpGained;
    while (skill.xp >= skill.xpToNextLevel) {
        levelUp(skillName);
    }
    updateSkillsList();
};

const calculateOfflineProgress = (offlineSeconds) => {
    let maxOfflineTime = OFFLINE_PROGRESS_MAX_HOURS * 60 * 60;
    if (gameState.skillTree.nodes.offline_time_boost_1.purchased) {
        maxOfflineTime += OFFLINE_PROGRESS_SKILL_TREE_BOOST_HOURS * 60 * 60;
    }
    const actualOfflineTime = Math.min(offlineSeconds, maxOfflineTime);

    if (actualOfflineTime <= 0) return;

    const skill = gameState.skills[gameState.activeSkill];
    if (!skill || skill.gatherRate <= 0) return;

    let resourcesGained = skill.gatherRate;
    if (gameState.skillTree.nodes.resource_boost_1.purchased) resourcesGained *= 1.10;
    if (gameState.skillTree.nodes.resource_boost_2.purchased) resourcesGained *= 1.20;
    if (gameState.activeSkill === 'woodcutting' && gameState.skillTree.nodes.woodcutting_efficiency_1.purchased) resourcesGained += 1;

    resourcesGained *= actualOfflineTime;

    gameState.inventory[skill.resource] += resourcesGained;
    gainXp(gameState.activeSkill, resourcesGained);

    addLog(`Welcome back! You were offline for ${Math.floor(actualOfflineTime / 60)} minutes and earned ${Math.floor(resourcesGained)} ${skill.resource}.`);
};

const calculateAscensionPoints = () => {
    const totalLevels = Object.values(gameState.skills).reduce((sum, skill) => sum + skill.level, 0);
    return Math.floor(totalLevels / 10) * ASCENSION_POINTS_PER_TEN_LEVELS;
};

const ascend = () => {
    const pointsGained = calculateAscensionPoints();
    if (pointsGained <= 0) {
        addLog("You need to make more progress before ascending.");
        return;
    }

    addLog(`You have ascended and gained ${pointsGained} Ascension Points!`);

    const currentAscensionPoints = gameState.ascensionPoints;
    gameState = getNewGameState();
    gameState.ascensionPoints = currentAscensionPoints + pointsGained;

    saveGameState();
    updateAllUI();
};

const purchaseSkillTreeNode = (nodeId) => {
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

    if (nodeId === 'unlock_mining') {
        gameState.skills.mining.locked = false;
        gameState.skills.mining.gatherRate = 1;
        addLog('Mining skill unlocked!');
    } else if (nodeId === 'unlock_fishing') {
        gameState.skills.fishing.locked = false;
        gameState.skills.fishing.gatherRate = 1;
        addLog('Fishing skill unlocked!');
    }

    addLog(`Purchased upgrade: ${node.description}`);
    updateAllUI();
    saveGameState();
};

const gameTick = () => {
    const skill = gameState.skills[gameState.activeSkill];
    if (skill && skill.gatherRate > 0) {
        let resourcesGained = skill.gatherRate;

        if (gameState.skillTree.nodes.resource_boost_1.purchased) resourcesGained *= 1.10;
        if (gameState.skillTree.nodes.resource_boost_2.purchased) resourcesGained *= 1.20;
        if (gameState.activeSkill === 'woodcutting' && gameState.skillTree.nodes.woodcutting_efficiency_1.purchased) resourcesGained += 1;

        gameState.inventory[skill.resource] += resourcesGained;
        gainXp(gameState.activeSkill, resourcesGained);
        updateInventory();
    }

    let currentSaveInterval = SAVE_INTERVAL_SECONDS;
    if (gameState.skillTree.nodes.autosave_interval_reduction_1.purchased) {
        currentSaveInterval -= 5;
    }

    saveTicker++;
    if (saveTicker >= currentSaveInterval) {
        saveTicker = 0;
        saveGameState();
    }
};

// -----------------
// --- UI Updates ---
// -----------------
const updateSkillsList = () => {
    dom.skillsList.innerHTML = '';
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
        dom.skillsList.appendChild(skillButton);
    }
};

const updateInventory = () => {
    dom.inventoryContent.innerHTML = '';
    for (const item in gameState.inventory) {
        let amount = gameState.inventory[item];
        if (amount > 0) {
            let roundedAmount = Math.round(amount);
            if (roundedAmount % 2 !== 0) {
                roundedAmount = (amount > roundedAmount) ? roundedAmount + 1 : roundedAmount - 1;
            }
            if (roundedAmount < 0) roundedAmount = 0;

            const entry = document.createElement('div');
            entry.className = 'inventory-entry';
            entry.innerHTML = `<span>${item}:</span><span>${roundedAmount}</span>`;
            dom.inventoryContent.appendChild(entry);
        }
    }
};

const setActiveSkill = (skillName) => {
    if (!gameState.skills || Object.keys(gameState.skills).length === 0) {
        dom.actionPanelTitle.textContent = "Welcome";
        dom.actionContent.innerHTML = '<p>Select a skill from the left to begin.</p>';
        return;
    }

    gameState.activeSkill = skillName;
    const skill = gameState.skills[skillName];
    if (!skill) {
        dom.actionPanelTitle.textContent = "Welcome";
        dom.actionContent.innerHTML = '<p>Select a skill from the left to begin.</p>';
        return;
    }

    dom.actionPanelTitle.textContent = skillName.charAt(0).toUpperCase() + skillName.slice(1);
    dom.actionContent.innerHTML = `
        <p>Currently training ${skillName}.</p>
        <p>XP/sec: ${skill.gatherRate * skill.baseXp}</p>
    `;
};

const updateAscendButton = () => {
    const pointsGained = calculateAscensionPoints();
    if (pointsGained > 0) {
        dom.ascendBtn.disabled = false;
        dom.ascendBtn.textContent = `Ascend for ${pointsGained} AP`;
    } else {
        dom.ascendBtn.disabled = true;
        dom.ascendBtn.textContent = 'Ascend';
    }
};

const updateSkillTreeUI = () => {
    if (!gameState.skillTree || !gameState.skillTree.nodes) {
        dom.skillTreeContent.innerHTML = '';
        return;
    }
    dom.skillTreeContent.innerHTML = '';
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
        dom.skillTreeContent.appendChild(button);
    }
};

const updateStats = () => {
    dom.ascensionPointsDisplay.textContent = gameState.ascensionPoints;
};

const updateSlotSwitcherUI = () => {
    dom.slotList.innerHTML = '';
    dom.slotSwitcherBtn.textContent = `Save Slot ${userProfile.currentSlot + 1}`;

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
        const slotItem = document.createElement('li');
        const slotLink = document.createElement('a');
        slotLink.className = 'dropdown-item';
        slotLink.href = '#';

        if (i < userProfile.slots.length) {
            slotLink.textContent = `Slot ${i + 1}`;
            if (i === userProfile.currentSlot) {
                slotLink.classList.add('active');
            }
        } else if (userProfile.slots.length < MAX_SAVE_SLOTS) {
            slotLink.textContent = 'New Slot';
        } else {
            continue;
        }

        slotLink.onclick = () => switchSlot(i);
        slotItem.appendChild(slotLink);
        dom.slotList.appendChild(slotItem);
    }
};

const displayVersion = async () => {
    try {
        const response = await fetch('package.json');
        const data = await response.json();
        dom.versionDisplay.textContent = `v${data.version}`;
    } catch (error) {
        dom.versionDisplay.textContent = 'v?.?.?';
    }
};

const updateAllUI = () => {
    updateSkillsList();
    updateInventory();
    updateStats();
    setActiveSkill(gameState.activeSkill);
    if (gameState.skillTree && gameState.skillTree.nodes) {
        updateSkillTreeUI();
    }
    updateSlotSwitcherUI();
    updateAscendButton();
};

// -----------------
// --- Game Initialization ---
// -----------------
const startGame = async (user) => {
    userProfile.userId = user.uid;
    dom.loginModal.hide();
    document.getElementById('user-email').textContent = user.email;
    await loadGameState(user.uid);
    updateAllUI();
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameTick, 1000);
};

const resetGame = () => {
    userProfile = {
        userId: null,
        currentSlot: 0,
        slots: []
    };
    gameState = getNewGameState();
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    document.getElementById('user-email').textContent = '';
    updateAllUI();
};

document.addEventListener('DOMContentLoaded', () => {
    addLog('DOM loaded. Initializing.');

    dom.signinBtn.addEventListener('click', signInWithEmail);
    dom.signupBtn.addEventListener('click', signUpWithEmail);
    dom.googleSigninBtn.addEventListener('click', signInWithGoogle);
    dom.signoutBtn.addEventListener('click', signOut);
    dom.ascendBtn.addEventListener('click', ascend);
    dom.openPrestigeBtn.addEventListener('click', () => dom.prestigeModal.show());

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
