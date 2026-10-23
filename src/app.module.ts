import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { UsersModule } from './users/users.module.js';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { LessonsModule } from './lessons/lessons.module.js';
@Module({
  imports: [PrismaModule, RedisModule, AuthModule, CoursesModule, UsersModule, LessonsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).exclude(
      { path: 'courses', method: RequestMethod.GET },
      { path: 'courses/:id', method: RequestMethod.GET },).forRoutes('*');
    // This '*' mean this middleware will run for all the routes in this nest js application. 
    // if i want to run this middleware only for the auth routes i will write consumer.apply(LoggerMiddleware).forRoutes('auth');

  }

}








