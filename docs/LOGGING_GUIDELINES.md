# Logging Guidelines for Eventify Ethiopia

## Overview

This document outlines logging best practices for the Eventify Ethiopia application.

## Logging Levels

Use appropriate log levels:

- **`debug`**: Detailed diagnostic information (disabled in production by default)
- **`log`/`info`**: General informational messages
- **`warn`**: Warning messages for potentially harmful situations
- **`error`**: Error messages for failures

## Configuration

Set log level via environment variable:

```env
# Development: see everything
LOG_LEVEL=debug

# Production: only warnings and errors
LOG_LEVEL=warn

# Options: debug, log, info, warn, error
```

## What to Log

### ✅ DO Log:

- **Application lifecycle events**
  - Startup/shutdown
  - Configuration loaded
  - Database connected/disconnected

- **Business logic events**
  - Order created
  - Payment processed
  - Ticket transferred
  - Event published

- **Security events**
  - Failed login attempts
  - Permission denied
  - Unusual activity patterns

- **Performance metrics**
  - Slow database queries
  - High memory usage
  - API response times

- **External service interactions**
  - Payment gateway responses (without sensitive data)
  - Email sent/failed
  - File upload success/failure

### ❌ DON'T Log:

- **Sensitive personal data**
  - Passwords (even hashed)
  - Full credit card numbers
  - Personal identification numbers
  - Complete email addresses in production
  - Phone numbers

- **Security credentials**
  - JWT tokens
  - API keys
  - Session IDs
  - OAuth tokens

- **Excessive detail in production**
  - Full request/response bodies
  - Stack traces for expected errors
  - User input validation failures

## Console.log Statements Found

### Current Issues:

1. **`backend/src/storage/storage.controller.ts`**
   - Lines 54, 68-71, 74, 77, 85: Excessive debug logging
   - **Action**: Remove or convert to debug level with sanitization

2. **`backend/src/transfers/transfers.service.ts`**
   - Lines 33-111: Detailed transfer flow logging with email addresses
   - **Action**: Use logger service with email sanitization

3. **`backend/src/transfers/transfers.controller.ts`**
   - Lines 18, 20: Contains user IDs and emails
   - **Action**: Use logger service

4. **`backend/src/events/events.controller.ts`**
   - Lines 113-131: Contains user and event IDs
   - **Action**: Keep for debugging but sanitize IDs

5. **`backend/src/seed.ts`**
   - Test credentials logged (acceptable for dev/seed script)
   - **Action**: No change needed (dev only)

6. **`backend/src/main.ts`**
   - Application startup info (acceptable)
   - **Action**: No change needed

7. **`backend/src/common/validators/environment.validator.ts`**
   - Configuration summary (acceptable, URIs masked)
   - **Action**: No change needed

## Migration Guide

### Replace console.log with Logger

**Before:**
```typescript
console.log(`User ${userId} initiated transfer to ${email}`);
```

**After:**
```typescript
private readonly logger = new Logger(TransfersService.name);

this.logger.log(`User initiated transfer`); // Production-safe
this.logger.debug(`User ${userId} initiated transfer to ${email}`); // Dev only
```

### For Controllers

```typescript
import { Logger } from '@nestjs/common';

export class MyController {
  private readonly logger = new Logger(MyController.name);

  async someMethod() {
    this.logger.log('Method called');
    this.logger.debug('Detailed info for debugging');
    this.logger.error('Something went wrong', error.stack);
  }
}
```

### For Services

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async processPayment(orderId: string) {
    this.logger.log(`Processing payment for order`);
    this.logger.debug(`Order ID: ${orderId}`); // Only in dev
    
    try {
      // ... process payment
      this.logger.log('Payment successful');
    } catch (error) {
      this.logger.error('Payment failed', error.stack);
      throw error;
    }
  }
}
```

## Sanitization Rules

### Emails

```typescript
// Bad
console.log(`Transfer to user@example.com`);

// Good
this.logger.debug(`Transfer to us***@example.com`);
```

### User IDs

```typescript
// Bad
console.log(`User ID: 507f1f77bcf86cd799439011`);

// Good (show first 8 chars only)
this.logger.debug(`User ID: 507f1f77***`);
```

### Tokens

```typescript
// Bad
console.log(`JWT: ${token}`);

// Good
this.logger.debug(`JWT received (${token.length} chars)`);
```

## Structured Logging (Future Enhancement)

For production, consider structured logging:

```typescript
this.logger.log({
  event: 'payment_processed',
  orderId: '12345',
  amount: 100,
  currency: 'ETB',
  provider: 'chapa',
  timestamp: new Date().toISOString(),
});
```

## Log Aggregation

In production, forward logs to aggregation service:

- **Papertrail**
- **Logtail**
- **AWS CloudWatch**
- **Datadog**
- **ELK Stack**

## Monitoring

Set up alerts for:

- Error rate > threshold
- Specific error patterns
- Failed payment attempts
- Authentication failures
- Database connection issues

## Audit Logs

For compliance and security, use the AuditLogsService for:

- Admin actions
- User data changes
- Financial transactions
- Security events

```typescript
await this.auditLogsService.create({
  action: 'USER_DELETED',
  performedBy: adminId,
  targetUser: userId,
  details: { reason: 'Policy violation' },
});
```

## Performance

- Avoid logging in tight loops
- Use appropriate log levels
- Consider async logging for high-traffic endpoints
- Rotate log files to prevent disk issues

## Quick Fixes Required

### High Priority (Exposes Sensitive Data):

1. **storage.controller.ts** - Remove excessive file logging
2. **transfers.service.ts** - Sanitize email addresses
3. **transfers.controller.ts** - Sanitize user/email info

### Low Priority (Clean up for production):

1. **events.controller.ts** - Add log level control
2. Convert debug logs to use `logger.debug()` instead of `console.log()`

## Production Checklist

- [ ] Set `LOG_LEVEL=warn` in production
- [ ] Replace sensitive `console.log` with `logger.debug()`
- [ ] Enable log aggregation service
- [ ] Set up error rate alerts
- [ ] Configure log rotation
- [ ] Test logging doesn't impact performance
- [ ] Verify no sensitive data in logs

## Example: Clean Logging

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  async processPayment(orderId: string, amount: number) {
    // Good: safe for production
    this.logger.log(`Processing payment`);
    
    // Good: detail only in development (LOG_LEVEL=debug)
    this.logger.debug(`Order ${orderId.substring(0, 8)}***, amount: ${amount}`);
    
    try {
      const result = await this.chapaService.charge(amount);
      
      // Good: business event
      this.logger.log(`Payment successful`);
      
      // Bad: exposing sensitive data
      // this.logger.log(`Payment successful: ${JSON.stringify(result)}`);
      
      return result;
      
    } catch (error) {
      // Good: error with context
      this.logger.error(`Payment failed: ${error.message}`, error.stack);
      
      // Bad: exposing full error object
      // this.logger.error(JSON.stringify(error));
      
      throw error;
    }
  }
}
```

---

**Next Steps:**

1. Review all console.log statements in codebase
2. Replace with appropriate logger calls
3. Add sanitization for sensitive data
4. Set LOG_LEVEL appropriately per environment
5. Test logging in both dev and production modes
