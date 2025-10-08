# Project Overview

This project is an idle incremental game called "Idle Ascension," inspired by RuneScape. It features client-side game logic implemented in JavaScript, a user interface built with HTML and Bootstrap, and cloud saving functionality powered by Firebase (Authentication and Firestore).

## Building and Running

This is a client-side web application and does not require a separate build process. To run the game:

1.  Ensure you have a `firebase-config.js` file in the root directory with your Firebase project's configuration.
2.  Open `index.html` in a web browser.

The game will load in your browser, and you will be prompted to sign in or sign up using Firebase authentication.

## Development Conventions

*   **Language:** JavaScript (ES6+), HTML, CSS.
*   **Styling:** Bootstrap 5.3.3 is used for responsive design and UI components, supplemented by custom styles in `styles.css`.
*   **State Management:** Game state is managed in a global `gameState` object within `script.js` and persisted to Firebase Firestore.
*   **Authentication:** Firebase Authentication is used for user sign-in (email/password and Google) and sign-out.
*   **Cloud Saving:** Game progress is saved to and loaded from Firebase Firestore, supporting multiple save slots per user.
*   **Version Control:** Git is used for version control. Commits should be descriptive, and version numbers in `package.json` are incremented for features (minor) and bug fixes (patch).
