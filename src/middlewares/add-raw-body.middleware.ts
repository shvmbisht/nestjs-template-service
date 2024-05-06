import { Injectable, NestMiddleware } from '@nestjs/common';
import { json, Request, Response, NextFunction } from 'express';

@Injectable()
export class AddRawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): any {
    return json({
      verify: (incomingMsg, res, buffer) => {
        if (Buffer.isBuffer(buffer)) {
          const rawBody = Buffer.from(buffer);

          req['rawBody'] = rawBody;
        }

        return true;
      },
    })(req, res, next);
  }
}
