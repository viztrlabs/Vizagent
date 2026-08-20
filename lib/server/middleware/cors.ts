import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function setCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  if (ALLOWED_ORIGINS.length === 0) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

export function handleOptionsRequest(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response, request);
}

const MAX_BODY_SIZE_MAP: Record<string, number> = {
  '/api/assets': 500 * 1024 * 1024, // 500MB for asset uploads
  '/api/payments': 1024 * 1024, // 1MB for payment webhooks
  '/api/communications': 1024 * 1024, // 1MB for messages
  '/api/default': 100 * 1024, // 100KB default
};

export function getMaxBodySize(pathname: string): number {
  for (const [path, max] of Object.entries(MAX_BODY_SIZE_MAP)) {
    if (pathname.startsWith(path)) return max;
  }
  return MAX_BODY_SIZE_MAP['/api/default'];
}
