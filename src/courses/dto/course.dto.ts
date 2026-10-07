import { IsString, IsOptional, IsNumber, IsNotEmpty, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for creating a course (Admin only)
export class CreateCourseDto {
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    price?: number;
}

// DTO for updating a course (Admin only) - all fields optional
export class UpdateCourseDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    price?: number;
}

// DTO for assigning a course to a student (Admin only)
export class AssignCourseDto {
    @IsEmail({}, { message: 'Provide a valid student email' })
    @IsNotEmpty()
    studentEmail: string;
}
