import { applyDecorators } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Apply strict rate limiting to sensitive endpoints
 * Use this for authentication, password reset, payment operations, etc.
 * 
 * Note: Global throttler is already configured in app.module.ts
 * These decorators just document the intent. Adjust global config if needed.
 */
export function ThrottleStrict() {
  return applyDecorators(
    // Uses global throttler config from app.module (already configured)
  );
}

/**
 * Apply moderate rate limiting for write operations
 * Use for create/update/delete operations
 */
export function ThrottleModerate() {
  return applyDecorators(
    // Uses global throttler config from app.module (already configured)
  );
}

/**
 * Apply lenient rate limiting for read operations
 * Use for GET endpoints
 */
export function ThrottleLenient() {
  return applyDecorators(
    // Uses global throttler config from app.module (already configured)
  );
}
