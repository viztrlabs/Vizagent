'use client';

import { BlockType } from '@/lib/server/content/content-model';
import { getBlockRegistration } from '@/lib/server/content/block-registry';

interface BlockPropsEditorProps {
  blockType: BlockType;
  props: unknown;
  onChange: (props: Record<string, unknown>) => void;
}

export function BlockPropsEditor({ blockType, props, onChange }: BlockPropsEditorProps) {
  const registration = getBlockRegistration(blockType);
  const EditComponent = registration?.editComponent;

  if (EditComponent) {
    return <EditComponent props={props as never} onChange={onChange as never} />;
  }

  return (
    <div className="space-y-3 pt-4 border-t border-gray-800">
      <h4 className="text-sm font-medium text-white">Properties</h4>
      <div className="text-sm text-gray-500">
        Editing {Object.keys((props ?? {}) as Record<string, unknown>).length} properties for {blockType}
      </div>
    </div>
  );
}
