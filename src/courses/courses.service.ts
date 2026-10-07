import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { CreateCourseDto, UpdateCourseDto, AssignCourseDto } from './dto/course.dto.js';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  // Cache key constants
  private readonly ALL_COURSES_KEY = 'courses:all';
  private readonly COURSE_TTL = 300; // 5 minutes in seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // 📖 PUBLIC: Get all courses (Cached in Redis)
  async findAll() {
    // 1. Try reading from Redis cache
    const cached = await this.redis.get<any[]>(this.ALL_COURSES_KEY);
    if (cached) {
      this.logger.log('⚡ [Cache HIT] Serving courses directly from Redis RAM!');
      return cached;
    }

    // 2. Cache MISS: Query PostgreSQL database
    this.logger.log('🐢 [Cache MISS] Fetching courses from PostgreSQL...');
    const courses = await this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // 3. Store in Redis with 5-minute expiration (TTL)
    await this.redis.set(this.ALL_COURSES_KEY, courses, this.COURSE_TTL);

    return courses;
  }

  // 📖 PUBLIC: Get a single course by ID (Cached in Redis)
  async findOne(id: number) {
    const cacheKey = `courses:${id}`;

    // 1. Check Redis cache
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      this.logger.log(`⚡ [Cache HIT] Serving course #${id} from Redis!`);
      return cached;
    }

    // 2. Cache MISS: Query PostgreSQL
    this.logger.log(`🐢 [Cache MISS] Fetching course #${id} from PostgreSQL...`);
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with ID ${id} not found.`);

    // 3. Store in Redis with TTL
    await this.redis.set(cacheKey, course, this.COURSE_TTL);

    return course;
  }

  // ✏️ ADMIN: Create a new course -> Invalidates all courses cache
  async create(dto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price ?? 0,
      },
    });

    // Invalidate the cached list so users see the new course immediately
    await this.redis.del(this.ALL_COURSES_KEY);
    this.logger.log('🧹 [Cache Invalidation] Cleared courses:all from Redis');

    return course;
  }

  // ✏️ ADMIN: Update a course -> Invalidates list and specific course cache
  async update(id: number, dto: UpdateCourseDto) {
    await this.findOne(id); // throws 404 if not found

    const updated = await this.prisma.course.update({
      where: { id },
      data: dto,
    });

    // Invalidate both the list and the single course cache
    await this.redis.del(this.ALL_COURSES_KEY);
    await this.redis.del(`courses:${id}`);
    this.logger.log(`🧹 [Cache Invalidation] Cleared courses:all and courses:${id} from Redis`);

    return updated;
  }

  // 🗑️ ADMIN: Delete a course -> Invalidates list and single course cache
  async remove(id: number) {
    await this.findOne(id); // throws 404 if not found

    await this.prisma.course.delete({ where: { id } });

    // Invalidate cache
    await this.redis.del(this.ALL_COURSES_KEY);
    await this.redis.del(`courses:${id}`);
    this.logger.log(`🧹 [Cache Invalidation] Cleared cache for course #${id} and courses:all`);

    return { message: `Course ${id} deleted successfully.` };
  }

  // 👥 ADMIN: Assign a course to a student
  async assignToStudent(courseId: number, dto: AssignCourseDto) {
    await this.findOne(courseId);

    const student = await this.prisma.user.findUnique({
      where: { email: dto.studentEmail },
    });
    if (!student) {
      throw new NotFoundException(`No user found with email: ${dto.studentEmail}`);
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('This student is already enrolled in this course.');
    }

    await this.prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId,
      },
    });

    return { message: `Course assigned to ${dto.studentEmail} successfully.` };
  }
}
