import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '@/entities/feedback.entity';
import { User } from '@/entities/user.entity';
import { Cohort } from '@/entities/cohort.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { CreateFeedbackRequestDto } from '@/feedback/feedback.request.dto';
import {
    CreateFeedbackResponseDto,
    GetFeedbackResponseDto,
} from '@/feedback/feedback.response.dto';
import { PaginatedDataDto, PaginatedQueryDto } from '@/common/dto';

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name);

    constructor(
        @InjectRepository(Feedback)
        private readonly feedbackRepository: Repository<Feedback>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(ExerciseScore)
        private readonly exerciseScoreRepository: Repository<ExerciseScore>,
    ) {}

    async createFeedback(
        user: User,
        feedbackData: CreateFeedbackRequestDto,
    ): Promise<CreateFeedbackResponseDto> {
        // Verify cohort exists
        const cohort: Cohort | null = await this.cohortRepository.findOne({
            where: { id: feedbackData.cohortId },
            relations: { users: true },
        });

        if (!cohort) {
            throw new NotFoundException(
                `Cohort with id ${feedbackData.cohortId} does not exist.`,
            );
        }

        // Check if user is enrolled in the cohort
        const isEnrolled = cohort.users.some(
            (enrolledUser) => enrolledUser.id === user.id,
        );

        if (!isEnrolled) {
            throw new BadRequestException(
                `You are not enrolled in this cohort.`,
            );
        }

        // Check if user has attended at least one week
        const attendanceCount = await this.exerciseScoreRepository.count({
            where: {
                user: { id: user.id },
                cohort: { id: feedbackData.cohortId },
                isSubmitted: true,
            },
        });

        if (attendanceCount === 0) {
            throw new BadRequestException(
                `You must attend at least one week before submitting feedback.`,
            );
        }

        // Check if user has already submitted feedback for this cohort
        const existingFeedback = await this.feedbackRepository.findOne({
            where: {
                user: { id: user.id },
                cohort: { id: feedbackData.cohortId },
            },
        });

        if (existingFeedback) {
            throw new BadRequestException(
                `You have already submitted feedback for this cohort.`,
            );
        }

        // Create feedback
        const feedback = new Feedback();
        feedback.preferredName = feedbackData.preferredName;
        feedback.email = feedbackData.email;
        feedback.feedbackText = feedbackData.feedbackText;
        feedback.user = user;
        feedback.cohort = cohort;

        const savedFeedback = await this.feedbackRepository.save(feedback);

        this.logger.log(
            `User ${user.id} submitted feedback for cohort ${feedbackData.cohortId}`,
        );

        return new CreateFeedbackResponseDto({
            id: savedFeedback.id,
            message: 'Feedback submitted successfully',
        });
    }

    async getFeedbackById(feedbackId: string): Promise<GetFeedbackResponseDto> {
        const feedback = await this.feedbackRepository.findOne({
            where: { id: feedbackId },
            relations: { user: true, cohort: true },
        });

        if (!feedback) {
            throw new NotFoundException(
                `Feedback with id ${feedbackId} does not exist.`,
            );
        }

        return new GetFeedbackResponseDto({
            id: feedback.id,
            preferredName: feedback.preferredName,
            email: feedback.email,
            feedbackText: feedback.feedbackText,
            cohortId: feedback.cohort.id,
            userId: feedback.user.id,
            createdAt: feedback.createdAt,
            updatedAt: feedback.updatedAt,
        });
    }

    async listFeedback(
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetFeedbackResponseDto>> {
        const [feedbacks, total] = await this.feedbackRepository.findAndCount({
            skip: query.page * query.pageSize,
            take: query.pageSize,
            order: { createdAt: 'DESC' },
            relations: { user: true, cohort: true },
        });

        return new PaginatedDataDto({
            totalRecords: total,
            records: feedbacks.map(
                (feedback) =>
                    new GetFeedbackResponseDto({
                        id: feedback.id,
                        preferredName: feedback.preferredName,
                        email: feedback.email,
                        feedbackText: feedback.feedbackText,
                        cohortId: feedback.cohort.id,
                        userId: feedback.user.id,
                        createdAt: feedback.createdAt,
                        updatedAt: feedback.updatedAt,
                    }),
            ),
        });
    }

    async listFeedbackByCohort(
        cohortId: string,
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetFeedbackResponseDto>> {
        // Verify cohort exists
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
        });

        if (!cohort) {
            throw new NotFoundException(
                `Cohort with id ${cohortId} does not exist.`,
            );
        }

        const [feedbacks, total] = await this.feedbackRepository.findAndCount({
            where: { cohort: { id: cohortId } },
            skip: query.page * query.pageSize,
            take: query.pageSize,
            order: { createdAt: 'DESC' },
            relations: { user: true, cohort: true },
        });

        return new PaginatedDataDto({
            totalRecords: total,
            records: feedbacks.map(
                (feedback) =>
                    new GetFeedbackResponseDto({
                        id: feedback.id,
                        preferredName: feedback.preferredName,
                        email: feedback.email,
                        feedbackText: feedback.feedbackText,
                        cohortId: feedback.cohort.id,
                        userId: feedback.user.id,
                        createdAt: feedback.createdAt,
                        updatedAt: feedback.updatedAt,
                    }),
            ),
        });
    }

    async listMyFeedback(
        user: User,
        query: PaginatedQueryDto,
    ): Promise<PaginatedDataDto<GetFeedbackResponseDto>> {
        const [feedbacks, total] = await this.feedbackRepository.findAndCount({
            where: { user: { id: user.id } },
            skip: query.page * query.pageSize,
            take: query.pageSize,
            order: { createdAt: 'DESC' },
            relations: { user: true, cohort: true },
        });

        return new PaginatedDataDto({
            totalRecords: total,
            records: feedbacks.map(
                (feedback) =>
                    new GetFeedbackResponseDto({
                        id: feedback.id,
                        preferredName: feedback.preferredName,
                        email: feedback.email,
                        feedbackText: feedback.feedbackText,
                        cohortId: feedback.cohort.id,
                        userId: feedback.user.id,
                        createdAt: feedback.createdAt,
                        updatedAt: feedback.updatedAt,
                    }),
            ),
        });
    }
}
