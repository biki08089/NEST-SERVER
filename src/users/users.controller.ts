import {
    Controller, Get, Patch, Delete,
    Param, Body, ParseIntPipe,
    UseGuards, Request,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard) // All user routes require login
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // 🔐 ANY LOGGED-IN USER — Get own profile
    @Get('me')
    getMe(@Request() req: any) {
        return this.usersService.findById(req.user.id);
    }

    // 🔐 ANY LOGGED-IN USER — Get own enrolled courses
    @Get('my-courses')
    getMyCourses(@Request() req: any) {
        return this.usersService.getMyCourses(req.user.id);
    }

    // 🔐 ADMIN ONLY — Get all users
    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    // 🔐 ADMIN ONLY — Get a user by ID
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findById(id);
    }

    // 🔐 LOGGED-IN USER — Update profile (admin can update any, student only their own)
    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.update(req.user.id, req.user.role, id, dto);
    }

    // 🔐 ADMIN ONLY — Delete a user
    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.remove(id);
    }
}
