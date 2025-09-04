
import { DEFAULT_TEXT_SHORTCUTS, DEFAULT_MORSE_SHORTCUTS } from '@utils/constants.js';
import { storage, STORAGE_KEYS } from '@utils/storage.js';
import { $id, $$, on, setText, setHTML, addClass, removeClass, toggleClass, createElement } from '@utils/dom.js';

export class ShortcutsManager {
    constructor() {
        this.textShortcuts = { ...DEFAULT_TEXT_SHORTCUTS };
        this.morseShortcuts = { ...DEFAULT_MORSE_SHORTCUTS };
        
        this.isModalOpen = false;
        this.textShortcutsPage = 0;
        this.morseShortcutsPage = 0;
        this.itemsPerPage = this.calculateItemsPerPage();
        
        this.elements = {
            shortcutsModal: $id('shortcutsModal'),
            closeModalBtn: $id('closeModalBtn'),
            
            textShortcutsList: $id('textShortcutsList'),
            textPaginationInfo: $id('textPaginationInfo'),
            textPrevBtn: $id('textPrevBtn'),
            textNextBtn: $id('textNextBtn'),
            newTextKey: $id('newTextKey'),
            newTextValue: $id('newTextValue'),
            addTextShortcutBtn: $id('addTextShortcutBtn'),
            
            morseShortcutsList: $id('morseShortcutsList'),
            morsePaginationInfo: $id('morsePaginationInfo'),
            morsePrevBtn: $id('morsePrevBtn'),
            morseNextBtn: $id('morseNextBtn'),
            newMorseKey: $id('newMorseKey'),
            newMorseValue: $id('newMorseValue'),
            addMorseShortcutBtn: $id('addMorseShortcutBtn'),
            
            restoreDefaultsBtn: $id('restoreDefaultsBtn'),
            saveShortcutsBtn: $id('saveShortcutsBtn')
        };
        
        this.loadShortcuts();
        this.setupEventListeners();
        
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupEventListeners() {
        if (this.elements.closeModalBtn) {
            on(this.elements.closeModalBtn, 'click', () => this.closeModal());
        }
        
        if (this.elements.shortcutsModal) {
            on(this.elements.shortcutsModal, 'click', (e) => {
                if (e.target === this.elements.shortcutsModal) {
                    this.closeModal();
                }
            });
        }
        
        if (this.elements.textPrevBtn) {
            on(this.elements.textPrevBtn, 'click', () => this.changeTextPage(-1));
        }
        if (this.elements.textNextBtn) {
            on(this.elements.textNextBtn, 'click', () => this.changeTextPage(1));
        }
        
        if (this.elements.morsePrevBtn) {
            on(this.elements.morsePrevBtn, 'click', () => this.changeMorsePage(-1));
        }
        if (this.elements.morseNextBtn) {
            on(this.elements.morseNextBtn, 'click', () => this.changeMorsePage(1));
        }
        
        if (this.elements.addTextShortcutBtn) {
            on(this.elements.addTextShortcutBtn, 'click', () => this.addTextShortcut());
        }
        if (this.elements.addMorseShortcutBtn) {
            on(this.elements.addMorseShortcutBtn, 'click', () => this.addMorseShortcut());
        }
        
        if (this.elements.newTextValue) {
            on(this.elements.newTextValue, 'keypress', (e) => {
                if (e.key === 'Enter') this.addTextShortcut();
            });
        }
        if (this.elements.newMorseValue) {
            on(this.elements.newMorseValue, 'keypress', (e) => {
                if (e.key === 'Enter') this.addMorseShortcut();
            });
        }
        
        if (this.elements.restoreDefaultsBtn) {
            on(this.elements.restoreDefaultsBtn, 'click', () => this.restoreDefaults());
        }
        if (this.elements.saveShortcutsBtn) {
            on(this.elements.saveShortcutsBtn, 'click', () => this.closeModal());
        }
    }
    
    openModal() {
        this.isModalOpen = true;
        this.itemsPerPage = this.calculateItemsPerPage();
        
        if (this.elements.shortcutsModal) {
            addClass(this.elements.shortcutsModal, 'show');
        }
        
        this.populateAllShortcuts();
    }
    
    closeModal() {
        this.isModalOpen = false;
        
        if (this.elements.shortcutsModal) {
            removeClass(this.elements.shortcutsModal, 'show');
        }
        
        this.saveShortcuts();
    }
    
    // TODO: Get these values dynamically. Short of this update these as these values change at there source of truth.
    calculateItemsPerPage() {
        const modalHeight = window.innerHeight * 0.95;
        const headerHeight = 60;
        const footerHeight = 80;
        const sectionHeaderHeight = 50;
        const paginationHeight = 50;
        const addShortcutHeight = 60;
        const padding = 40;
        
        const availableHeight = modalHeight - headerHeight - footerHeight - 
                               sectionHeaderHeight - paginationHeight - 
                               addShortcutHeight - padding;
        
        const itemHeight = 50;
        const calculatedItems = Math.floor(availableHeight / itemHeight);
        
        return Math.max(3, Math.min(10, calculatedItems));
    }
    
    handleResize() {
        const newItemsPerPage = this.calculateItemsPerPage();
        if (newItemsPerPage !== this.itemsPerPage) {
            this.itemsPerPage = newItemsPerPage;
            
            const textEntries = Object.keys(this.textShortcuts).length;
            const morseEntries = Object.keys(this.morseShortcuts).length;
            
            this.textShortcutsPage = Math.min(
                this.textShortcutsPage, 
                Math.floor(textEntries / this.itemsPerPage)
            );
            this.morseShortcutsPage = Math.min(
                this.morseShortcutsPage, 
                Math.floor(morseEntries / this.itemsPerPage)
            );
            
            if (this.isModalOpen) {
                this.populateAllShortcuts();
            }
        }
    }
    
    populateAllShortcuts() {
        this.populateTextShortcuts();
        this.populateMorseShortcuts();
    }
    
    populateTextShortcuts() {
        if (!this.elements.textShortcutsList) return;
        
        const entries = Object.entries(this.textShortcuts);
        const totalPages = Math.max(1, Math.ceil(entries.length / this.itemsPerPage));
        
        this.textShortcutsPage = Math.max(0, Math.min(this.textShortcutsPage, totalPages - 1));
        
        const startIndex = this.textShortcutsPage * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageEntries = entries.slice(startIndex, endIndex);
        
        setHTML(this.elements.textShortcutsList, '');
        
        pageEntries.forEach(([key, value]) => {
            const item = createElement('div', {
                className: 'shortcut-item',
                innerHTML: `
                    <span class="shortcut-key">${key}</span>
                    <span class="shortcut-value">${value}</span>
                    <button class="shortcut-delete" data-key="${key}" data-type="text">Delete</button>
                `
            });
            
            const deleteBtn = item.querySelector('.shortcut-delete');
            on(deleteBtn, 'click', () => this.deleteTextShortcut(key));
            
            this.elements.textShortcutsList.appendChild(item);
        });
        
        this.updateTextPagination(totalPages);
    }
    
    populateMorseShortcuts() {
        if (!this.elements.morseShortcutsList) return;
        
        const entries = Object.entries(this.morseShortcuts);
        const totalPages = Math.max(1, Math.ceil(entries.length / this.itemsPerPage));
        
        this.morseShortcutsPage = Math.max(0, Math.min(this.morseShortcutsPage, totalPages - 1));
        
        const startIndex = this.morseShortcutsPage * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageEntries = entries.slice(startIndex, endIndex);
        
        setHTML(this.elements.morseShortcutsList, '');
        
        pageEntries.forEach(([key, value]) => {
            const item = createElement('div', {
                className: 'shortcut-item',
                innerHTML: `
                    <span class="shortcut-key">${key}</span>
                    <span class="shortcut-value">${value}</span>
                    <button class="shortcut-delete" data-key="${key}" data-type="morse">Delete</button>
                `
            });
            
            const deleteBtn = item.querySelector('.shortcut-delete');
            on(deleteBtn, 'click', () => this.deleteMorseShortcut(key));
            
            this.elements.morseShortcutsList.appendChild(item);
        });
        
        this.updateMorsePagination(totalPages);
    }
    
    updateTextPagination(totalPages) {
        if (this.elements.textPaginationInfo) {
            setText(this.elements.textPaginationInfo, `Page ${this.textShortcutsPage + 1} of ${totalPages}`);
        }
        
        if (this.elements.textPrevBtn) {
            this.elements.textPrevBtn.disabled = this.textShortcutsPage === 0;
        }
        
        if (this.elements.textNextBtn) {
            this.elements.textNextBtn.disabled = this.textShortcutsPage >= totalPages - 1;
        }
    }
    
    updateMorsePagination(totalPages) {
        if (this.elements.morsePaginationInfo) {
            setText(this.elements.morsePaginationInfo, `Page ${this.morseShortcutsPage + 1} of ${totalPages}`);
        }
        
        if (this.elements.morsePrevBtn) {
            this.elements.morsePrevBtn.disabled = this.morseShortcutsPage === 0;
        }
        
        if (this.elements.morseNextBtn) {
            this.elements.morseNextBtn.disabled = this.morseShortcutsPage >= totalPages - 1;
        }
    }
    
    changeTextPage(direction) {
        const totalEntries = Object.keys(this.textShortcuts).length;
        const totalPages = Math.max(1, Math.ceil(totalEntries / this.itemsPerPage));
        
        this.textShortcutsPage += direction;
        this.textShortcutsPage = Math.max(0, Math.min(totalPages - 1, this.textShortcutsPage));
        
        this.populateTextShortcuts();
    }
    
    changeMorsePage(direction) {
        const totalEntries = Object.keys(this.morseShortcuts).length;
        const totalPages = Math.max(1, Math.ceil(totalEntries / this.itemsPerPage));
        
        this.morseShortcutsPage += direction;
        this.morseShortcutsPage = Math.max(0, Math.min(totalPages - 1, this.morseShortcutsPage));
        
        this.populateMorseShortcuts();
    }
    
    addTextShortcut() {
        const key = this.elements.newTextKey?.value.trim().toUpperCase();
        const value = this.elements.newTextValue?.value.trim();
        
        if (key && value) {
            this.textShortcuts[key] = value;
            
            if (this.elements.newTextKey) this.elements.newTextKey.value = '';
            if (this.elements.newTextValue) this.elements.newTextValue.value = '';
            
            this.populateTextShortcuts();
            this.saveShortcuts();
        }
    }
    
    addMorseShortcut() {
        const key = this.elements.newMorseKey?.value.trim();
        const value = this.elements.newMorseValue?.value.trim();
        
        if (key && value) {
            this.morseShortcuts[key] = value;
            
            if (this.elements.newMorseKey) this.elements.newMorseKey.value = '';
            if (this.elements.newMorseValue) this.elements.newMorseValue.value = '';
            
            this.populateMorseShortcuts();
            this.saveShortcuts();
        }
    }
    
    deleteTextShortcut(key) {
        delete this.textShortcuts[key];
        this.populateTextShortcuts();
        this.saveShortcuts();
    }
    
    deleteMorseShortcut(key) {
        delete this.morseShortcuts[key];
        this.populateMorseShortcuts();
        this.saveShortcuts();
    }
    
    restoreDefaults() {
        this.textShortcuts = { ...DEFAULT_TEXT_SHORTCUTS };
        this.morseShortcuts = { ...DEFAULT_MORSE_SHORTCUTS };
        
        this.textShortcutsPage = 0;
        this.morseShortcutsPage = 0;
        
        this.populateAllShortcuts();
        this.saveShortcuts();
    }
    
    getTextShortcuts() {
        return { ...this.textShortcuts };
    }
    
    getMorseShortcuts() {
        return { ...this.morseShortcuts };
    }
    
    processTextShortcuts(text) {
        let processedText = text;
        
        for (const [shortcut, replacement] of Object.entries(this.textShortcuts)) {
            const regex = new RegExp(`\\b${shortcut}\\b`, 'gi');
            processedText = processedText.replace(regex, replacement);
        }
        
        return processedText;
    }
    
    saveShortcuts() {
        storage.set(STORAGE_KEYS.TEXT_SHORTCUTS, this.textShortcuts);
        storage.set(STORAGE_KEYS.MORSE_SHORTCUTS, this.morseShortcuts);
    }
    
    loadShortcuts() {
        this.textShortcuts = storage.get(STORAGE_KEYS.TEXT_SHORTCUTS, DEFAULT_TEXT_SHORTCUTS);
        this.morseShortcuts = storage.get(STORAGE_KEYS.MORSE_SHORTCUTS, DEFAULT_MORSE_SHORTCUTS);
    }
}