export function hotspotPosition(
  yaw: number,
  pitch: number,
  radius: number
): { x: number; y: number; z: number } {
  return {
    x: Math.sin(yaw) * Math.cos(pitch) * radius,
    y: Math.sin(pitch) * radius,
    z: Math.cos(yaw) * Math.cos(pitch) * radius,
  };
}
