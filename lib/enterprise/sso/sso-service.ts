// M17: SSO/SAML Service
import { prisma } from '@/lib/db/server';

export interface SsoConfig {
  id: string;
  tenantId: string;
  provider: string; // saml, oidc
  entityId: string | null;
  ssoUrl: string | null;
  certificate: string | null;
  attributeMapping: Record<string, unknown>;
  autoProvision: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SsoConfigInput {
  provider: string;
  entityId?: string | null;
  ssoUrl?: string | null;
  certificate?: string | null;
  attributeMapping?: Record<string, string>;
  autoProvision?: boolean;
  enabled?: boolean;
}

export async function getSsoConfig(tenantId: string): Promise<SsoConfig | null> {
  const config = await prisma.ssoConfig.findUnique({ where: { tenantId } });
  return config ? {
    ...config,
    attributeMapping: config.attributeMapping as Record<string, unknown>,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  } : null;
}

export async function upsertSsoConfig(tenantId: string, data: SsoConfigInput): Promise<SsoConfig> {
  const config = await prisma.ssoConfig.upsert({
    where: { tenantId },
    create: { tenantId, ...data, attributeMapping: data.attributeMapping || {} },
    update: { ...data, attributeMapping: data.attributeMapping || {} },
  });
  return {
    ...config,
    attributeMapping: config.attributeMapping as Record<string, unknown>,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export async function deleteSsoConfig(tenantId: string): Promise<void> {
  await prisma.ssoConfig.delete({ where: { tenantId } });
}

export async function generateSamlMetadata(tenantId: string): Promise<string | null> {
  const config = await getSsoConfig(tenantId);
  if (!config || config.provider !== 'saml') return null;
  
  // Generate basic SAML metadata XML
  const entityId = config.entityId || `https://${tenantId}.viztr.io/saml/metadata`;
  const ssoUrl = config.ssoUrl || `https://${tenantId}.viztr.io/saml/acs`;
  
  return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${ssoUrl}" index="1"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
}