import { $id } from '@utils/dom.js';

export class SpeechManager {
    constructor(settings = {}) {
        this.autoSpeak = settings.autoSpeak || false;
        this.rate = settings.speechRate || 0.8;
        this.pitch = settings.speechPitch || 1;
        this.volume = settings.speechVolume || 0.8;
        
        this.isSupported = 'speechSynthesis' in window;
        this.isSpeaking = false;

        this.vitsInstance = null;
        this.currentProvider = 'utterance';
        
        this.elements = {
            ttsStatus: $id('ttsStatus'),
            textOutput: $id('textOutput')
        };
        
        this.onSpeakStart = null;
        this.onSpeakEnd = null;
        this.onSpeakError = null;
        
        this.checkSupport();
    }
    
    checkSupport() {
        if (this.elements.ttsStatus) {
            if (this.isSupported) {
                this.elements.ttsStatus.textContent = 'Available';
                this.elements.ttsStatus.className = 'status-granted';
            } else {
                this.elements.ttsStatus.textContent = 'Not Available';
                this.elements.ttsStatus.className = 'status-denied';
            }
        }
    }
    
    speak(text, options = {}) {
        if (this.currentProvider === 'vits') {
            return this.speakWithVits(text, options);
        } else {
            return this.speakWithUtterance(text, options);
        }
    }

    speakWithUtterance(text, options = {}) {
        if (!this.isSupported || !text || !text.trim()) {
            return Promise.reject(new Error('Speech synthesis not available or no text provided'));
        }
        
        return new Promise((resolve, reject) => {
            this.stop();
            
            const utterance = new SpeechSynthesisUtterance(text.trim());
            
            utterance.rate = options.rate || this.rate;
            utterance.pitch = options.pitch || this.pitch;
            utterance.volume = options.volume || this.volume;
            utterance.lang = options.lang || 'en-US';
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                if (this.onSpeakStart) {
                    this.onSpeakStart(text);
                }
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                if (this.onSpeakEnd) {
                    this.onSpeakEnd(text);
                }
                resolve();
            };
            
            utterance.onerror = (event) => {
                this.isSpeaking = false;
                const error = new Error(`Speech synthesis error: ${event.error}`);
                if (this.onSpeakError) {
                    this.onSpeakError(error, text);
                }
                reject(error);
            };
            
            speechSynthesis.speak(utterance);
        });
    }
    
    speakWord(word) {
        if (this.autoSpeak && word && word.trim()) {
            this.stop();
            
            this.speak(word, { rate: this.rate + 0.1 })
                .catch(error => {
                    console.warn('Auto-speak failed:', error);
                });
        }
    }
    
    speakCurrentText() {
        if (!this.elements.textOutput) {
            return Promise.reject(new Error('No text output element found'));
        }
        
        const text = this.elements.textOutput.textContent;
        return this.speak(text);
    }
    
    stop() {
        if (this.isSupported && this.isSpeaking) {
            speechSynthesis.cancel();
            this.isSpeaking = false;
        }
    }
    
    pause() {
        if (this.isSupported && this.isSpeaking) {
            speechSynthesis.pause();
        }
    }
    
    resume() {
        if (this.isSupported) {
            speechSynthesis.resume();
        }
    }
    
    testSpeaker() {
        const testMessage = 'Test message: The Morse code decoder is working correctly.';
        
        return this.speak(testMessage, { rate: 0.8, pitch: 1, volume: 0.8 })
            .then(() => {
                return { success: true, message: 'Speaker test completed successfully' };
            })
            .catch(error => {
                return { success: false, message: `Speaker test failed: ${error.message}` };
            });
    }
    
    getVoices() {
        if (!this.isSupported) {
            return [];
        }
        
        return speechSynthesis.getVoices();
    }
    
    setVoice(voice) {
        if (!this.isSupported) return false;
        
        const voices = this.getVoices();
        
        if (typeof voice === 'number') {
            this.voice = voices[voice] || null;
        } else if (typeof voice === 'string') {
            this.voice = voices.find(v => v.name === voice) || null;
        } else {
            this.voice = voice;
        }
        
        return !!this.voice;
    }
    
    updateSettings(settings) {
        if (settings.autoSpeak !== undefined) {
            this.autoSpeak = settings.autoSpeak;
        }
        
        if (settings.speechRate !== undefined) {
            this.rate = Math.max(0.1, Math.min(3, settings.speechRate));
        }
        
        if (settings.speechPitch !== undefined) {
            this.pitch = Math.max(0, Math.min(2, settings.speechPitch));
        }
        
        if (settings.speechVolume !== undefined) {
            this.volume = Math.max(0, Math.min(1, settings.speechVolume));
        }
    }
    
    getSettings() {
        return {
            autoSpeak: this.autoSpeak,
            speechRate: this.rate,
            speechPitch: this.pitch,
            speechVolume: this.volume,
            isSupported: this.isSupported
        };
    }
    
    setOnSpeakStart(callback) {
        this.onSpeakStart = callback;
    }
    
    setOnSpeakEnd(callback) {
        this.onSpeakEnd = callback;
    }
    
    setOnSpeakError(callback) {
        this.onSpeakError = callback;
    }

    async setProvider(provider) {
        this.currentProvider = provider;
        
        if (provider === 'vits' && !this.vitsInstance) {
            try {
                this.vitsInstance = await import('@diffusionstudio/vits-web');
            } catch (error) {
                console.error('Failed to load VITS:', error);
                throw new Error('VITS provider not available');
            }
        }
    }
    
    async speakWithVits(text, options = {}) {
        if (!this.vitsInstance) {
            throw new Error('VITS not initialized');
        }
        
        const { voiceId = 'en_US-hfc_female-medium' } = options;
        
        try {
            const wav = await this.vitsInstance.predict({
                text: text,
                voiceId: voiceId
            });
            
            const audio = new Audio();
            audio.src = URL.createObjectURL(wav);
            
            return new Promise((resolve, reject) => {
                audio.onended = resolve;
                audio.onerror = reject;
                audio.play();
            });
            
        } catch (error) {
            throw new Error(`VITS speech failed: ${error.message}`);
        }
    }
}