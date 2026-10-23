import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class IsEnrolledGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // 1. Must be logged in
        if (!user || !user.id) {
            throw new UnauthorizedException('You must be logged in.');
        }

        // 2. Admins can view everything!
        if (user.role === 'ADMIN') {
            return true;
        }

        // 3. Extract courseId from URL params (e.g. /courses/:courseId/lessons/:id)
        const courseId = Number(request.params.courseId || request.params.id);

        if (!courseId || isNaN(courseId)) {
            throw new BadRequestException('Valid Course ID is required.');
        }

        // 4. Check PostgreSQL if this student is enrolled in this course
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId,
                },
            },
        });

        // 5. If not enrolled, deny access!
        if (!enrollment) {
            throw new ForbiddenException(
                'Access denied: You must be enrolled in this course to access this content.',
            );
        }

        // 6. Enrolled! Allow access!
        return true;
    }
}
