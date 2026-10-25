import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/review.dto.js';

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    // 1. Submit or update review (Enrolled students only)
    async createOrUpdate(
        userId: number,
        courseId: number,
        dto: CreateReviewDto,
    ) {
        // A. Check if the course exists
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new NotFoundException(`Course with ID ${courseId} not found.`);
        }

        // B. Check if the student is enrolled in this course
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });

        if (!enrollment) {
            throw new ForbiddenException(
                'You can only review courses you are enrolled in.',
            );
        }

        // C. Upsert: create if first time, update if review already exists
        return this.prisma.review.upsert({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            update: {
                rating: dto.rating,
                comment: dto.comment,
            },
            create: {
                userId,
                courseId,
                rating: dto.rating,
                comment: dto.comment,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    // 2. Public: Get all reviews for a course + average rating
    async findByCourse(courseId: number) {
        // Check if course exists
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new NotFoundException(`Course with ID ${courseId} not found.`);
        }

        // Fetch all reviews for this course
        const reviews = await this.prisma.review.findMany({
            where: { courseId },
            include: {
                user: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute average rating and count using Prisma's aggregate
        const stats = await this.prisma.review.aggregate({
            where: { courseId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        return {
            courseId,
            totalReviews: stats._count.rating,
            averageRating: stats._avg.rating
                ? Number(stats._avg.rating.toFixed(1))
                : 0,
            reviews,
        };
    }

    // 3. Delete review (Review author or ADMIN only)
    async remove(reviewId: number, userId: number, userRole: string) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException(`Review with ID ${reviewId} not found.`);
        }

        // Only author or ADMIN can delete
        if (review.userId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException(
                'You do not have permission to delete this review.',
            );
        }

        await this.prisma.review.delete({
            where: { id: reviewId },
        });

        return { message: 'Review deleted successfully.' };
    }
}
