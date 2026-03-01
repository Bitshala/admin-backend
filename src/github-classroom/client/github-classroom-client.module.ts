import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GITHUB_OCTOKIT_INJECTION_TOKEN } from '@/github-classroom/client/github-classroom-client.constants';
import { GitHubClassroomClient } from '@/github-classroom/client/github-classroom.client';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: GITHUB_OCTOKIT_INJECTION_TOKEN,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const { Octokit } = await (new Function(
                    'return import("@octokit/rest")',
                )() as Promise<typeof import('@octokit/rest')>);
                const token = configService.getOrThrow<string>('github.token');
                return new Octokit({ auth: token });
            },
        },
        GitHubClassroomClient,
    ],
    exports: [GitHubClassroomClient],
})
export class GitHubClassroomClientModule {}
