import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
    SendOtpDto,
    RegisterDto,
    LoginDto,
    VerifyLoginOtpDto,
} from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // 1. Request OTP for registration
    @Post('send-register-otp')
    @HttpCode(HttpStatus.OK)
    async sendRegisterOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendRegisterOtp(dto);
    }

    // 2. Complete registration with verified OTP
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    // 3. User login (password check + triggers OTP)
    @Post('login')
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
