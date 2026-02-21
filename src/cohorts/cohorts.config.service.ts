import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CohortType } from '@/common/enum';
import { join } from 'path';
import { readFileSync } from 'fs';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CohortConfig } from '@/cohorts/cohorts.config.model';

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

            this.configs.set(type, config);
            this.logger.log(`Loaded config for ${type} (${fileName})`);
        }
    }

    getConfig(type: CohortType): CohortConfig {
        const config = this.configs.get(type);
        if (!config) {
            throw new Error(`No config found for cohort type: ${type}`);
        }
        return config;
    }
}
