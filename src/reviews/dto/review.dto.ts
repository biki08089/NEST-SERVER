import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
    @IsInt({ message: 'Rating must be an integer between 1 and 5' })
    @Min(1, { message: 'Rating must be at least 1 star' })
    @Max(5, { message: 'Rating cannot be more than 5 stars' })
    @Type(() => Number)
    rating: number;

    @IsString()
    @IsOptional()
    comment?: string;
}

export class UpdateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    @Type(() => Number)
    rating?: number;

    @IsString()
    @IsOptional()
    comment?: string;
}
