import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

// DTO to update a user's profile (Admin or self)
export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
