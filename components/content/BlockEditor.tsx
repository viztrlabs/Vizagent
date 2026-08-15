'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Copy, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Block, BlockType, BLOCK_TYPES, getDefaultBlockProps } from '@/lib/server/content/content-model';
import { getBlockRegistration } from '@/lib/server/content/block-registry';

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  readOnly?: boolean;
  sectionId: string;
}

const BLOCK_CATEGORIES = {
  layout: 'Layout',
  content: 'Content',
  media: 'Media',
  interactive: 'Interactive',
  forms: 'Forms',
  data: 'Data',
} as const;

export function BlockEditor({ blocks, onBlocksChange, readOnly = false, sectionId }: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);

  const handleAddBlock = (type: string) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type: type as BlockType,
      props: getDefaultBlockProps(type as BlockType),
      order: blocks.length,
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const handleUpdateBlock = (blockId: string, props: Record<string, unknown>) => {
    onBlocksChange(blocks.map(b => b.id === blockId ? { ...b, props: props as Block['props'] } : b));
  };

  const handleDeleteBlock = (blockId: string) => {
    if (window.confirm('Delete this block?')) {
      onBlocksChange(blocks.filter(b => b.id !== blockId));
    }
  };

  const handleDuplicateBlock = (block: Block) => {
    const newBlock = {
      ...block,
      id: crypto.randomUUID(),
      order: block.order + 1,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(blocks.indexOf(block) + 1, 0, newBlock);
    onBlocksChange(newBlocks.map((b, i) => ({ ...b, order: i })));
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      onBlocksChange(newBlocks.map((b, i) => ({ ...b, order: i })));
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      onBlocksChange(newBlocks.map((b, i) => ({ ...b, order: i })));
    }
  };

  const renderBlockEditor = (block: Block) => {
    return (
      <div key={block.id} className="relative group">
        {/* Drag handle + actions */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleMoveBlock(block.id, 'up')}
              disabled={block.order === 0}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMoveBlock(block.id, 'down')}
              disabled={block.order === blocks.length - 1}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Block content */}
        <div className="ml-8 flex-1 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          {/* Block header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-cyan/20 text-cyan rounded">
                {getBlockRegistration(block.type)?.label || block.type}
              </span>
              <span className="text-xs text-gray-500 font-mono">#{block.order + 1}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDuplicateBlock(block)}
                className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                aria-label="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteBlock(block.id)}
                className="p-1.5 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Block props editor */}
          <BlockPropsEditor
            blockType={block.type}
            props={block.props}
            onChange={(props) => handleUpdateBlock(block.id, props)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add block button */}
      <button
        onClick={() => {
          // Show modal or dropdown to select block type
          const type = prompt('Enter block type:', 'text');
          if (type && BLOCK_TYPES.includes(type as BlockType)) {
            const newBlock = {
              id: crypto.randomUUID(),
              type: type as BlockType,
              props: getDefaultBlockProps(type as BlockType),
              order: blocks.length,
            };
            onBlocksChange([...blocks, newBlock]);
          }
        }}
        className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-800 rounded-lg hover:border-cyan/50 hover:bg-cyan/5 transition-colors min-h-[100px]"
      >
        <Plus className="w-5 h-5 text-cyan" />
        <span className="text-white font-medium">Add Block</span>
        <span className="text-xs text-gray-500 ml-2">({BLOCK_TYPES.length} types available)</span>
      </button>

      {/* Existing blocks */}
      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No blocks yet. Click &quot;Add Block&quot; to get started.
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className="group relative">
              {/* Block rendering would go here */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-cyan/20 text-cyan rounded">
                      {getBlockRegistration(block.type)?.label || block.type}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">#{block.order + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors" aria-label="Move up">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors" aria-label="Move down">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors" aria-label="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-colors" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Block type: {block.type} | Props: {JSON.stringify(block.props)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Placeholder for BlockPropsEditor component
function BlockPropsEditor({ blockType, props, onChange }: { blockType: string; props: Record<string, unknown>; onChange: (props: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3 pt-4 border-t border-gray-800">
      <h4 className="text-sm font-medium text-white">Properties</h4>
      <div className="text-sm text-gray-500">
        Editing {Object.keys(props).length} properties for {blockType}
      </div>
    </div>
  );
}