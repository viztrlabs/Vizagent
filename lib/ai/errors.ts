import type { AIProviderName } from './types';

export class AIProviderError extends Error {
  readonly provider?: AIProviderName;
  readonly cause?: unknown;

  constructor(message: string, options?: { provider?: AIProviderName; cause?: unknown }) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = options?.provider;
    this.cause = options?.cause;
  }
}
