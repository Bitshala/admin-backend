import { UserRole } from '@/common/enum';
import { Link } from '@/entities/cohort.entity';

// Who is asking. `null` is an anonymous (unauthenticated) viewer on a @Public()
// route, where @GetUser() yields undefined.
export type ViewerRole = UserRole | null;

const ROLE_RANK: Record<UserRole, number> = {
    [UserRole.STUDENT]: 0,
    [UserRole.TEACHING_ASSISTANT]: 1,
    [UserRole.ADMIN]: 2,
};

// Anonymous ranks below every authenticated role.
const ANONYMOUS_RANK = -1;

// Deliberately no `?? 0` fallback: STUDENT *is* rank 0, so a fallback would
// hand full student visibility to any role the table forgot. Record<UserRole,
// number> makes the lookup exhaustive, so a new UserRole member is a compile
// error here rather than a silent leak.
function rankOf(role: ViewerRole): number {
    return role === null ? ANONYMOUS_RANK : ROLE_RANK[role];
}

/** True if `role` is at least as privileged as `minRole`. */
export function isAtLeastRole(role: ViewerRole, minRole: UserRole): boolean {
    return rankOf(role) >= ROLE_RANK[minRole];
}

/** Bonus questions are staff-only (TA/Admin). */
export function canViewBonusQuestions(role: ViewerRole): boolean {
    return role === UserRole.TEACHING_ASSISTANT || role === UserRole.ADMIN;
}

/** Drop links the requesting role is not permitted to see. */
export function filterLinksByRole(links: Link[], role: ViewerRole): Link[] {
    return links.filter(
        (link) => !link.minRole || isAtLeastRole(role, link.minRole),
    );
}
