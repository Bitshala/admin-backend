import { Module } from '@nestjs/common';
import { GitHubClient } from '@/github-client/github.client';

@Module({
    imports: [],
    providers: [GitHubClient],
    controllers: [],
    exports: [GitHubClient],
})
export class GitHubClientModule {}
