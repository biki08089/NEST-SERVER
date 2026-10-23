import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
    SendOtpDto,
    RegisterDto,
    LoginDto,
    VerifyLoginOtpDto,
} from './dto/auth.dto.js';
import { Throttle } from '../common/decorators/throttle.decorator.js';
import { RateLimitGuard } from '../common/guards/rate-limit.guard.js';


@Controller('auth')
@UseGuards(RateLimitGuard) // 🛡️ Enables rate-limiting for routes in this controller
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // 1. Request OTP for registration (Max 3 requests per 60 seconds from same IP!)
    @Post('send-register-otp')
    @Throttle({ limit: 3, ttl: 60 })
    @HttpCode(HttpStatus.OK)
    async sendRegisterOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendRegisterOtp(dto);
    }

    // 2. Complete registration with verified OTP
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    // 3. User login (Max 3 attempts per 60 seconds from same IP to stop brute-forcing!)
    @Post('login')
    @Throttle({ limit: 5, ttl: 60 })
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // 4. Verify login OTP and get JWT access token
    @Post('verify-login-otp')
    @HttpCode(HttpStatus.OK)
    async verifyLoginOtp(@Body() dto: VerifyLoginOtpDto) {
        return this.authService.verifyLoginOtp(dto);
    }
}
