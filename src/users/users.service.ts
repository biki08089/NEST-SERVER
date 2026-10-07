import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/user.dto.js';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    // Get a user's full profile (internal use — never returns password)
    async findById(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) throw new NotFoundException(`User with ID ${id} not found.`);
        return user;
    }

    // ADMIN: Get all users
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ADMIN: Update any user | User: update own profile only
    async update(requestingUserId: number, requestingRole: string, targetId: number, dto: UpdateUserDto) {
        // A student can only update themselves
        if (requestingRole !== 'ADMIN' && requestingUserId !== targetId) {
            throw new ForbiddenException('You can only update your own profile.');
        }

        await this.findById(targetId); // throws 404 if not found

        const data: any = {};
        if (dto.name) data.name = dto.name;
        if (dto.role && requestingRole === 'ADMIN') data.role = dto.role; // only admin can change roles
        if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

        return this.prisma.user.update({
            where: { id: targetId },
            data,
            select: { id: true, email: true, name: true, role: true },
        });
    }

    // ADMIN: Delete a user
    async remove(id: number) {
        await this.findById(id);
        await this.prisma.user.delete({ where: { id } });
        return { message: `User ${id} deleted successfully.` };
    }

    // STUDENT: Get their own enrolled courses
    async getMyCourses(userId: number) {
        const enrollments = await this.prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: true,
            },
            orderBy: { assignedAt: 'desc' },
        });

        return enrollments.map((e) => ({
            enrolledAt: e.assignedAt,
            ...e.course,
        }));
    }
}
