import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CoursesController } from './courses.controller.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  providers: [CoursesService],
  controllers: [CoursesController],
  imports: [CloudinaryModule],
})
export class CoursesModule { }
