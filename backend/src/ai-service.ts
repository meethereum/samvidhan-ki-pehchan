import { logger } from './logger.js';

export interface ChatMessage {
  role: 'user' | 'model' | 'bot';
  text: string;
}

// Internal RAG service URL — only reachable inside the Docker network
const RAG_URL = (process.env.RAG_URL ?? 'http://rag:8000').replace(/\/$/, '');
const RAG_TIMEOUT_MS = 100_000;  // 90s Mistral timeout + 10s buffer

logger.info(`AI backend: RAG service at ${RAG_URL}`);

export class AIService {

  static async getChatResponse(history: ChatMessage[]): Promise<string> {
    const signal = AbortSignal.timeout(RAG_TIMEOUT_MS);

    try {
      logger.debug(`Calling RAG /chat (timeout: ${RAG_TIMEOUT_MS}ms)`);

      const response = await fetch(`${RAG_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
        signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as any;
        logger.error(`RAG service error — HTTP ${response.status}`, body);
        if (response.status === 503) {
          return 'The knowledge base is still initialising. Please wait a moment and try again.';
        }
        return 'The AI service encountered an error. Please try again.';
      }

      const data = await response.json() as {
        reply: string;
        sources: string[];
        insufficient: boolean;
      };

      logger.debug(`RAG responded — insufficient=${data.insufficient} sources=${data.sources.length}`);
      return data.reply;

    } catch (error: any) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        logger.warn(`RAG service timed out after ${RAG_TIMEOUT_MS}ms`);
        return 'The response is taking longer than expected. Please try again in a moment.';
      }
      logger.error('RAG service fetch error', { name: error?.name, message: error?.message });
      return "I'm having trouble connecting to the knowledge base right now. Please try again.";
    }
  }
}
