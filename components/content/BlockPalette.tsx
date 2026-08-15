'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Layout,
  Type,
  Image,
  Video,
  Grid,
  MousePointerClick,
  LayoutGrid,
  MessageSquare,
  DollarSign,
  Mail,
  Code,
  Minus,
  Maximize2,
  ExternalLink,
  HelpCircle,
  Users,
  X,
  DollarSign as DollarSignIcon,
  BarChart2,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Box,
} from 'lucide-react';
import { BLOCK_TYPES, BLOCK_TYPE_LABELS, BlockType } from '@/lib/server/content/content-model';
import { BLOCK_REGISTRY, getBlockTypesByCategory } from '@/lib/server/content/block-registry';

interface BlockPaletteProps {
  onAddBlock: (type: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const BLOCK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  hero: Layout,
  text: Type,
  image: Image,
  video: VideoIcon,
  gallery: Grid,
  cta: MousePointerClick,
  'feature-grid': LayoutGrid,
  testimonial: MessageSquare,
  'pricing-table': DollarSign,
  'contact-form': Mail,
  code: FileText,
  divider: Minus,
  spacer: Maximize2,
  html: FileText,
  embed: ExternalLink,
  faq: HelpCircle,
  team: Users,
  pricing: DollarSign,
  stats: BarChart2,
};

const CATEGORIES = [
  { key: 'layout', label: 'Layout', icon: Layout },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'interactive', label: 'Interactive', icon: MousePointerClick },
  { key: 'forms', label: 'Forms', icon: Mail },
  { key: 'data', label: 'Data', icon: BarChart2 },
] as const;

export function BlockPalette({ onAddBlock, isOpen, onClose }: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState('layout');
  const [search, setSearch] = useState('');

  const filteredTypes = BLOCK_TYPES.filter(type => {
    const reg = BLOCK_TYPES.find(t => t === type);
    if (!reg) return false;
    const regData = BLOCK_TYPES.find(t => t === type);
    // Filter by category
    const regInfo = Object.entries({
      layout: ['hero', 'divider', 'spacer'],
      content: ['text', 'html', 'faq', 'team', 'stats'],
      media: ['image', 'video', 'gallery', 'embed'],
      interactive: ['cta', 'testimonial'],
      forms: ['contact-form'],
      data: ['feature-grid', 'pricing-table', 'pricing', 'stats'],
    }).find(([cat]) => cat === activeCategory)?.[1]?.includes(type as string);

    // Simple category mapping
    const categories: Record<string, string[]> = {
      layout: ['hero', 'divider', 'spacer', 'feature-grid'],
      content: ['text', 'html', 'faq', 'team', 'stats', 'testimonial'],
      media: ['image', 'video', 'gallery', 'embed'],
      interactive: ['cta', 'testimonial'],
      forms: ['contact-form'],
      data: ['pricing-table', 'pricing', 'stats'],
    };

    const categoryTypes = categories[activeCategory] || [];
    const matchesCategory = categoryTypes.includes(type);
    const matchesSearch = BLOCK_TYPE_LABELS[type]?.toLowerCase().includes(search.toLowerCase()) || type.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface border border-gray-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-display text-xl text-white">Add Block</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search blocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-800 overflow-x-auto">
          {[
            { key: 'layout', label: 'Layout', icon: Layout },
            { key: 'content', label: 'Content', icon: FileText },
            { key: 'media', label: 'Media', icon: ImageIcon },
            { key: 'interactive', label: 'Interactive', icon: MousePointerClick },
            { key: 'forms', label: 'Forms', icon: Mail },
            { key: 'data', label: 'Data', icon: BarChart2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === key
                  ? 'bg-cyan/10 text-cyan border border-cyan/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Block grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { type: 'hero', category: 'layout' },
              { type: 'divider', category: 'layout' },
              { type: 'spacer', category: 'layout' },
              { type: 'feature-grid', category: 'layout' },
              { type: 'text', category: 'content' },
              { type: 'html', category: 'content' },
              { type: 'faq', category: 'content' },
              { type: 'team', category: 'content' },
              { type: 'stats', category: 'content' },
              { type: 'testimonial', category: 'content' },
              { type: 'image', category: 'media' },
              { type: 'video', category: 'media' },
              { type: 'gallery', category: 'media' },
              { type: 'embed', category: 'media' },
              { type: 'cta', category: 'interactive' },
              { type: 'testimonial', category: 'interactive' },
              { type: 'contact-form', category: 'forms' },
              { type: 'feature-grid', category: 'data' },
              { type: 'pricing-table', category: 'data' },
              { type: 'pricing', category: 'data' },
              { type: 'stats', category: 'data' },
            ].map(({ type, category }) => {
              const label = BLOCK_TYPE_LABELS[type as BlockType] || type;
              const Icon = BLOCK_ICONS[type] || FileText;
              const description = getBlockDescription(type);

              return (
                <button
                  key={type}
                  onClick={() => { onAddBlock(type); }}
                  className="group relative flex flex-col items-start gap-2 p-4 bg-surface border border-gray-800 rounded-xl hover:border-cyan/50 hover:bg-cyan/5 transition-all duration-200 cursor-pointer min-h-[120px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-cyan/20 flex items-center justify-center text-cyan">
                      {(() => {
                        const icons: Record<string, string> = {
                          hero: 'Layout',
                          text: 'Type',
                          image: 'Image',
                          video: 'Video',
                          gallery: 'Grid',
                          cta: 'MousePointerClick',
                          'feature-grid': 'LayoutGrid',
                          testimonial: 'MessageSquare',
                          'pricing-table': 'DollarSign',
                          'contact-form': 'Mail',
                          code: 'FileText',
                          divider: 'Minus',
                          spacer: 'Maximize2',
                          html: 'FileText',
                          embed: 'ExternalLink',
                          faq: 'HelpCircle',
                          team: 'Users',
                          pricing: 'DollarSign',
                          stats: 'BarChart2',
                        };
                        const IconName = icons[type] || 'FileText';
                        return <span className="text-xl">{IconName[0]}</span>;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{BLOCK_TYPE_LABELS[type as BlockType] || type}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{getBlockDescription(type)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getBlockDescription(type: string): string {
  const descriptions: Record<string, string> = {
    hero: 'Large headline section with CTA, typically at the top of a page',
    text: 'Rich text content with headings, lists, and inline formatting',
    image: 'Single image with optional caption and link',
    video: 'Video player with playback controls',
    gallery: 'Grid of images with lightbox view',
    cta: 'Button or link that drives user action',
    'feature-grid': 'Grid of feature cards with icons and descriptions',
    testimonial: 'Customer quotes with author info and carousel option',
    'pricing-table': 'Pricing plans with features and CTAs',
    'contact-form': 'Configurable form with validation',
    code: 'Syntax-highlighted code snippet with copy button',
    divider: 'Horizontal rule to separate content',
    spacer: 'Vertical spacing between elements',
    html: 'Raw HTML for advanced customization',
    embed: 'Embed external content (YouTube, Vimeo, Figma, etc.)',
    faq: 'Collapsible frequently asked questions',
    team: 'Team member cards with roles and social links',
    pricing: 'Pricing plans with features and CTAs',
    stats: 'Key metrics and numbers display',
  };
  return descriptions[type] || '';
}