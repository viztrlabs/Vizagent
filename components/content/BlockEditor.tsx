'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Copy, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BlockType, BLOCK_TYPES, getDefaultBlockProps } from '@/lib/server/content/content-model';
import { getBlockRegistration } from '@/lib/server/content/block-registry';
import { BlockPropsEditor } from './BlockPropsEditor';

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

function SortableBlock({ block, index, children }: { block: Block; index: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40' : ''}>
      <div className="flex items-center gap-1 mb-1">
        <button {...attributes} {...listeners} className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-white cursor-grab" aria-label={`Drag block ${index + 1}`}>
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 font-mono">#{index + 1}</span>
      </div>
      {children}
    </div>
  );
}

export function BlockEditor({ blocks, onBlocksChange, readOnly = false, sectionId }: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
    onBlocksChange(reordered);
  };

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {blocks.map((block) => (
                  <SortableBlock key={block.id} block={block} index={block.order}>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 text-xs font-medium bg-cyan/20 text-cyan rounded">
                          {getBlockRegistration(block.type)?.label || block.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleMoveBlock(block.id, 'up')} className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white" aria-label="Move up">
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleMoveBlock(block.id, 'down')} className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white" aria-label="Move down">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDuplicateBlock(block)} className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white" aria-label="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteBlock(block.id)} className="p-1.5 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400" aria-label="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <BlockPropsEditor blockType={block.type as BlockType} props={block.props} onChange={(p) => handleUpdateBlock(block.id, p)} />
                    </div>
                  </SortableBlock>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}