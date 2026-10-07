import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, CoursesModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
