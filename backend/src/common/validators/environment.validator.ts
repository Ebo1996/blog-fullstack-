import { Logger } from '@nestjs/common';

/**
 * Validates required environment variables on startup
 * Prevents deployment with missing critical configuration
 */
export class EnvironmentValidator {
  private static logger = new Logger('EnvironmentValidator');

  private static requiredVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAIL_FROM',
    'RESEND_API_KEY',
  ];

  private static productionOnlyVars = [
    'FRONTEND_URL',
    'CHAPA_SECRET_KEY',
    'CHAPA_WEBHOOK_SECRET',
  ];

  private static optionalVars = [
    'SENTRY_DSN',
    'SWAGGER_ENABLED',
    'LOG_LEVEL',
  ];

  static validate(): void {
    const isProd = process.env.NODE_ENV === 'production';
    const missing: string[] = [];
    const weak: string[] = [];
    const warnings: string[] = [];

    this.logger.log('🔍 Validating environment configuration...');

    // Check required variables
    for (const varName of this.requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    // Check production-only variables
    if (isProd) {
      for (const varName of this.productionOnlyVars) {
        if (!process.env[varName]) {
          missing.push(varName);
        }
      }
    }

    // Check JWT secret strength in production
    if (isProd) {
      const jwtSecret = process.env.JWT_SECRET || '';
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';

      if (jwtSecret.length < 32) {
        weak.push('JWT_SECRET (minimum 32 characters)');
      }

      if (jwtRefreshSecret.length < 32) {
        weak.push('JWT_REFRESH_SECRET (minimum 32 characters)');
      }

      // Check if secrets are the same (bad practice)
      if (jwtSecret === jwtRefreshSecret) {
        weak.push('JWT_SECRET and JWT_REFRESH_SECRET are identical');
      }

      // Check for common weak secrets
      const weakSecrets = ['secret', 'password', '123456', 'change_me'];
      if (weakSecrets.some(s => jwtSecret.toLowerCase().includes(s))) {
        weak.push('JWT_SECRET appears to be a weak/default value');
      }
    }

    // Check Swagger in production
    if (isProd && process.env.SWAGGER_ENABLED === 'true') {
      warnings.push('Swagger is enabled in production (consider disabling)');
    }

    // Check optional but recommended variables
    for (const varName of this.optionalVars) {
      if (!process.env[varName]) {
        warnings.push(`${varName} is not set (optional but recommended)`);
      }
    }

    // Report results
    if (missing.length > 0) {
      this.logger.error('❌ Missing required environment variables:');
      missing.forEach(v => this.logger.error(`   - ${v}`));
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }

    if (weak.length > 0) {
      this.logger.error('❌ Weak security configuration detected:');
      weak.forEach(w => this.logger.error(`   - ${w}`));
      if (isProd) {
        throw new Error('Weak security configuration not allowed in production');
      }
    }

    if (warnings.length > 0) {
      this.logger.warn('⚠️  Configuration warnings:');
      warnings.forEach(w => this.logger.warn(`   - ${w}`));
    }

    // Check database connection string
    this.validateMongoUri();

    // Check Chapa configuration in production
    if (isProd) {
      this.validateChapaConfig();
    }

    this.logger.log('✅ Environment validation passed');
  }

  private static validateMongoUri(): void {
    const uri = process.env.MONGODB_URI || '';

    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MONGODB_URI format');
    }

    // Check for localhost in production
    if (process.env.NODE_ENV === 'production' && uri.includes('localhost')) {
      this.logger.warn(
        '⚠️  MongoDB URI points to localhost in production environment',
      );
    }

    // Check for embedded credentials (security warning)
    if (uri.includes('@') && !uri.includes('***')) {
      this.logger.log('✓ MongoDB connection string contains credentials');
    }
  }

  private static validateChapaConfig(): void {
    const chapaKey = process.env.CHAPA_SECRET_KEY || '';

    // Check if using test key in production
    if (chapaKey.startsWith('CHASECK_TEST')) {
      this.logger.warn(
        '⚠️  WARNING: Chapa test key detected in production! Switch to production key for live payments.',
      );
      // Temporarily allow test key - REMOVE THIS IN PRODUCTION!
      return;
    }

    this.logger.log('✓ Chapa configuration validated');
  }

  /**
   * Display startup summary
   */
  static displaySummary(): void {
    const isProd = process.env.NODE_ENV === 'production';
    const chapaKey = process.env.CHAPA_SECRET_KEY || '';

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   EVENTIFY ETHIOPIA - STARTUP CHECK    ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log(`Environment:     ${isProd ? '🔴 PRODUCTION' : '🟢 DEVELOPMENT'}`);
    console.log(`Port:            ${process.env.PORT}`);
    console.log(`Database:        ${this.maskUri(process.env.MONGODB_URI || '')}`);
    console.log(`Cloudinary:      ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`Email Provider:  Resend`);
    console.log(`Payment:         Chapa ${chapaKey.startsWith('CHASECK_TEST') ? '(TEST)' : '(LIVE)'}`);
    console.log(`Sentry:          ${process.env.SENTRY_DSN ? '✓ Enabled' : '✗ Disabled'}`);
    console.log(`Swagger:         ${process.env.SWAGGER_ENABLED === 'true' || !isProd ? '✓ Enabled' : '✗ Disabled'}`);
    console.log('');
  }

  private static maskUri(uri: string): string {
    // Mask password in connection string
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  }
}
