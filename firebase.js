
// -----------------
// --- Firebase ---
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
