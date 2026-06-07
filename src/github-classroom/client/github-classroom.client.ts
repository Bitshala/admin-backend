import { Inject, Injectable } from '@nestjs/common';
import type { Octokit } from '@octokit/rest';
import { GITHUB_OCTOKIT_INJECTION_TOKEN } from '@/github-classroom/client/github-classroom-client.constants';
import {
    AcceptedAssignment,
    Assignment,
} from '@/github-classroom/client/response';

@Injectable()
export class GitHubClassroomClient {
    constructor(
        @Inject(GITHUB_OCTOKIT_INJECTION_TOKEN)
        private readonly octokit: Octokit,
    ) {}

    async getAssignment(assignmentId: number): Promise<Assignment> {
        const res = await this.octokit.request(
            'GET /assignments/{assignment_id}',
            {
                assignment_id: assignmentId,
            },
        );

        return res.data;
    }

    async fetchAcceptedAssignments(
        assignmentId: number,
    ): Promise<AcceptedAssignment[]> {
        return await this.octokit.paginate(
            'GET /assignments/{assignment_id}/accepted_assignments',
            {
                assignment_id: assignmentId,
                per_page: 1000,
            },
        );
    }

    /**
     * Whether a GitHub account with this username exists.
     * Resolves false on 404; rethrows other errors (rate limit, network)
     * so callers can distinguish "missing" from "could not check".
     */
    async userExists(username: string): Promise<boolean> {
        try {
            await this.octokit.request('GET /users/{username}', { username });
            return true;
        } catch (err) {
            if ((err as { status?: number }).status === 404) return false;
            throw err;
        }
    }
}
