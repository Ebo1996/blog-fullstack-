# Sentry Error Monitoring Setup Guide

This guide walks you through setting up Sentry for error tracking and performance monitoring in Eventify Ethiopia.

## 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account (100k events/month free tier)
3. Create a new organization: "Eventify Ethiopia"

## 2. Create Projects

Create two separate projects:
- **eventify-backend** (Node.js)
- **eventify-frontend** (Next.js)

## 3. Backend Setup (NestJS)

### Install Dependencies

```bash
cd backend
npm install --save @sentry/node @sentry/profiling-node
```

### Update Environment Variables

Add to `backend/.env.production`:

```env
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

### Create Sentry Service

**File: `backend/src/common/sentry/sentry.service.ts`**

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('SENTRY_ENVIRONMENT', 'development');
    const release = this.configService.get<string>('SENTRY_RELEASE', '1.0.0');

    if (dsn) {
      Sentry.init({
        dsn,
        environment,
        release,
        integrations: [
          new ProfilingIntegration(),
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: true }),
        ],
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
        beforeSend(event, hint) {
          // Filter sensitive data
          if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
          }
          return event;
        },
      });
      
      console.log('✓ Sentry initialized');
    }
  }

  captureException(exception: any, context?: any) {
    Sentry.captureException(exception, { extra: context });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }
}
```

### Create Sentry Interceptor

**File: `backend/src/common/interceptors/sentry.interceptor.ts`**

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Only send 5xx errors to Sentry, not 4xx client errors
        if (error instanceof HttpException) {
          const status = error.getStatus();
          if (status >= 500) {
            Sentry.captureException(error);
          }
        } else {
          // Non-HTTP exceptions (unexpected errors)
          Sentry.captureException(error);
        }
        
        return throwError(() => error);
      }),
    );
  }
}
```

### Update main.ts

**File: `backend/src/main.ts`**

Add at the very top (before other imports):

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry as early as possible
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    integrations: [
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 0.1,
  });
}
```

In bootstrap function, add the interceptor:

```typescript
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

// Add to global interceptors
app.useGlobalInterceptors(new SentryInterceptor());
```

## 4. Frontend Setup (Next.js)

### Install Dependencies

```bash
cd frontend
npm install --save @sentry/nextjs
```

### Configure Sentry

Run the wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

Or manually create configuration files:

**File: `frontend/sentry.client.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 0.1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
    }
    return event;
  },
});
```

**File: `frontend/sentry.server.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 0.1,
  debug: false,
});
```

**File: `frontend/sentry.edge.config.ts`**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'production',
  tracesSampleRate: 0.1,
  debug: false,
});
```

### Update Environment Variables

Add to `frontend/.env.production`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

### Update next.config.js

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  silent: true,
  org: 'eventify-ethiopia',
  project: 'eventify-frontend',
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

## 5. Testing Sentry Integration

### Backend Test

Create a test endpoint:

```typescript
@Get('test-sentry')
testSentry() {
  throw new Error('Test Sentry integration');
}
```

Visit: `http://localhost:3001/api/test-sentry`

### Frontend Test

Add to any page:

```typescript
<button onClick={() => {
  throw new Error('Test Sentry integration');
}}>
  Test Sentry
</button>
```

## 6. Sentry Features to Configure

### Performance Monitoring

Track slow API calls and database queries:

```typescript
import * as Sentry from '@sentry/node';

// Wrap slow operations
const transaction = Sentry.startTransaction({
  op: 'ticket.purchase',
  name: 'Purchase Ticket',
});

try {
  // Your code
} finally {
  transaction.finish();
}
```

### User Context

Add user information to errors:

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

### Custom Tags

```typescript
Sentry.setTag('payment_provider', 'chapa');
Sentry.setTag('event_type', 'concert');
```

### Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  message: 'User selected VIP ticket',
  level: 'info',
  data: { ticketType: 'VIP', price: 500 },
});
```

## 7. Alerts & Notifications

Configure in Sentry dashboard:

1. Go to **Settings → Alerts**
2. Create alert rules:
   - High error rate (>100 errors/hour)
   - New error types
   - Performance degradation
3. Add notification channels:
   - Email
   - Slack
   - PagerDuty

## 8. Source Maps (for Frontend)

Sentry wizard should configure this automatically. Verify in `next.config.js`:

```javascript
sentry: {
  hideSourceMaps: true,
  widenClientFileUpload: true,
}
```

## 9. Best Practices

### DO:
- ✅ Filter sensitive data (passwords, tokens)
- ✅ Set appropriate sample rates (10% in production)
- ✅ Add user context to errors
- ✅ Use custom tags for categorization
- ✅ Monitor performance transactions

### DON'T:
- ❌ Send 4xx client errors to Sentry
- ❌ Include passwords or tokens in error data
- ❌ Set 100% sample rate in production
- ❌ Log every single validation error
- ❌ Forget to handle PII (Personally Identifiable Information)

## 10. Cost Optimization

Free tier limits: 100k events/month

To stay within limits:
- Use 10% sample rate for traces
- Filter out expected errors (404s, validation errors)
- Use beforeSend to drop noisy errors
- Set up proper error boundaries in React

## 11. Dashboard Widgets

Add to your Sentry dashboard:
- Error frequency by endpoint
- Response time P95
- Active users experiencing errors
- Release health

## Resources

- [Sentry NestJS Docs](https://docs.sentry.io/platforms/node/)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Filtering](https://docs.sentry.io/platforms/javascript/configuration/filtering/)
