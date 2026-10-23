import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

// 1. DTO for creating a new lesson (Admin only)
export class CreateLessonDto {
    @IsString()
    @IsNotEmpty({ message: 'Lesson title is required' })
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    order?: number; // e.g. 1 for Lesson 1, 2 for Lesson 2
}

// 2. DTO for updating an existing lesson (all fields optional)
export class UpdateLessonDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    order?: number;
}
