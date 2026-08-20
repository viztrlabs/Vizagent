import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export type ValidationError = {
  field: string;
  message: string;
};

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  return { success: false, errors };
}

export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  const result = schema.safeParse(params);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  return { success: false, errors };
}

export function validationErrorResponse(errors: ValidationError[]) {
  return NextResponse.json(
    { error: 'Validation failed', details: errors },
    { status: 400 }
  );
}
