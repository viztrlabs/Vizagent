import { z } from 'zod';

/**
 * M9: Content Engine - Page/Section/Block content model
 *
 * Every public page is composed of:
 * Page -> Sections -> Blocks
 * with support for draft/publish workflow, version history, and SEO.
 */

export const BLOCK_TYPES = [
  'hero',
  'text',
  'image',
  'video',
  'gallery',
  'cta',
  'feature-grid',
  'testimonial',
  'pricing-table',
  'contact-form',
  'code',
  'divider',
  'spacer',
  'html',
  'embed',
  'faq',
  'team',
  'pricing',
  'stats',
] as const;

export type BlockType = typeof BLOCK_TYPES[number];

export interface BlockProps {
  hero: {
    headline: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    alignment: 'left' | 'center' | 'right';
  };
  text: {
    content: string;
    size: 'sm' | 'base' | 'lg' | 'xl';
    alignment: 'left' | 'center' | 'right';
  };
  image: {
    src: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
    link?: string;
  };
  video: {
    src: string;
    poster?: string;
    autoplay: boolean;
    loop: boolean;
    controls: boolean;
    muted: boolean;
  };
  gallery: {
    images: Array<{ src: string; alt: string; caption?: string }>;
    columns: 2 | 3 | 4;
    gap: number;
  };
  cta: {
    text: string;
    url: string;
    variant: 'primary' | 'secondary' | 'ghost' | 'danger';
    size: 'sm' | 'md' | 'lg';
    icon?: string;
  };
  'feature-grid': {
    items: Array<{
      icon?: string;
      title: string;
      description: string;
      link?: string;
    }>;
    columns: 2 | 3 | 4;
  };
  testimonial: {
    items: Array<{
      quote: string;
      author: string;
      role?: string;
      avatar?: string;
      company?: string;
    }>;
    autoplay: boolean;
    interval: number;
  };
  'pricing-table': {
    plans: Array<{
      name: string;
      price: number;
      period: 'month' | 'year';
      features: string[];
      ctaText: string;
      ctaUrl: string;
      highlighted?: boolean;
      badge?: string;
    }>;
    currency: string;
  };
  'contact-form': {
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox';
      required: boolean;
      options?: string[];
      placeholder?: string;
    }>;
    submitText: string;
    successMessage: string;
    endpoint: string;
  };
  code: {
    code: string;
    language: string;
    theme: 'light' | 'dark';
    showLineNumbers: boolean;
    copyable: boolean;
  };
  divider: {
    variant: 'solid' | 'dashed' | 'dotted';
    color?: string;
    margin: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  spacer: {
    size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  };
  html: {
    html: string;
  };
  embed: {
    url: string;
    aspectRatio: '16:9' | '4:3' | '1:1' | '21:9';
    title?: string;
  };
  faq: {
    items: Array<{
      question: string;
      answer: string;
    }>;
    collapsible: boolean;
  };
  team: {
    members: Array<{
      name: string;
      role: string;
      bio?: string;
      avatar?: string;
      social?: {
        linkedin?: string;
        twitter?: string;
        github?: string;
        email?: string;
      };
    }>;
    columns: 2 | 3 | 4;
  };
  pricing: {
    plans: Array<{
      name: string;
      price: number;
      period: 'month' | 'year' | 'once';
      features: string[];
      ctaText: string;
      ctaUrl: string;
      highlighted?: boolean;
      badge?: string;
    }>;
    currency: string;
  };
  stats: {
    items: Array<{
      value: string | number;
      label: string;
      prefix?: string;
      suffix?: string;
    }>;
    columns: 2 | 3 | 4;
  };
}

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps[BlockType];
  order: number;
  isPlaceholder?: boolean;
  placeholderKey?: string;
}

export interface Section {
  id: string;
  name: string;
  blocks: Block[];
  layout: 'container' | 'full-width' | 'split' | 'grid';
  background?: {
    type: 'color' | 'gradient' | 'image' | 'video';
    value: string;
    overlay?: {
      color: string;
      opacity: number;
    };
  };
  padding: {
    top: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    bottom: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  container: 'default' | 'narrow' | 'wide' | 'full';
  order: number;
  isPlaceholder?: boolean;
  placeholderKey?: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sections: Section[];
  status: 'draft' | 'published' | 'archived';
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
    ogType: 'website' | 'article';
    noIndex: boolean;
    noFollow: boolean;
    canonicalUrl?: string;
  };
  openGraph?: {
    title: string;
    description: string;
    image?: string;
    type: 'website' | 'article';
  };
  twitterCard?: {
    card: 'summary' | 'summary_large_image';
    site?: string;
    creator?: string;
  };
  schemaOrg?: Record<string, unknown>;
  isPlaceholder?: boolean;
  placeholderKey?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string;
  updatedBy: string;
  tenantId: string;
  version: number;
}

export const PAGE_STATUS = ['draft', 'published', 'archived'] as const;
export type PageStatus = typeof PAGE_STATUS[number];

export interface PageVersion {
  id: string;
  pageId: string;
  snapshot: Page;
  createdAt: Date;
  createdBy: string;
  changeDescription?: string;
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  hero: 'Hero Section',
  text: 'Rich Text',
  image: 'Image',
  video: 'Video',
  gallery: 'Image Gallery',
  cta: 'Call to Action',
  'feature-grid': 'Feature Grid',
  testimonial: 'Testimonials',
  'pricing-table': 'Pricing Table',
  'contact-form': 'Contact Form',
  code: 'Code Block',
  divider: 'Divider',
  spacer: 'Spacer',
  html: 'Custom HTML',
  embed: 'Embed',
  faq: 'FAQ',
  team: 'Team Members',
  pricing: 'Pricing Plans',
  stats: 'Statistics',
};

export const SECTION_LAYOUTS = {
  container: 'Container (max-width)',
  'full-width': 'Full Width',
  split: 'Split (50/50)',
  grid: 'Grid',
} as const;

export const CONTAINER_SIZES = {
  default: 'Default',
  narrow: 'Narrow',
  wide: 'Wide',
  full: 'Full Width',
} as const;

export function getDefaultBlockProps(type: BlockType): BlockProps[BlockType] {
  const defaults: Partial<Record<BlockType, BlockProps[BlockType]>> = {
    hero: {
      headline: '',
      subheadline: '',
      ctaText: 'Get Started',
      ctaUrl: '#',
      alignment: 'center',
    },
    text: {
      content: '',
      size: 'base',
      alignment: 'left',
    },
    image: {
      src: '',
      alt: '',
      caption: '',
    },
    video: {
      src: '',
      poster: '',
      autoplay: false,
      loop: false,
      controls: true,
      muted: true,
    },
    gallery: {
      images: [],
      columns: 3,
      gap: 16,
    },
    cta: {
      text: 'Click Here',
      url: '#',
      variant: 'primary',
      size: 'md',
    },
    'feature-grid': {
      items: [
        { title: 'Feature 1', description: 'Description', icon: 'sparkles' },
        { title: 'Feature 2', description: 'Description', icon: 'zap' },
        { title: 'Feature 3', description: 'Description', icon: 'shield' },
      ],
      columns: 3,
    },
    testimonial: {
      items: [
        { quote: 'Amazing product!', author: 'John Doe', role: 'CEO', company: 'Acme Inc.' },
      ],
      autoplay: true,
      interval: 5000,
    },
    'pricing-table': {
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
    'contact-form': {
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ],
      submitText: 'Send Message',
      successMessage: 'Thanks for your message!',
      endpoint: '/api/contact',
    },
    code: {
      code: 'console.log("Hello World");',
      language: 'typescript',
      theme: 'dark',
      showLineNumbers: true,
      copyable: true,
    },
    divider: {
      variant: 'solid',
      margin: 'md',
    },
    spacer: {
      size: 'md',
    },
    html: {
      html: '',
    },
    embed: {
      url: '',
      aspectRatio: '16:9',
    },
    faq: {
      items: [
        { question: 'Question?', answer: 'Answer.' },
      ],
      collapsible: true,
    },
    team: {
      members: [
        { name: 'John Doe', role: 'CEO', bio: 'Founder & CEO' },
      ],
      columns: 3,
    },
    pricing: {
      plans: [
        { name: 'Pro', price: 99, period: 'month', features: ['Feature 1', 'Feature 2'], ctaText: 'Start', ctaUrl: '#' },
      ],
      currency: 'USD',
    },
    stats: {
      items: [
        { value: '100+', label: 'Projects' },
      ],
      columns: 3,
    },
  };

  return defaults[type] as BlockProps[BlockType];
}

export function createBlock(type: BlockType, overrides: Partial<Block> = {}): Block {
  return {
    id: crypto.randomUUID(),
    type,
    props: getDefaultBlockProps(type),
    order: 0,
    ...overrides,
  };
}

export function createSection(overrides: Partial<Section> = {}): Section {
  return {
    id: crypto.randomUUID(),
    name: 'New Section',
    blocks: [],
    layout: 'container',
    padding: { top: 'md', bottom: 'md' },
    container: 'default',
    order: 0,
    ...overrides,
  };
}

export function createPage(overrides: Partial<Page> = {}): Page {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    slug: '',
    title: 'New Page',
    description: '',
    sections: [],
    status: 'draft',
    seo: {
      ogType: 'website',
      noIndex: false,
      noFollow: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '',
    updatedBy: '',
    tenantId: '',
    version: 1,
    ...overrides,
  };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}