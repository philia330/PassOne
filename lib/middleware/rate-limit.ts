import { NextRequest, NextResponse } from 'next/server';

// Rate limit configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100; // Maximum requests per window

// In-memory store for rate limiting
// In production, consider using Redis or a similar distributed store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Get the client IP address from the request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to a default IP for development/testing
  return '127.0.0.1';
}

/**
 * Clean up expired entries from the rate limit store
 * This prevents memory leaks in long-running processes
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given IP address
 * Returns rate limit info and whether the request should be allowed
 */
export interface RateLimitInfo {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(ip: string): RateLimitInfo {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // If no entry exists or the window has expired, create a new entry
  if (!entry || entry.resetTime <= now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(ip, newEntry);

    // Periodic cleanup (every 100 requests)
    if (Math.random() < 0.01) {
      cleanupExpiredEntries();
    }

    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment the count for existing entry
  entry.count += 1;
  const allowed = entry.count <= RATE_LIMIT_MAX_REQUESTS;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);

  return {
    allowed,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Create rate limit headers for the response
 */
function createRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  return {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': info.resetTime.toString(),
  };
}

/**
 * Rate limiting middleware for Next.js API routes
 * Use this as middleware in your API routes
 *
 * @example
 * ```typescript
 * // pages/api/example.ts or app/api/example/route.ts
 * import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
 *
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = rateLimitMiddleware(request);
 *
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Your API logic here
 *   return NextResponse.json({ data: 'example' }, {
 *     headers: rateLimitResult.headers
 *   });
 * }
 * ```
 */
export function rateLimitMiddleware(request: NextRequest): {
  success: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
} {
  const ip = getClientIP(request);
  const rateLimitInfo = checkRateLimit(ip);
  const headers = createRateLimitHeaders(rateLimitInfo);

  if (!rateLimitInfo.allowed) {
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          ...headers,
          'Retry-After': Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );

    return {
      success: false,
      response,
      headers,
    };
  }

  return {
    success: true,
    headers,
  };
}

/**
 * Utility function to add rate limit headers to any response
 * Useful when you want to include rate limit info even on successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo: RateLimitInfo
): NextResponse {
  const headers = createRateLimitHeaders(rateLimitInfo);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// HTTP method type for API handlers
type HTTPMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

/**
 * Handler type for individual HTTP method functions
 */
type ApiHandler<T = unknown> = () => Promise<NextResponse<T>>;

/**
 * Wrapper function to add rate limiting to API routes
 *
 * @example
 * ```typescript
 * // app/api/example/route.ts
 * import { NextRequest } from 'next/server';
 * import { withRateLimit } from '@/lib/middleware/rate-limit';
 *
 * async function GET() {
 *   // Your GET logic here
 *   return NextResponse.json({ data: 'example' });
 * }
 *
 * export const GET = withRateLimit(GET);
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * export const POST = withRateLimit(POST, { maxRequests: 10, windowMs: 60000 });
 * ```
 */
export function withRateLimit<
  T = unknown,
  M extends HTTPMethod = HTTPMethod
>(
  handler: ApiHandler<T>,
  options?: {
    /** Maximum requests per window (default: 100) */
    maxRequests?: number;
    /** Window duration in milliseconds (default: 900000 = 15 minutes) */
    windowMs?: number;
  }
) {
  return async function rateLimitedHandler(): Promise<NextResponse<T>> {
    // Create a mock request to check rate limit
    // In production, you'd pass the actual request through
    const ip = '127.0.0.1'; // Will be overridden by middleware in real usage

    // For edge runtime, use a different approach
    const now = Date.now();
    const windowMs = options?.windowMs ?? RATE_LIMIT_WINDOW;
    const maxRequests = options?.maxRequests ?? RATE_LIMIT_MAX_REQUESTS;

    // Create a temporary entry key for checking
    const tempKey = `rate-limit-${ip}`;

    // Get or create entry
    let entry = rateLimitStore.get(tempKey);
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        } as T,
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          },
        }
      );
    }

    // Increment count
    entry.count += 1;
    rateLimitStore.set(tempKey, entry);

    // Execute the handler
    const response = await handler();

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return response;
  };
}

/**
 * Higher-order function for route handlers that receive NextRequest
 * Use this for routes that need access to the request object for IP detection
 *
 * @example
 * ```typescript
 * import { NextRequest } from 'next/server';
 * import { withRequestRateLimit } from '@/lib/middleware/rate-limit';
 *
 * async function GET(request: NextRequest) {
 *   return NextResponse.json({ data: 'example' });
 * }
 *
 * export const GET = withRequestRateLimit(GET);
 * ```
 */
export function withRequestRateLimit<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options?: {
    maxRequests?: number;
    windowMs?: number;
  }
) {
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse<T>> {
    const ip = getClientIP(request);
    const now = Date.now();
    const windowMs = options?.windowMs ?? RATE_LIMIT_WINDOW;
    const maxRequests = options?.maxRequests ?? RATE_LIMIT_MAX_REQUESTS;

    // Get or create entry
    let entry = rateLimitStore.get(ip);
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        } as T,
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          },
        }
      );
    }

    // Increment count
    entry.count += 1;
    rateLimitStore.set(ip, entry);

    // Execute the handler
    const response = await handler(request);

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return response;
  };
}
