import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort } from '@/entities/cohort.entity';
import { CohortWeek } from '@/entities/cohort-week.entity';
import { APITask } from '@/entities/api-task.entity';
import { TaskType } from '@/task-processor/task.enums';
import { CohortWeekType } from '@/common/enum';
import { MailService } from '@/mail/mail.service';
import { User } from '@/entities/user.entity';
import { ServiceError } from '@/common/errors';

@Injectable()
export class CohortReminderService {
    private readonly logger = new Logger(CohortReminderService.name);

    constructor(
        @InjectRepository(Cohort)
        private readonly cohortRepository: Repository<Cohort>,
        @InjectRepository(CohortWeek)
        private readonly cohortWeekRepository: Repository<CohortWeek>,
        private readonly mailService: MailService,
    ) {}

    async handleSendCohortReminderEmails(
        task: APITask<TaskType.SEND_COHORT_REMINDER_EMAILS>,
    ): Promise<void> {
        const { cohortId, cohortWeekId } = task.data;

        const cohort = await this.cohortRepository.findOne({
            where: { id: cohortId },
            relations: { users: true },
        });

        if (!cohort) {
            throw new ServiceError(
                `Cohort ${cohortId} not found for reminder task`,
            );
        }

        const cohortWeek = await this.cohortWeekRepository.findOne({
            where: { id: cohortWeekId },
        });

        if (!cohortWeek) {
            throw new ServiceError(
                `CohortWeek ${cohortWeekId} not found for reminder task`,
            );
        }

        if (cohortWeek.type === CohortWeekType.GRADUATION) {
            this.logger.warn(
                `Skipping reminder for graduation week ${cohortWeekId}`,
            );
            return;
        }

        const sessionDate = new Date(cohort.startDate);
        sessionDate.setUTCDate(sessionDate.getUTCDate() + cohortWeek.week * 7);

        const usersWithEmail = cohort.users.filter((u) => u.email);

        this.logger.log(
            `Sending ${cohortWeek.type} reminder emails to ${usersWithEmail.length} users for cohort ${cohortId}, week ${cohortWeek.week}`,
        );

        for (const user of usersWithEmail) {
            try {
                if (cohortWeek.type === CohortWeekType.ORIENTATION) {
                    await this.sendOrientationReminder(
                        user,
                        cohort,
                        sessionDate,
                    );
                } else if (
                    cohortWeek.type === CohortWeekType.GROUP_DISCUSSION
                ) {
                    await this.sendGdSessionReminder(user, cohort, sessionDate);
                }
            } catch (error) {
                this.logger.error(
                    `Failed to send reminder email to ${user.email}: ${error?.message}`,
                    error?.stack,
                );
            }
        }
    }

    private async sendOrientationReminder(
        user: User,
        cohort: Cohort,
        sessionDate: Date,
    ): Promise<void> {
        const userName =
            user.name || user.discordGlobalName || user.discordUserName;

        if (!user.email) {
            this.logger.warn(
                `User ${user.id} does not have an email address, skipping orientation reminder`,
            );
            return;
        }

        await this.mailService.sendCohortOrientationReminderEmail(
            user.email,
            userName,
            cohort.type,
            this.formatDate(sessionDate),
            '8:00 PM IST',
            'Weekly',
            'Bitshala Discord Lounge',
        );
    }

    private async sendGdSessionReminder(
        user: User,
        cohort: Cohort,
        sessionDate: Date,
    ): Promise<void> {
        const userName =
            user.name || user.discordGlobalName || user.discordUserName;
        const season = `Season ${cohort.season.toString().padStart(2, '0')}`;

        if (!user.email) {
            this.logger.warn(
                `User ${user.id} does not have an email address, skipping GD session reminder`,
            );
            return;
        }

        await this.mailService.sendCohortGdSessionReminderEmail(
            user.email,
            userName,
            this.mailService.getCohortShortName(cohort.type),
            season,
            this.formatDayOfWeek(sessionDate),
            this.formatDate(sessionDate),
            '8:00 PM IST',
            `${this.mailService.getCohortShortName(
                cohort.type,
            )} channel on the Bitshala Discord server`,
        );
    }

    private formatDate(date: Date): string {
        const day = date.getUTCDate();
        const suffix = this.getDaySuffix(day);
        const month = date.toLocaleString('en-US', {
            month: 'short',
            timeZone: 'UTC',
        });
        return `${day}${suffix} ${month}`;
    }

    private formatDayOfWeek(date: Date): string {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            timeZone: 'UTC',
        });
    }

    private getDaySuffix(day: number): string {
        if (day >= 11 && day <= 13) return 'th';
        switch (day % 10) {
            case 1:
                return 'st';
            case 2:
                return 'nd';
            case 3:
                return 'rd';
            default:
                return 'th';
        }
    }
}
