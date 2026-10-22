import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));
  // 🎁 1. Transform response shape  +  ⏱️ 2. Measure route execution speed!
  app.useGlobalInterceptors(new TransformInterceptor(), new TimingInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();