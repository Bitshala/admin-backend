import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

// Per-field caps — single source of truth shared by the request DTOs and the
// submit-time validation. Mirrors the frontend's limits (proposalFormat.ts).
export const TITLE_LIMIT = 120; // title, mentorName, mentorContact
export const LONG_TEXT_LIMIT = 3000; // problemStatement, plan, mentorTestimonial
export const LINK_LIMIT = 500; // per-link char cap
export const MAX_LINKS = 20; // max links array length

// Stored github value: bare username, first char alphanumeric, the rest
// alphanumeric or hyphen, 1..39 chars. Intentionally as permissive as the FE
// regex (allows `--` and a trailing `-`).
export const GITHUB_USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]){0,38}$/;
const GITHUB_URL_RE =
    /^https?:\/\/(www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]){0,38})\/?$/i;

// A link must start with http(s)://, contain a dot, and have no whitespace.
export const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]+$/i;

/**
 * Normalize any accepted github input form — bare handle, `@handle`, or a
 * github.com profile URL — to a bare username. Input that matches no known
 * form is returned trimmed so downstream format validation can reject it.
 */
export function normalizeGithub(value: string): string {
    const trimmed = value.trim();
    const urlMatch = trimmed.match(GITHUB_URL_RE);
    if (urlMatch) return urlMatch[2];
    if (trimmed.startsWith('@')) return trimmed.slice(1);
    return trimmed;
}

/**
 * Key used for duplicate-link detection — ignores protocol, leading `www.`,
 * case and trailing slashes, so `https://Foo.com/x/` and `http://foo.com/x`
 * collide.
 */
export function normalizeLinkForDedup(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/+$/, '');
}

/** Trim each entry and drop empties — used as a Transform before validation. */
export function cleanLinks(value: unknown): unknown {
    if (!Array.isArray(value)) return value;
    return value
        .map((v) => (typeof v === 'string' ? v.trim() : v))
        .filter((v) => v !== '');
}

/**
 * Upper-bounds check for the `links` array used on draft writes: must be an
 * array of at most MAX_LINKS valid http(s) URLs, each at most LINK_LIMIT
 * chars. Duplicate detection is deferred to submit (see service).
 */
@ValidatorConstraint({ name: 'isLinkArray', async: false })
export class IsLinkArrayConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean {
        if (value === undefined || value === null) return true;
        if (!Array.isArray(value)) return false;
        if (value.length > MAX_LINKS) return false;
        return value.every(
            (v) =>
                typeof v === 'string' &&
                v.length <= LINK_LIMIT &&
                URL_RE.test(v),
        );
    }

    defaultMessage(): string {
        return `links must contain at most ${MAX_LINKS} valid http(s) URLs, each at most ${LINK_LIMIT} characters`;
    }
}

export function IsLinkArray(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsLinkArrayConstraint,
        });
    };
}
