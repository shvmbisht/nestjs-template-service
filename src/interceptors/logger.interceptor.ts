import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import config from 'config';
import { Request, Response } from 'express';
import _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { maskFieldsInObject } from 'src/shared/helpers';
import { errorLog, infoLog } from 'src/shared/logger/logger.helpers';

export class LoggerInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const reqBody = _.cloneDeep(req.body);
    // Mask req body
    const fieldsToMask = config.has('logger.fieldsToMask')
      ? config.get<string[]>('logger.fieldsToMask')
      : [];
    const maskedReqBody = maskFieldsInObject(reqBody, fieldsToMask);

    const reqLogData = {
      id: req['id'],
      method: req.method,
      uri: req.url,
      reqHeaders: {
        ...req.headers,
        authorization: '***',
        'proxy-authorization': '***',
      },
      reqBody: maskedReqBody,
    };

    return next.handle().pipe(
      tap((data) => {
        const res = ctx.switchToHttp().getResponse<Response>();
        infoLog(
          {
            ...reqLogData,
            status: res.statusCode,
            resBody: data,
            resHeader: res.getHeaders(),
          },
          'App request-response',
        );
      }),
      catchError((err) => {
        errorLog(err, { req: reqLogData }, 'App exception occurs');
        return throwError(() => err);
      }),
    );
  }
}
