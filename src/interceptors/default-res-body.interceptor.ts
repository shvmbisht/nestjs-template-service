import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import _ from 'lodash';
import { map } from 'rxjs';

export class DefaultResBodyInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, call$: CallHandler) {
    return call$
      .handle()
      .pipe(
        map((resBody) =>
          _.isNil(resBody) ? { status: 'SUCCEEDED' } : resBody,
        ),
      );
  }
}
