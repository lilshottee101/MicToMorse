import { $id, $$, on, addClass, removeClass, toggleClass, setText, copyToClipboard } from '@utils/dom.js';

export class UIController {
    constructor() {
        this.navbarRight = false;
        this.mobileNavOpen = false;
        this.isListening = false;
        
        this.elements = {
            appContainer: $id('appContainer'),
            navbar: $id('navbar'),
            mobileNavToggle: $id('mobileNavToggle'),
            mobileOverlay: $id('mobileOverlay'),
            
            startBtn: $id('startBtn'),
            stopBtn: $id('stopBtn'),
            clearBtn: $id('clearBtn'),
            speakTextBtn: $id('speakTextBtn'),
            copyMorseBtn: $id('copyMorseBtn'),
            copyTextBtn: $id('copyTextBtn'),
            shortcutsBtn: $id('shortcutsBtn'),
            
            status: $id('status'),
            morseOutput: $id('morseOutput'),
            textOutput: $id('textOutput')
        };
        
        this.onStartListening = null;
        this.onStopListening = null;
        this.onClearAll = null;
        this.onSpeakText = null;
        this.onOpenShortcuts = null;
        
        this.setupEventListeners();
        this.setupMobileResponsiveness();
    }
    
    setupEventListeners() {
        if (this.elements.startBtn) {
            on(this.elements.startBtn, 'click', () => this.handleStartListening());
        }
        
        if (this.elements.stopBtn) {
            on(this.elements.stopBtn, 'click', () => this.handleStopListening());
        }
        
        if (this.elements.clearBtn) {
            on(this.elements.clearBtn, 'click', () => this.handleClearAll());
        }
        
        if (this.elements.speakTextBtn) {
            on(this.elements.speakTextBtn, 'click', () => this.handleSpeakText());
        }
        
        if (this.elements.copyMorseBtn) {
            on(this.elements.copyMorseBtn, 'click', () => this.copyMorse());
        }
        
        if (this.elements.copyTextBtn) {
            on(this.elements.copyTextBtn, 'click', () => this.copyText());
        }
        
        if (this.elements.shortcutsBtn) {
            on(this.elements.shortcutsBtn, 'click', () => this.handleOpenShortcuts());
        }
        
        if (this.elements.mobileNavToggle) {
            on(this.elements.mobileNavToggle, 'click', () => this.toggleMobileNav());
        }
        
        if (this.elements.mobileOverlay) {
            on(this.elements.mobileOverlay, 'click', () => this.closeMobileNav());
        }
        
        window.addEventListener('resize', () => this.handleWindowResize());
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    setupMobileResponsiveness() {
        const updateMobileUI = () => {
            const isMobile = window.innerWidth <= 768;
            
            if (this.elements.mobileNavToggle) {
                this.elements.mobileNavToggle.hidden = !isMobile;
            }
            
            if (isMobile && this.mobileNavOpen) {
                this.closeMobileNav();
            }
        };
        
        updateMobileUI();
        window.addEventListener('resize', updateMobileUI);
    }
    
    async handleStartListening() {
        this.setListeningState(true);
        this.updateStatus('Starting...', 'status-prompt');
        
        try {
            if (this.onStartListening) {
                await this.onStartListening();
            }
            this.updateStatus('Listening... Make sounds to generate Morse code', 'status-granted');
        } catch (error) {
            this.setListeningState(false);
            this.updateStatus(error.message, 'status-denied');
        }
    }
    
    handleStopListening() {
        this.setListeningState(false);
        
        if (this.onStopListening) {
            this.onStopListening();
        }
        
        this.updateStatus('Stopped listening', '');
    }
    
    handleClearAll() {
        if (this.onClearAll) {
            this.onClearAll();
        }
        
        this.updateStatus('All output cleared', '');
    }
    
    handleSpeakText() {
        if (this.onSpeakText) {
            this.onSpeakText()
                .then(() => {
                    this.updateStatus('Finished speaking text', '');
                })
                .catch((error) => {
                    this.updateStatus(`Speech error: ${error.message}`, 'status-denied');
                });
        }
    }
    
    handleOpenShortcuts() {
        if (this.onOpenShortcuts) {
            this.onOpenShortcuts();
        }
    }
    
    async copyMorse() {
        const text = this.elements.morseOutput?.textContent || '';
        
        if (text) {
            const success = await copyToClipboard(text);
            this.updateStatus(
                success ? 'Morse code copied to clipboard' : 'Failed to copy morse code',
                success ? 'status-granted' : 'status-denied'
            );
        } else {
            this.updateStatus('No morse code to copy', 'status-denied');
        }
    }
    
    async copyText() {
        const text = this.elements.textOutput?.textContent || '';
        
        if (text) {
            const success = await copyToClipboard(text);
            this.updateStatus(
                success ? 'Text copied to clipboard' : 'Failed to copy text',
                success ? 'status-granted' : 'status-denied'
            );
        } else {
            this.updateStatus('No text to copy', 'status-denied');
        }
    }
    
    setListeningState(isListening) {
        this.isListening = isListening;
        
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = isListening;
        }
        
        if (this.elements.stopBtn) {
            this.elements.stopBtn.disabled = !isListening;
        }
    }
    
    updateStatus(message, className = '') {
        if (this.elements.status) {
            setText(this.elements.status, message);
            this.elements.status.className = `current-status ${className}`;
        }
    }
    
    toggleMobileNav() {
        this.mobileNavOpen = !this.mobileNavOpen;
        
        if (this.elements.navbar) {
            toggleClass(this.elements.navbar, 'open', this.mobileNavOpen);
        }
        
        if (this.elements.mobileOverlay) {
            toggleClass(this.elements.mobileOverlay, 'show', this.mobileNavOpen);
        }
    }
    
    closeMobileNav() {
        this.mobileNavOpen = false;
        
        if (this.elements.navbar) {
            removeClass(this.elements.navbar, 'open');
        }
        
        if (this.elements.mobileOverlay) {
            removeClass(this.elements.mobileOverlay, 'show');
        }
    }
    
    toggleNavbarPosition() {
        this.navbarRight = !this.navbarRight;
        
        if (this.elements.appContainer) {
            toggleClass(this.elements.appContainer, 'navbar-right', this.navbarRight);
        }
    }
    
    handleWindowResize() {
        if (window.innerWidth > 768) {
            this.closeMobileNav();
        }
    }
    
    handleKeyboard(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        const shortcuts = ['s', ' ', 'c', 'x', 'v', 't', 'escape'];
        if (shortcuts.includes(key) || (event.ctrlKey && ['c', 'v', 's'].includes(key))) {
            event.preventDefault();
        }
        
        switch (key) {
            case 's':
            case ' ':
                if (this.isListening) {
                    this.handleStopListening();
                } else {
                    this.handleStartListening();
                }
                break;
                
            case 'c':
                this.handleClearAll();
                break;
                
            case 't':
                this.handleSpeakText();
                break;
                
            case 'escape':
                this.closeMobileNav();
                break;
        }
        
        if (event.ctrlKey) {
            switch (key) {
                case 'c':
                    this.copyText();
                    break;
                    
                case 'v':
                    this.copyMorse();
                    break;
            }
        }
    }
    // TODO: Add Audible 
    showNotification(message, type = 'info', duration = 3000) {
        this.updateStatus(message, `status-${type}`);
        
        if (duration > 0) {
            setTimeout(() => {
                this.updateStatus('Ready', '');
            }, duration);
        }
    }
    
    setButtonStates(states) {
        Object.entries(states).forEach(([elementKey, disabled]) => {
            const element = this.elements[elementKey];
            if (element && 'disabled' in element) {
                element.disabled = disabled;
            }
        });
    }
    
    getUIState() {
        return {
            navbarRight: this.navbarRight,
            isListening: this.isListening
        };
    }
    
    setUIState(state) {
        if (state.navbarRight !== undefined) {
            this.navbarRight = state.navbarRight;
            if (this.elements.appContainer) {
                toggleClass(this.elements.appContainer, 'navbar-right', this.navbarRight);
            }
        }
        
        if (state.isListening !== undefined) {
            this.setListeningState(state.isListening);
        }
    }
    
    setOnStartListening(callback) {
        this.onStartListening = callback;
    }
    
    setOnStopListening(callback) {
        this.onStopListening = callback;
    }
    setOnClearAll(callback) {
        this.onClearAll = callback;
    }
    
    setOnSpeakText(callback) {
        this.onSpeakText = callback;
    }
    
    setOnOpenShortcuts(callback) {
        this.onOpenShortcuts = callback;
    }
}