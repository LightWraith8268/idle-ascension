document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE --- //
    const gameState = {
        skills: {
            woodcutting: {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                resource: 'Logs',
                gatherRate: 1 // logs per second
            },
            mining: {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                resource: 'Ore',
                gatherRate: 0
            },
            fishing: {
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                resource: 'Fish',
                gatherRate: 0
            }
        },
        inventory: {
            Logs: 0,
            Ore: 0,
            Fish: 0
        },
        activeSkill: 'woodcutting' // Start with woodcutting active
    };

    // --- DOM ELEMENTS --- //
    const skillsList = document.getElementById('skills-list');
    const actionPanelTitle = document.getElementById('action-panel-title');
    const actionContent = document.getElementById('action-content');
    const logMessages = document.getElementById('log-messages');
    const statsContent = document.getElementById('stats-content');
    const inventoryContent = document.getElementById('inventory-content');

    // --- GAME LOOP --- //
    function gameTick() {
        // This function runs every second
        const skill = gameState.skills[gameState.activeSkill];
        if (skill && skill.gatherRate > 0) {
            const resourcesGained = skill.gatherRate;
            gameState.inventory[skill.resource] += resourcesGained;
            addLog(`Gained ${resourcesGained} ${skill.resource}.`);
            updateInventory();
        }
    }

    // --- UI UPDATE FUNCTIONS --- //
    function addLog(message) {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logMessages.prepend(logEntry);
        // Keep log from getting too long
        if (logMessages.children.length > 20) {
            logMessages.removeChild(logMessages.lastChild);
        }
    }

    function updateSkillsList() {
        skillsList.innerHTML = '';
        for (const skillName in gameState.skills) {
            const skill = gameState.skills[skillName];
            const skillButton = document.createElement('div');
            skillButton.className = 'skill-button';
            skillButton.textContent = `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} - Lvl ${skill.level}`;
            skillButton.onclick = () => setActiveSkill(skillName);
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
        actionPanelTitle.textContent = skillName.charAt(0).toUpperCase() + skillName.slice(1);
        // Future: Add content to the action panel based on the selected skill
        actionContent.innerHTML = `<p>Currently training ${skillName}.</p>`;
        addLog(`Switched to training ${skillName}.`);
    }

    // --- INITIALIZATION --- //
    function init() {
        addLog('Welcome to Idle Ascension!');
        updateSkillsList();
        updateInventory();
        setActiveSkill(gameState.activeSkill);
        setInterval(gameTick, 1000); // Run the game loop every second
    }

    init();
});