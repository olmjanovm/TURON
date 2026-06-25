import { env } from '../config.js';

/**
 * AI yo'l-yo'riq yordamchisi (kuryer) — BEPUL modellar, FAQAT server-side.
 *
 *  Tartib:  Gemini (birlamchi, o'zbekchada kuchli)
 *        → Groq  (zaxira, tez)
 *        → mahalliy (AIsiz, ORS burilish turlaridan o'zbekcha qadamlar)
 *
 * Kalitlar `.env`da (GEMINI_API_KEY / GROQ_API_KEY) — kodda/git'da YO'Q.
 * FE marshrut burilishlarini yuboradi (ORS instruction'lari inglizcha bo'lishi
 * mumkin) — LLM ularni sodda o'zbekchaga tarjima + soddalashtiradi.
 */

export interface AiGuidanceManeuver {
  type: string;
  instruction?: string;
  distanceFromStartMeters?: number;
}

export interface AiGuidanceInput {
  orderNumber?: string;
  stageLabel?: string;
  pickupLabel?: string;
  destinationLabel?: string;
  totalDistanceMeters?: number;
  totalDurationSec?: number;
  vehicleMode?: 'auto' | 'pedestrian' | 'bicycle';
  maneuvers?: AiGuidanceManeuver[];
}

export interface AiGuidanceResult {
  guidance: string;
  source: 'gemini' | 'groq' | 'local';
}

const TIMEOUT_MS = 9_000;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function fmtDist(m?: number): string {
  if (m == null) return '';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function fmtDur(s?: number): string {
  if (s == null) return '';
  const min = Math.round(s / 60);
  return min >= 1 ? `${min} daq` : `${Math.round(s)} s`;
}

/** Burilish turini o'zbekcha harakatga aylantirish (mahalliy zaxira + prompt yordami). */
function maneuverActionUz(type: string): string {
  const t = (type || '').toLowerCase();
  if (t.includes('sharp-left') || t.includes('sharp_left')) return 'keskin chapga buriling';
  if (t.includes('sharp-right') || t.includes('sharp_right')) return "keskin o'ngga buriling";
  if (t.includes('slight-left') || t.includes('slight_left')) return 'biroz chapga oling';
  if (t.includes('slight-right') || t.includes('slight_right')) return "biroz o'ngga oling";
  if (t.includes('left')) return 'chapga buriling';
  if (t.includes('right')) return "o'ngga buriling";
  if (t.includes('roundabout')) return 'aylanmaga kiring';
  if (t.includes('u-turn') || t.includes('uturn')) return 'orqaga buriling';
  return "to'g'ri yuring";
}

/** LLM uchun tuzilgan prompt (system + user). */
function buildPrompt(input: AiGuidanceInput): { system: string; user: string } {
  const system =
    "Sen TURON yetkazib berish xizmatining kuryeri uchun yordamchisan. " +
    "Berilgan marshrut burilishlarini SODDA, QISQA o'zbekcha yo'l-yo'riqqa aylantir. " +
    "Qoidalar: faqat o'zbek tilida yoz; har qadamni raqamla (1, 2, 3...); " +
    "qisqa va aniq gaplar (kuryer mashinada/piyoda o'qiydi); masofalarni metr yoki km da ko'rsat; " +
    "ingliz tilidagi ko'cha nomlari/ko'rsatmalarni o'zbekchaga tarjima qil; " +
    "boshida qayerdan boshlashni, oxirida mijozni/manzilni topish bo'yicha qisqa eslatma yoz. " +
    "Ortiqcha gap, kirish so'zi yoki izoh yozma — faqat qadamlar.";

  const lines: string[] = [];
  if (input.stageLabel) lines.push(`Bosqich: ${input.stageLabel}`);
  if (input.pickupLabel) lines.push(`Boshlanish (restoran): ${input.pickupLabel}`);
  if (input.destinationLabel) lines.push(`Manzil (mijoz): ${input.destinationLabel}`);
  const dist = fmtDist(input.totalDistanceMeters);
  const dur = fmtDur(input.totalDurationSec);
  if (dist || dur) lines.push(`Umumiy: ${[dist, dur].filter(Boolean).join(' / ')}`);

  const mans = input.maneuvers ?? [];
  if (mans.length > 0) {
    lines.push('', 'Burilishlar (tartib bilan):');
    mans.forEach((m, i) => {
      const d = fmtDist(m.distanceFromStartMeters);
      const instr = m.instruction?.trim();
      lines.push(`${i + 1}. ${[d, instr || maneuverActionUz(m.type)].filter(Boolean).join(' — ')}`);
    });
  } else {
    lines.push('', "Burilishlar yo'q — to'g'ri yo'nalishda boring.");
  }

  const user =
    'Quyidagi marshrutni kuryer uchun sodda o\'zbekcha qadam-baqadam yo\'l-yo\'riqqa aylantir:\n\n' +
    lines.join('\n');

  return { system, user };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function callGemini(system: string, user: string): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const res = await fetchWithTimeout(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

async function callGroq(system: string, user: string): Promise<string | null> {
  if (!env.GROQ_API_KEY) return null;
  try {
    const res = await fetchWithTimeout(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

/** AIsiz zaxira — ORS burilish turlaridan o'zbekcha qadamlar. DOIM natija qaytaradi. */
function localGuidance(input: AiGuidanceInput): string {
  const steps: string[] = [];
  if (input.pickupLabel) steps.push(`Boshlang'ich: ${input.pickupLabel}`);
  const mans = input.maneuvers ?? [];
  if (mans.length === 0) {
    steps.push("To'g'ri yo'nalishda mijoz manziliga boring.");
  } else {
    mans.forEach((m, i) => {
      const d = fmtDist(m.distanceFromStartMeters);
      steps.push(`${i + 1}. ${[d, maneuverActionUz(m.type)].filter(Boolean).join(' dan keyin ')}`);
    });
  }
  if (input.destinationLabel) steps.push(`Manzilga yeting: ${input.destinationLabel}. Mijoz raqamiga qo'ng'iroq qiling.`);
  return steps.join('\n');
}

export async function getCourierGuidance(input: AiGuidanceInput): Promise<AiGuidanceResult> {
  const { system, user } = buildPrompt(input);

  const gemini = await callGemini(system, user);
  if (gemini) return { guidance: gemini, source: 'gemini' };

  const groq = await callGroq(system, user);
  if (groq) return { guidance: groq, source: 'groq' };

  return { guidance: localGuidance(input), source: 'local' };
}
