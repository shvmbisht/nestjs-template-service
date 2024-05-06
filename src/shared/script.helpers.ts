import { config as envConfig } from 'dotenv';
envConfig();
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from 'src/modules/app.module';

type Script = (app: INestApplication) => Promise<void>;

export const runScript = (f: Script) => {
  NestFactory.create<NestExpressApplication>(AppModule).then(async (app) => {
    await app.init();
    await f(app)
      .then(() => process.exit(0))
      .catch((e) => {
        console.error(e);
        process.exit(-1);
      });
  });
};
