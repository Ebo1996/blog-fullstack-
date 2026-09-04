import { Injectable, LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Custom logger service that respects LOG_LEVEL environment variable
 * and sanitizes sensitive data in production
 */
@Injectable()
export class AppLoggerService implements NestLoggerService {
  private logLevel: string;
  private isProd: boolean;

  constructor(private configService: ConfigService) {
    this.logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    this.isProd = this.configService.get<string>('NODE_ENV') === 'production';
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'log', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private sanitize(message: any): any {
    if (typeof message !== 'string') return message;
    
    // In production, mask sensitive data
    if (this.isProd) {
      // Mask emails (show first 2 chars + domain)
      message = message.replace(
        /([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*@/g,
        '$1***@'
      );
      
      // Mask user IDs (show first 8 chars)
      message = message.replace(
        /\b[0-9a-f]{24}\b/g,
        (match) => match.substring(0, 8) + '***'
      );
    }
    
    return message;
  }

  log(message: any, context?: string) {
    if (!this.shouldLog('log')) return;
    const sanitized = this.sanitize(message);
    console.log(context ? `[${context}] ${sanitized}` : sanitized);
  }

  error(message: any, trace?: string, context?: string) {
    if (!this.shouldLog('error')) return;
    const sanitized = this.sanitize(message);
    console.error(context ? `[${context}] ${sanitized}` : sanitized);
    if (trace) console.error(trace);
  }

  warn(message: any, context?: string) {
    if (!this.shouldLog('warn')) return;
    const sanitized = this.sanitize(message);
    console.warn(context ? `[${context}] ${sanitized}` : sanitized);
  }

  debug(message: any, context?: string) {
    if (!this.shouldLog('debug')) return;
    const sanitized = this.sanitize(message);
    console.debug(context ? `[${context}] ${sanitized}` : sanitized);
  }

  verbose(message: any, context?: string) {
    if (!this.shouldLog('debug')) return;
    const sanitized = this.sanitize(message);
    console.log(context ? `[${context}] ${sanitized}` : sanitized);
  }
}
