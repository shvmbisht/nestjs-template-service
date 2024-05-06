import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import config from 'config';
import { DBRootModule } from './adapters/db/db-root.module';
import { HealthModule } from './health/health.module';
import { json } from 'express';
import { AddRawBodyMiddleware } from 'src/middlewares/add-raw-body.middleware';

@Module({
  imports: [DBRootModule.forMongo(), HealthModule],
})
export class AppModule {}
