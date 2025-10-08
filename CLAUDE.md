# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-Level Architecture

This project is a client-side JavaScript idle game with a RuneScape-inspired theme. It consists of:

- `index.html`: The main HTML file that structures the game's interface.
- `styles.css`: Contains the styling for the game.
- `script.js`: Implements the core game logic, including mechanics, UI interactions, and potentially game state management and saving.
- `firebase-config.js`: Appears to handle Firebase configuration, suggesting cloud saving capabilities.

### Core Mechanics
- Ascension mechanic
- Prestige system (RuneScape-themed)
- Offline progress
- Multiple save slots per user
- Ability to switch between save slots
- Cloud save

### Content
- Skills (Gathering, Artisan, Combat)
- Skill tree
- Combat system with monsters and loot
- Slayer skill
- Boss battles
- Questing system
- Treasure Trails
- Minigames
- Skilling pets
- Achievements
- Storyline
- Player-owned houses

### PWA & Technical
- PWA-specific features (Add to home screen, Push notifications, Service worker for offline play)

### Multiplayer
- Grand Exchange (player-driven marketplace)
- Clans

## Common Commands

This is a client-side web project without a build step or explicit test/linting scripts in `package.json`. Development typically involves:

- **Running the game**: Open `index.html` in a web browser.
- **Editing code**: Modify `script.js` for game logic, `styles.css` for styling, and `index.html` for structure.
- **Version Control**: Use Git for version control, as indicated by the `.git` directory.