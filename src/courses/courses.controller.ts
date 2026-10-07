import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto, UpdateCourseDto, AssignCourseDto } from './dto/course.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    // ✅ PUBLIC - No guards needed
    @Get()
    findAll() {
        return this.coursesService.findAll();
    }

    // ✅ PUBLIC - No guards needed
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.coursesService.findOne(id);
    }

    // 🔐 ADMIN ONLY
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    create(@Body() dto: CreateCourseDto) {
        return this.coursesService.create(dto);
    }

    // 🔐 ADMIN ONLY
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
        return this.coursesService.update(id, dto);
    }

    // 🔐 ADMIN ONLY
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.coursesService.remove(id);
    }

    // 🔐 ADMIN ONLY - Assign course to a student
    @Post(':id/assign')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignCourseDto) {
        return this.coursesService.assignToStudent(id, dto);
    }
}
