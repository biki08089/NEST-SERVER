import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class IsVerifiedGuard implements CanActivate {
    // 1. Inject PrismaService into our guard!
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Must be logged in first (JwtAuthGuard must run before this guard)
        if (!user || !user.id) {
            throw new UnauthorizedException('You must be logged in.');
        }

        // 2. Look up the user directly in PostgreSQL
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            throw new UnauthorizedException('User not found.');
        }

        // 3. Check if isVerified is true
        if (!dbUser.isVerified) {
            throw new ForbiddenException(
                'Access denied: Your account is not verified yet.',
            );
        }

        // 4. Access granted!
        return true;
    }
}
