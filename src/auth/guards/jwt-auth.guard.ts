import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard uses the JwtStrategy above.
// Add @UseGuards(JwtAuthGuard) to any route to protect it.
// If the JWT is invalid or missing, NestJS automatically returns 401 Unauthorized.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
