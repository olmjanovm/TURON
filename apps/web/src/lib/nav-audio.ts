'use client';

/**
 * Navigator audio — Web Speech API (Uzbek TTS) + Web Audio beep.
 * - Uzbek/Russian/English overlap'i bilan — qaysi voice topilsa
 * - Dedup: bir xil matn 8s ichida 2-marta o'qilmaydi
 * - Cancel queue — yangi gap eski queue'ni to'xtatadi
 */

let cachedVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    // Fallback timeout
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 1500);
  });
}

async function getBestVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice) return cachedVoice;
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = await loadVoices();
  // O'zbekcha → Russcha (Cyrillic baseline) → inglizcha
  const langPriority = ['uz', 'ru', 'en-US', 'en-GB', 'en'];
  for (const lang of langPriority) {
    const found = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (found) {
      cachedVoice = found;
      return found;
    }
  }
  cachedVoice = voices[0] ?? null;
  return cachedVoice;
}

const dedupMap = new Map<string, number>();
const SPEAK_DEDUP_MS = 8_000;
let enabled = true;

export function isVoiceEnabled(): boolean {
  return enabled;
}

export function setVoiceEnabled(v: boolean): void {
  enabled = v;
  if (!v) cancelSpeech();
}

/** Speak with dedup. key=text by default. */
export async function speak(text: string, opts?: { key?: string; rate?: number; pitch?: number }): Promise<void> {
  if (!enabled) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const key = opts?.key ?? text;
  const now = Date.now();
  const last = dedupMap.get(key) ?? 0;
  if (now - last < SPEAK_DEDUP_MS) return;
  dedupMap.set(key, now);

  // Eski queue'ni to'xtatish
  try {
    window.speechSynthesis.cancel();
  } catch {/* */}

  const voice = await getBestVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'uz-UZ';
  utterance.rate = opts?.rate ?? 1.05;
  utterance.pitch = opts?.pitch ?? 1.0;
  utterance.volume = 1.0;

  try {
    window.speechSynthesis.speak(utterance);
  } catch {/* swallow */}
}

export function cancelSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {/* */}
}

// ── Beep — Web Audio sintezi ────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
let beepEnabled = true;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  const AC =
    window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    audioCtx = new AC();
  } catch {/* */}
  return audioCtx;
}

export function setBeepEnabled(v: boolean): void {
  beepEnabled = v;
}

let lastBeepAt = 0;
const BEEP_THROTTLE_MS = 1500;

/** Yumshoq beep — radar/ogohlantirish uchun. */
export function beep(frequency = 880, durationMs = 180): void {
  if (!beepEnabled) return;
  const now = Date.now();
  if (now - lastBeepAt < BEEP_THROTTLE_MS) return;
  lastBeepAt = now;

  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {/* */});

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'sine';
    // ADSR envelope — qulay tovush
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + durationMs / 1000 + 0.05);
  } catch {/* */}
}

/**
 * Maneuver xabarini matni — Uzbekcha.
 */
export function maneuverPhrase(type: string, distanceMeters: number | null): string {
  const t = type.toLowerCase();
  let action = "to'g'ri yuring";
  if (t.includes('sharp-left') || t.includes('sharp_left')) action = "keskin chapga buriling";
  else if (t.includes('sharp-right') || t.includes('sharp_right')) action = "keskin o'ngga buriling";
  else if (t.includes('slight-left') || t.includes('slight_left')) action = "biroz chapga oling";
  else if (t.includes('slight-right') || t.includes('slight_right')) action = "biroz o'ngga oling";
  else if (t.includes('left')) action = "chapga buriling";
  else if (t.includes('right')) action = "o'ngga buriling";
  else if (t.includes('roundabout')) action = "aylanmaga kiring";
  else if (t.includes('u-turn') || t.includes('uturn')) action = "orqaga buriling";

  if (distanceMeters == null) return action.charAt(0).toUpperCase() + action.slice(1);
  if (distanceMeters < 50) return `Hozir ${action}`;
  if (distanceMeters < 150) return `100 metrdan keyin ${action}`;
  if (distanceMeters < 600) return `${Math.round(distanceMeters / 100) * 100} metrdan keyin ${action}`;
  return `${(distanceMeters / 1000).toFixed(1)} kilometrdan keyin ${action}`;
}
