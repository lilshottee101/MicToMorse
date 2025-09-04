import { AudioProcessor } from '@components/audioProcessor.js';
import { MorseDecoder } from '@components/morseDecoder.js';
import { SpeechManager } from '@components/speechManager.js';
import { SettingsManager } from '@components/settingsManager.js';
import { ShortcutsManager } from '@components/shortcutsManager.js';
import { SettingsModal } from '@components/SettingsModal.js';
import { UIController } from '@components/uiController.js';
import { DEFAULT_SETTINGS } from '@utils/constants.js';

export class MorseCodeDecoderApp {
    constructor() {
        this.audioProcessor = new AudioProcessor(DEFAULT_SETTINGS);
        this.morseDecoder = new MorseDecoder(DEFAULT_SETTINGS);
        this.speechManager = new SpeechManager(DEFAULT_SETTINGS);
        this.settingsManager = new SettingsManager();
        this.shortcutsManager = new ShortcutsManager();
        this.settingsModal = new SettingsModal(this.speechManager);
        this.uiController = new UIController();
        
        this.sessionHistory = [];
        
        this.setupComponentCommunication();
        this.restoreState();
        
        window.addEventListener('beforeunload', () => this.saveState());
    }
    
    setupComponentCommunication() {
        this.audioProcessor.setOnSignal((symbol, duration) => {
            this.morseDecoder.addSymbol(symbol);
        });
        
        this.audioProcessor.setOnGap((duration) => {
            this.morseDecoder.processGap(duration);
        });
        
        this.morseDecoder.setOnLetterProcessed((letter, isWord) => {
            if (isWord) {
                this.speechManager.speakWord(letter);
            }
            this.processTextShortcuts();
        });
        
        this.morseDecoder.setOnWordProcessed(() => {
            this.processTextShortcuts();
            this.saveToHistory();
        });
        
        this.settingsManager.setOnSettingsChanged((settings) => {
            this.audioProcessor.updateSettings(settings);
            this.morseDecoder.updateSettings(settings);
            this.speechManager.updateSettings(settings);
            this.updateStatus('Settings updated');
        });
        
        this.uiController.setOnStartListening(async () => {
            await this.audioProcessor.startListening();
        });
        
        this.uiController.setOnStopListening(() => {
            this.audioProcessor.stopListening();
            this.morseDecoder.processEndOfInput();
        });
        
        this.uiController.setOnClearAll(() => {
            this.clearAll();
        });
        
        this.uiController.setOnSpeakText(async () => {
            await this.speechManager.speakCurrentText();
        });
        
        this.uiController.setOnOpenShortcuts(() => {
            this.shortcutsManager.openModal();
        });
        
        this.speechManager.setOnSpeakStart((text) => {
            this.updateStatus(`Speaking: ${text.substring(0, 30)}...`);
        });
        
        this.speechManager.setOnSpeakEnd(() => {
            this.updateStatus('Finished speaking');
        });
        
        this.speechManager.setOnSpeakError((error) => {
            this.updateStatus(`Speech error: ${error.message}`);
        });

        this.uiController.setOnOpenSettings(() => {
            this.settingsModal.open();
        });
    }
    
    processTextShortcuts() {
        const currentText = this.morseDecoder.getCurrentText();
        const processedText = this.shortcutsManager.processTextShortcuts(currentText);
        
        if (processedText !== currentText) {
            this.morseDecoder.elements.textOutput.textContent = processedText;
            
            const words = processedText.split(' ');
            const lastWord = words[words.length - 1];
            if (lastWord && this.speechManager.autoSpeak) {
                this.speechManager.speakWord(lastWord);
            }
            
            this.updateStatus('Text shortcut applied');
        }
    }
    
    clearAll() {
        this.morseDecoder.clearAll();
        this.audioProcessor.clearHistory();
        this.sessionHistory = [];
        this.updateStatus('All data cleared');
    }
    
    saveToHistory() {
        const morseCode = this.morseDecoder.getCurrentMorse().trim();
        const text = this.morseDecoder.getCurrentText().trim();
        
        if (morseCode || text) {
            const timestamp = new Date().toLocaleTimeString();
            this.sessionHistory.push({
                timestamp,
                morse: morseCode,
                text: text
            });
            
            if (this.sessionHistory.length > 100) {
                this.sessionHistory = this.sessionHistory.slice(-50);
            }
        }
    }
    
    exportHistory() {
        if (this.sessionHistory.length === 0) {
            this.updateStatus('No history to export');
            return;
        }
        
        let exportData = 'Morse Code Session History\n';
        exportData += '================================\n\n';
        
        this.sessionHistory.forEach((entry, index) => {
            exportData += `Entry ${index + 1} - ${entry.timestamp}\n`;
            exportData += `Text: ${entry.text || 'No translation'}\n`;
            exportData += `Morse: ${entry.morse || 'No morse code'}\n`;
            exportData += '---\n\n';
        });
        
        const blob = new Blob([exportData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `morse_history_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.updateStatus('History exported successfully');
    }
    
    async testAudioSpeech() {
        try {
            this.updateStatus('Testing text-to-speech...');
            const speechResult = await this.speechManager.testSpeaker();
            
            if (speechResult.success) {
                this.updateStatus('Audio/Speech test completed successfully');
            } else {
                this.updateStatus(`Speech test failed: ${speechResult.message}`);
            }
            
        } catch (error) {
            this.updateStatus(`Test failed: ${error.message}`);
        }
    }
    
    updateStatus(message) {
        this.uiController.updateStatus(message);
    }
    
    saveState() {
        const state = {
            settings: this.settingsManager.getSettings(),
            text: this.morseDecoder.getCurrentText(),
            morse: this.morseDecoder.getCurrentMorse(),
            history: this.sessionHistory,
            ui: this.uiController.getUIState(),
            speechSettings: this.speechManager.getSettings()
        };
        
        this.settingsManager.saveState(state);
    }
    
    restoreState() {
        const state = this.settingsManager.loadState();
        
        if (state.text) {
            this.morseDecoder.elements.textOutput.textContent = state.text;
        }
        
        if (state.morse) {
            this.morseDecoder.elements.morseOutput.textContent = state.morse;
        }
        
        if (state.history) {
            this.sessionHistory = state.history;
        }
        
        if (state.ui) {
            this.uiController.setUIState(state.ui);
        }
        
        if (state.speechSettings) {
            this.speechManager.updateSettings(state.speechSettings);
        }
        
        const morseShortcuts = this.shortcutsManager.getMorseShortcuts();
        this.morseDecoder.updateMorseShortcuts(morseShortcuts);
    }
    
    getDebugInfo() {
        return {
            isListening: this.audioProcessor.isListening,
            currentSettings: this.settingsManager.getSettings(),
            historyEntries: this.sessionHistory.length,
            textShortcuts: Object.keys(this.shortcutsManager.getTextShortcuts()).length,
            morseShortcuts: Object.keys(this.shortcutsManager.getMorseShortcuts()).length,
            speechSupported: this.speechManager.isSupported,
            audioContextState: this.audioProcessor.audioContext?.state
        };
    }
}

window.MorseCodeDecoderApp = MorseCodeDecoderApp;