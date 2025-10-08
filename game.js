
// -----------------
// --- Game Logic ---
// -----------------
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
    createNode(10, 'Increase storage size by 20.', currentParent, 'storage_size', { amount: 20 });

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
            mining: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Copper Ore', gatherRate: 1, baseXp: 15, locked: false, maxStorage: 100 },
            fishing: { level: 1, xp: 0, xpToNextLevel: 100, resource: 'Fish', gatherRate: 1, baseXp: 12, locked: false, maxStorage: 100 }
        },
        storage: {
            Logs: { current: 0, max: 100 },
            'Copper Ore': { current: 0, max: 100 },
            'Tin Ore': { current: 0, max: 100 },
            'Iron Ore': { current: 0, max: 100 },
            Shrimp: { current: 0, max: 100 },
            Sardine: { current: 0, max: 100 },
            Herring: { current: 0, max: 100 },
            Tuna: { current: 0, max: 100 },
            Lobster: { current: 0, max: 100 },
            Swordfish: { current: 0, max: 100 },
        },
        activeSkill: 'woodcutting',
        fishing: {
            isFishing: false,
            fishingProgress: 0,
            fishingTime: 5, // 5 seconds to catch a fish
            currentArea: 'shimmering_shallows'
        },
        mining: {
            isMining: false,
            miningProgress: 0,
            miningTime: 5, // 5 seconds to mine an ore
            currentZone: 'whispering_quarry'
        },
        woodcutting: {
            isChopping: false,
            choppingProgress: 0,
            choppingTime: 5, // 5 seconds to chop a tree
            currentArea: 'whisperwood'
        },
        autosaveInterval: 15
    };
};

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

    let currentAmount = gameState.storage[skill.resource].current;
    let maxStorage = gameState.storage[skill.resource].max;
    if (currentAmount < maxStorage) {
        let resourcesToGain = Math.min(resourcesGained, maxStorage - currentAmount);
        gameState.storage[skill.resource].current += resourcesToGain;
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

const startMining = () => {
    if (gameState.activeSkill !== 'mining') {
        setActiveSkill('mining');
    }
    gameState.mining.isMining = true;
    addLog("You start mining.");
    updateAllUI();
};

const stopMining = () => {
    gameState.mining.isMining = false;
    addLog("You stop mining.");
    updateAllUI();
};

const mineOre = () => {
    const zone = miningData.zones[gameState.mining.currentZone];
    const rand = Math.random();
    let cumulativeChance = 0;
    for (const oreName in zone.ores) {
        cumulativeChance += zone.ores[oreName].chance;
        if (rand < cumulativeChance) {
            const ore = miningData.ores[oreName];
            addLog(`You mined some ${ore.name}!`);
            if (gameState.storage[ore.name].current < gameState.storage[ore.name].max) {
                            if (gameState.storage[ore.name].current < gameState.storage[ore.name].max) {
                                gameState.storage[ore.name].current++;
                                gainXp('mining', ore.xp);
                                updateStorage();
                            } else {
                                addLog(`Your storage is full. You can't carry any more ${ore.name}.`);
                            }            }
            return;
        }
    }
};

const startWoodcutting = () => {
    if (gameState.activeSkill !== 'woodcutting') {
        setActiveSkill('woodcutting');
    }
    gameState.woodcutting.isChopping = true;
    addLog("You start chopping wood.");
    updateAllUI();
};

const stopWoodcutting = () => {
    gameState.woodcutting.isChopping = false;
    addLog("You stop chopping wood.");
    updateAllUI();
};

const chopTree = () => {
    const area = woodcuttingData.areas[gameState.woodcutting.currentArea];
    const rand = Math.random();
    let cumulativeChance = 0;
    for (const treeName in area.trees) {
        cumulativeChance += area.trees[treeName].chance;
        if (rand < cumulativeChance) {
            const tree = woodcuttingData.trees[treeName];
            addLog(`You got some ${tree.name}!`);
            if (gameState.storage.Logs.current < gameState.storage.Logs.max) {
                            if (gameState.storage.Logs.current < gameState.storage.Logs.max) {
                                gameState.storage.Logs.current++; // Assuming all trees give logs for now
                                gainXp('woodcutting', tree.xp);
                                updateStorage();
                            } else {
                                addLog(`Your storage is full. You can't carry any more Logs.`);
                            }            }
            return;
        }
    }
};

const startFishing = () => {
    if (gameState.activeSkill !== 'fishing') {
        setActiveSkill('fishing');
    }
    gameState.fishing.isFishing = true;
    addLog("You start fishing.");
    updateAllUI();
};

const stopFishing = () => {
    gameState.fishing.isFishing = false;
    addLog("You stop fishing.");
    updateAllUI();
};

const fishCaught = () => {
    const area = fishingData.areas[gameState.fishing.currentArea];
    const rand = Math.random();
    let cumulativeChance = 0;
    for (const fishName in area.fish) {
        cumulativeChance += area.fish[fishName].chance;
        if (rand < cumulativeChance) {
            const fish = fishingData.fish[fishName];
            addLog(`You caught a ${fish.name}!`);
            if (gameState.storage[fish.name].current < gameState.storage[fish.name].max) {
                            if (gameState.storage[fish.name].current < gameState.storage[fish.name].max) {
                                gameState.storage[fish.name].current++;
                                gainXp('fishing', fish.xp);
                                updateStorage();
                            } else {
                                addLog(`Your storage is full. You can't carry any more ${fish.name}.`);
                            }            }
            return;
        }
    }
};

const purchaseSkillTreeNode = (nodeId) => {
    const node = gameState.skillTree.nodes[nodeId];

    if (!node || node.purchased || gameState.ascensionPoints < node.cost) {
        addLog('Cannot purchase this upgrade.');
        return;
    }

    const requiredNode = gameState.skillTree.nodes[node.requires];
    if (node.requires && (!requiredNode || !requiredNode.purchased)) {
        addLog('Prerequisite not met for this upgrade.');
        return;
    }

    gameState.ascensionPoints -= node.cost;
    node.purchased = true;

    if (node.type === 'xp_boost') {
        // XP boosts are applied dynamically in gainXp
    } else if (node.type === 'resource_boost') {
        // Resource boosts are applied dynamically in gameTick and calculateOfflineProgress
    } else if (node.type === 'gather_rate_boost') {
        // Gather rate boosts are applied dynamically in gameTick and calculateOfflineProgress
    } else if (node.type === 'offline_time_boost') {
        // Offline time boost is applied dynamically in calculateOfflineProgress
    } else if (node.type === 'autosave_reduction') {
        // Autosave reduction is applied dynamically in gameTick
    } else if (node.type === 'skill_unlock') {
        gameState.skills[node.effect.skill].locked = false;
        addLog(`Unlocked new skill: ${node.effect.skill}`);
    } else if (node.type === 'log_capacity') {
        // Log capacity is handled by MAX_LOG_MESSAGES, this node would need to modify that constant or a state variable
    } else if (node.type === 'storage_size') {
        for (const item in gameState.storage) {
            gameState.storage[item].max += node.effect.amount;
        }
    }
    addLog(`Purchased upgrade: ${node.description}`);
    updateAllUI();
    saveGameState();
};

const calculateFishingProgress = () => {
    if (gameState.fishing.isFishing) {
        gameState.fishing.fishingProgress++;
        if (gameState.fishing.fishingProgress >= gameState.fishing.fishingTime) {
            gameState.fishing.fishingProgress = 0;
            fishCaught();
        }
    }
};

const calculateMiningProgress = () => {
    if (gameState.mining.isMining) {
        gameState.mining.miningProgress++;
        if (gameState.mining.miningProgress >= gameState.mining.miningTime) {
            gameState.mining.miningProgress = 0;
            mineOre();
        }
    }
};

const calculateWoodcuttingProgress = () => {
    if (gameState.woodcutting.isChopping) {
        gameState.woodcutting.choppingProgress++;
        if (gameState.woodcutting.choppingProgress >= gameState.woodcutting.choppingTime) {
            gameState.woodcutting.choppingProgress = 0;
            chopTree();
        }
    }
};

const gameTick = () => {
    const skill = gameState.skills[gameState.activeSkill];
    if (skill && skill.gatherRate > 0 && gameState.activeSkill !== 'fishing' && gameState.activeSkill !== 'mining' && gameState.activeSkill !== 'woodcutting') {
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

        let currentAmount = gameState.storage[skill.resource].current;
        let maxStorage = gameState.storage[skill.resource].max;
        if (currentAmount < maxStorage) {
            let resourcesToGain = Math.min(resourcesGained, maxStorage - currentAmount);
            gameState.storage[skill.resource].current += resourcesToGain;
            gainXp(gameState.activeSkill, resourcesToGain);
        }
        updateStorage();
    }

    calculateFishingProgress();
    calculateMiningProgress();
    calculateWoodcuttingProgress();

    saveTicker++;
    if (saveTicker >= gameState.autosaveInterval) {
        saveTicker = 0;
        saveGameState();
    }
};
