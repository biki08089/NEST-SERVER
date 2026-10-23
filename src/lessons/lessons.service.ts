import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto.js';

@Injectable()
export class LessonsService {
    private readonly logger = new Logger(LessonsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // 1. Check if a course exists (Helper)
    private async ensureCourseExists(courseId: number) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new NotFoundException(`Course #${courseId} does not exist.`);
        }
        return course;
    }

    // 2. ✏️ ADMIN: Create a new lesson inside a course
    async create(courseId: number, dto: CreateLessonDto) {
        await this.ensureCourseExists(courseId);

        const lesson = await this.prisma.lesson.create({
            data: {
                title: dto.title,
                description: dto.description,
                videoUrl: dto.videoUrl,
                order: dto.order ?? 1,
                courseId: courseId,
            },
        });

        this.logger.log(`Created lesson "${lesson.title}" for Course #${courseId}`);
        return lesson;
    }

    // 3. 📖 PUBLIC SYLLABUS: Get all lesson titles for a course (preview)
    // Notice: We don't expose videoUrl here, so anyone can see the topics!
    async findAllByCourse(courseId: number) {
        await this.ensureCourseExists(courseId);

        return this.prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' }, // Lesson 1, Lesson 2, Lesson 3...
            select: {
                id: true,
                title: true,
                order: true,
                courseId: true,
            },
        });
    }

    // 4. 🔐 ENROLLED STUDENTS ONLY: Get full lesson details + videoUrl
    async findOne(courseId: number, lessonId: number) {
        await this.ensureCourseExists(courseId);

        const lesson = await this.prisma.lesson.findFirst({
            where: {
                id: lessonId,
                courseId: courseId,
            },
        });

        if (!lesson) {
            throw new NotFoundException(`Lesson #${lessonId} not found in Course #${courseId}.`);
        }

        return lesson;
    }

    // 5. ✏️ ADMIN: Update a lesson
    async update(courseId: number, lessonId: number, dto: UpdateLessonDto) {
        await this.findOne(courseId, lessonId); // verifies existence

        return this.prisma.lesson.update({
            where: { id: lessonId },
            data: dto,
        });
    }

    // 6. 🗑️ ADMIN: Delete a lesson
    async remove(courseId: number, lessonId: number) {
        await this.findOne(courseId, lessonId); // verifies existence

        await this.prisma.lesson.delete({
            where: { id: lessonId },
        });

        return { message: `Lesson #${lessonId} deleted successfully.` };
    }
}
