
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
                    <span style="color: black; text-align: center;">${Math.floor(skill.xp)} / ${skill.xpToNextLevel}</span>
                </div>
            </div>
        `;
        dom.skillsList.appendChild(skillButton);
    }
};

const updateStorage = () => {
    dom.storageContent.innerHTML = '';
    for (const item in gameState.storage) {
        const amount = gameState.storage[item].current;
        const max = gameState.storage[item].max;
        const roundedAmount = Math.floor(amount);

        const entry = document.createElement('div');
        entry.className = 'storage-entry';
        entry.innerHTML = `<span>${item}:</span><span>${roundedAmount} / ${max}</span>`;
        dom.storageContent.appendChild(entry);
    }
};

const createAreaSelector = (skillName, areas, currentArea) => {
    let areaSelector = `<div class="mb-3"><label for="${skillName}-area-select" class="form-label">Select Area:</label><select id="${skillName}-area-select" class="form-select">`;
    for (const areaId in areas) {
        const area = areas[areaId];
        if (gameState.skills[skillName].level >= area.level) {
            areaSelector += `<option value="${areaId}" ${areaId === currentArea ? 'selected' : ''}>${area.name}</option>`;
        }
    }
    areaSelector += '</select></div>';
    return areaSelector;
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

    let content = '';

    if (skillName === 'fishing') {
        content += createAreaSelector('fishing', fishingData.areas, gameState.fishing.currentArea);
        if (gameState.fishing.isFishing) {
            content += `
                <p>Currently fishing...</p>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${(gameState.fishing.fishingProgress / gameState.fishing.fishingTime) * 100}%;" aria-valuenow="${(gameState.fishing.fishingProgress / gameState.fishing.fishingTime) * 100}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <button id="stop-fishing-btn" class="btn btn-danger mt-2">Stop Fishing</button>
            `;
        } else {
            content += `
                <p>Ready to fish.</p>
                <button id="start-fishing-btn" class="btn btn-primary">Start Fishing</button>
            `;
        }
        const area = fishingData.areas[gameState.fishing.currentArea];
        content += '<ul class="list-group mt-3">';
        for (const fishName in area.fish) {
            const fish = fishingData.fish[fishName];
            content += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${fish.name}
                <span class="badge bg-primary rounded-pill">${area.fish[fishName].chance * 100}%</span>
            </li>`;
        }
        content += '</ul>';
    } else if (skillName === 'mining') {
        content += createAreaSelector('mining', miningData.zones, gameState.mining.currentZone);
        if (gameState.mining.isMining) {
            content += `
                <p>Currently mining...</p>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${(gameState.mining.miningProgress / gameState.mining.miningTime) * 100}%;" aria-valuenow="${(gameState.mining.miningProgress / gameState.mining.miningTime) * 100}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <button id="stop-mining-btn" class="btn btn-danger mt-2">Stop Mining</button>
            `;
        } else {
            content += `
                <p>Ready to mine.</p>
                <button id="start-mining-btn" class="btn btn-primary">Start Mining</button>
            `;
        }
        const zone = miningData.zones[gameState.mining.currentZone];
        content += '<ul class="list-group mt-3">';
        for (const oreName in zone.ores) {
            const ore = miningData.ores[oreName];
            content += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${ore.name}
                <span class="badge bg-primary rounded-pill">${zone.ores[oreName].chance * 100}%</span>
            </li>`;
        }
        content += '</ul>';
    } else if (skillName === 'woodcutting') {
        content += createAreaSelector('woodcutting', woodcuttingData.areas, gameState.woodcutting.currentArea);
        if (gameState.woodcutting.isChopping) {
            content += `
                <p>Currently chopping...</p>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-info" role="progressbar" style="width: ${(gameState.woodcutting.choppingProgress / gameState.woodcutting.choppingTime) * 100}%;" aria-valuenow="${(gameState.woodcutting.choppingProgress / gameState.woodcutting.choppingTime) * 100}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <button id="stop-woodcutting-btn" class="btn btn-danger mt-2">Stop Chopping</button>
            `;
        } else {
            content += `
                <p>Ready to chop.</p>
                <button id="start-woodcutting-btn" class="btn btn-primary">Start Chopping</button>
            `;
        }
        const area = woodcuttingData.areas[gameState.woodcutting.currentArea];
        content += '<ul class="list-group mt-3">';
        for (const treeName in area.trees) {
            const tree = woodcuttingData.trees[treeName];
            content += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${tree.name}
                <span class="badge bg-primary rounded-pill">${area.trees[treeName].chance * 100}%</span>
            </li>`;
        }
        content += '</ul>';
    } else {
        content = `
            <p>Currently training ${skillName}.</p>
            <p>XP/sec: ${skill.gatherRate * skill.baseXp}</p>
        `;
    }

    dom.actionContent.innerHTML = content;
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
        { type: 'skill_unlock', title: 'Skill Unlocks' },
        { type: 'log_capacity', title: 'Log Capacity' },
        { type: 'storage_size', title: 'Storage Size' },
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
                <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#${categoryId}" aria-expanded="false" aria-controls="${categoryId}">
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
                } else if ((!node.requires || (requiredNode && requiredNode.purchased)) && gameState.ascensionPoints >= node.cost) {
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
    if(dom.autosaveIntervalInput) {
        dom.autosaveIntervalInput.value = gameState.autosaveInterval;
    }
};
