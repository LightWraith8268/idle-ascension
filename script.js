document.addEventListener('DOMContentLoaded', () => {
    // Moved to top to be available globally inside this listener
    function addLog(message) {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        if(document.getElementById('log-messages')) {
            document.getElementById('log-messages').prepend(logEntry);
        }
    }

    addLog('DOM content loaded. Initializing script.');

    // --- GAME STATE --- //
    let gameState = { /* ... */ };
    // ... rest of the script, with the original addLog function removed from its old position
});