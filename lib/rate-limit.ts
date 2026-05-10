/**
 * Rate Limiting Utility for Myncel API
 * 
 * Implements a simple in-memory rate limiter for production use.
 * For distributed systems, consider using Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    });
  }, 60000);
}

export interface RateLimitConfig {
  // Maximum number of requests allowed in the window
  maxRequests: number;
  // Window size in milliseconds
  windowMs: number;
  // Key prefix for identification
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier for the client (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.keyPrefix || 'rl'}:${identifier}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // No entry or expired - create new
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict
  AUTH: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 requests per minute
    keyPrefix: 'auth',
  },
  // Registration - very strict
  REGISTER: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    keyPrefix: 'register',
  },
  // Password reset - strict
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    keyPrefix: 'pwreset',
  },
  // API endpoints - moderate
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    keyPrefix: 'api',
  },
  // Chat - moderate
  CHAT: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 messages per minute
    keyPrefix: 'chat',
  },
} as const;