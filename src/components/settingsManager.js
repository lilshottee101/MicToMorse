import { DEFAULT_SETTINGS } from '@utils/constants.js';
import { storage, cookies, STORAGE_KEYS } from '@utils/storage.js';
import { $, $id, $$, on, setText, addClass, removeClass, toggleClass } from '@utils/dom.js';

export class SettingsManager {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        
        this.currentProfile = 1;
        this.profiles = {
            1: { name: 'Profile 1', settings: null },
            2: { name: 'Profile 2', settings: null },
            3: { name: 'Profile 3', settings: null }
        };
        
        this.elements = {
            thresholdInput: $id('thresholdInput'),
            dotLengthInput: $id('dotLengthInput'),
            dashMultiplierInput: $id('dashMultiplierInput'),
            letterGapInput: $id('letterGapInput'),
            wordGapInput: $id('wordGapInput'),
            autoCommitTimeInput: $id('autoCommitTimeInput'),
            autoSpeakToggle: $id('autoSpeakToggle'),
            
            profileName: $id('profileName'),
            saveProfileBtn: $id('saveProfileBtn'),
            deleteProfileBtn: $id('deleteProfileBtn'),
            
            audioSectionBtn: $id('audioSectionBtn'),
            profileSectionBtn: $id('profileSectionBtn'),
            audioSection: $id('audioSection'),
            profileSection: $id('profileSection')
        };
        
        this.onSettingsChanged = null;
        
        this.loadProfiles();
        this.setupEventListeners();
        this.updateAllInputs();
    }
    
        setupEventListeners() {
        $$('[data-setting]').forEach(btn => {
            on(btn, 'click', () => {
                const setting = btn.dataset.setting;
                const delta = parseFloat(btn.dataset.delta);
                this.adjustSetting(setting, delta);
            });
        });
        
        Object.entries(this.elements).forEach(([key, element]) => {
            if (element && key.endsWith('Input')) {
                on(element, 'change', () => {
                    const settingName = key.replace('Input', '');
                    this.updateSetting(settingName, element.value);
                });
            }
        });
        
        if (this.elements.autoSpeakToggle) {
            on(this.elements.autoSpeakToggle, 'click', () => {
                this.toggleAutoSpeak();
            });
        }
        
        $$('[data-profile]').forEach(btn => {
            on(btn, 'click', () => {
                const profileNumber = parseInt(btn.dataset.profile);
                this.loadProfile(profileNumber);
            });
        });
        
        if (this.elements.saveProfileBtn) {
            on(this.elements.saveProfileBtn, 'click', () => {
                this.saveCurrentProfile();
            });
        }
        
        if (this.elements.deleteProfileBtn) {
            on(this.elements.deleteProfileBtn, 'click', () => {
                this.deleteCurrentProfile();
            });
        }
        
        if (this.elements.audioSectionBtn) {
            on(this.elements.audioSectionBtn, 'click', () => {
                this.switchToSection('audio');
            });
        }
        
        if (this.elements.profileSectionBtn) {
            on(this.elements.profileSectionBtn, 'click', () => {
                this.switchToSection('profiles');
            });
        }
    }
    
        updateSetting(settingName, value) {
        const numValue = parseFloat(value);
        
        if (!isNaN(numValue)) {
            this.settings[settingName] = numValue;
            this.updateAllInputs();
            this.notifySettingsChanged();
        }
    }
    
        adjustSetting(settingName, delta) {
        const input = this.elements[settingName + 'Input'];
        if (!input) return;
        
        const currentValue = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        const max = parseFloat(input.max) || 9999;
        const step = parseFloat(input.step) || 1;
        
        let newValue = currentValue + delta;
        
        if (step < 1) {
            newValue = Math.round(newValue * 10) / 10;
        } else {
            newValue = Math.round(newValue);
        }
        
        newValue = Math.max(min, Math.min(max, newValue));
        
        input.value = newValue;
        this.updateSetting(settingName, newValue);
    }
    
        toggleAutoSpeak() {
        this.settings.autoSpeak = !this.settings.autoSpeak;
        this.updateAutoSpeakToggle();
        this.notifySettingsChanged();
    }
    
        updateAllInputs() {
        Object.entries(this.settings).forEach(([key, value]) => {
            const input = this.elements[key + 'Input'];
            if (input && input.type === 'number') {
                input.value = value;
            }
        });
        
        this.updateAutoSpeakToggle();
    }
    
        updateAutoSpeakToggle() {
        const toggle = this.elements.autoSpeakToggle;
        if (!toggle) return;
        
        toggleClass(toggle, 'active', this.settings.autoSpeak);
        
        const text = toggle.querySelector('.toggle-text');
        if (text) {
            setText(text, this.settings.autoSpeak ? 'ON' : 'OFF');
        }
    }
    
        switchToSection(sectionName) {
        if (this.elements.audioSection && this.elements.profileSection) {
            this.elements.audioSection.style.display = 
                sectionName === 'audio' ? 'block' : 'none';
            this.elements.profileSection.style.display = 
                sectionName === 'profiles' ? 'block' : 'none';
        }
        
        if (this.elements.audioSectionBtn && this.elements.profileSectionBtn) {
            toggleClass(this.elements.audioSectionBtn, 'active', sectionName === 'audio');
            toggleClass(this.elements.profileSectionBtn, 'active', sectionName === 'profiles');
        }
    }
    
        loadProfile(profileNumber) {
        this.currentProfile = profileNumber;
        const profile = this.profiles[profileNumber];
        
        if (profile && profile.settings) {
            this.settings = { ...profile.settings };
            this.updateAllInputs();
            this.notifySettingsChanged();
        }
        
        if (this.elements.profileName) {
            this.elements.profileName.value = profile.name;
        }
        
        this.updateProfileButtons();
    }
    
        saveCurrentProfile() {
        const profileName = this.elements.profileName?.value.trim() || 
                           `Profile ${this.currentProfile}`;
        
        this.profiles[this.currentProfile] = {
            name: profileName,
            settings: { ...this.settings }
        };
        
        this.saveProfiles();
        this.updateProfileButtons();
        
        return `Saved profile: ${profileName}`;
    }
    
        deleteCurrentProfile() {
        const profile = this.profiles[this.currentProfile];
        const profileName = profile.name;
        
        this.profiles[this.currentProfile] = {
            name: `Profile ${this.currentProfile}`,
            settings: null
        };
        
        if (this.elements.profileName) {
            this.elements.profileName.value = this.profiles[this.currentProfile].name;
        }
        
        this.saveProfiles();
        this.updateProfileButtons();
        
        return `Deleted profile: ${profileName}`;
    }
    
        updateProfileButtons() {
        for (let i = 1; i <= 3; i++) {
            const btn = $(`[data-profile="${i}"]`)[0];
            if (btn) {
                const profile = this.profiles[i];
                setText(btn, profile.name);
                toggleClass(btn, 'active', i === this.currentProfile);
            }
        }
    }
    
        getSettings() {
        return { ...this.settings };
    }
    
        setSettings(newSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...newSettings };
        this.updateAllInputs();
        this.notifySettingsChanged();
    }
    
        resetToDefaults() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.updateAllInputs();
        this.notifySettingsChanged();
    }
    
        saveState(additionalState = {}) {
        const state = {
            settings: this.settings,
            currentProfile: this.currentProfile,
            ...additionalState
        };
        
        storage.set(STORAGE_KEYS.APP_STATE, state);
    }
    
        loadState() {
        const state = storage.get(STORAGE_KEYS.APP_STATE, {});
        
        if (state.settings) {
            this.settings = { ...DEFAULT_SETTINGS, ...state.settings };
            this.updateAllInputs();
        }
        
        if (state.currentProfile) {
            this.currentProfile = state.currentProfile;
            this.updateProfileButtons();
        }
        
        return state;
    }
    
        saveProfiles() {
        cookies.set(STORAGE_KEYS.PROFILES, this.profiles);
    }
    
        loadProfiles() {
        const savedProfiles = cookies.get(STORAGE_KEYS.PROFILES, {});
        
        for (let i = 1; i <= 3; i++) {
            if (savedProfiles[i]) {
                this.profiles[i] = savedProfiles[i];
            }
        }
        
        this.updateProfileButtons();
    }
    
        exportSettings() {
        return {
            settings: this.settings,
            profiles: this.profiles,
            exportDate: new Date().toISOString()
        };
    }
    
        importSettings(data) {
        try {
            if (data.settings) {
                this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
                this.updateAllInputs();
            }
            
            if (data.profiles) {
                this.profiles = { ...this.profiles, ...data.profiles };
                this.saveProfiles();
                this.updateProfileButtons();
            }
            
            this.notifySettingsChanged();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
    
        notifySettingsChanged() {
        if (this.onSettingsChanged) {
            this.onSettingsChanged(this.settings);
        }
    }
    
        setOnSettingsChanged(callback) {
        this.onSettingsChanged = callback;
    }
}