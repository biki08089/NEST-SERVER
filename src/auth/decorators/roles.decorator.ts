import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

// This decorator lets you tag a route with required roles.
// Example usage: @Roles(Role.ADMIN) on any controller method
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
