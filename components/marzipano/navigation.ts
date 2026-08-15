export function nextIndex(current: number, length: number): number {
  if (length <= 0) return 0;
  return (current + 1) % length;
}

export function prevIndex(current: number, length: number): number {
  if (length <= 0) return 0;
  return (current - 1 + length) % length;
}

export function resolveStartScene(
  scenes: Array<{ id: string }>,
  startSceneId?: string
): number {
  if (scenes.length === 0) return 0;
  if (!startSceneId) return 0;
  const index = scenes.findIndex((scene) => scene.id === startSceneId);
  return index >= 0 ? index : 0;
}
