import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { User } from '@/entities/user.entity';
import {
    GitHubClient,
    GitHubClassroomGrade,
} from '@/github-client/github.client';
import {
    CohortExerciseGradesResponseDto,
    StudentGradeDto,
    WeekExerciseGradesResponseDto,
} from '@/exercise-grades/exercise-grades.response.dto';
import { UserRole } from '@/common/enum';

@Injectable()
export class ExerciseGradesService {
    private readonly logger = new Logger(ExerciseGradesService.name);
    private static readonly CACHE_TTL_MS = 5 * 60 * 1000;
    private static readonly CACHE_KEY_PREFIX = 'gh_grades:';

    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(CohortWeek)
        private readonly cohortWeekRepository: Repository<CohortWeek>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly gitHubClient: GitHubClient,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) {}

    private extractGitHubUsername(profileUrl: string | null): string | null {
        if (!profileUrl) return null;
        try {
            const url = new URL(profileUrl);
            const parts = url.pathname.split('/').filter(Boolean);
            return parts.length > 0 ? parts[0].toLowerCase() : null;
        } catch {
            return null;
        }
    }

    private async buildUsernameToUserMap(
        cohortId: string,
    ): Promise<Map<string, User>> {
        const users = await this.userRepository.find({
            where: {
                cohorts: { id: cohortId },
                role: UserRole.STUDENT,
            },
            relations: { cohorts: true },
        });

        const map = new Map<string, User>();
        for (const user of users) {
            const username = this.extractGitHubUsername(user.githubProfileUrl);
            if (username) {
                map.set(username, user);
            }
        }
        return map;
    }

    private async fetchGradesWithCache(
        assignmentId: number,
    ): Promise<GitHubClassroomGrade[]> {
        const cacheKey = ExerciseGradesService.CACHE_KEY_PREFIX + assignmentId;

        const cached = await this.cacheManager.get<GitHubClassroomGrade[]>(
            cacheKey,
        );
        if (cached) {
            this.logger.debug(`Cache hit for assignment ${assignmentId}`);
            return cached;
        }

        const grades = await this.gitHubClient.getAssignmentGrades(
            assignmentId,
        );
        await this.cacheManager.set(
            cacheKey,
            grades,
            ExerciseGradesService.CACHE_TTL_MS,
        );
        return grades;
    }

    private mapGradesToStudentDtos(
        grades: GitHubClassroomGrade[],
        usernameToUser: Map<string, User>,
    ): StudentGradeDto[] {
        return grades.map((grade) => {
            const normalizedUsername = grade.github_username.toLowerCase();
            const matchedUser = usernameToUser.get(normalizedUsername) ?? null;

            return new StudentGradeDto({
                userId: matchedUser?.id ?? null,
                name: matchedUser?.name ?? null,
                githubUsername: grade.github_username,
                pointsAwarded: grade.points_awarded,
                pointsAvailable: grade.points_available,
                submissionTimestamp: grade.submission_timestamp,
                studentRepositoryUrl: grade.student_repository_url,
            });
        });
    }

    async getExerciseGradesForCohortWeek(
        cohortId: string,
        weekId: string,
    ): Promise<WeekExerciseGradesResponseDto> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} not found`,
            );
        }
        if (!cohort.hasExercises) {
            throw new BadRequestException(
                `Cohort ${cohortId} does not have exercises enabled`,
            );
        }

        const cohortWeek = await this.cohortWeekRepository.findOne({
            where: { id: weekId, cohort: { id: cohortId } },
            relations: { cohort: true },
        });

        if (!cohortWeek) {
            throw new BadRequestException(
                `CohortWeek with id ${weekId} not found for cohort ${cohortId}`,
            );
        }

        if (!cohortWeek.classroomAssignmentId) {
            throw new BadRequestException(
                `CohortWeek ${weekId} does not have a GitHub Classroom assignment ID configured`,
            );
        }

        const usernameToUser = await this.buildUsernameToUserMap(cohortId);
        const grades = await this.fetchGradesWithCache(
            cohortWeek.classroomAssignmentId,
        );

        return new WeekExerciseGradesResponseDto({
            weekNumber: cohortWeek.week,
            weekAssignmentLink: cohortWeek.classroomUrl,
            students: this.mapGradesToStudentDtos(grades, usernameToUser),
        });
    }

    async getExerciseGradesForCohort(
        cohortId: string,
    ): Promise<CohortExerciseGradesResponseDto> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { weeks: true },
        });

        if (!cohort) {
            throw new BadRequestException(
                `Cohort with id ${cohortId} not found`,
            );
        }
        if (!cohort.hasExercises) {
            throw new BadRequestException(
                `Cohort ${cohortId} does not have exercises enabled`,
            );
        }

        const usernameToUser = await this.buildUsernameToUserMap(cohortId);

        const weeksWithAssignment = cohort.weeks
            .filter((w) => w.classroomAssignmentId != null)
            .sort((a, b) => a.week - b.week);

        const weekResults: WeekExerciseGradesResponseDto[] = [];

        for (const week of weeksWithAssignment) {
            const assignmentId = week.classroomAssignmentId as number;
            const grades = await this.fetchGradesWithCache(assignmentId);

            weekResults.push(
                new WeekExerciseGradesResponseDto({
                    weekNumber: week.week,
                    weekAssignmentLink: week.classroomUrl,
                    students: this.mapGradesToStudentDtos(
                        grades,
                        usernameToUser,
                    ),
                }),
            );
        }

        return new CohortExerciseGradesResponseDto({
            cohortName: cohort.type,
            season: cohort.season,
            weeks: weekResults,
        });
    }
}
