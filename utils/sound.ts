// Simple Web Audio Synthesizer for UI Sounds
// Directly checks localStorage to avoid stale state in long-lived sessions.

let audioCtx: AudioContext | null = null;

const getContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
};

const getSettings = () => {
    try {
        const saved = localStorage.getItem('user_settings');
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.warn("Sound logic: settings parse failure", e);
    }
    return null;
};

export const playUISound = (type: 'click' | 'toggle' | 'success' | 'error' | 'hero' | 'navigation') => {
    const settings = getSettings();
    
    // STRICT AUDIT COMPLIANCE: If soundEffects is explicitly FALSE, or settings are missing, return immediately.
    if (!settings || settings.soundEffects === false) return;
    
    const masterVol = settings.volume ?? 1;
    if (masterVol === 0) return;

    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
        case 'click':
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
            gain.gain.setValueAtTime(0.04 * masterVol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.start(now);
            osc.stop(now + 0.03);
            break;

        case 'toggle':
            osc.type = 'square';
            osc.frequency.setValueAtTime(250, now);
            gain.gain.setValueAtTime(0.02 * masterVol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
            break;

        case 'navigation':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(550, now + 0.1);
            gain.gain.setValueAtTime(0.04 * masterVol, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;

        case 'success':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.06 * masterVol, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;

        case 'hero':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.linearRampToValueAtTime(1000, now + 0.1);
            gain.gain.setValueAtTime(0.03 * masterVol, now); 
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;

        case 'error':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.12);
            gain.gain.setValueAtTime(0.08 * masterVol, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
            break;
    }
};