
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
    logMessages: null,
    authError: null,
    signinEmail: null,
    signinPassword: null,
    signinBtn: null,
    signupEmail: null,
    signupPassword: null,
    signupBtn: null,
    googleSigninBtn: null,
    signoutBtn: null,
    ascendBtn: null,
    skillsList: null,
    storageContent: null,
    actionPanelTitle: null,
    actionContent: null,
    ascensionPointsDisplay: null,
    skillTreeContent: null,
    slotList: null,
    slotSwitcherBtn: null,
    openPrestigeBtn: null,
    resetGameBtn: null,
    loginModal: null,
    prestigeModal: null
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

const getNewGameState = () => {
    const nodes = {};
    let nodeIdCounter = 0;

    const createNode = (cost, description, requires = null, type = 'generic', effect = {}) => {
        const id = `node_${nodeIdCounter++}`;
        nodes[id] = { purchased: false, cost, description, requires, type, effect };
        return id;
    };

    const createXpBoostNode = (baseCost, requires, skill = 'all', multiplier = 0.01) => {
        const description = skill === 'all' ? `+${multiplier * 100}% XP from all sources.` : `+${multiplier * 100}% XP for ${skill}.`;
        return createNode(baseCost, description, requires, 'xp_boost', { skill, multiplier });
    };

    const createResourceBoostNode = (baseCost, requires, skill = 'all', multiplier = 0.01) => {
        const description = skill === 'all' ? `+${multiplier * 100}% resources from all sources.` : `+${multiplier * 100}% resources for ${skill}.`;
        return createNode(baseCost, description, requires, 'resource_boost', { skill, multiplier });
    };

    const createGatherRateNode = (baseCost, requires, skill, amount = 0.1) => {
        const description = `+${amount} gather rate for ${skill}.`;
        return createNode(baseCost, description, requires, 'gather_rate_boost', { skill, amount });
    };

    const createOfflineTimeNode = (baseCost, requires, hours = 1) => {
        const description = `Increase max offline time by ${hours} hour(s).`;
        return createNode(baseCost, description, requires, 'offline_time_boost', { hours });
    };

    const createAutosaveNode = (baseCost, requires, seconds = 1) => {
        const description = `Reduce auto-save interval by ${seconds} second(s).`;
        return createNode(baseCost, description, requires, 'autosave_reduction', { seconds });
    };

    const createSkillUnlockNode = (skillName, baseCost, requires) => {
        const description = `Unlock the ${skillName} skill.`;
        return createNode(baseCost, description, requires, 'skill_unlock', { skill: skillName });
    };

    // --- Prestige Layer 1 (Root) ---
    const root = createNode(0, 'The journey begins.');

    // Branch 1: General XP/Resource
    let currentParent = root;
    for (let i = 0; i < 5; i++) {
        currentParent = createXpBoostNode(1 + i, currentParent, 'all', 0.02 + i * 0.01);
        createResourceBoostNode(1 + i, currentParent, 'all', 0.02 + i * 0.01);
    }

    // Branch 2: Utility
    currentParent = root;
    currentParent = createOfflineTimeNode(2, currentParent, 1);
    createAutosaveNode(2, currentParent, 1);
    createNode(3, 'Increase log capacity by 10.', currentParent, 'log_capacity', { amount: 10 });

    // Branch 3: Skill Unlocks & Initial Skill Boosts
    currentParent = root;


    createGatherRateNode(2, root, 'woodcutting', 0.2);
    createXpBoostNode(2, root, 'woodcutting', 0.05);

    // --- Prestige Layer 2 (Requires significant AP from Layer 1) ---
    const layer2Root = createNode(20, 'Unlock advanced prestige options.', currentParent); // Link to a node in Layer 1

    // Branch 1: Advanced XP/Resource
    currentParent = layer2Root;
    for (let i = 0; i < 7; i++) {
        currentParent = createXpBoostNode(5 + i * 2, currentParent, 'all', 0.03 + i * 0.015);
        createResourceBoostNode(5 + i * 2, currentParent, 'all', 0.03 + i * 0.015);
    }

    // Branch 2: Advanced Utility
    currentParent = layer2Root;
    createOfflineTimeNode(7, currentParent, 2);
    createAutosaveNode(7, currentParent, 2);
    createNode(10, 'Increase inventory size by 20.', currentParent, 'inventory_size', { amount: 20 });

    // Branch 3: Skill Specialization
    currentParent = layer2Root;
    const miningSpecialization = createNode(8, 'Mining Specialization', currentParent);
    createGatherRateNode(5, miningSpecialization, 'mining', 0.5);
    createXpBoostNode(5, miningSpecialization, 'mining', 0.1);

    const fishingSpecialization = createNode(8, 'Fishing Specialization', currentParent);
    createGatherRateNode(5, fishingSpecialization, 'fishing', 0.5);
    createXpBoostNode(5, fishingSpecialization, 'fishing', 0.1);

    // --- Prestige Layer 3 (Requires significant AP from Layer 2) ---
    const layer3Root = createNode(50, 'Unlock master prestige options.', layer2Root); // Link to a node in Layer 2

    // Branch 1: Master XP/Resource
    currentParent = layer3Root;
    for (let i = 0; i < 10; i++) {
        currentParent = createXpBoostNode(15 + i * 3, currentParent, 'all', 0.05 + i * 0.02);
        createResourceBoostNode(15 + i * 3, currentParent, 'all', 0.05 + i * 0.02);
    }

    // Branch 2: Master Utility
    currentParent = layer3Root;
    createOfflineTimeNode(20, currentParent, 5);
    createAutosaveNode(20, currentParent, 5);
    createNode(25, 'Unlock auto-ascension (manual trigger).', currentParent, 'auto_ascension_unlock');

    // Branch 3: Ultimate Skill Boosts
    currentParent = layer3Root;
    createGatherRateNode(15, currentParent, 'woodcutting', 1);
    createXpBoostNode(15, currentParent, 'woodcutting', 0.2);
    createGatherRateNode(15, currentParent, 'mining', 1);
    createXpBoostNode(15, currentParent, 'mining', 0.2);
    createGatherRateNode(15, currentParent, 'fishing', 1);
    createXpBoostNode(15, currentParent, 'fishing', 0.2);

    // --- Placeholder for more nodes to reach 500-750 --- 
    // This is a representative sample. To reach 500-750 nodes, 
    // more layers and more nodes per branch would be needed, 
    // potentially with more complex branching logic and node types.
    // For example, each skill could have its own deep branch of 20-30 nodes.

    return {
        ascensionPoints: 0,
        lastSaveTimestamp: null,
        skillTree: {
            nodes: nodes
        },
        skills: {
            woodcutting: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Logs', gatherRate: 1, baseXp: 10, maxStorage: 100 },
            mining: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Ore', gatherRate: 1, baseXp: 15, locked: false, maxStorage: 100 },
            fishing: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Fish', gatherRate: 1, baseXp: 12, locked: false, maxStorage: 100 }
        },
        inventory: { 
            Logs: { current: 0, max: 100 }, 
            Ore: { current: 0, max: 100 }, 
            Fish: { current: 0, max: 100 } 
        },
        activeSkill: 'woodcutting'
    };
};

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
                // Start with all base skill tree nodes
                const newSkillTreeNodes = { ...baseGameState.skillTree.nodes };

                // Merge purchased status from loaded slot onto the new skill tree nodes
                if (slot.skillTree && slot.skillTree.nodes) {
                    for (const nodeId in slot.skillTree.nodes) {
                        if (newSkillTreeNodes[nodeId]) {
                            newSkillTreeNodes[nodeId].purchased = slot.skillTree.nodes[nodeId].purchased;
                        }
                    }
                }
                const mergedSkillTree = { ...baseGameState.skillTree, nodes: newSkillTreeNodes };
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

    let allXpMultiplier = 1;
    let skillXpMultiplier = 1;

    for (const nodeId in gameState.skillTree.nodes) {
        const node = gameState.skillTree.nodes[nodeId];
        if (node.purchased && node.type === 'xp_boost') {
            if (node.effect.skill === 'all') {
                allXpMultiplier += node.effect.multiplier;
            } else if (node.effect.skill === skillName) {
                skillXpMultiplier += node.effect.multiplier;
            }
        }
    }

    xpGained *= allXpMultiplier;
    xpGained *= skillXpMultiplier;

    skill.xp += xpGained;
    while (skill.xp >= skill.xpToNextLevel) {
        levelUp(skillName);
    }
    updateSkillsList();
};

const calculateOfflineProgress = (offlineSeconds) => {
    let maxOfflineTime = OFFLINE_PROGRESS_MAX_HOURS * 60 * 60;
    let allResourceMultiplier = 1;
    let skillResourceMultiplier = 1;

    for (const nodeId in gameState.skillTree.nodes) {
        const node = gameState.skillTree.nodes[nodeId];
        if (node.purchased) {
            if (node.type === 'offline_time_boost') {
                maxOfflineTime += node.effect.hours * 60 * 60;
            }
            if (node.type === 'resource_boost') {
                if (node.effect.skill === 'all') {
                    allResourceMultiplier += node.effect.multiplier;
                } else if (node.effect.skill === gameState.activeSkill) {
                    skillResourceMultiplier += node.effect.multiplier;
                }
            }
        }
    }

    const actualOfflineTime = Math.min(offlineSeconds, maxOfflineTime);

    if (actualOfflineTime <= 0) return;

    const skill = gameState.skills[gameState.activeSkill];
    if (!skill || skill.gatherRate <= 0) return;

    let resourcesGained = skill.gatherRate;
    resourcesGained *= allResourceMultiplier;
    resourcesGained *= skillResourceMultiplier;

    // Apply gather rate boosts from skill tree
    for (const nodeId in gameState.skillTree.nodes) {
        const node = gameState.skillTree.nodes[nodeId];
        if (node.purchased && node.type === 'gather_rate_boost' && node.effect.skill === gameState.activeSkill) {
            resourcesGained += node.effect.amount;
        }
    }

    resourcesGained *= actualOfflineTime;

    let currentAmount = gameState.inventory[skill.resource].current;
    let maxStorage = gameState.inventory[skill.resource].max;
    if (currentAmount < maxStorage) {
        let resourcesToGain = Math.min(resourcesGained, maxStorage - currentAmount);
        gameState.inventory[skill.resource].current += resourcesToGain;
        gainXp(gameState.activeSkill, resourcesToGain);
    }

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

    if (node.type === 'skill_unlock') {
        const skillToUnlock = node.effect.skill;
        if (gameState.skills[skillToUnlock]) {
            gameState.skills[skillToUnlock].locked = false;
            gameState.skills[skillToUnlock].gatherRate = 1; // Default gather rate for newly unlocked skills
            addLog(`${skillToUnlock.charAt(0).toUpperCase() + skillToUnlock.slice(1)} skill unlocked!`);
        }
    } else if (node.type === 'inventory_size') {
        for (const item in gameState.inventory) {
            gameState.inventory[item].max += node.effect.amount;
        }
    }
    addLog(`Purchased upgrade: ${node.description}`);
    updateAllUI();
    saveGameState();
};

const gameTick = () => {
    const skill = gameState.skills[gameState.activeSkill];
    if (skill && skill.gatherRate > 0) {
        let resourcesGained = skill.gatherRate;

        let allResourceMultiplier = 1;
        let skillResourceMultiplier = 1;

        for (const nodeId in gameState.skillTree.nodes) {
            const node = gameState.skillTree.nodes[nodeId];
            if (node.purchased && node.type === 'resource_boost') {
                if (node.effect.skill === 'all') {
                    allResourceMultiplier += node.effect.multiplier;
                } else if (node.effect.skill === gameState.activeSkill) {
                    skillResourceMultiplier += node.effect.multiplier;
                }
            }
        }
        resourcesGained *= allResourceMultiplier;
        resourcesGained *= skillResourceMultiplier;

        // Apply gather rate boosts from skill tree
        for (const nodeId in gameState.skillTree.nodes) {
            const node = gameState.skillTree.nodes[nodeId];
            if (node.purchased && node.type === 'gather_rate_boost' && node.effect.skill === gameState.activeSkill) {
                resourcesGained += node.effect.amount;
            }
        }

        let currentAmount = gameState.inventory[skill.resource].current;
        let maxStorage = gameState.inventory[skill.resource].max;
        if (currentAmount < maxStorage) {
            let resourcesToGain = Math.min(resourcesGained, maxStorage - currentAmount);
            gameState.inventory[skill.resource].current += resourcesToGain;
            gainXp(gameState.activeSkill, resourcesToGain);
        }
        updateStorage();
    }

    let currentSaveInterval = SAVE_INTERVAL_SECONDS;
    for (const nodeId in gameState.skillTree.nodes) {
        const node = gameState.skillTree.nodes[nodeId];
        if (node.purchased && node.type === 'autosave_reduction') {
            currentSaveInterval -= node.effect.seconds;
        }
    }
    currentSaveInterval = Math.max(1, currentSaveInterval); // Ensure interval doesn't go below 1 second

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
        if (skillName === gameState.activeSkill) {
            skillButton.classList.add('active-skill');
        }
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

const updateStorage = () => {
    dom.storageContent.innerHTML = '';
    for (const item in gameState.inventory) {
        let amount = gameState.inventory[item].current;
        if (amount > 0) {
            let roundedAmount = Math.round(amount);
            if (roundedAmount % 2 !== 0) {
                roundedAmount = (amount > roundedAmount) ? roundedAmount + 1 : roundedAmount - 1;
            }
            if (roundedAmount < 0) roundedAmount = 0;

            const entry = document.createElement('div');
            entry.className = 'inventory-entry';
            entry.innerHTML = `<span>${item}:</span><span>${roundedAmount} / ${gameState.inventory[item].max}</span>`;
            dom.storageContent.appendChild(entry);
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

    updateSkillsList();

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

    const categorizedNodes = {};
    for (const nodeId in gameState.skillTree.nodes) {
        const node = gameState.skillTree.nodes[nodeId];
        if (!categorizedNodes[node.type]) {
            categorizedNodes[node.type] = [];
        }
        categorizedNodes[node.type].push(node);
    }

    // Define display order and titles for categories
    const categoryOrder = [
        { type: 'xp_boost', title: 'Experience Boosts' },
        { type: 'resource_boost', title: 'Resource Gains' },
        { type: 'gather_rate_boost', title: 'Gather Rate Boosts' },
        { type: 'offline_time_boost', title: 'Offline Progress' },
        { type: 'autosave_reduction', title: 'Autosave Improvements' },
        { type: 'skill_unlock', title: 'Skill Unlocks' },
        { type: 'log_capacity', title: 'Log Capacity' },
        { type: 'inventory_size', title: 'Inventory Size' },
        { type: 'auto_ascension_unlock', title: 'Auto Ascension' },
        { type: 'generic', title: 'General Upgrades' }
    ];

    categoryOrder.forEach(categoryInfo => {
        const nodesInType = categorizedNodes[categoryInfo.type];
        if (nodesInType && nodesInType.length > 0) {
            const categoryId = `category-collapse-${categoryInfo.type}`;
            const categoryContainer = document.createElement('div');
            categoryContainer.className = `skill-tree-category ${categoryInfo.type}-category mb-4 p-3 border rounded`;

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'd-flex justify-content-between align-items-center';
            categoryHeader.innerHTML = `<h5 class="text-white mb-0">${categoryInfo.title}</h5>
                <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#${categoryId}" aria-expanded="true" aria-controls="${categoryId}">
                    <i class="fas fa-chevron-down"></i>
                </button>`;
            categoryContainer.appendChild(categoryHeader);

            const collapseContainer = document.createElement('div');
            collapseContainer.id = categoryId;
            collapseContainer.className = 'collapse';
            categoryContainer.appendChild(collapseContainer);

            // Sort nodes within category for consistent display (e.g., by cost or requires)
            nodesInType.sort((a, b) => a.cost - b.cost);

            nodesInType.forEach(node => {
                const requiredNode = gameState.skillTree.nodes[node.requires];

                const button = document.createElement('button');
                button.className = `btn m-2 skill-node-btn ${node.type}-node`;
                button.innerHTML = `${node.description}<br><small>Cost: ${node.cost} AP</small>`;
                const nodeId = Object.keys(gameState.skillTree.nodes).find(id => gameState.skillTree.nodes[id] === node);
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
                collapseContainer.appendChild(button);
            });
            dom.skillTreeContent.appendChild(categoryContainer);
        }
    });
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
        document.getElementById('version-display-menu').textContent = `v${data.version}`;
    } catch (error) {
        dom.versionDisplay.textContent = 'v?.?.?';
        document.getElementById('version-display-menu').textContent = 'v?.?.?';
    }
};

const updateAllUI = () => {
    updateSkillsList();
    updateStorage();
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

const resetGame = async () => {
    if (!confirm("Are you sure you want to reset your game? All progress will be lost.")) return;

    if (userProfile.userId) {
        try {
            await db.collection('users').doc(userProfile.userId).delete();
            addLog("Game data reset on the server.");
        } catch (error) {
            addLog("Error resetting game data on the server.");
        }
    }

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
    location.reload();
};

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
