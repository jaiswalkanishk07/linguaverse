// Sarvam AI Voice Integration — STT & TTS
// https://docs.sarvam.ai/

const SARVAM_KEY = process.env.NEXT_PUBLIC_SARVAM_API_KEY || "";
const TIMEOUT_MS = 8000;

export type SarvamLanguage = "hi-IN" | "ta-IN" | "en-IN";

/**
 * Map the UI language level to Sarvam language codes
 */
export function mapLanguageToSarvam(langLevel: string): SarvamLanguage {
    if (langLevel.startsWith("ta")) return "ta-IN";
    if (langLevel.startsWith("hi")) return "hi-IN";
    return "en-IN"; // default: English
}

/**
 * Speech-to-Text using Sarvam API
 * Takes a recorded audio Blob (WebM) and returns the transcript string
 */
export async function sarvamSTT(
    audioBlob: Blob,
    languageCode: SarvamLanguage = "hi-IN"
): Promise<string> {
    if (!SARVAM_KEY) throw new Error("Sarvam API key not configured");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");
        formData.append("language_code", languageCode);
        formData.append("model", "saaras:v3");

        const res = await fetch("https://api.sarvam.ai/speech-to-text", {
            method: "POST",
            headers: { "api-subscription-key": SARVAM_KEY },
            body: formData,
            signal: controller.signal,
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            throw new Error(`STT failed (${res.status}): ${errText}`);
        }

        const data = await res.json();
        return data.transcript || "";
    } catch (err: any) {
        if (err.name === "AbortError") throw new Error("STT timed out");
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Text-to-Speech using Sarvam API
 * Takes text and speaks it via the browser's AudioContext
 * Returns a Promise that resolves when speech finishes
 */
export async function sarvamTTS(
    text: string,
    languageCode: SarvamLanguage = "hi-IN"
): Promise<void> {
    if (!SARVAM_KEY) {
        console.warn("Sarvam API key not configured, skipping TTS");
        return;
    }

    // Strip emojis and special characters that confuse TTS
    const cleanText = text.replace(/[✅❌⚠️🔍📦📒📊📈🙏•🎙️]/g, "").replace(/\s+/g, " ").trim();
    if (!cleanText) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch("https://api.sarvam.ai/text-to-speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-subscription-key": SARVAM_KEY,
            },
            body: JSON.stringify({
                inputs: [cleanText.slice(0, 500)],
                target_language_code: languageCode,
                speaker: "manisha",
                model: "bulbul:v2",
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            console.error(`TTS failed (${res.status}):`, errBody);
            return;
        }

        const data = await res.json();
        const base64Audio = data.audios?.[0];
        if (!base64Audio) {
            console.warn("TTS: No audio data in response");
            return;
        }

        // Decode base64 to binary
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Use Audio element instead of AudioContext (avoids autoplay policy blocks)
        const blob = new Blob([bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        return new Promise<void>((resolve) => {
            audio.onended = () => {
                URL.revokeObjectURL(url);
                resolve();
            };
            audio.onerror = () => {
                console.error("TTS: Audio playback error");
                URL.revokeObjectURL(url);
                resolve();
            };
            audio.play().catch((e) => {
                console.error("TTS: play() blocked:", e);
                URL.revokeObjectURL(url);
                resolve();
            });
        });
    } catch (err: any) {
        if (err.name === "AbortError") console.error("TTS timed out");
        else console.error("TTS error:", err);
    } finally {
        clearTimeout(timer);
    }
}
