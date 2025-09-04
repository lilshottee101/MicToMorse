import { $id, $$, on, addClass, removeClass, toggleClass } from '@utils/dom.js';
import * as VITS from '@diffusionstudio/vits-web';

export class SettingsModal {
    constructor(speechManager) {
        this.speechManager = speechManager;
        this.isOpen = false;
        this.currentProvider = 'utterance';
        this.vitsInstance = null;
        this.availableVoices = [];
        
        this.elements = {
            modal: $id('settingsModal'),
            closeBtn: $id('closeSettingsModalBtn'),
            tabs: $$('.modal-tab'),
            ttsTab: $id('ttsTab'),
            
            providerRadios: $$('input[name="ttsProvider"]'),
            utteranceSettings: $id('utteranceSettings'),
            vitsSettings: $id('vitsSettings'),
            
            voiceSelect: $id('voiceSelect'),
            rateSlider: $id('rateSlider'),
            rateValue: $id('rateValue'),
            pitchSlider: $id('pitchSlider'),
            pitchValue: $id('pitchValue'),
            volumeSlider: $id('volumeSlider'),
            volumeValue: $id('volumeValue'),
            
            vitsVoiceSelect: $id('vitsVoiceSelect'),
            vitsSpeedSlider: $id('vitsSpeedSlider'),
            vitsSpeedValue: $id('vitsSpeedValue'),
            downloadedModels: $id('downloadedModels'),
            
            testBtn: $id('testSpeechBtn'),
            resetBtn: $id('resetTtsBtn')
        };
        
        this.setupEventListeners();
        this.loadVoices();
    }
    
    setupEventListeners() {
        if (this.elements.closeBtn) {
            on(this.elements.closeBtn, 'click', () => this.close());
        }
        
        if (this.elements.modal) {
            on(this.elements.modal, 'click', (e) => {
                if (e.target === this.elements.modal) this.close();
            });
        }
        
        this.elements.providerRadios.forEach(radio => {
            on(radio, 'change', async (e) => {
                await this.switchProvider(e.target.value);
            });
        });
        
        if (this.elements.rateSlider) {
            on(this.elements.rateSlider, 'input', (e) => {
                this.elements.rateValue.textContent = e.target.value;
                this.speechManager.updateSettings({ speechRate: parseFloat(e.target.value) });
            });
        }
        
        if (this.elements.pitchSlider) {
            on(this.elements.pitchSlider, 'input', (e) => {
                this.elements.pitchValue.textContent = e.target.value;
                this.speechManager.updateSettings({ speechPitch: parseFloat(e.target.value) });
            });
        }
        
        if (this.elements.volumeSlider) {
            on(this.elements.volumeSlider, 'input', (e) => {
                this.elements.volumeValue.textContent = e.target.value;
                this.speechManager.updateSettings({ speechVolume: parseFloat(e.target.value) });
            });
        }
        
        if (this.elements.voiceSelect) {
            on(this.elements.voiceSelect, 'change', (e) => {
                this.speechManager.setVoice(parseInt(e.target.value));
            });
        }
        
        if (this.elements.vitsSpeedSlider) {
            on(this.elements.vitsSpeedSlider, 'input', (e) => {
                this.elements.vitsSpeedValue.textContent = e.target.value;
            });
        }
        
        if (this.elements.vitsVoiceSelect) {
            on(this.elements.vitsVoiceSelect, 'change', (e) => {
                this.loadVitsModel(e.target.value);
            });
        }
        
        if (this.elements.testBtn) {
            on(this.elements.testBtn, 'click', () => this.testSpeech());
        }
        
        if (this.elements.resetBtn) {
            on(this.elements.resetBtn, 'click', () => this.resetToDefaults());
        }
    }
    
    async loadVoices() {
        if (!this.speechManager.isSupported) return;
        
        let voices = this.speechManager.getVoices();
        
        if (voices.length === 0) {
            await new Promise((resolve) => {
                const checkVoices = () => {
                    voices = this.speechManager.getVoices();
                    if (voices.length > 0) {
                        resolve();
                    } else {
                        setTimeout(checkVoices, 100);
                    }
                };
                
                speechSynthesis.addEventListener('voiceschanged', () => {
                    voices = this.speechManager.getVoices();
                    if (voices.length > 0) {
                        resolve();
                    }
                }, { once: true });
                
                checkVoices();
            });
        }
        
        this.availableVoices = voices;
        
        if (this.elements.voiceSelect) {
            this.elements.voiceSelect.innerHTML = '';
            
            if (voices.length === 0) {
                const option = document.createElement('option');
                option.textContent = 'No voices available';
                this.elements.voiceSelect.appendChild(option);
            } else {
                voices.forEach((voice, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    this.elements.voiceSelect.appendChild(option);
                });
            }
        }
    }
    
    async switchProvider(provider) {
        this.currentProvider = provider;
        
        if (provider === 'utterance') {
            removeClass(this.elements.utteranceSettings, 'hidden');
            addClass(this.elements.vitsSettings, 'hidden');
            await this.loadVoices();
        } else {
            addClass(this.elements.utteranceSettings, 'hidden');
            removeClass(this.elements.vitsSettings, 'hidden');
            this.initializeVits();
        }
    }
    
    async initializeVits() {
        try {
            if (!this.vitsInstance) {
                this.vitsInstance = await import('@diffusionstudio/vits-web');
                await this.loadVitsVoices();
            }
        } catch (error) {
            console.error('Failed to load VITS:', error);
            this.elements.vitsVoiceSelect.innerHTML = '<option>VITS not available</option>';
        }
    }
    
    async loadVitsVoices() {
        if (!this.vitsInstance) return;

        try {
            const availableVoices = await tts.voices();
            console.log(availableVoices)
            this.elements.vitsVoiceSelect.innerHTML = '';
            
            availableVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.id;
                option.textContent = voice.name;
                this.elements.vitsVoiceSelect.appendChild(option);
            });
            
            this.updateDownloadedModels();
        } catch (error) {
            console.error('Failed to load VITS voices:', error);
        }
    }
    
    async loadVitsModel(voiceId) {
        if (!this.vitsInstance || !voiceId) return;
        
        try {
            const progressCallback = (progress) => {
                const percent = Math.round(progress.loaded * 100 / progress.total);
                this.updateModelDownloadProgress(voiceId, percent);
            };
            
            await this.vitsInstance.download(voiceId, progressCallback);
            this.updateDownloadedModels();
        } catch (error) {
            console.error('Failed to load VITS model:', error);
        }
    }

    updateModelDownloadProgress(voiceId, percent) {
        const progressElement = document.getElementById(`progress-${voiceId}`);
        if (progressElement) {
            progressElement.textContent = `Downloading: ${percent}%`;
        } else {
            const item = document.createElement('div');
            item.className = 'model-item downloading';
            item.innerHTML = `
                <span>${voiceId}</span>
                <span id="progress-${voiceId}">Downloading: ${percent}%</span>
            `;
            this.elements.downloadedModels.appendChild(item);
        }
    }
    
    updateDownloadedModels() {
        const downloadedModels = JSON.parse(localStorage.getItem('vits-downloaded-models') || '[]');
        
        this.elements.downloadedModels.innerHTML = '';
        
        if (downloadedModels.length === 0) {
            this.elements.downloadedModels.innerHTML = '<div class="model-item"><span>No models downloaded</span></div>';
        } else {
            downloadedModels.forEach(model => {
                const item = document.createElement('div');
                item.className = 'model-item';
                item.innerHTML = `
                    <span>${model.name}</span>
                    <span>${model.size || 'Unknown size'}</span>
                    <button class="model-delete-btn" onclick="this.removeModel('${model.id}')">Delete</button>
                `;
                this.elements.downloadedModels.appendChild(item);
            });
        }
    }
    
    async testSpeech() {
        const testText = "This is a test of the text-to-speech settings.";
        
        if (this.currentProvider === 'utterance') {
            this.speechManager.speak(testText);
        } else if (this.vitsInstance) {
            try {
                const voiceId = this.elements.vitsVoiceSelect.value;
                if (!voiceId) {
                    alert('Please select a voice first');
                    return;
                }
                
                const wav = await this.vitsInstance.predict({
                    text: testText,
                    voiceId: voiceId
                });
                
                const audio = new Audio();
                audio.src = URL.createObjectURL(wav);
                audio.play();
                
                this.trackDownloadedModel(voiceId);
                
            } catch (error) {
                console.error('VITS speech test failed:', error);
                alert('Speech test failed. The model may need to be downloaded first.');
            }
        }
    }
    
trackDownloadedModel(voiceId) {
    const downloadedModels = JSON.parse(localStorage.getItem('vits-downloaded-models') || '[]');
    const voiceName = this.elements.vitsVoiceSelect.options[this.elements.vitsVoiceSelect.selectedIndex].textContent;
    
    if (!downloadedModels.find(m => m.id === voiceId)) {
        downloadedModels.push({
            id: voiceId,
            name: voiceName,
            downloadedAt: new Date().toISOString()
        });
        localStorage.setItem('vits-downloaded-models', JSON.stringify(downloadedModels));
        this.updateDownloadedModels();
    }
}

async removeModel(voiceId) {
    const downloadedModels = JSON.parse(localStorage.getItem('vits-downloaded-models') || '[]');
    const filtered = downloadedModels.filter(m => m.id !== voiceId);
    localStorage.setItem('vits-downloaded-models', JSON.stringify(filtered));
    
    this.updateDownloadedModels();
}

    resetToDefaults() {
        this.elements.rateSlider.value = 0.8;
        this.elements.rateValue.textContent = '0.8';
        this.elements.pitchSlider.value = 1;
        this.elements.pitchValue.textContent = '1';
        this.elements.volumeSlider.value = 0.8;
        this.elements.volumeValue.textContent = '0.8';
        
        this.elements.vitsSpeedSlider.value = 1.0;
        this.elements.vitsSpeedValue.textContent = '1.0';
        
        this.elements.providerRadios[0].checked = true;
        this.switchProvider('utterance');
        
        this.speechManager.updateSettings({
            speechRate: 0.8,
            speechPitch: 1,
            speechVolume: 0.8
        });
    }
    
    async open() {
        this.isOpen = true;
        addClass(this.elements.modal, 'show');
        
        if (this.currentProvider === 'utterance') {
            await this.loadVoices();
        }
    }
    
    close() {
        this.isOpen = false;
        removeClass(this.elements.modal, 'show');
    }
}