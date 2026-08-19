// M17: Enterprise Branding Service
import { prisma } from '@/lib/db/server';

export interface BrandingConfig {
  id: string;
  tenantId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  customCss: string | null;
  whiteLabel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingConfigInput {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontFamily?: string | null;
  customCss?: string | null;
  whiteLabel?: boolean;
}

export async function getBrandingConfig(tenantId: string): Promise<BrandingConfig | null> {
  const config = await prisma.brandingConfig.findUnique({ where: { tenantId } });
  return config ? {
    ...config,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  } : null;
}

export async function upsertBrandingConfig(tenantId: string, data: BrandingConfigInput): Promise<BrandingConfig> {
  const config = await prisma.brandingConfig.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });
  return {
    ...config,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export async function deleteBrandingConfig(tenantId: string): Promise<void> {
  await prisma.brandingConfig.delete({ where: { tenantId } });
}

export function generateBrandingCss(config: BrandingConfig): string {
  const css = [];
  if (config.primaryColor) css.push(`--brand-primary: ${config.primaryColor};`);
  if (config.secondaryColor) css.push(`--brand-secondary: ${config.secondaryColor};`);
  if (config.fontFamily) css.push(`--brand-font: "${config.fontFamily}", sans-serif;`);
  if (config.customCss) css.push(config.customCss);
  return css.join('\n');
}

export function generateBrandingHtml(config: BrandingConfig): string {
  const css = generateBrandingCss(config);
  const logo = config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" style="max-height: 40px;">` : '';
  const favicon = config.faviconUrl ? `<link rel="icon" href="${config.faviconUrl}">` : '';
  
  return `
    <style>
      :root { ${css} }
      .brand-logo { ${logo} }
    </style>
    ${favicon}
  `;
}