export const MORSE_TO_TEXT = {
    '·−': 'A', '−···': 'B', '−·−·': 'C', '−··': 'D', '·': 'E',
    '··−·': 'F', '−−·': 'G', '····': 'H', '··': 'I', '·−−−': 'J',
    '−·−': 'K', '·−··': 'L', '−−': 'M', '−·': 'N', '−−−': 'O',
    '·−−·': 'P', '−−·−': 'Q', '·−·': 'R', '···': 'S', '−': 'T',
    '··−': 'U', '···−': 'V', '·−−': 'W', '−··−': 'X', '−·−−': 'Y',
    '−−··': 'Z', '·−−−−': '1', '··−−−': '2', '···−−': '3', '····−': '4',
    '·····': '5', '−····': '6', '−−···': '7', '−−−··': '8', '−−−−·': '9',
    '−−−−−': '0'
};

export const DEFAULT_SETTINGS = {
    threshold: 30,
    dotLength: 120,
    dashMultiplier: 1.6,
    letterGap: 650,
    wordGap: 4000,
    autoCommitTime: 3000,
    autoSpeak: false
};

export const DEFAULT_TEXT_SHORTCUTS = {
    'TK': 'thank you',
    'PLS': 'please',
    'THX': 'thanks',
    'OK': 'okay',
    'BRB': 'be right back',
    'TTYL': 'talk to you later'
};

export const DEFAULT_MORSE_SHORTCUTS = {
    '−·−·−−': 'Fantastic',
    '·−·−·−': 'Excellent',
    '−−··−−': 'Good job',
    '···−−−···': 'SOS',
    '−·−−·−': 'Start of message',
    '·−·−·': 'End of message'
};

export const AUDIO_CONFIG = {
    fftSize: 256,
    smoothingTimeConstant: 0.3,
    maxHistoryLength: 200
};

export const SECTIONS = {
    AUDIO: 'audio',
    PROFILES: 'profiles'
};

export const SYMBOLS = {
    DOT: '·',
    DASH: '−'
};

export const STATUS_TYPES = {
    GRANTED: 'status-granted',
    DENIED: 'status-denied',
    PROMPT: 'status-prompt'
};