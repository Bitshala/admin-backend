export interface Assignment {
    id: number;
    public_repo: boolean;
    title: string;
    type: string;
    invite_link: string;
    invitations_enabled: boolean;
    slug: string;
    students_are_repo_admins: boolean;
    feedback_pull_requests_enabled: boolean;
    max_teams?: number | null;
    max_members?: number | null;
    editor: string | null;
    accepted: number;
    submissions?: number;
    passing: number;
    language: string | null;
    deadline: string | null;
    classroom: {
        id: number;
        name: string;
        archived: boolean;
        url: string;
    };
    starter_code_repository: {
        id: number;
        name?: string;
        full_name: string;
        html_url: string;
        node_id: string;
        private: boolean;
        default_branch: string;
    };
}

export interface AcceptedAssignment {
    id: number;
    submitted: boolean;
    passing: boolean;
    commit_count: number;
    grade: string | null;
    students: {
        id: number;
        login: string;
        name?: string | null;
        avatar_url: string;
        html_url: string;
    }[];
    assignment: Omit<Assignment, 'starter_code_repository' | 'submissions'>;
    repository: {
        id: number;
        full_name: string;
        html_url: string;
        node_id: string;
        private: boolean;
        default_branch: string;
    };
}
