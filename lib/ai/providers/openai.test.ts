import OpenAI from 'openai';
import { OpenAIProvider } from './openai';

jest.mock('openai', () => {
  const create = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({ chat: { completions: { create } } })),
  };
});

const mockOpenAI = OpenAI as unknown as jest.Mock;

describe('OpenAIProvider', () => {
  const provider = new OpenAIProvider({ apiKey: 'test-key', model: 'gpt-4o-mini' });
  const mockedCreate = mockOpenAI().chat.completions.create as jest.Mock;

  beforeEach(() => mockedCreate.mockReset());

  it('returns text and usage for a non-streaming request', async () => {
    mockedCreate.mockResolvedValue({
      choices: [{ message: { content: 'Hello from OpenAI' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const res = await provider.complete({ prompt: 'Hi' });
    expect(res.text).toBe('Hello from OpenAI');
    expect(res.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini', stream: false })
    );
  });

  it('yields text chunks then a done chunk when streaming', async () => {
    mockedCreate.mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: 'Hel' } }] };
        yield { choices: [{ delta: { content: 'lo' } }] };
      })()
    );

    const chunks: string[] = [];
    let doneSeen = false;
    for await (const chunk of provider.stream({ prompt: 'Hi', temperature: 0.5 })) {
      if (chunk.type === 'text') chunks.push(chunk.text);
      else doneSeen = true;
    }
    expect(chunks).toEqual(['Hel', 'lo']);
    expect(doneSeen).toBe(true);
    expect(mockedCreate).toHaveBeenCalledWith(expect.objectContaining({ stream: true }));
  });

  it('wraps SDK errors in AIProviderError', async () => {
    mockedCreate.mockRejectedValue(new Error('rate limited'));
    await expect(provider.complete({ prompt: 'Hi' })).rejects.toThrow('OpenAI request failed');
  });
});
