import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { EnvironmentValidator } from './common/validators/environment.validator';

async function bootstrap() {
  // Validate environment configuration before starting
  try {
    EnvironmentValidator.validate();
    EnvironmentValidator.displaySummary();
  } catch (error) {
    console.error('❌ Startup validation failed:', error.message);
    process.exit(1);
  }
  // rawBody: true is required for Chapa webhook HMAC signature verification
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const isProd = configService.get<string>('NODE_ENV') === 'production';
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // Security headers - Enhanced for production
  app.use(helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false, // required for Cloudinary images
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProd ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
  }));
  
  app.use(compression());

  // CORS — only allow localhost in development
  const allowedOrigins = isProd
    ? [frontendUrl]
    : [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Versioning
  app.enableVersioning({ type: VersioningType.URI });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger — disabled by default in production
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
  
  if (!isProd || swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Eventify Ethiopia API')
      .setDescription('Production-grade Event Management & Ticketing Platform API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('events', 'Event management')
      .addTag('tickets', 'Ticket management')
      .addTag('orders', 'Order management')
      .addTag('payments', 'Payment processing')
      .addTag('check-ins', 'QR check-in')
      .addTag('transfers', 'Ticket transfers')
      .addTag('analytics', 'Analytics & reporting')
      .addTag('admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { 
        persistAuthorization: true,
        // Add basic auth for production Swagger if needed
        ...(isProd && {
          authAction: {
            JWT: {
              name: 'JWT',
              schema: { type: 'http', in: 'header', name: 'Authorization', description: '' },
              value: 'Bearer <your-token-here>'
            }
          }
        })
      },
    });
    
    console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Eventify API running on: http://localhost:${port}/api`);
  console.log(`🔒 Environment: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🛡️  Security: Helmet enabled, Rate limiting active`);
  if (!isProd) console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
