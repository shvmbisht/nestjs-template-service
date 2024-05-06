import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { map } from 'rxjs/operators';
import { IPaginationResponse } from 'src/shared/types';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(
    ctx: ExecutionContext,
    next: CallHandler<IPaginationResponse<any>>,
  ): Observable<any[]> {
    return next.handle().pipe(
      map((data) => {
        const req = ctx.switchToHttp().getRequest<Request>();
        Object.entries(data.headers).forEach(([kH, vH]) => {
          req.res?.header(kH, vH);
        });
        return data.items;
      }),
    );
  }
}
