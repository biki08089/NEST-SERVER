import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('courses/:courseId/reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    // 1. 🔐 ENROLLED STUDENTS: Add or update a review
    // POST /courses/:courseId/reviews
    @Post()
    @UseGuards(JwtAuthGuard)
    create(
        @Param('courseId', ParseIntPipe) courseId: number,
        @CurrentUser('id') userId: number,
        @Body() dto: CreateReviewDto,
    ) {
        return this.reviewsService.createOrUpdate(userId, courseId, dto);
    }

    // 2. 🌍 PUBLIC: Get all reviews & average rating for a course
    // GET /courses/:courseId/reviews
    @Get()
    findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
        return this.reviewsService.findByCourse(courseId);
    }

    // 3. 🔐 AUTHOR OR ADMIN: Delete a review
    // DELETE /courses/:courseId/reviews/:reviewId
    @Delete(':reviewId')
    @UseGuards(JwtAuthGuard)
    remove(
        @Param('reviewId', ParseIntPipe) reviewId: number,
        @CurrentUser() user: { id: number; role: string },
    ) {
        return this.reviewsService.remove(reviewId, user.id, user.role);
    }
}
