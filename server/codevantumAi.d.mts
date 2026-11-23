import type { IncomingMessage, ServerResponse } from 'node:http';

export const CODEVANTUM_MODELS: { fast: string; smart: string; vision: string; transcribe: string };

export function createCodevantumAiHandler(options?: {
  getKey?: () => string | undefined;
  fetchImpl?: typeof fetch;
  limits?: { perMinute?: number; perDay?: number };
}): (req: IncomingMessage, res: ServerResponse, next?: (error?: unknown) => void) => Promise<void>;

export function createTranscribeHandler(options?: {
  getKey?: () => string | undefined;
  fetchImpl?: typeof fetch;
}): (req: IncomingMessage, res: ServerResponse, next?: (error?: unknown) => void) => Promise<void>;
