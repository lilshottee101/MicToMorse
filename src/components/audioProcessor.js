import { AUDIO_CONFIG, SYMBOLS } from '@utils/constants.js';
import { $id, setStyle } from '@utils/dom.js';

export class AudioProcessor {
    constructor(settings = {}) {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isListening = false;
        
        this.volumeHistory = [];
        this.currentSignalStart = null;
        this.currentGapStart = null;
        this.isSignalActive = false;
        
        this.threshold = settings.threshold || 30;
        this.dotLength = settings.dotLength || 120;
        this.dashMultiplier = settings.dashMultiplier || 1.6;
        
        this.elements = {
            volumeHistory: $id('volumeHistory'),
            thresholdLine: $id('thresholdLine'),
            micStatus: $id('micStatus'),
            currentSignal: $id('currentSignal'),
            signalDuration: $id('signalDuration'),
            gapDuration: $id('gapDuration'),
            lastSymbol: $id('lastSymbol')
        };
        
        this.onSignal = null;
        this.onGap = null;
        this.onVolumeUpdate = null;
        
        this.updateThresholdLine();
    }
    
        async startListening() {
        try {
            this.updateMicStatus('Requesting...', 'status-prompt');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            this.updateMicStatus('Granted', 'status-granted');
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser.fftSize = AUDIO_CONFIG.fftSize;
            this.analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;
            this.microphone.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.isListening = true;
            this.analyze();
            
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.updateMicStatus('Denied', 'status-denied');
            throw new Error('Microphone access denied. Please allow microphone access and refresh the page.');
        }
    }
    
        stopListening() {
        this.isListening = false;
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.microphone = null;
        this.analyser = null;
        this.dataArray = null;
        
        if (this.currentSignalStart && this.isSignalActive) {
            const duration = Date.now() - this.currentSignalStart;
            this.processSignal(duration);
        }
        
        this.isSignalActive = false;
        this.currentSignalStart = null;
        this.currentGapStart = null;
    }
    
        analyze() {
        if (!this.isListening) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        const rms = Math.sqrt(sum / this.dataArray.length);
        const volume = (rms / 255) * 100;
        
        this.volumeHistory.push(volume);
        if (this.volumeHistory.length > AUDIO_CONFIG.maxHistoryLength) {
            this.volumeHistory.shift();
        }
        
        this.updateVolumeVisualization();
        
        const now = Date.now();
        const isAboveThreshold = volume > this.threshold;
        
        if (isAboveThreshold && !this.isSignalActive) {
            this.isSignalActive = true;
            this.currentSignalStart = now;
            
            if (this.currentGapStart) {
                const gapDuration = now - this.currentGapStart;
                this.updateGapDisplay(gapDuration);
                this.processGap(gapDuration);
            }
            
            this.updateSignalDisplay('Signal');
            
        } else if (!isAboveThreshold && this.isSignalActive) {
            this.isSignalActive = false;
            this.currentGapStart = now;
            
            if (this.currentSignalStart) {
                const signalDuration = now - this.currentSignalStart;
                this.updateSignalDurationDisplay(signalDuration);
                this.processSignal(signalDuration);
            }
            
            this.updateSignalDisplay('Gap');
        }
        
        if (this.isSignalActive && this.currentSignalStart) {
            this.updateSignalDurationDisplay(now - this.currentSignalStart);
        } else if (!this.isSignalActive && this.currentGapStart) {
            this.updateGapDisplay(now - this.currentGapStart);
        }
        
        if (this.onVolumeUpdate) {
            this.onVolumeUpdate(volume);
        }
        
        requestAnimationFrame(() => this.analyze());
    }
    
        processSignal(duration) {
        const dashThreshold = this.dotLength * this.dashMultiplier;
        const symbol = duration >= dashThreshold ? SYMBOLS.DASH : SYMBOLS.DOT;
        
        this.updateLastSymbol(symbol, duration);
        
        if (this.onSignal) {
            this.onSignal(symbol, duration);
        }
    }
    
        processGap(duration) {
        if (this.onGap) {
            this.onGap(duration);
        }
    }
    
        updateSettings(settings) {
        if (settings.threshold !== undefined) {
            this.threshold = settings.threshold;
            this.updateThresholdLine();
        }
        
        if (settings.dotLength !== undefined) {
            this.dotLength = settings.dotLength;
        }
        
        if (settings.dashMultiplier !== undefined) {
            this.dashMultiplier = settings.dashMultiplier;
        }
    }
    
        clearHistory() {
        this.volumeHistory = [];
        this.updateVolumeVisualization();
        this.updateSignalDisplay('-');
        this.updateSignalDurationDisplay(0);
        this.updateGapDisplay(0);
        this.updateLastSymbol('-', 0);
    }
    
        updateMicStatus(text, className) {
        if (this.elements.micStatus) {
            this.elements.micStatus.textContent = text;
            this.elements.micStatus.className = className;
        }
    }
    
        updateThresholdLine() {
        if (this.elements.thresholdLine) {
            setStyle(this.elements.thresholdLine, 'bottom', `${this.threshold}%`);
        }
    }
    
        updateVolumeVisualization() {
        if (!this.elements.volumeHistory) return;
        
        this.elements.volumeHistory.innerHTML = '';
        
        this.volumeHistory.forEach(volume => {
            const bar = document.createElement('div');
            bar.className = 'volume-bar-history';
            bar.style.height = `${Math.min(volume * 1.5, 100)}%`;
            
            if (volume > this.threshold) {
                bar.classList.add('above-threshold');
            }
            
            this.elements.volumeHistory.appendChild(bar);
        });
    }
    
        updateSignalDisplay(text) {
        if (this.elements.currentSignal) {
            this.elements.currentSignal.textContent = text;
        }
    }
    
        updateSignalDurationDisplay(duration) {
        if (this.elements.signalDuration) {
            this.elements.signalDuration.textContent = `${Math.round(duration)}ms`;
        }
    }
    
        updateGapDisplay(duration) {
        if (this.elements.gapDuration) {
            this.elements.gapDuration.textContent = `${Math.round(duration)}ms`;
        }
    }
    
        updateLastSymbol(symbol, duration) {
        if (this.elements.lastSymbol) {
            this.elements.lastSymbol.textContent = `${symbol} (${Math.round(duration)}ms)`;
        }
    }
    
        getCurrentVolume() {
        if (!this.dataArray || !this.analyser) return 0;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        const rms = Math.sqrt(sum / this.dataArray.length);
        return (rms / 255) * 100;
    }
    
        getAudioContextState() {
        return this.audioContext?.state || 'closed';
    }
    
        async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
        getVolumeStats() {
        if (this.volumeHistory.length === 0) {
            return { min: 0, max: 0, avg: 0, current: 0 };
        }
        
        const min = Math.min(...this.volumeHistory);
        const max = Math.max(...this.volumeHistory);
        const sum = this.volumeHistory.reduce((a, b) => a + b, 0);
        const avg = sum / this.volumeHistory.length;
        const current = this.volumeHistory[this.volumeHistory.length - 1] || 0;
        
        return { min, max, avg: Math.round(avg), current: Math.round(current) };
    }
    
        calibrateThreshold(samples = 100) {
        return new Promise((resolve) => {
            if (!this.isListening) {
                resolve(null);
                return;
            }
            
            const calibrationSamples = [];
            let sampleCount = 0;
            
            const collectSample = () => {
                const volume = this.getCurrentVolume();
                calibrationSamples.push(volume);
                sampleCount++;
                
                if (sampleCount < samples) {
                    setTimeout(collectSample, 50);
                } else {
                    const maxVolume = Math.max(...calibrationSamples);
                    const avgVolume = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length;
                    const recommendedThreshold = Math.max(avgVolume + 10, maxVolume * 0.3);
                    
                    resolve({
                        samples: calibrationSamples,
                        maxVolume: Math.round(maxVolume),
                        avgVolume: Math.round(avgVolume),
                        recommendedThreshold: Math.round(recommendedThreshold),
                        currentThreshold: this.threshold
                    });
                }
            };
            
            collectSample();
        });
    }
    
        setOnSignal(callback) {
        this.onSignal = callback;
    }
    
        setOnGap(callback) {
        this.onGap = callback;
    }
    
        setOnVolumeUpdate(callback) {
        this.onVolumeUpdate = callback;
    }
    
        getDebugInfo() {
        return {
            isListening: this.isListening,
            audioContextState: this.getAudioContextState(),
            settings: {
                threshold: this.threshold,
                dotLength: this.dotLength,
                dashMultiplier: this.dashMultiplier
            },
            state: {
                isSignalActive: this.isSignalActive,
                volumeHistoryLength: this.volumeHistory.length,
                currentSignalStart: this.currentSignalStart,
                currentGapStart: this.currentGapStart
            },
            volumeStats: this.getVolumeStats()
        };
    }
}