import fetch from 'node-fetch';

export interface ChatMessage {
  role: 'user' | 'model' | 'bot';
  text: string;
}

export class AIService {
  private static SYSTEM_INSTRUCTION = `You are an AI Legal Assistant for "Samvidhan Ki Pehchan".
  Goal: Identify relevant Fundamental Rights and Articles of the Indian Constitution based on user input.
  Rules: Use simple language. Avoid complex legal jargon. Provide practical steps. 
  If user input is in Hindi, reply in Hindi.
  Confidence Note: Always mention this is educational guidance, not legal advice.`;

  /**
   * Flexible chat method. Can be refactored to use RAG by 
   * querying a vector DB before calling the LLM.
   */
  static async getChatResponse(history: ChatMessage[], apiKey: string): Promise<string> {
    if (!apiKey) {
      return AIService.getFallbackResponse(history[history.length - 1].text);
    }

    try {
      // Map 'bot' role back to 'model' for Gemini API
      const geminiHistory = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const payload = {
        systemInstruction: {
          parts: [{ text: this.SYSTEM_INSTRUCTION }]
        },
        contents: geminiHistory
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Gemini API Error:', error);
        throw new Error('AI Service Unavailable');
      }

      const data: any = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('AI Service Error:', error);
      return "I'm having trouble connecting to my AI brain right now. Please try again later.";
    }
  }

  private static getFallbackResponse(query: string): string {
    const l = query.toLowerCase();
    if (l.includes('preamble')) return 'The Preamble embodies Justice, Liberty, Equality, and Fraternity.';
    if (l.includes('right')) return 'There are 6 Fundamental Rights in Part III.';
    if (l.includes('duty')) return 'There are 11 Fundamental Duties in Article 51A.';
    return "I'm in basic mode. Please provide a Gemini API Key for detailed legal analysis.";
  }
}
