import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// This "Strategy" tells Passport how to validate a JWT token.
// It automatically runs every time a protected route is accessed.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Reads token from "Authorization: Bearer <token>"
            ignoreExpiration: false, // Rejects expired tokens
            secretOrKey: process.env.JWT_SECRET || 'fallbackSecretKey',
        });
    }

    // This method runs after the token is verified.
    // Whatever you return here is attached to the request as `req.user`
    async validate(payload: { sub: number; email: string; role: string }) {
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
