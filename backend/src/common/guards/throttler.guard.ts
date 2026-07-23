import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class FloodGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip;
    const key = `flood:${userId}`;
    
    const current = await this.redis.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= 30) {
      throw new HttpException('Too many requests. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
    }
    
    await this.redis.set(key, String(count + 1), 60);
    return true;
  }
}
