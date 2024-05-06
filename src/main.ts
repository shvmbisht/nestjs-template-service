import { config as envConfig } from 'dotenv';
envConfig();
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import config from 'config';
import express from 'express';
import { DefaultResBodyInterceptor } from './interceptors/default-res-body.interceptor';
import { LoggerInterceptor } from './interceptors/logger.interceptor';
import { AppModule } from './modules/app.module';
import { generalValidationPipe } from './pipes/general-validation.pipe';
import { convertErrorToLogData } from './shared/helpers';
import { errorLog, infoLog } from './shared/logger/logger.helpers';
import { initializeSwaggerDoc } from './shared/swagger.helpers';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: false,
  });
  app.set('trust-proxy', true);
  app.set('etag', false);
  app.setGlobalPrefix(config.get<string>('service.baseUrl'));
  app.enableCors({
    exposedHeaders: config.get<string>('server.cors.exposedHeaders'),
  });
  app.use(express.urlencoded({ extended: true }));
  app.useGlobalPipes(generalValidationPipe);
  app.useGlobalInterceptors(
    new LoggerInterceptor(),
    new DefaultResBodyInterceptor(),
  );
  initializeSwaggerDoc(app);
  app.use(express.text({ type: 'text/plain' }));
  await app.listen(config.get<string>('server.port'));
}

bootstrap()
  .then(() => {
    infoLog(
      {
        address: `${config.get<string>(
          'server.swaggerSchema',
        )}://${config.get<string>('server.hostname')}`,
        apiBaseUrl: `${config.get<string>('service.baseUrl')}`,
        docsBaseUrl: `${config.get<string>('service.docsBaseUrl')}`,
      },
      `App is running`,
    );
  })
  .catch((e) => {
    errorLog(convertErrorToLogData(e), undefined, 'App exception occurs');
    process.exit(-1);
  });

// add callback to log uncaught exception
process.on('uncaughtException', (err) => {
  errorLog(convertErrorToLogData(err), undefined, 'uncaughtException');
});
// add callback to log unhandled exception
process.on('unhandledRejection', (reason: any, promise) => {
  errorLog(
    {
      promise,
      reason,
      promiseStr: String(promise),
      reasonStr: String(reason),
      reasonStack: reason?.stack,
    },
    undefined,
    `unhandledRejection`,
  );
});
