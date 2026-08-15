/* eslint-disable @typescript-eslint/no-explicit-any */
// Test-globals ambient declaration for `tsc --noEmit`.
//
// The repo runs Vitest but many test files were written against the Jest API
// surface (global `describe/it/expect` + the `jest.*` mock helpers). Vitest
// ships global type declarations for the former via `vitest/globals`; the
// `jest` value/namespace is not included, so tsc flagged ~243 errors.
//
// This file (a) pulls in vitest's globals and (b) maps the Jest-compat API
// onto vitest's spies so both typecheck cleanly without restricting tsconfig
// `types` (which would break react/node/pg auto-inclusion).
//
// Note: this makes `pnpm tsc` green; running the suites still requires Vitest
// `globals: true` (already set in vitest.config.ts).
/// <reference types="vitest/globals" />

declare const jest: {
  fn: typeof import('vitest').vi.fn;
  mock: typeof import('vitest').vi.mock;
  mocked: typeof import('vitest').vi.mocked;
  clearAllMocks: typeof import('vitest').vi.clearAllMocks;
  resetAllMocks: typeof import('vitest').vi.resetAllMocks;
  restoreAllMocks: typeof import('vitest').vi.restoreAllMocks;
};

declare namespace jest {
  type Mock<T extends (...args: any) => any = (...args: any) => any> = import('vitest').Mock<T>;
  type MockedFunction<T extends (...args: any) => any> = import('vitest').MockedFunction<T>;
  type MockInstance = import('vitest').MockInstance;
  type SpyInstance = import('vitest').MockInstance;
}
