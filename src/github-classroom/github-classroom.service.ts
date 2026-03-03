import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { ExerciseScore } from '@/entities/exercise-score.entity';
import { APITask } from '@/entities/api-task.entity';
import { TaskType } from '@/task-processor/task.enums';
import { SyncClassroomScoresTaskData } from '@/task-processor/task.types';
import { ServiceError } from '@/common/errors';
import { GitHubClassroomClient } from '@/github-classroom/client/github-classroom.client';
import { isLastRetry } from '@/task-processor/task-processor.utils';
import {
    SIX_HOURS_MS,
    TWENTY_FOUR_HOURS_MS,
} from '@/common/durations.constants';

@Injectable()
export class GitHubClassroomService {
    private readonly logger = new Logger(GitHubClassroomService.name);

    constructor(
        @InjectRepository(APITask)
        private readonly apiTaskRepository: Repository<APITask<any>>,
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(CohortWeek)
        private readonly cohortWeekRepository: Repository<CohortWeek>,
        @InjectRepository(ExerciseScore)
        private readonly exerciseScoreRepository: Repository<ExerciseScore>,
        private readonly githubClassroomClient: GitHubClassroomClient,
    ) {}

    private async scheduleNextSync(
        data: SyncClassroomScoresTaskData,
    ): Promise<void> {
        const entity = this.apiTaskRepository.create({
            type: TaskType.SYNC_CLASSROOM_SCORES,
            data: data,
            executeOnTime: new Date(Date.now() + SIX_HOURS_MS),
        });
        await this.apiTaskRepository.save(entity);
    }

    async handleSyncClassroomTask(
        task: APITask<TaskType.SYNC_CLASSROOM_SCORES>,
    ): Promise<void> {
        const data: SyncClassroomScoresTaskData = task.data;
        try {
            const shouldReschedule = await this.syncCohortScoresById(
                data.cohortId,
            );

            if (shouldReschedule) await this.scheduleNextSync(data);
        } catch (error) {
            this.logger.error(
                `Failed to sync classroom scores for cohort (${
                    data.cohortId
                }): ${error?.message ?? error}`,
                error?.stack,
            );

            if (isLastRetry(task)) {
                await this.scheduleNextSync(data);
            }
        }
    }

    private async syncCohortScoresById(cohortId: string): Promise<boolean> {
        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: {
                users: true,
                weeks: true,
            },
        });

        if (!cohort) {
            throw new ServiceError(
                `Cohort with ID ${cohortId} not found. Cannot sync GitHub Classroom scores.`,
            );
        }

        const endDatePlusBuffer = new Date(
            cohort.endDate.getTime() + TWENTY_FOUR_HOURS_MS,
        );
        const hasCohortEnded = endDatePlusBuffer < new Date();

        if (!cohort.classroomId) {
            this.logger.log(
                `No classroomId set for cohort (${cohort.id}), skipping`,
            );
            return false;
        }

        const weeksWithAssignment = cohort.weeks.filter(
            (w) => w.classroomAssignmentId,
        );
        if (weeksWithAssignment.length === 0) {
            this.logger.log(
                `No weeks with classroomAssignmentId in cohort (${cohort.id}), skipping sync`,
            );
            // If the cohort has ended, we can stop scheduling syncs.
            // If it hasn't ended, we keep scheduling in case assignments are added later.
            return !hasCohortEnded;
        }

        const githubUsernameToUserIdMap = new Map<string, string>();
        for (const user of cohort.users) {
            const username = this.extractGitHubUsername(user.githubProfileUrl);
            if (username) {
                githubUsernameToUserIdMap.set(username.toLowerCase(), user.id);
            }
        }

        if (githubUsernameToUserIdMap.size === 0) {
            this.logger.warn(
                `No users with GitHub profiles in cohort (${cohort.id})`,
            );
            // If the cohort has ended, we can stop scheduling syncs.
            // If it hasn't ended, we keep scheduling in case users are added later.
            return !hasCohortEnded;
        }

        this.logger.log(
            `Syncing cohort (${cohort.id}) — ${githubUsernameToUserIdMap.size} GitHub-linked user(s), ${weeksWithAssignment.length} assignment(s)`,
        );

        let syncedCount = 0;
        let failedCount = 0;

        for (const cohortWeek of weeksWithAssignment) {
            try {
                await this.syncAssignment(
                    cohort,
                    cohortWeek,
                    githubUsernameToUserIdMap,
                );
                syncedCount++;
            } catch (error) {
                failedCount++;
                this.logger.error(
                    `Failed to sync cohort week (${cohortWeek.id}): ${error.message}`,
                    error.stack,
                );
            }
        }

        this.logger.log(
            `Cohort (${cohort.id}) sync complete: ${syncedCount} succeeded, ${failedCount} failed`,
        );

        // If the cohort has ended, we can stop scheduling syncs.
        // If it hasn't ended, we keep scheduling in case of late submissions or new assignments.
        return !hasCohortEnded;
    }

    private async syncAssignment(
        cohort: Cohort,
        cohortWeek: CohortWeek,
        githubUsernameToUserIdMap: Map<string, string>,
    ): Promise<void> {
        if (!cohortWeek.classroomAssignmentId) {
            this.logger.warn(
                `Cohort week (${cohortWeek.id}) has no classroomAssignmentId, skipping`,
            );
            return;
        }

        const assignment = await this.githubClassroomClient.getAssignment(
            parseInt(cohortWeek.classroomAssignmentId),
        );

        await this.cohortWeekRepository.update(cohortWeek.id, {
            classroomInviteLink: assignment.invite_link,
            classroomAssignmentUrl: `${assignment.classroom.url}/assignments/${assignment.slug}`,
        });

        const existingScores = await this.exerciseScoreRepository.find({
            where: {
                cohort: { id: cohort.id },
                cohortWeek: { id: cohortWeek.id },
            },
            relations: {
                user: true,
            },
        });

        const userIdToScoreMap = new Map<string, ExerciseScore>();
        for (const score of existingScores) {
            userIdToScoreMap.set(score.user.id, score);
        }

        const acceptedAssignments =
            await this.githubClassroomClient.fetchAcceptedAssignments(
                parseInt(cohortWeek.classroomAssignmentId),
            );

        const scoresToSave: ExerciseScore[] = [];
        const unmatchedLogins: string[] = [];

        for (const acceptedAssignment of acceptedAssignments) {
            for (const student of acceptedAssignment.students) {
                const userId = githubUsernameToUserIdMap.get(
                    student.login.toLowerCase(),
                );
                if (!userId) {
                    unmatchedLogins.push(student.login);
                    continue;
                }

                const score = userIdToScoreMap.get(userId);
                if (!score) {
                    throw new ServiceError(
                        `No ExerciseScore found for user ID (${userId}) for cohort week (${cohortWeek.id})`,
                    );
                }

                // We use commit_count > 0 instead of 'submitted' because of a Github Classroom quirk
                // where it may not mark an assignment as 'submitted' even if the student has accepted and pushed to the repo
                score.isSubmitted = acceptedAssignment.commit_count > 0;
                score.isPassing = acceptedAssignment.passing;
                score.classroomRepositoryUrl =
                    acceptedAssignment.repository.html_url;
                scoresToSave.push(score);
            }
        }

        if (unmatchedLogins.length > 0) {
            this.logger.warn(
                `Cohort week (${cohortWeek.id}) has ${
                    unmatchedLogins.length
                } unmatched GitHub student(s): ${unmatchedLogins.join(', ')}`,
            );
        }

        if (scoresToSave.length > 0) {
            await this.exerciseScoreRepository.save(scoresToSave);
            this.logger.log(
                `Updated ${scoresToSave.length} exercise score(s) for cohort week (${cohortWeek.id})`,
            );
        }
    }

    private extractGitHubUsername(profileUrl: string | null): string | null {
        if (!profileUrl) return null;
        try {
            const { hostname, pathname } = new URL(profileUrl);
            if (hostname !== 'github.com') return null;
            const segments = pathname.split('/').filter(Boolean);
            return segments.length > 0 ? segments[0] : null;
        } catch {
            return null;
        }
    }
}
