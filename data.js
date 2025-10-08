

const fishingData = {
    fish: {
        shrimp: { name: 'Shrimp', xp: 10, level: 1 },
        sardine: { name: 'Sardine', xp: 20, level: 5 },
        herring: { name: 'Herring', xp: 30, level: 10 },
        tuna: { name: 'Tuna', xp: 80, level: 35 },
        lobster: { name: 'Lobster', xp: 90, level: 40 },
        swordfish: { name: 'Swordfish', xp: 100, level: 50 },
    },
    areas: {
        tutorial_island: {
            name: 'Tutorial Island',
            level: 1,
            fish: {
                shrimp: { chance: 1 },
            }
        },
        karamja: {
            name: 'Karamja',
            level: 20,
            fish: {
                sardine: { chance: 0.5 },
                herring: { chance: 0.3 },
                tuna: { chance: 0.15 },
                lobster: { chance: 0.05 },
            }
        },
        catherby: {
            name: 'Catherby',
            level: 40,
            fish: {
                tuna: { chance: 0.4 },
                lobster: { chance: 0.3 },
                swordfish: { chance: 0.3 },
            }
        }
    }
};

const miningData = {
    ores: {
        copper: { name: 'Copper Ore', xp: 17.5, level: 1 },
        tin: { name: 'Tin Ore', xp: 17.5, level: 1 },
        iron: { name: 'Iron Ore', xp: 35, level: 15 },
    },
    zones: {
        lumbridge_swamp: {
            name: 'Lumbridge Swamp',
            level: 1,
            ores: {
                copper: { chance: 0.5 },
                tin: { chance: 0.5 },
            }
        },
        varrock_east: {
            name: 'Varrock East',
            level: 10,
            ores: {
                copper: { chance: 0.2 },
                tin: { chance: 0.2 },
                iron: { chance: 0.6 },
            }
        }
    }
};

const woodcuttingData = {
    trees: {
        normal: { name: 'Normal Tree', xp: 25, level: 1 },
        oak: { name: 'Oak Tree', xp: 37.5, level: 15 },
        willow: { name: 'Willow Tree', xp: 67.5, level: 30 },
    },
    areas: {
        lumbridge: {
            name: 'Lumbridge',
            level: 1,
            trees: {
                normal: { chance: 1 },
            }
        },
        draynor_village: {
            name: 'Draynor Village',
            level: 10,
            trees: {
                normal: { chance: 0.5 },
                oak: { chance: 0.5 },
            }
        },
        seers_village: {
            name: 'Seers\' Village',
            level: 25,
            trees: {
                oak: { chance: 0.5 },
                willow: { chance: 0.5 },
            }
        }
    }
};

