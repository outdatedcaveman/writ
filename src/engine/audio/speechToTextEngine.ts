/**
 * Speech-To-Text Audio Recording & Live Transcription Engine
 * 
 * Supports:
 * 1. Web Speech API (Chromium / Electron native streaming recognition)
 * 2. MediaRecorder API with real-time audio amplitude / waveform analysis
 * 3. Local Whisper backend invocation via /api/transcribe
 */

export interface STTEvent {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface AudioVisualizerData {
  volume: number; // 0 to 100
  frequencyBars: number[]; // Array of normalized bar values (0 to 100)
}

export type STTStatus = "idle" | "listening" | "processing" | "paused" | "error";

export class SpeechToTextEngine {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private visualizerTimer: number | null = null;

  public status: STTStatus = "idle";
  public language: string = "en-US";
  public onTranscript?: (event: STTEvent) => void;
  public onVisualizer?: (data: AudioVisualizerData) => void;
  public onStatusChange?: (status: STTStatus, error?: string) => void;

  constructor(language: string = "en-US") {
    this.language = language;
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;

        this.recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          if (this.onTranscript) {
            if (finalTranscript) {
              this.onTranscript({ text: finalTranscript.trim(), isFinal: true });
            } else if (interimTranscript) {
              this.onTranscript({ text: interimTranscript.trim(), isFinal: false });
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn("[STT] Web Speech recognition event:", event.error);
          if (event.error !== "no-speech") {
            this.status = "error";
            if (this.onStatusChange) this.onStatusChange("error", event.error);
          }
        };

        this.recognition.onend = () => {
          if (this.status === "listening") {
            // Keep alive continuous listening if active
            try {
              this.recognition.start();
            } catch {}
          }
        };
      } catch (err) {
        console.warn("[STT] Web Speech API initialization notice:", err);
      }
    }
  }

  public async start(): Promise<boolean> {
    try {
      this.status = "listening";
      this.audioChunks = [];
      if (this.onStatusChange) this.onStatusChange("listening");

      // 1. Start microphone stream and audio visualizer
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        // Initialize AudioContext for live waveform visualizer
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaStreamSource(this.audioStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);

          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          this.visualizerTimer = window.setInterval(() => {
            if (this.analyser && this.status === "listening") {
              this.analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              const bars: number[] = [];
              for (let i = 0; i < 16; i++) {
                const val = dataArray[i] || 0;
                bars.push(Math.round((val / 255) * 100));
                sum += val;
              }
              const averageVolume = Math.round((sum / (16 * 255)) * 100);
              if (this.onVisualizer) {
                this.onVisualizer({
                  volume: averageVolume,
                  frequencyBars: bars
                });
              }
            }
          }, 60);
        }

        // Initialize MediaRecorder for offline audio blob
        if (typeof MediaRecorder !== "undefined") {
          this.mediaRecorder = new MediaRecorder(this.audioStream);
          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.audioChunks.push(e.data);
            }
          };
          this.mediaRecorder.start(250);
        }
      }

      // 2. Start Web Speech recognition
      if (this.recognition) {
        try {
          this.recognition.lang = this.language;
          this.recognition.start();
        } catch {}
      }

      return true;
    } catch (err: any) {
      console.error("[STT] Could not start recording:", err);
      this.status = "error";
      if (this.onStatusChange) this.onStatusChange("error", err.message || "Microphone access denied");
      return false;
    }
  }

  public stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.status = "idle";
      if (this.onStatusChange) this.onStatusChange("idle");

      // Stop visualizer
      if (this.visualizerTimer) {
        clearInterval(this.visualizerTimer);
        this.visualizerTimer = null;
      }
      if (this.audioContext) {
        try { this.audioContext.close(); } catch {}
        this.audioContext = null;
      }

      // Stop speech recognition
      if (this.recognition) {
        try { this.recognition.stop(); } catch {}
      }

      // Stop media recorder and resolve recorded audio blob
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.audioChunks, { type: "audio/webm" });
          this.cleanupStream();
          resolve(blob);
        };
        this.mediaRecorder.stop();
      } else {
        this.cleanupStream();
        resolve(null);
      }
    });
  }

  private cleanupStream() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((t) => t.stop());
      this.audioStream = null;
    }
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Dispatches recorded audio blob to local server Whisper transcriber.
   */
  public async transcribeWithWhisperServer(audioBlob: Blob): Promise<{
    success: boolean;
    transcript?: string;
    error?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "dictation.webm");
      formData.append("language", this.language.startsWith("pt") ? "pt" : "en");

      const res = await fetch("http://localhost:4983/api/transcribe", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || `Server HTTP ${res.status}` };
      }

      const data = await res.json();
      return { success: true, transcript: data.transcript };
    } catch (err: any) {
      return { success: false, error: err.message || "Could not reach local transcription server" };
    }
  }

  /**
   * Queries local server for STT availability (Whisper, Python, etc.)
   */
  public static async getSTTServerStatus(): Promise<{
    available: boolean;
    whisperInstalled: boolean;
    pythonInstalled: boolean;
    ffmpegInstalled: boolean;
    recommendedEngine: string;
  }> {
    try {
      const res = await fetch("http://localhost:4983/api/stt/status");
      if (!res.ok) throw new Error("Status endpoint unavailable");
      return await res.json();
    } catch {
      return {
        available: false,
        whisperInstalled: false,
        pythonInstalled: false,
        ffmpegInstalled: false,
        recommendedEngine: "web_speech_native"
      };
    }
  }
}
