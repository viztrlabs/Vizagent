import { OllamaProvider } from './ollama';

describe('OllamaProvider', () => {
  const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434', model: 'llama3.1' });
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('calls /api/generate and returns the response text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Hello from Ollama' }),
    } as Response);

    const res = await provider.complete({ prompt: 'Hi' });
    expect(res.text).toBe('Hello from Ollama');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws AIProviderError on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'boom',
    } as Response);

    await expect(provider.complete({ prompt: 'Hi' })).rejects.toThrow('Ollama request failed');
  });

  it('parses NDJSON stream into text chunks then done', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ response: 'he' }) + '\n'));
        controller.enqueue(encoder.encode(JSON.stringify({ response: 'y' }) + '\n'));
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
        controller.close();
      },
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, body } as Response);

    const chunks: string[] = [];
    let doneSeen = false;
    for await (const chunk of provider.stream({ prompt: 'Hi' })) {
      if (chunk.type === 'text') chunks.push(chunk.text);
      else doneSeen = true;
    }
    expect(chunks).toEqual(['he', 'y']);
    expect(doneSeen).toBe(true);
  });
});
