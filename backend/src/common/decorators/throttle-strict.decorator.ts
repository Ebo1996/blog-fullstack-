import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Apply strict rate limiting to sensitive endpoints
 * Use this for authentication, password reset, payment operations, etc.
 */
export function ThrottleStrict() {
  return applyDecorators(
    // 5 requests per minute for auth/sensitive operations
    Throttle([{ name: 'short', ttl: 60000, limit: 5 }])
  );
}

/**
 * Apply moderate rate limiting for write operations
 * Use for create/update/delete operations
 */
export function ThrottleModerate() {
  return applyDecorators(
    // 20 requests per minute
    Throttle([{ name: 'medium', ttl: 60000, limit: 20 }])
  );
}

/**
 * Apply lenient rate limiting for read operations
 * Use for GET endpoints
 */
export function ThrottleLenient() {
  return applyDecorators(
    // 100 requests per minute
    Throttle([{ name: 'long', ttl: 60000, limit: 100 }])
  );
}
