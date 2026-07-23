import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private redis: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    if (request.method !== 'GET') return next.handle();
    
    const key = `cache:${request.url}`;
    const cached = await this.redis.get(key);
    
    if (cached) return of(JSON.parse(cached));
    
    return next.handle().pipe(
      tap(async (data) => {
        await this.redis.set(key, JSON.stringify(data), 300);
      }),
    );
  }
}
