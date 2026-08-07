import type { QACheck } from '@/lib/types';
import { MAX_FILE_SIZE } from '@/lib/validations';

export const REQUIRED_PANORAMA = 'required-panorama-present';
export const NAMING_CONVENTION = 'naming-convention';
export const SIZE_LIMIT = 'size-under-limit';
export const METADATA_COMPLETE = 'metadata-complete';
export const GLB_LOADABLE = 'glb-loadable';

const NAME_RE = /^[a-z0-9-]+\.(jpg|jpeg|png|glb|gltf|usdz|zip)$/i;
const PANORAMA_RE = /\.(jpg|jpeg|png)$/i;

export type AssetLike = { fileName: string; fileSize?: number | bigint };
export type ProjectLike = { name: string; description: string | null; clientId: string };

export function checkRequiredPanorama(assets: AssetLike[]): QACheck {
  const hasPanorama = assets.some((a) => PANORAMA_RE.test(a.fileName));
  return {
    name: REQUIRED_PANORAMA,
    status: hasPanorama ? 'pass' : 'fail',
    message: hasPanorama
      ? 'At least one 360 panorama (JPG/PNG) is present'
      : 'No panorama asset (JPG/PNG) found',
  };
}

export function checkNaming(assets: AssetLike[]): QACheck {
  const offenders = assets.filter((a) => !NAME_RE.test(a.fileName)).map((a) => a.fileName);
  return {
    name: NAMING_CONVENTION,
    status: offenders.length ? 'fail' : 'pass',
    message: offenders.length
      ? `Invalid filenames: ${offenders.join(', ')}`
      : 'All filenames follow convention',
  };
}

export function checkSizeLimit(assets: AssetLike[]): QACheck {
  const over = assets
    .filter((a) => a.fileSize != null && Number(a.fileSize) > MAX_FILE_SIZE)
    .map((a) => a.fileName);
  return {
    name: SIZE_LIMIT,
    status: over.length ? 'fail' : 'pass',
    message: over.length
      ? `Files over 500 MB: ${over.join(', ')}`
      : 'All assets within size limit',
  };
}

export function checkMetadata(project: ProjectLike): QACheck {
  const missing: string[] = [];
  if (!project.name || !project.name.trim()) missing.push('name');
  if (!project.description) missing.push('description');
  if (!project.clientId) missing.push('clientId');
  return {
    name: METADATA_COMPLETE,
    status: missing.length ? 'fail' : 'pass',
    message: missing.length
      ? `Missing: ${missing.join(', ')}`
      : 'Project metadata complete',
  };
}

export type GlbLoader = (glbUrl: string) => Promise<void>;

export async function checkGlbLoadable(
  assets: AssetLike[],
  urlFor: (asset: AssetLike) => string,
  loadGlb: GlbLoader
): Promise<QACheck> {
  const glbs = assets.filter((a) => /\.glb$/i.test(a.fileName));
  if (!glbs.length) {
    return { name: GLB_LOADABLE, status: 'pass', message: 'No GLB assets to validate' };
  }
  const failed: string[] = [];
  for (const glb of glbs) {
    try {
      await loadGlb(urlFor(glb));
    } catch {
      failed.push(glb.fileName);
    }
  }
  return {
    name: GLB_LOADABLE,
    status: failed.length ? 'fail' : 'pass',
    message: failed.length
      ? `GLB load failed: ${failed.join(', ')}`
      : `${glbs.length} GLB asset(s) loaded successfully`,
  };
}

export function runAllChecks(input: {
  assets: AssetLike[];
  project: ProjectLike;
  urlFor: (a: AssetLike) => string;
  loadGlb: GlbLoader;
}): QACheck[] {
  return [
    checkRequiredPanorama(input.assets),
    checkNaming(input.assets),
    checkSizeLimit(input.assets),
    checkMetadata(input.project),
  ];
}
