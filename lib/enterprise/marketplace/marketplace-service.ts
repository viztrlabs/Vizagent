// M17: Marketplace Service
import { prisma } from '@/lib/db/server';
import { MarketplaceItemType, MarketplaceItemStatus } from '@prisma/client';

export interface MarketplaceItem {
  id: string;
  tenantId: string;
  creatorId: string;
  type: MarketplaceItemType;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  previewUrls: string[];
  fileUrl: string | null;
  fileSize: number | null;
  version: string;
  tags: string[];
  category: string;
  price: number;
  currency: string;
  commissionRate: number;
  status: MarketplaceItemStatus;
  reviewNotes: string | null;
  publishedAt: string | null;
  salesCount: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceItemInput {
  type: MarketplaceItemType;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  previewUrls?: string[];
  fileUrl?: string | null;
  fileSize?: number | null;
  version?: string;
  tags?: string[];
  category: string;
  price?: number;
  currency?: string;
  commissionRate?: number;
}

export async function createMarketplaceItem(creatorId: string, tenantId: string, data: MarketplaceItemInput): Promise<MarketplaceItem> {
  const item = await prisma.marketplaceItem.create({
    data: { ...data, creatorId, tenantId },
  });
  return formatMarketplaceItem(item);
}

export async function getMarketplaceItems(tenantId: string, options?: { status?: MarketplaceItemStatus; type?: MarketplaceItemType; creatorId?: string }): Promise<MarketplaceItem[]> {
  const where: any = { tenantId };
  if (options?.status) where.status = options.status;
  if (options?.type) where.type = options.type;
  if (options?.creatorId) where.creatorId = options.creatorId;
  
  const items = await prisma.marketplaceItem.findMany({ where, orderBy: { createdAt: 'desc' } });
  return items.map(formatMarketplaceItem);
}

export async function getMarketplaceItem(id: string, tenantId: string): Promise<MarketplaceItem | null> {
  const item = await prisma.marketplaceItem.findFirst({ where: { id, tenantId } });
  return item ? formatMarketplaceItem(item) : null;
}

export async function updateMarketplaceItem(id: string, tenantId: string, data: Partial<MarketplaceItemInput>): Promise<MarketplaceItem> {
  const item = await prisma.marketplaceItem.update({ where: { id, tenantId }, data });
  return formatMarketplaceItem(item);
}

export async function publishMarketplaceItem(id: string, tenantId: string): Promise<MarketplaceItem> {
  const item = await prisma.marketplaceItem.update({
    where: { id, tenantId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  return formatMarketplaceItem(item);
}

export async function deleteMarketplaceItem(id: string, tenantId: string): Promise<void> {
  await prisma.marketplaceItem.delete({ where: { id, tenantId } });
}

export async function purchaseMarketplaceItem(itemId: string, buyerId: string, tenantId: string): Promise<{ purchase: any; item: MarketplaceItem }> {
  const item = await prisma.marketplaceItem.findFirst({ where: { id: itemId, tenantId, status: 'PUBLISHED' } });
  if (!item) throw new Error('Item not found or not published');
  
  const commission = Math.round(item.price * item.commissionRate);
  const netAmount = item.price - commission;
  
  const purchase = await prisma.marketplacePurchase.create({
    data: {
      itemId: item.id,
      buyerId,
      sellerId: item.creatorId,
      price: item.price,
      currency: item.currency,
      commission,
      netAmount,
    },
  });
  
  // Update item stats
  await prisma.marketplaceItem.update({
    where: { id: item.id },
    data: { salesCount: { increment: 1 }, revenue: { increment: item.price } },
  });
  
  return { purchase, item: formatMarketplaceItem(item) };
}

export async function getMarketplacePurchases(buyerId: string, tenantId: string): Promise<any[]> {
  return prisma.marketplacePurchase.findMany({
    where: { buyerId },
    orderBy: { purchasedAt: 'desc' },
  });
}

export async function getCreatorSales(sellerId: string, tenantId: string): Promise<any[]> {
  return prisma.marketplacePurchase.findMany({
    where: { sellerId },
    orderBy: { purchasedAt: 'desc' },
  });
}

function formatMarketplaceItem(item: any): MarketplaceItem {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    publishedAt: item.publishedAt?.toISOString() || null,
  };
}