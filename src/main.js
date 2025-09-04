import { MorseCodeDecoderApp } from './App.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new MorseCodeDecoderApp();
        
        window.morseApp = app;
        
        console.log('Morse Code Decoder initialized successfully');
        console.log('Debug info:', app.getDebugInfo());
        console.log('Use window.morseApp to access the application from the console');
        
    } catch (error) {
        console.error('Failed to initialize Morse Code Decoder:', error);
        
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = `Initialization error: ${error.message}`;
            statusElement.className = 'current-status status-denied';
        }
    }
});

window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = `Application error: ${event.error?.message || 'Unknown error'}`;
        statusElement.className = 'current-status status-denied';
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = `Promise error: ${event.reason?.message || 'Unknown error'}`;
        statusElement.className = 'current-status status-denied';
    }
});