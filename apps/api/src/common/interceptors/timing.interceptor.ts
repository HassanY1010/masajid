import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseTimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = process.hrtime();
    const http = context.switchToHttp();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        if (res && res.setHeader && !res.headersSent) {
          res.setHeader('X-Response-Time', `${timeInMs}ms`);
        }
      }),
    );
  }
}
