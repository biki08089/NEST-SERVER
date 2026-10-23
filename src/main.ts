import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));
  // 🎁 1. Transform response shape  +  ⏱️ 2. Measure route execution speed!
  app.useGlobalInterceptors(new TransformInterceptor(), new TimingInterceptor());
  // 3. 🚨 Filter: Catch every error and shape error responses!
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();