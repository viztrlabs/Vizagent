export const MARZIPANO_YAW_OFFSET = Math.PI / 2;
export const DEFAULT_VIEW_FOV = Math.PI / 2;
export const MAX_VIEW_FOV = (100 * Math.PI) / 180;

export function toMarzipanoYaw(yaw: number): number {
  return yaw + MARZIPANO_YAW_OFFSET;
}

export function toMarzipanoView(
  yaw: number,
  pitch: number,
  fov?: number
): { yaw: number; pitch: number; fov: number } {
  return { yaw: toMarzipanoYaw(yaw), pitch, fov: fov ?? DEFAULT_VIEW_FOV };
}

export function toMarzipanoHotspotPosition(
  yaw: number,
  pitch: number
): { yaw: number; pitch: number } {
  return { yaw: toMarzipanoYaw(yaw), pitch };
}
