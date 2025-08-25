import { GoogleGenAI, Modality } from '@google/genai';


const MODEL = process.env.GEMINI_MODEL || 'gemini-live-2.5-flash-preview';


/**
* Creates a Gemini Live session and exposes helpers to send input.
*/
export async function createLiveBridge({ systemInstruction = '' } = {}) {
// IMPORTANT: Do not pass API key to the browser. Keep it on server.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// Configure live session
const config = {
responseModalities: [Modality.AUDIO],
systemInstruction,
// Automatic Activity Detection enables barge‑in (interrupt while model speaks)
realtimeInputConfig: {
// defaults are fine; leaving empty uses START_OF_ACTIVITY_INTERRUPTS
},
// Optional: request output transcription alongside audio
outputAudioTranscription: {},
};


const session = await ai.live.connect({
model: MODEL,
config,
callbacks: {
onopen() { console.log('[Live] opened'); },
onmessage() {}, // will be overridden by server/index.js to forward to client
onerror(e) { console.error('[Live] error', e); },
onclose(e) { console.log('[Live] close', e?.reason); },
}
});


// Helpers to send realtime input
async function sendRealtimeInput({ audioBase64, text, audioStreamEnd = false }) {
if (audioBase64) {
await session.sendRealtimeInput({
audio: { data: audioBase64, mimeType: 'audio/pcm;rate=16000' },
});
return;
}
if (typeof text === 'string') {
await session.sendRealtimeInput({ text });
return;
}
if (audioStreamEnd) {
await session.sendRealtimeInput({ audioStreamEnd: true });
}
}


async function close() {
try { session.close(); } catch (_) {}
}


return { session, sendRealtimeInput, close };
}