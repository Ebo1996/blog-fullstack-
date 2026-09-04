import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private connection: Connection,
    private configService: ConfigService,
  ) {}

  async getDetailedHealth() {
    const dbStatus = await this.checkDatabase();
    const envStatus = this.checkEnvironment();

    return {
      status: dbStatus.connected && envStatus.valid ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      checks: {
        database: dbStatus,
        environment: envStatus,
        memory: this.getMemoryUsage(),
      },
    };
  }

  async checkReadiness() {
    const dbStatus = await this.checkDatabase();
    const ready = dbStatus.connected;

    return {
      ready,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus.connected,
      },
    };
  }

  private async checkDatabase() {
    try {
      const state = this.connection.readyState;
      // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
      const connected = state === 1;

      return {
        connected,
        state: this.getConnectionStateName(state),
        host: this.connection.host,
        name: this.connection.name,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  private checkEnvironment() {
    const required = [
      'NODE_ENV',
      'MONGODB_URI',
      'JWT_SECRET',
      'CLOUDINARY_CLOUD_NAME',
    ];

    const missing = required.filter(key => !process.env[key]);

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`,
    };
  }

  private getConnectionStateName(state: number): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[state] || 'unknown';
  }
}
