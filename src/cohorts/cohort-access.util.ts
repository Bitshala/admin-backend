import { UserRole } from '@/common/enum';
import { Link } from '@/entities/cohort.entity';

const ROLE_RANK: Record<UserRole, number> = {
    [UserRole.STUDENT]: 0,
    [UserRole.TEACHING_ASSISTANT]: 1,
    [UserRole.ADMIN]: 2,
};

/** True if `role` is at least as privileged as `minRole`. */
export function isAtLeastRole(role: UserRole, minRole: UserRole): boolean {
    return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0);
}

/** Bonus questions are staff-only (TA/Admin). */
export function canViewBonusQuestions(role: UserRole): boolean {
    return role === UserRole.TEACHING_ASSISTANT || role === UserRole.ADMIN;
}

/** Drop links the requesting role is not permitted to see. */
export function filterLinksByRole(links: Link[], role: UserRole): Link[] {
    return links.filter(
        (link) => !link.minRole || isAtLeastRole(role, link.minRole),
    );
}
