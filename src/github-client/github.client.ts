import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { ConfigService } from '@nestjs/config';
import { ServiceError } from '@/common/errors';

export interface GitHubClassroomGrade {
    assignment_name: string;
    assignment_url: string;
    starter_code_url: string;
    github_username: string;
    roster_identifier: string;
    student_repository_name: string;
    student_repository_url: string;
    submission_timestamp: string;
    points_awarded: string;
    points_available: string;
    group_name?: string;
}

@Injectable()
export class GitHubClient {
    private readonly logger = new Logger(GitHubClient.name);
    private readonly octokit: Octokit;

    constructor(private readonly configService: ConfigService) {
        const token = this.configService.getOrThrow<string>('github.token');
        this.octokit = new Octokit({ auth: token });
    }

    async getAssignmentGrades(
        assignmentId: number,
    ): Promise<GitHubClassroomGrade[]> {
        try {
            const response = await this.octokit.request(
                'GET /assignments/{assignment_id}/grades',
                { assignment_id: assignmentId },
            );
            return response.data as GitHubClassroomGrade[];
        } catch (error) {
            this.logger.error(
                `Failed to fetch grades for assignment ${assignmentId}: ${error.message}`,
                error.stack,
            );
            throw new ServiceError(
                `Failed to fetch grades from GitHub Classroom for assignment ${assignmentId}`,
                { cause: error },
            );
        }
    }
}
