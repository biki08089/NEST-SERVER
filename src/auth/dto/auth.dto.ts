import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

// 1. DTO for requesting registration OTP
export class SendOtpDto {
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty()
    email: string;
}

// 2. DTO for completing registration (requires verified OTP)
export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'OTP is required' })
    otp: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(Role, { message: 'Role must be ADMIN or STUDENT' })
    @IsOptional()
    role?: Role;
}

// 3. DTO for login (verifies email & password, triggers OTP)
export class LoginDto {
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

// 4. DTO for verifying login OTP to get the JWT token
export class VerifyLoginOtpDto {
    @IsEmail({}, { message: 'Invalid email address' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'OTP is required' })
    otp: string;
}
