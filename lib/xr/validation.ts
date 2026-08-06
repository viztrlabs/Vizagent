import { z } from 'zod';

export const materialSchema = z.object({
  id: z.string(),
  name: z.string(),
  albedo: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  metallic: z.number().min(0).max(1),
  roughness: z.number().min(0).max(1),
  normalScale: z.number().min(0).max(2),
  emissiveColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  emissiveIntensity: z.number().min(0).max(10),
  opacity: z.number().min(0).max(1),
  doubleSided: z.boolean(),
});

export const objectSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});

export const lightSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  type: z.enum(['hemisphere', 'directional', 'point', 'spot']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  intensity: z.number().min(0).max(100),
  position: z.tuple([z.number(), z.number(), z.number()]),
  castShadow: z.boolean(),
});

export const configDataSchema = z.object({
  scene: z.object({
    bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    exposure: z.number().min(0).max(5),
    toneMapping: z.string(),
    environment: z.string(),
  }),
  materials: z.array(materialSchema),
  objects: z.array(objectSchema),
  lights: z.array(lightSchema),
  camera: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    target: z.tuple([z.number(), z.number(), z.number()]),
    fov: z.number().min(10).max(120),
  }),
});