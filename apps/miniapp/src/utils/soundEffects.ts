/**
 * Global sound effects for the app
 */

const audioCache: Map<string, HTMLAudioElement> = new Map();

// Data URIs for sound effects (using web audio synth approach for reliable cross-platform sounds)
const SOUNDS = {
    addToCart: () => {}, // Disabled
    buttonClick: () => {}, // Disabled
    success: () => {}, // Disabled
};

function playBeep(frequency: number = 800, duration: number = 100) {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.value = frequency;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

        osc.start(now);
        osc.stop(now + duration / 1000);
    } catch (e) {
        console.debug('Audio context not available');
    }
}

function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioContext.currentTime;

        // Play a two-note chime
        const notes = [523, 659]; // C5, E5

        notes.forEach((freq, idx) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            const startTime = now + idx * 0.1;
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    } catch (e) {
        console.debug('Audio context not available');
    }
}

export const playSound = {
    addToCart: SOUNDS.addToCart,
    buttonClick: SOUNDS.buttonClick,
    success: SOUNDS.success,
};
