'use client';

import { BlockProps } from '@/lib/server/content/content-model';

interface Props { props: BlockProps['code'] }

export function CodeBlock({ props }: Props) {
  const { code, language, showLineNumbers, copyable } = props;
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-950 border border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80">
        <span className="text-xs font-mono text-gray-400">{language}</span>
        {copyable && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-xs text-cyan hover:text-cyan/80"
          >
            Copy
          </button>
        )}
      </div>
      <pre className="p-4 text-sm text-gray-200 overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
