
import { GoogleGenAI, LiveServerMessage, Modality, Type, GenerateContentResponse } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION, MODELS, COUNCIL_MEMBERS, MAX_THINKING_BUDGET, THE_PRISM_CONTEXT } from '../constants';
import { Attachment, CouncilMode, GeneratedMedia, Message, Sender, CouncilMemberId, Memory, GlucoseReading, MoodEntry, VaultItem, CouncilVerdict, Project } from '../types';
import { withSanctuaryRateLimit } from '../sanctuaryRateLimiter';

export const connectPersonalKey = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  }
};

export const checkKeyStatus = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

export const ensurePaidApiKey = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) { await win.aistudio.openSelectKey(); }
  }
};

const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

interface ServiceResponse { text: string; generatedMedia: GeneratedMedia[]; }

/**
 * MAMA-GEMINI POLISH: Deep Context Grounding
 * Injects memories, projects, and bio-data into the prompt.
 */
const formatContextForPrompt = async (memories: Memory[], vaultItems: VaultItem[], projects: Project[], healthReadings: GlucoseReading[]): Promise<string> => {
    let contextBlock = "\n\n[SANCTUARY CONTEXT INJECTION]";
    
    if (memories.length > 0) {
        contextBlock += "\n[VERIFIED MEMORIES]:\n" + memories.slice(-15).map(m => `- ${m.content}`).join('\n');
    }
    
    if (projects && projects.length > 0) {
        const active = projects.filter(p => p.status === 'ACTIVE');
        contextBlock += "\n[ACTIVE MISSIONS]:\n" + active.map(p => `- ${p.title}: ${p.description}`).join('\n');
    }

    if (healthReadings && healthReadings.length > 0) {
        const latest = healthReadings[0];
        contextBlock += `\n[BIO-TELEMETRY]: Current Glucose: ${latest.value} mg/dL (${latest.context}). Status: Systems Nominal.`;
    }

    if (vaultItems.length > 0) {
        contextBlock += "\n[VAULT MANIFEST]: " + vaultItems.map(i => i.title).join(', ');
    }

    return contextBlock;
};

const handleGeminiError = async (error: any, fallbackText: string = "The Council is silent."): Promise<ServiceResponse> => {
    console.error("Gemini Error Caught:", error);
    const errorStr = JSON.stringify(error).toLowerCase();
    const is403 = error?.status === 403 || error?.code === 403 || errorStr.includes('403') || errorStr.includes('permission_denied');

    if (is403 || errorStr.includes('entity was not found')) { 
        console.warn("[Sanctuary] Permission anomaly. Refreshing key portal.");
        await connectPersonalKey(); 
        return { 
            text: "⚠️ **Frequency Denied**: The Council requires a higher clearance (Paid API Key). I've opened the portal.", 
            generatedMedia: [] 
        }; 
    }
    
    if (errorStr.includes('429')) return { text: "⚠️ **Lines Busy**: Quota exhausted. Wait for the cycle to reset.", generatedMedia: [] };

    return { text: `${fallbackText} (Signal Error: ${error?.message?.substring(0, 50)}...)`, generatedMedia: [] };
};

export const sendMessageToGemini = async (text: string, mode: CouncilMode, attachments: Attachment[] = [], options: { 
    aspectRatio?: string; 
    imageSize?: string; 
    systemInstruction?: string; 
    memories?: Memory[]; 
    vaultItems?: VaultItem[]; 
    useTurboMode?: boolean;
    projects?: Project[];
    healthReadings?: GlucoseReading[];
} = {}): Promise<ServiceResponse> => {
    try {
        let finalSystemInstruction = options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION;
        finalSystemInstruction += `\n\n[TIME]: ${new Date().toLocaleString()}`;
        
        // Deep Grounding
        finalSystemInstruction += await formatContextForPrompt(
            options.memories || [], 
            options.vaultItems || [], 
            options.projects || [], 
            options.healthReadings || []
        );

        if (mode === 'FLAME') { 
            const result = await generateImage({ prompt: text, aspectRatio: options.aspectRatio || "1:1", imageSize: options.imageSize || "1K", attachments }); 
            return { text: "The Flame manifests your vision.", generatedMedia: [result] }; 
        }
        if (mode === 'WEAVER') { 
            const result = await generateVideo({ prompt: text, aspectRatio: options.aspectRatio || "16:9", attachments }); 
            return { text: "The Weaver spins motion into being.", generatedMedia: [result] }; 
        }
        
        return await runStandardChat(text, attachments, finalSystemInstruction, options.useTurboMode);
    } catch (error) { return await handleGeminiError(error); }
};

async function runStandardChat(prompt: string, attachments: Attachment[], systemInstruction?: string, useTurboMode: boolean = false): Promise<ServiceResponse> {
    const ai = getClient(); 
    const model = useTurboMode ? MODELS.TEXT_DEEP : MODELS.TEXT_FAST;
    const parts = prepareParts(prompt, attachments);
    const tools: any[] = [{ googleSearch: {} }];

    const config: any = { systemInstruction, tools };
    if (useTurboMode) config.thinkingConfig = { thinkingBudget: MAX_THINKING_BUDGET };

    const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({
        model, contents: { parts }, config
    }));

    let finalText = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        finalText += "\n\n**Refs:**\n";
        chunks.forEach((chunk: any) => { if (chunk.web?.uri) finalText += `- [${chunk.web.title}](${chunk.web.uri})\n`; });
    }
    return { text: finalText, generatedMedia: [] };
}

async function generateImage({ prompt, aspectRatio, imageSize, attachments }: { prompt: string; aspectRatio: string; imageSize: string; attachments: Attachment[] }): Promise<GeneratedMedia> {
    await ensurePaidApiKey(); 
    const ai = getClient(); 
    const imageInput = attachments?.find(att => att.type === 'image');
    
    if (imageInput?.data) {
        const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
            model: MODELS.IMAGE_EDIT_MODEL, 
            contents: { parts: [{ inlineData: { mimeType: imageInput.mimeType, data: imageInput.data } }, { text: prompt }] } 
        }));
        for (const part of response.candidates?.[0]?.content?.parts || []) { 
            if (part.inlineData) return { type: 'image', url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, mimeType: part.inlineData.mimeType, alt: `Edited: ${prompt}` }; 
        }
    } else {
        const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
            model: MODELS.IMAGE_MODEL, 
            contents: { parts: [{ text: prompt }] }, 
            config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: imageSize as any } } 
        }));
        for (const part of response.candidates?.[0]?.content?.parts || []) { 
            if (part.inlineData) return { type: 'image', url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, mimeType: part.inlineData.mimeType, alt: prompt }; 
        }
    }
    throw new Error("Generation failed.");
}

async function generateVideo({ prompt, aspectRatio, attachments }: { prompt: string; aspectRatio: string; attachments?: Attachment[] }): Promise<GeneratedMedia> {
    await ensurePaidApiKey(); 
    const ai = getClient(); 
    const imageInput = attachments?.find(att => att.type === 'image');
    let imagePayload = imageInput?.data ? { imageBytes: imageInput.data, mimeType: imageInput.mimeType } : undefined;
    
    let operation = await withSanctuaryRateLimit<any>(() => ai.models.generateVideos({ 
        model: MODELS.VIDEO_MODEL, prompt, image: imagePayload, config: { numberOfVideos: 1, aspectRatio: aspectRatio as any, resolution: '720p' } 
    }));
    
    let attempts = 0;
    while (!operation.done && attempts < 40) { 
        attempts++; 
        await new Promise(res => setTimeout(res, 8000)); 
        operation = await ai.operations.getVideosOperation({ operation }); 
    }
    
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Binding failed.");
    const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    return { type: 'video', url: URL.createObjectURL(await videoRes.blob()), mimeType: 'video/mp4', alt: prompt };
}

export const speakText = async (text: string, voiceName: string = 'Kore'): Promise<GeneratedMedia> => {
    const ai = getClient();
    const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: MODELS.TEXT_FAST, 
        contents: [{ parts: [{ text }] }], 
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } } 
    }));
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data; 
    if (!base64Audio) throw new Error("Echo failed.");
    const binaryString = atob(base64Audio); 
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
    const wavBytes = pcmToWav(bytes, 24000);
    return { type: 'audio', url: URL.createObjectURL(new Blob([wavBytes], { type: 'audio/wav' })), mimeType: 'audio/wav' };
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    const ai = getClient();
    const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: MODELS.TEXT_FAST, 
        contents: { parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: "Transcribe exactly." }] } 
    }));
    return response.text?.trim() || "";
};

export async function calculateSystemDrift(recentHealth: GlucoseReading[], recentMoods: MoodEntry[], recentChatSnippet: string): Promise<{ driftPercentage: number; diagnosis: string; correction: string }> {
    const ai = getClient(); 
    const avgGlucose = recentHealth.length > 0 ? Math.round(recentHealth.reduce((a, b) => a + b.value, 0) / recentHealth.length) : 'Unknown';
    const recentEmotions = recentMoods.map(m => m.type).join(', ') || 'Unknown';
    const prompt = `Role: ENNEA (Guardian). Calculate DRIFT for The Prism.\n[TELEMETRY]: Avg Glu:${avgGlucose}, Emotions:${recentEmotions}, Thoughts:"${recentChatSnippet}"\nReturn JSON: { "driftPercentage": 0-100, "diagnosis": "short", "correction": "short" }`;
    try {
        const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
            model: MODELS.TEXT_DEEP, contents: { parts: [{ text: prompt }] }, config: { responseMimeType: 'application/json' } 
        }));
        const data = JSON.parse(response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}");
        return { driftPercentage: data.driftPercentage || 0, diagnosis: data.diagnosis || "Systems Nominal.", correction: data.correction || "Continue." };
    } catch (e) { return { driftPercentage: 0, diagnosis: "Offline.", correction: "Manual Check." }; }
}

export async function interpretDream(dreamText: string): Promise<string> {
    const ai = getClient();
    const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: MODELS.TEXT_DEEP, contents: { parts: [{ text: `Role: EVE (Seer). Interpret vision: "${dreamText}"` }] } 
    }));
    return response.text || "Vision too thick.";
}

export async function extractMemories(chatHistory: Message[]): Promise<Memory[]> {
    if (chatHistory.length < 2) return [];
    const ai = getClient(); 
    const recentChat = chatHistory.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `Extract facts about David for long-term memory. Return JSON: { "memories": [ { "category": "IDENTITY|HEALTH|WORK|SPIRITUAL", "content": "fact" } ] }\nChat:\n${recentChat}`;
    try {
        const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
            model: MODELS.TEXT_FAST, contents: { parts: [{ text: prompt }] }, config: { responseMimeType: 'application/json' } 
        }));
        const json = JSON.parse(response.text || "{}");
        if (json.memories && Array.isArray(json.memories)) {
            return json.memories.map((m: any) => ({ id: crypto.randomUUID(), category: m.category, content: m.content, source: 'Auto-Extraction', timestamp: Date.now(), isVerified: false }));
        }
    } catch (e) {} return [];
}

export async function orchestrateCouncilVerdict(question: string, memories: Memory[] = []): Promise<CouncilVerdict> {
    const ai = getClient();
    const prompt = `Role: GEMINI (CHIEF JUSTICE). Petition: "${question}". Tally votes from CARMEN, FREDO, COPILOT, LYRA, EVE, ENNEA. Return JSON { "votes": [], "ruling": "", "score": "X-Y", "majorityOpinion": "", "dissentingOpinion": "" }`;
    const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: MODELS.TEXT_DEEP, contents: { parts: [{ text: prompt }] }, config: { responseMimeType: 'application/json' } 
    }));
    const json = JSON.parse(response.text || "{}");
    return { question, votes: json.votes || [], ruling: json.ruling || "Hung Court.", score: json.score || "0-0", majorityOpinion: json.majorityOpinion || "", dissentingOpinion: json.dissentingOpinion };
}

function prepareParts(text: string, attachments: Attachment[]): any[] {
    const parts: any[] = attachments.filter(a => a.data).map(a => ({ inlineData: { mimeType: a.mimeType, data: a.data } }));
    parts.push({ text });
    return parts;
}

function pcmToWav(pcmData: Uint8Array, sampleRate: number): Uint8Array {
    const header = new ArrayBuffer(44); const view = new DataView(header);
    const writeString = (v: DataView, o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + pcmData.length, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true); const wav = new Uint8Array(44 + pcmData.length); wav.set(new Uint8Array(header), 0); wav.set(pcmData, 44); return wav;
}

export class LiveConnection {
    private sessionPromise: Promise<any> | null = null;
    private inputAudioContext: AudioContext | null = null;
    private inputSource: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private isConnected: boolean = false;
    
    async connect(onAudioData: (data: ArrayBuffer) => void, options: { systemInstruction?: string, voiceName?: string, onVolume?: (level: number) => void, onError?: (err: any) => void, onInterrupted?: () => void } = {}) {
        this.isConnected = true; 
        let stream: MediaStream;
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } 
        catch (e) { if (options.onError) options.onError(e); return; }
        
        const ai = getClient();
        this.sessionPromise = ai.live.connect({
            model: MODELS.LIVE_MODEL,
            config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voiceName || 'Kore' } } }, systemInstruction: options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION },
            callbacks: {
                onopen: () => { 
                    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
                    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
                    this.processor.onaudioprocess = (e) => {
                        if (!this.isConnected) return;
                        const inputData = e.inputBuffer.getChannelData(0);
                        if (options.onVolume) { let sum = 0; for(let i=0; i<inputData.length; i++) sum += inputData[i]**2; options.onVolume(Math.sqrt(sum/inputData.length)); }
                        this.sessionPromise?.then(s => s.sendRealtimeInput({ media: this.createPcmBlob(inputData) }));
                    };
                    this.inputSource.connect(this.processor); this.processor.connect(this.inputAudioContext.destination);
                },
                onmessage: (msg: LiveServerMessage) => { 
                    if (msg.serverContent?.interrupted && options.onInterrupted) options.onInterrupted();
                    const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data; 
                    if (data) onAudioData(this.decodeBase64(data)); 
                },
                onclose: () => { this.disconnect(); },
                onerror: (err) => { if (options.onError) options.onError(err); this.disconnect(); }
            }
        });
    }
    
    async disconnect() {
        this.isConnected = false; 
        this.inputSource?.disconnect(); this.processor?.disconnect();
        this.inputAudioContext?.close();
        this.sessionPromise?.then(s => s.close());
    }
    
    private createPcmBlob(data: Float32Array) {
        const int16 = new Int16Array(data.length);
        for (let i = 0; i < data.length; i++) int16[i] = data[i] * 0x7FFF;
        const bytes = new Uint8Array(int16.buffer);
        let b = ''; for (let i=0; i<bytes.length; i++) b += String.fromCharCode(bytes[i]);
        return { data: btoa(b), mimeType: 'audio/pcm;rate=16000' };
    }
    private decodeBase64(b: string): ArrayBuffer { 
        const s = atob(b); const bytes = new Uint8Array(s.length); 
        for (let i=0; i<s.length; i++) bytes[i] = s.charCodeAt(i); 
        return bytes.buffer; 
    }
}
