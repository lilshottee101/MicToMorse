/**
 * MorseDecoder - Handles morse code translation and pattern recognition
 */
import { MORSE_TO_TEXT, DEFAULT_MORSE_SHORTCUTS } from '@utils/constants.js';
import { $id, setText, getText, addClass, removeClass, $$, scrollToBottom } from '@utils/dom.js';

export class MorseDecoder {
    constructor(settings = {}) {
        this.letterGap = settings.letterGap || 650;
        this.wordGap = settings.wordGap || 1500;
        this.autoCommitTime = settings.autoCommitTime || 3000;
        
        this.currentLetter = '';
        this.morseBuffer = '';
        this.autoCommitTimer = null;
        
        this.morseShortcuts = { ...DEFAULT_MORSE_SHORTCUTS };
        
        this.elements = {
            morseOutput: $id('morseOutput'),
            textOutput: $id('textOutput'),
            morseGrid: $id('morseGrid')
        };
        
        this.onLetterProcessed = null;
        this.onWordProcessed = null;
        
        this.generateMorseReference();
    }
    
    addSymbol(symbol) {
        this.currentLetter += symbol;
        this.updateMorseOutput();
        this.highlightMorseReferences();
        this.startAutoCommitTimer();
    }
    
    processGap(duration) {
        this.clearAutoCommitTimer();
        
        if (duration >= this.wordGap) {
            this.processLetter();
            this.addSpace();
        } else if (duration >= this.letterGap) {
            this.processLetter();
        }
    }
    
    processLetter() {
        if (!this.currentLetter) return;
        
        // Check shortcutes
        let letter = this.morseShortcuts[this.currentLetter];
        let isWord = !!letter;
        
        if (!letter) {
            letter = MORSE_TO_TEXT[this.currentLetter] || '?';
        }
        
        this.addToTextOutput(letter);
        
        this.currentLetter = '';
        this.updateMorseOutput();
        this.clearMorseHighlights();
        
        if (this.onLetterProcessed) {
            this.onLetterProcessed(letter, isWord);
        }
        
        return letter;
    }
    
    addSpace() {
        this.addToTextOutput(' ');
        
        if (this.onWordProcessed) {
            this.onWordProcessed();
        }
    }
    
    processEndOfInput() {
        if (this.currentLetter) {
            this.processLetter();
        }
        
        if (this.onWordProcessed) {
            this.onWordProcessed();
        }
    }
    
    addToTextOutput(text) {
        if (this.elements.textOutput) {
            this.elements.textOutput.textContent += text;
            scrollToBottom(this.elements.textOutput);
        }
    }
    
    updateMorseOutput() {
        if (!this.elements.morseOutput) return;
        
        let output = this.elements.morseOutput.textContent;
        const lastSpaceIndex = output.lastIndexOf(' ');
        
        if (lastSpaceIndex !== -1) {
            output = output.substring(0, lastSpaceIndex + 1);
        } else {
            output = '';
        }
        
        output += this.currentLetter;
        
        setText(this.elements.morseOutput, output);
        scrollToBottom(this.elements.morseOutput);
    }
    
    startAutoCommitTimer() {
        this.clearAutoCommitTimer();
        
        if (this.currentLetter && this.autoCommitTime > 0) {
            this.autoCommitTimer = setTimeout(() => {
                this.processLetter();
                
                if (this.onLetterProcessed) {
                    this.onLetterProcessed('(auto-committed)', false);
                }
            }, this.autoCommitTime);
        }
    }
    
    clearAutoCommitTimer() {
        if (this.autoCommitTimer) {
            clearTimeout(this.autoCommitTimer);
            this.autoCommitTimer = null;
        }
    }
    
    updateSettings(settings) {
        if (settings.letterGap !== undefined) {
            this.letterGap = settings.letterGap;
        }
        
        if (settings.wordGap !== undefined) {
            this.wordGap = settings.wordGap;
        }
        
        if (settings.autoCommitTime !== undefined) {
            this.autoCommitTime = settings.autoCommitTime;
        }
    }
    
    updateMorseShortcuts(shortcuts) {
        this.morseShortcuts = { ...shortcuts };
    }
    
    clearAll() {
        this.currentLetter = '';
        this.morseBuffer = '';
        this.clearAutoCommitTimer();
        
        if (this.elements.morseOutput) {
            setText(this.elements.morseOutput, '');
        }
        
        if (this.elements.textOutput) {
            setText(this.elements.textOutput, '');
        }
        
        this.clearMorseHighlights();
    }
    
    getCurrentMorse() {
        return getText(this.elements.morseOutput);
    }
    
    getCurrentText() {
        return getText(this.elements.textOutput);
    }
    
    generateMorseReference() {
        if (!this.elements.morseGrid) return;
        
        this.elements.morseGrid.innerHTML = '';
        
        const sortedMorse = Object.entries(MORSE_TO_TEXT).sort((a, b) => 
            a[1].localeCompare(b[1])
        );
        
        sortedMorse.forEach(([morseCode, letter]) => {
            const morseChar = document.createElement('div');
            morseChar.className = 'morse-char';
            morseChar.setAttribute('data-char', letter);
            
            const morsePattern = document.createElement('div');
            morsePattern.className = 'morse-pattern';
            morsePattern.textContent = morseCode;
            
            const morseLetterDiv = document.createElement('div');
            morseLetterDiv.className = 'morse-letter';
            morseLetterDiv.textContent = letter;
            
            morseChar.appendChild(morsePattern);
            morseChar.appendChild(morseLetterDiv);
            this.elements.morseGrid.appendChild(morseChar);
        });
    }
    
    highlightMorseReferences() {
        this.clearMorseHighlights();
        
        if (!this.currentLetter) return;
        
        const exactMatch = this.elements.morseGrid?.querySelector(
            `[data-char="${MORSE_TO_TEXT[this.currentLetter] || ''}"]`
        );
        if (exactMatch) {
            addClass(exactMatch, 'exact-match');
        }
        
        Object.entries(MORSE_TO_TEXT).forEach(([morseCode, letter]) => {
            if (morseCode.startsWith(this.currentLetter) && morseCode !== this.currentLetter) {
                const partialMatch = this.elements.morseGrid?.querySelector(
                    `[data-char="${letter}"]`
                );
                if (partialMatch) {
                    addClass(partialMatch, 'partial-match');
                }
            }
        });
        
        Object.entries(this.morseShortcuts).forEach(([morseCode, word]) => {
            if (morseCode === this.currentLetter) {
                const customMatch = Array.from($$('.morse-char')).find(el => {
                    const pattern = el.querySelector('.morse-pattern');
                    return pattern && pattern.textContent === morseCode;
                });
                if (customMatch) {
                    addClass(customMatch, 'exact-match');
                }
            } else if (morseCode.startsWith(this.currentLetter)) {
                const customPartial = Array.from($$('.morse-char')).find(el => {
                    const pattern = el.querySelector('.morse-pattern');
                    return pattern && pattern.textContent === morseCode;
                });
                if (customPartial) {
                    addClass(customPartial, 'partial-match');
                }
            }
        });
    }
    
    clearMorseHighlights() {
        $$('.morse-char').forEach(char => {
            removeClass(char, 'exact-match');
            removeClass(char, 'partial-match');
        });
    }
    
    setOnLetterProcessed(callback) {
        this.onLetterProcessed = callback;
    }
    
    setOnWordProcessed(callback) {
        this.onWordProcessed = callback;
    }
}