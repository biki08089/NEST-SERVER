import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

// This guard checks that the logged-in user has the required role.
// It reads the roles set by @Roles() decorator using Reflector.
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Get the required roles defined on the route
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no @Roles() decorator was set, allow everyone through
        if (!requiredRoles) return true;

        // Get the user from the request (put there by JwtStrategy.validate)
        const { user } = context.switchToHttp().getRequest();

        // Check if the user's role is in the required roles
        if (!requiredRoles.includes(user?.role)) {
            throw new ForbiddenException('You do not have permission to access this resource.');
        }

        return true;
    }
}
