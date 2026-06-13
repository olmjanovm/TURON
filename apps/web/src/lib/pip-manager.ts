'use client';

/**
 * Picture-in-Picture menejer.
 * 1. Document PiP (Chromium 116+): ixtiyoriy DOM ko'rsatadi
 * 2. Canvas → MediaStream → Video PiP: eski brauzer fallback
 *
 * Kuryer boshqa ilovaga o'tsa, kichik PiP oynada keyingi burilish + masofa
 * ko'rinib turadi.
 */

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: {
        width?: number;
        height?: number;
        disallowReturnToOpener?: boolean;
      }) => Promise<Window>;
      window: Window | null;
    };
  }
}

interface PipState {
  open: boolean;
  mode: 'document' | 'video' | null;
}

export class PipManager {
  private pipWindow: Window | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private raf: number | null = null;
  private listeners: Set<(s: PipState) => void> = new Set();
  private mode: 'document' | 'video' | null = null;

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!window.documentPictureInPicture || 'pictureInPictureEnabled' in document;
  }

  isOpen(): boolean {
    return this.mode != null;
  }

  subscribe(fn: (s: PipState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    const state: PipState = { open: this.isOpen(), mode: this.mode };
    this.listeners.forEach((fn) => fn(state));
  }

  /** Document PiP — DOM kontentni alohida oynada ko'rsatadi. */
  async openDocument(content: HTMLElement): Promise<boolean> {
    if (typeof window === 'undefined' || !window.documentPictureInPicture) return false;
    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 260,
        height: 220,
        disallowReturnToOpener: false,
      });
      this.pipWindow = pipWin;
      this.mode = 'document';

      // Stylesheet'larni klonlash (Tailwind ham)
      [...document.styleSheets].forEach((sheet) => {
        try {
          const styleEl = pipWin.document.createElement('style');
          const css = [...sheet.cssRules].map((r) => r.cssText).join('\n');
          styleEl.textContent = css;
          pipWin.document.head.appendChild(styleEl);
        } catch {/* CORS — tashqi stylesheet'larni o'tkazib yuboramiz */}
      });

      pipWin.document.body.style.margin = '0';
      pipWin.document.body.style.background = '#0a0a0c';
      pipWin.document.body.style.color = '#fff';
      pipWin.document.body.style.fontFamily = 'system-ui, sans-serif';
      pipWin.document.body.appendChild(content);

      pipWin.addEventListener('pagehide', () => {
        this.pipWindow = null;
        this.mode = null;
        this.notify();
      });

      this.notify();
      return true;
    } catch {
      this.mode = null;
      return false;
    }
  }

  /** Canvas → MediaStream → Video PiP fallback. */
  async openCanvas(
    drawFrame: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  ): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    if (!('pictureInPictureEnabled' in document)) return false;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 280;
      this.canvasEl = canvas;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const renderLoop = () => {
        if (!this.canvasEl) return;
        try {
          drawFrame(ctx, canvas.width, canvas.height);
        } catch {/* */}
        this.raf = requestAnimationFrame(renderLoop);
      };
      renderLoop();

      const stream = canvas.captureStream(30);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      (video as HTMLVideoElement & { srcObject: MediaStream }).srcObject = stream;
      await video.play();

      this.videoEl = video;
      const vAny = video as HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> };
      if (typeof vAny.requestPictureInPicture !== 'function') return false;
      await vAny.requestPictureInPicture();

      video.addEventListener('leavepictureinpicture', () => {
        this.closeCanvas();
        this.mode = null;
        this.notify();
      });

      this.mode = 'video';
      this.notify();
      return true;
    } catch {
      this.closeCanvas();
      return false;
    }
  }

  private closeCanvas(): void {
    if (this.raf != null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    if (this.videoEl) {
      try {
        const stream = (this.videoEl as HTMLVideoElement & { srcObject: MediaStream | null }).srcObject;
        stream?.getTracks().forEach((t) => t.stop());
        this.videoEl.pause();
        this.videoEl.remove();
      } catch {/* */}
      this.videoEl = null;
    }
    if (this.canvasEl) {
      this.canvasEl.remove();
      this.canvasEl = null;
    }
  }

  close(): void {
    if (this.pipWindow) {
      try { this.pipWindow.close(); } catch {/* */}
      this.pipWindow = null;
    }
    this.closeCanvas();
    this.mode = null;
    this.notify();
  }
}

export const pipManager = new PipManager();
