const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE || 'https://cdn.viztr.io';

export function getCdnUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.replace(/^\/+/, '');
  return `${CDN_BASE}/${normalized}`;
}

export function get360AssetUrl(path: string | null | undefined): string {
  return getCdnUrl(path);
}

export function getThumbnailUrl(path: string | null | undefined): string {
  const cdnPath = getCdnUrl(path);
  if (!cdnPath) return '';
  return `${cdnPath}?w=400&h=300&fit=crop&auto=format`;
}
