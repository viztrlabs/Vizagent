import Anthropic from '@anthropic-ai/sdk';
import { AnthropicProvider } from './anthropic';

jest.mock('@anthropic-ai/sdk', () => {
  const create = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({ messages: { create } })),
  };
});

const mockAnthropic = Anthropic as unknown as jest.Mock;

describe('AnthropicProvider', () => {
  const provider = new AnthropicProvider({ apiKey: 'test-key', model: 'claude-3-5-sonnet-latest' });
  const mockedCreate = mockAnthropic().messages.create as jest.Mock;

  beforeEach(() => mockedCreate.mockReset());

  it('returns text and usage for a non-streaming request', async () => {
    mockedCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello from Claude' }],
      usage: { input_tokens: 8, output_tokens: 4 },
    });

    const res = await provider.complete({ prompt: 'Hi' });
    expect(res.text).toBe('Hello from Claude');
    expect(res.usage).toEqual({ inputTokens: 8, outputTokens: 4 });
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-3-5-sonnet-latest', max_tokens: expect.any(Number) })
    );
  });

  it('yields text chunks then a done chunk when streaming', async () => {
    mockedCreate.mockResolvedValue(
      (async function* () {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Go' } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'od' } };
      })()
    );

    const chunks: string[] = [];
    let doneSeen = false;
    for await (const chunk of provider.stream({ prompt: 'Hi' })) {
      if (chunk.type === 'text') chunks.push(chunk.text);
      else doneSeen = true;
    }
    expect(chunks).toEqual(['Go', 'od']);
    expect(doneSeen).toBe(true);
  });

  it('wraps SDK errors in AIProviderError', async () => {
    mockedCreate.mockRejectedValue(new Error('overloaded'));
    await expect(provider.complete({ prompt: 'Hi' })).rejects.toThrow('Anthropic request failed');
  });
});
