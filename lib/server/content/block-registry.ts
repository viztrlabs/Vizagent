import { BlockType, BLOCK_TYPES, BlockProps, getDefaultBlockProps, Block } from './content-model';
import { HeroBlock } from '@/components/content/blocks/HeroBlock';
import { TextBlock } from '@/components/content/blocks/TextBlock';
import { ImageBlock } from '@/components/content/blocks/ImageBlock';
import { VideoBlock } from '@/components/content/blocks/VideoBlock';
import { GalleryBlock } from '@/components/content/blocks/GalleryBlock';
import { CtaBlock } from '@/components/content/blocks/CtaBlock';
import { FeatureGridBlock } from '@/components/content/blocks/FeatureGridBlock';
import { TestimonialBlock } from '@/components/content/blocks/TestimonialBlock';
import { PricingTableBlock } from '@/components/content/blocks/PricingTableBlock';
import { ContactFormBlock } from '@/components/content/blocks/ContactFormBlock';
import { CodeBlock } from '@/components/content/blocks/CodeBlock';
import { DividerBlock } from '@/components/content/blocks/DividerBlock';
import { SpacerBlock } from '@/components/content/blocks/SpacerBlock';
import { HtmlBlock } from '@/components/content/blocks/HtmlBlock';
import { EmbedBlock } from '@/components/content/blocks/EmbedBlock';
import { FaqBlock } from '@/components/content/blocks/FaqBlock';
import { TeamBlock } from '@/components/content/blocks/TeamBlock';
import { PricingBlock } from '@/components/content/blocks/PricingBlock';
import { StatsBlock } from '@/components/content/blocks/StatsBlock';


/**
 * M9: Block Registry
 *
 * Central registry for all block types with their components,
 * validation schemas, and default props.
 */

export interface BlockComponentMap {
  [key: string]: React.ComponentType<BlockProps[keyof BlockProps]>;
}

export interface BlockRegistration {
  type: BlockType;
  label: string;
  description: string;
  category: 'layout' | 'content' | 'media' | 'interactive' | 'forms' | 'data';
  icon: string;
  defaultProps: BlockProps[keyof BlockProps];
  isContainer?: boolean;
  allowedChildren?: BlockType[];
  allowedParents?: BlockType[];
  maxCount?: number;
  minCount?: number;
  defaultWidth?: number;
  resizable?: boolean;
  draggable?: boolean;
  duplicable?: boolean;
  deletable?: boolean;
  locked?: boolean;
  previewComponent?: React.ComponentType<{ props: BlockProps[BlockType] }>;
  editComponent?: React.ComponentType<{ props: BlockProps[BlockType]; onChange: (props: BlockProps[BlockType]) => void }>;
}

export const BLOCK_REGISTRY: Record<BlockType, BlockRegistration> = {
  hero: {
    type: 'hero',
    label: 'Hero Section',
    description: 'Large headline section with CTA, typically at the top of a page',
    category: 'layout',
    icon: 'Layout',
    defaultProps: {
      headline: '',
      subheadline: '',
      ctaText: 'Get Started',
      ctaUrl: '#',
      alignment: 'center',
    },
    isContainer: false,
    defaultWidth: 12,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
    locked: false,
  },
  text: {
    type: 'text',
    label: 'Rich Text',
    description: 'Formatted text content with headings, lists, and inline formatting',
    category: 'content',
    icon: 'Type',
    defaultProps: {
      content: '',
      size: 'base',
      alignment: 'left',
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  image: {
    type: 'image',
    label: 'Image',
    description: 'Single image with optional caption and link',
    category: 'media',
    icon: 'Image',
    defaultProps: {
      src: '',
      alt: '',
      caption: '',
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  video: {
    type: 'video',
    label: 'Video',
    description: 'Video player with playback controls',
    category: 'media',
    icon: 'Video',
    defaultProps: {
      src: '',
      poster: '',
      autoplay: false,
      loop: false,
      controls: true,
      muted: true,
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    description: 'Grid of images with lightbox view',
    category: 'media',
    icon: 'Grid',
    defaultProps: {
      images: [],
      columns: 3,
      gap: 16,
    },
    isContainer: true,
    allowedChildren: ['image'],
    minCount: 1,
    maxCount: 20,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  cta: {
    type: 'cta',
    label: 'Call to Action',
    description: 'Button or link that drives user action',
    category: 'interactive',
    icon: 'MousePointerClick',
    defaultProps: {
      text: 'Click Here',
      url: '#',
      variant: 'primary',
      size: 'md',
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  'feature-grid': {
    type: 'feature-grid',
    label: 'Feature Grid',
    description: 'Grid of feature cards with icons and descriptions',
    category: 'layout',
    icon: 'LayoutGrid',
    defaultProps: {
      items: [
        { title: 'Feature 1', description: 'Description', icon: 'sparkles' },
        { title: 'Feature 2', description: 'Description', icon: 'zap' },
        { title: 'Feature 3', description: 'Description', icon: 'shield' },
      ],
      columns: 3,
    },
    isContainer: true,
    allowedChildren: [],
    minCount: 2,
    maxCount: 6,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  testimonial: {
    type: 'testimonial',
    label: 'Testimonials',
    description: 'Customer quotes with author info and carousel option',
    category: 'content',
    icon: 'MessageSquare',
    defaultProps: {
      items: [
        { quote: 'Amazing product!', author: 'John Doe', role: 'CEO', company: 'Acme Inc.' },
      ],
      autoplay: true,
      interval: 5000,
    },
    isContainer: false,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  'pricing-table': {
    type: 'pricing-table',
    label: 'Pricing Table',
    description: 'Pricing plans with features and CTAs',
    category: 'data',
    icon: 'DollarSign',
    defaultProps: {
      plans: [
        {
          name: 'Starter',
          price: 29,
          period: 'month',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
          ctaText: 'Get Started',
          ctaUrl: '#',
        },
      ],
      currency: 'USD',
    },
    isContainer: true,
    allowedChildren: [],
    minCount: 1,
    maxCount: 5,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  'contact-form': {
    type: 'contact-form',
    label: 'Contact Form',
    description: 'Configurable form with validation',
    category: 'forms',
    icon: 'Mail',
    defaultProps: {
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ],
      submitText: 'Send Message',
      successMessage: 'Thanks for your message!',
      endpoint: '/api/contact',
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  code: {
    type: 'code',
    label: 'Code Block',
    description: 'Syntax-highlighted code snippet with copy button',
    category: 'content',
    icon: 'Code',
    defaultProps: {
      code: 'console.log("Hello World");',
      language: 'typescript',
      theme: 'dark',
      showLineNumbers: true,
      copyable: true,
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal rule to separate content',
    category: 'layout',
    icon: 'Minus',
    defaultProps: {
      variant: 'solid',
      margin: 'md',
    },
    isContainer: false,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    description: 'Vertical spacing between elements',
    category: 'layout',
    icon: 'Maximize2',
    defaultProps: {
      size: 'md',
    },
    isContainer: false,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  html: {
    type: 'html',
    label: 'Custom HTML',
    description: 'Raw HTML for advanced customization',
    category: 'content',
    icon: 'Code2',
    defaultProps: {
      html: '',
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
    locked: true, // Requires admin permission
  },
  embed: {
    type: 'embed',
    label: 'Embed',
    description: 'Embed external content (YouTube, Vimeo, Figma, etc.)',
    category: 'media',
    icon: 'ExternalLink',
    defaultProps: {
      url: '',
      aspectRatio: '16:9',
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  faq: {
    type: 'faq',
    label: 'FAQ',
    description: 'Collapsible frequently asked questions',
    category: 'content',
    icon: 'HelpCircle',
    defaultProps: {
      items: [
        { question: 'Question?', answer: 'Answer.' },
      ],
      collapsible: true,
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  team: {
    type: 'team',
    label: 'Team Members',
    description: 'Team member cards with roles and social links',
    category: 'content',
    icon: 'Users',
    defaultProps: {
      members: [
        { name: 'John Doe', role: 'CEO', bio: 'Founder & CEO' },
      ],
      columns: 3,
    },
    isContainer: true,
    allowedChildren: [],
    minCount: 1,
    maxCount: 12,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  pricing: {
    type: 'pricing',
    label: 'Pricing Plans',
    description: 'Pricing plans with features and CTAs',
    category: 'data',
    icon: 'DollarSign',
    defaultProps: {
      plans: [
        {
          name: 'Pro',
          price: 99,
          period: 'month',
          features: ['Feature 1', 'Feature 2'],
          ctaText: 'Start',
          ctaUrl: '#',
        },
      ],
      currency: 'USD',
    },
    isContainer: true,
    allowedChildren: [],
    minCount: 1,
    maxCount: 5,
    resizable: false,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
  stats: {
    type: 'stats',
    label: 'Statistics',
    description: 'Key metrics and numbers display',
    category: 'data',
    icon: 'BarChart2',
    defaultProps: {
      items: [
        { value: '100+', label: 'Projects' },
      ],
      columns: 3,
    },
    isContainer: false,
    resizable: true,
    draggable: true,
    duplicable: true,
    deletable: true,
  },
};

export const BLOCK_PREVIEWS: Record<BlockType, React.ComponentType<{ props: any }>> = {
  hero: HeroBlock,
  text: TextBlock,
  image: ImageBlock,
  video: VideoBlock,
  gallery: GalleryBlock,
  cta: CtaBlock,
  'feature-grid': FeatureGridBlock,
  testimonial: TestimonialBlock,
  'pricing-table': PricingTableBlock,
  'contact-form': ContactFormBlock,
  code: CodeBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  html: HtmlBlock,
  embed: EmbedBlock,
  faq: FaqBlock,
  team: TeamBlock,
  pricing: PricingBlock,
  stats: StatsBlock,
};

// Wire preview components into the registry
Object.keys(BLOCK_REGISTRY).forEach((key) => {
  const type = key as BlockType;
  BLOCK_REGISTRY[type].previewComponent = BLOCK_PREVIEWS[type] as any;
});


/**
 * Get registration for a block type
 */
export function getBlockRegistration(type: BlockType) {
  return BLOCK_REGISTRY[type];
}

/**
 * Get all block types in a category
 */
export function getBlockTypesByCategory(category: 'layout' | 'content' | 'media' | 'interactive' | 'forms' | 'data'): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([, reg]) => reg.category === category)
    .map(([type]) => type as BlockType);
}

/**
 * Get all available block types
 */
export function getAllBlockTypes(): BlockType[] {
  return [...BLOCK_TYPES];
}

/**
 * Check if a block type can be nested in another
 */
export function canNest(childType: BlockType, parentType: BlockType): boolean {
  const parentReg = BLOCK_REGISTRY[parentType];
  if (!parentReg.allowedChildren || parentReg.allowedChildren.length === 0) {
    return false;
  }
  return parentReg.allowedChildren.includes(childType);
}

/**
 * Get default props for a block type
 */
export { getDefaultBlockProps } from './content-model';

/**
 * Validate block props against type
 */
export function validateBlockProps(type: BlockType, props: unknown): props is Record<string, unknown> {
  // In production, use Zod schema validation
  return true;
}