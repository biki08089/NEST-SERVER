import {
    Injectable,
    ConflictException,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from './mail.service.js';
import {
    SendOtpDto,
    RegisterDto,
    LoginDto,
    VerifyLoginOtpDto,
} from './dto/auth.dto.js';
import { RedisService } from '../redis/redis.service.js';


@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly redis: RedisService,
    ) { }

    // Helper: generates a 6-digit numeric OTP
    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 1. Send OTP before registration (Rate-limited & cached in Redis)
    async sendRegisterOtp(dto: SendOtpDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('An account with this email already exists.');
        }

        // 🛡️ RATE LIMITING: Max 3 OTP requests per email every 5 minutes (300 seconds)
        const rateLimitKey = `rate:otp:${dto.email}`;
        const attempts = await this.redis.incr(rateLimitKey, 300);

        if (attempts > 3) {
            throw new HttpException(
                'Too many OTP requests. Please wait 5 minutes before trying again.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const code = this.generateOtp();

        // ⚡ Save OTP in Redis with 5-minute (300 seconds) TTL
        // No more cluttering PostgreSQL!
        await this.redis.set(`otp:register:${dto.email}`, code, 300);

        // Send email
        await this.mailService.sendOtpEmail(dto.email, code);

        return {
            message: 'Verification OTP sent to your email.',
            remainingAttempts: Math.max(0, 3 - attempts),
        };
    }


    // 2. Complete registration after OTP verification
    async register(dto: RegisterDto) {
        // Check if email already registered in the meantime
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('An account with this email already exists.');
        }

        // Verify OTP from Redis
        const redisOtpKey = `otp:register:${dto.email}`;
        const storedOtp = await this.redis.get<string>(redisOtpKey);
        if (!storedOtp || storedOtp !== dto.otp) {
            throw new BadRequestException('Invalid or expired OTP.');
        }
        // Valid! Delete OTP from Redis so it cannot be reused
        await this.redis.del(redisOtpKey);

        // Hash the password with bcrypt (salt rounds = 10)
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create the user in PostgreSQL
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                role: dto.role || 'STUDENT',
                isVerified: true,
            },
        });

        // Delete the used OTP
        await this.prisma.otp.deleteMany({ where: { email: dto.email } });

        // Generate JWT access token
        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            message: 'Registration successful!',
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    // 3. User login (checks password, sends OTP)
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        const code = this.generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete old OTPs and create a new one
        await this.prisma.otp.deleteMany({ where: { email: dto.email } });
        await this.prisma.otp.create({
            data: {
                email: dto.email,
                code,
                expiresAt,
            },
        });

        await this.mailService.sendOtpEmail(dto.email, code);

        return {
            message: 'Login OTP sent to your email. Please verify to access your account.',
        };
    }

    // 4. Verify login OTP and return JWT
    async verifyLoginOtp(dto: VerifyLoginOtpDto) {
        const validOtp = await this.prisma.otp.findFirst({
            where: {
                email: dto.email,
                code: dto.otp,
                expiresAt: { gt: new Date() },
            },
        });

        if (!validOtp) {
            throw new BadRequestException('Invalid or expired OTP.');
        }

        // Clean up OTP
        await this.prisma.otp.deleteMany({ where: { email: dto.email } });

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            message: 'Login successful!',
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }
}
