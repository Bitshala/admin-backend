export enum ServiceStatus {
    HEALTHY = 'HEALTHY',
}

export enum CohortType {
    MASTERING_BITCOIN = 'MASTERING_BITCOIN',
    LEARNING_BITCOIN_FROM_COMMAND_LINE = 'LEARNING_BITCOIN_FROM_COMMAND_LINE',
    PROGRAMMING_BITCOIN = 'PROGRAMMING_BITCOIN',
    BITCOIN_PROTOCOL_DEVELOPMENT = 'BITCOIN_PROTOCOL_DEVELOPMENT',
    MASTERING_LIGHTNING_NETWORK = 'MASTERING_LIGHTNING_NETWORK',
    BUILDING_BITCOIN_IN_RUST = 'BUILDING_BITCOIN_IN_RUST',
}

export enum UserRole {
    ADMIN = 'ADMIN',
    TEACHING_ASSISTANT = 'TEACHING_ASSISTANT',
    STUDENT = 'STUDENT',
}

export enum CertificateType {
    PARTICIPANT = 'PARTICIPANT',
    PERFORMER = 'PERFORMER',
}

export enum TopPerformerRank {
    FIRST = 1,
    SECOND = 2,
    THIRD = 3,
}

export enum CohortWeekType {
    ORIENTATION = 'ORIENTATION',
    GROUP_DISCUSSION = 'GROUP_DISCUSSION',
    GRADUATION = 'GRADUATION',
}

export enum ComponentRating {
    NOT_AT_ALL = 'NOT_AT_ALL',
    SOMEWHAT = 'SOMEWHAT',
    HELPFUL = 'HELPFUL',
    VERY_HELPFUL = 'VERY_HELPFUL',
}

export enum CohortComponent {
    SESSION_INSTRUCTIONS = 'sessionInstructions',
    STUDY_MATERIAL = 'studyMaterial',
    GROUP_DISCUSSIONS = 'groupDiscussions',
    LOUNGE_DISCUSSIONS = 'loungeDiscussions',
    DEPUTY = 'deputy',
    TEACHING_ASSISTANTS = 'teachingAssistants',
    BITSHALA_CLUBS = 'bitshalaClubs',
    BITDEV_MEETUPS = 'bitdevMeetups',
    BITSPACE = 'bitspace',
    FELLOWSHIPS = 'fellowships',
}

export enum OpportunityInterest {
    DEVELOPER = 'DEVELOPER',
    DESIGNER_CREATIVE = 'DESIGNER_CREATIVE',
    EDUCATION_WRITING = 'EDUCATION_WRITING',
    PROGRAM_OPS = 'PROGRAM_OPS',
    LEGAL_ACCOUNTS = 'LEGAL_ACCOUNTS',
    BUILDING_STARTUP = 'BUILDING_STARTUP',
    HOSTING_CLUB = 'HOSTING_CLUB',
    JUST_STACKING = 'JUST_STACKING',
}

export enum FellowshipInterest {
    SILENT_PAYMENT_LIBRARY = 'SILENT_PAYMENT_LIBRARY',
    SILENT_PAYMENT_INDEXER = 'SILENT_PAYMENT_INDEXER',
    COINSELECTION = 'COINSELECTION',
    BITCOIN_CORE_REVIEW = 'BITCOIN_CORE_REVIEW',
    COINSWAP = 'COINSWAP',
    ANY_OTHER_PROJECT = 'ANY_OTHER_PROJECT',
}

export enum FellowshipType {
    DEVELOPER = 'DEVELOPER',
    DESIGNER = 'DESIGNER',
    EDUCATOR = 'EDUCATOR',
}

// The category of an education (EDUCATOR) fellowship application: TAing a
// cohort, running a meetup, running a club, or a free-form "other".
export enum EducationCategory {
    MEETUP = 'MEETUP',
    CLUB = 'CLUB',
    COHORT_TA = 'COHORT_TA',
    OTHER = 'OTHER',
}

// The tier of a fellowship. STARTER_GRANT is a higher-tier, full-time,
// invite-only variant; it is orthogonal to FellowshipType (a starter grant can
// still be a DEVELOPER, etc.) and is set by an admin when accepting an
// application.
export enum FellowshipKind {
    FELLOWSHIP = 'FELLOWSHIP',
    STARTER_GRANT = 'STARTER_GRANT',
}

export enum FellowshipApplicationStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    CHANGES_REQUESTED = 'CHANGES_REQUESTED',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

export enum FellowshipStatus {
    PENDING = 'PENDING',
    // Created on accept; one or more fellow documents are still unuploaded or rejected.
    AWAITING_DOCUMENTS = 'AWAITING_DOCUMENTS',
    // Both fellow documents uploaded and pending admin review.
    DOCUMENTS_IN_REVIEW = 'DOCUMENTS_IN_REVIEW',
    // Both fellow documents approved; start-contract is enabled.
    DOCUMENTS_APPROVED = 'DOCUMENTS_APPROVED',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
}

export enum FellowshipDocumentType {
    UNSIGNED_CONTRACT = 'UNSIGNED_CONTRACT',
    SIGNED_CONTRACT = 'SIGNED_CONTRACT',
    W8BEN = 'W8BEN',
}

export enum FellowshipDocumentStatus {
    AWAITING_UPLOAD = 'AWAITING_UPLOAD',
    PENDING_REVIEW = 'PENDING_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

// How the contract is provided when an admin accepts an application.
// UNSIGNED (default): the admin uploads the Bitshala-signed unsigned contract and
// the fellow signs it offline, then uploads the signed contract + W-8BEN for
// review. PRESIGNED: the contract was signed out of band, so the admin uploads
// the already-signed contract + W-8BEN directly and the fellow upload/review
// step is skipped.
export enum AcceptContractMode {
    UNSIGNED = 'UNSIGNED',
    PRESIGNED = 'PRESIGNED',
}

export enum FellowshipReportStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}
