import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CohortType, UserRole } from '@/common/enum';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
    CohortConfig,
    LinkConfig,
    QuestionConfig,
} from '@/cohorts/cohorts.config.model';
import { ServiceError } from '@/common/errors';

// Links shared by every cohort, declared once here so they aren't duplicated
// across each cohort config file. Merged into every cohort at load time.
const GLOBAL_LINKS: LinkConfig[] = [
    {
        label: 'Wheel of Names',
        url: 'https://wheelofnames.com/',
        minRole: UserRole.TEACHING_ASSISTANT,
    },
    {
        label: 'MultiBuzz',
        url: 'https://www.multibuzz.app/',
        minRole: UserRole.TEACHING_ASSISTANT,
    },
];

@Injectable()
export class CohortsConfigService implements OnModuleInit {
    private readonly logger = new Logger(CohortsConfigService.name);
    private readonly configs = new Map<CohortType, CohortConfig>();

    onModuleInit(): void {
        const configDir = join(__dirname, '..', 'assets', 'cohort-configs');

        for (const type of Object.values(CohortType)) {
            const fileName = type.toLowerCase().replace(/_/g, '-') + '.json';
            const filePath = join(configDir, fileName);

            let raw: string;
            try {
                raw = readFileSync(filePath, 'utf-8');
            } catch {
                throw new Error(
                    `Missing cohort config file for ${type}: ${filePath}`,
                );
            }

            const config = plainToInstance(CohortConfig, JSON.parse(raw));
            const errors = validateSync(config, {
                whitelist: true,
                forbidNonWhitelisted: true,
            });

            if (errors.length > 0) {
                const messages = errors.map((e) => e.toString()).join('; ');
                throw new Error(
                    `Invalid cohort config for ${type}: ${messages}`,
                );
            }

            if (config.weeks.length !== config.gdSessions) {
                throw new Error(
                    `Invalid config for ${type}: weeks array length (${config.weeks.length}) must equal gdSessions (${config.gdSessions})`,
                );
            }

            // Validate that all referenced attachment files exist
            const attachDir = join(
                configDir,
                'attachments',
                type.toLowerCase().replace(/_/g, '-'),
            );
            const allQuestions: QuestionConfig[] = config.weeks.flatMap((w) => [
                ...w.questions,
                ...w.bonusQuestions,
            ]);
            for (const question of allQuestions) {
                for (const attachment of question.attachments ?? []) {
                    const attachPath = join(attachDir, attachment);
                    if (!existsSync(attachPath)) {
                        throw new ServiceError(
                            `Missing attachment file for ${type}: ${attachPath}`,
                        );
                    }
                }
            }

            // Prepend shared global links, then this cohort's course-specific
            // links, de-duplicated by url so a config can't reintroduce a
            // global one.
            const seen = new Set<string>();
            config.links = [...GLOBAL_LINKS, ...config.links].filter((link) => {
                if (seen.has(link.url)) return false;
                seen.add(link.url);
                return true;
            });

            this.configs.set(type, config);
            this.logger.log(`Loaded config for ${type} (${fileName})`);
        }
    }

    getConfig(type: CohortType): CohortConfig {
        const config = this.configs.get(type);
        if (!config) {
            throw new ServiceError(`No config found for cohort type: ${type}`);
        }
        return config;
    }
}
