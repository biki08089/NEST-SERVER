import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service.js';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { IsEnrolledGuard } from '../common/guards/is-enrolled.guard.js';

@Controller('courses/:courseId/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // 1. 🔐 ADMIN ONLY: Add a lesson to a course
  // POST /courses/:courseId/lessons
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(courseId, dto);
  }

  // 2. 📖 PUBLIC: Syllabus preview (titles, order, IDs - no videoUrl)
  // GET /courses/:courseId/lessons
  @Get()
  findAllByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.lessonsService.findAllByCourse(courseId);
  }

  // 3. 🔐 ENROLLED STUDENTS & ADMIN: Watch lesson (returns full videoUrl)
  // GET /courses/:courseId/lessons/:lessonId
  @Get(':lessonId')
  @UseGuards(JwtAuthGuard, IsEnrolledGuard)
  findOne(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.lessonsService.findOne(courseId, lessonId);
  }

  // 4. 🔐 ADMIN ONLY: Update lesson title, description, or videoUrl
  // PATCH /courses/:courseId/lessons/:lessonId
  @Patch(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(courseId, lessonId, dto);
  }

  // 5. 🔐 ADMIN ONLY: Remove a lesson from a course
  // DELETE /courses/:courseId/lessons/:lessonId
  @Delete(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.lessonsService.remove(courseId, lessonId);
  }
}
