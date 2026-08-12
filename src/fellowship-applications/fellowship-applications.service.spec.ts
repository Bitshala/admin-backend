import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FellowshipApplicationsService } from '@/fellowship-applications/fellowship-applications.service';
import { FellowshipApplication } from '@/entities/fellowship-application.entity';
import { User } from '@/entities/user.entity';
import { MailService } from '@/mail/mail.service';
import { GitHubClassroomClient } from '@/github-classroom/client/github-classroom.client';
import { FellowshipDocumentsService } from '@/fellowship-documents/fellowship-documents.service';
import {
    CohortType,
    EducationCategory,
    FellowshipApplicationStatus,
    FellowshipType,
} from '@/common/enum';

// Exercises the private validateProposalForSubmit through the public
// submitApplication. The key invariants: the new EDUCATOR rules, and that the
// developer/designer rules (and their exact, order-sensitive error output) are
// unchanged.
describe('FellowshipApplicationsService — submit validation', () => {
    let service: FellowshipApplicationsService;

    const applicationRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };
    const mailService = {
        sendFellowshipApplicationReceivedEmail: jest.fn(),
    };

    // The authenticated applicant. `location` lives on the profile and is
    // required to submit on every track.
    const applicant = {
        id: 'user-1',
        displayName: 'Alice',
        location: 'Pune, India',
        email: 'alice@example.com',
    } as unknown as User;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FellowshipApplicationsService,
                {
                    provide: getRepositoryToken(FellowshipApplication),
                    useValue: applicationRepository,
                },
                { provide: getRepositoryToken(User), useValue: {} },
                { provide: MailService, useValue: mailService },
                { provide: GitHubClassroomClient, useValue: {} },
                { provide: FellowshipDocumentsService, useValue: {} },
            ],
        }).compile();

        service = module.get(FellowshipApplicationsService);
        applicationRepository.save.mockImplementation(
            async (a: FellowshipApplication) => a,
        );
        mailService.sendFellowshipApplicationReceivedEmail.mockResolvedValue(
            undefined,
        );
    });

    afterEach(() => jest.resetAllMocks());

    // A valid EDUCATOR (MEETUP) draft. Each test overrides one field.
    function buildApplication(
        overrides: Partial<FellowshipApplication> = {},
    ): FellowshipApplication {
        return {
            id: 'app-1',
            type: FellowshipType.EDUCATOR,
            status: FellowshipApplicationStatus.DRAFT,
            applicant,
            reviewedBy: null,
            title: null,
            problemStatement: null,
            plan: 'A detailed plan of what I will do.',
            mentorName: null,
            mentorContact: null,
            mentorTestimonial: null,
            github: null,
            links: [],
            projectName: null,
            projectGithubLink: null,
            academicBackground: 'My academic background.',
            graduationYear: 2020,
            professionalExperience: 'My professional experience.',
            domains: ['bitcoin'],
            codingLanguages: null,
            educationInterests: ['teaching'],
            bitcoinContributions: 'My contributions.',
            bitcoinMotivation: 'My motivation.',
            bitcoinOssGoal: 'My OSS goal.',
            additionalInfo: null,
            questionsForBitshala: null,
            educationCategory: EducationCategory.MEETUP,
            cohortType: null,
            city: 'Pune',
            educationCategoryOther: null,
            scopeOfWork: 'Two meetups per month.',
            reviewerRemarks: null,
            driveFolderId: null,
            fellowship: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        } as unknown as FellowshipApplication;
    }

    function buildDeveloper(
        overrides: Partial<FellowshipApplication> = {},
    ): FellowshipApplication {
        return buildApplication({
            type: FellowshipType.DEVELOPER,
            title: 'My developer proposal',
            problemStatement: 'The problem I am solving.',
            mentorName: 'Bob',
            mentorContact: 'bob@example.com',
            mentorTestimonial: 'A strong endorsement.',
            projectName: 'My Project',
            projectGithubLink: 'https://github.com/alice/project',
            github: 'alice',
            codingLanguages: ['rust'],
            educationCategory: null,
            city: null,
            scopeOfWork: null,
            educationCategoryOther: null,
            cohortType: null,
            ...overrides,
        });
    }

    function buildDesigner(
        overrides: Partial<FellowshipApplication> = {},
    ): FellowshipApplication {
        return buildApplication({
            type: FellowshipType.DESIGNER,
            title: 'My designer proposal',
            problemStatement: 'The problem I am solving.',
            mentorName: 'Bob',
            mentorContact: 'bob@example.com',
            mentorTestimonial: 'A strong endorsement.',
            projectName: 'My Project',
            educationCategory: null,
            city: null,
            scopeOfWork: null,
            educationCategoryOther: null,
            cohortType: null,
            ...overrides,
        });
    }

    // Submit a valid application and return the (mutated) entity.
    async function submit(app: FellowshipApplication): Promise<void> {
        applicationRepository.findOne.mockResolvedValue(app);
        await service.submitApplication(app.id, applicant);
    }

    // Submit an invalid application and return the thrown error message.
    async function submitError(app: FellowshipApplication): Promise<string> {
        applicationRepository.findOne.mockResolvedValue(app);
        try {
            await service.submitApplication(app.id, applicant);
        } catch (e) {
            return (e as Error).message;
        }
        throw new Error('Expected submitApplication to throw, but it resolved');
    }

    it('is defined', () => {
        expect(service).toBeDefined();
    });

    describe('EDUCATOR — happy paths', () => {
        it('accepts a MEETUP application with a city', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.MEETUP,
                city: 'Pune',
                title: null,
            });
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
            expect(applicationRepository.save).toHaveBeenCalled();
        });

        it('accepts a COHORT_TA application with a course', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.COHORT_TA,
                cohortType: CohortType.PROGRAMMING_BITCOIN,
                city: null,
                title: null,
            });
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
        });

        it('accepts a CLUB application with a title', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.CLUB,
                city: null,
                title: 'Bitcoin Reading Club, Bangalore',
            });
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
        });

        it('accepts an OTHER application with a title and a description', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.OTHER,
                city: null,
                title: 'Documentation translation',
                educationCategoryOther: 'I will translate docs to Hindi.',
            });
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
        });

        it('does not require a problem statement for educators', async () => {
            const app = buildApplication({
                problemStatement: null,
                title: null,
            });
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
        });
    });

    describe('EDUCATOR — category rules', () => {
        it('rejects an application with no category', async () => {
            const app = buildApplication({ educationCategory: null });
            expect(await submitError(app)).toContain(
                'Education category is required',
            );
        });

        it('rejects a MEETUP with no city', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.MEETUP,
                city: null,
            });
            expect(await submitError(app)).toContain(
                'City is required for a meetup',
            );
        });

        it('rejects a COHORT_TA with no course', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.COHORT_TA,
                cohortType: null,
                city: null,
            });
            expect(await submitError(app)).toContain(
                'A cohort is required when the category is Cohort TA',
            );
        });

        it('rejects an OTHER with no description', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.OTHER,
                city: null,
                title: 'Something',
                educationCategoryOther: null,
            });
            expect(await submitError(app)).toContain(
                'A description is required when the category is Other',
            );
        });
    });

    describe('EDUCATOR — title conditionality', () => {
        it('requires a title for CLUB', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.CLUB,
                city: null,
                title: null,
            });
            expect(await submitError(app)).toContain('Title is required');
        });

        it('requires a title for OTHER', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.OTHER,
                city: null,
                title: null,
                educationCategoryOther: 'A description.',
            });
            expect(await submitError(app)).toContain('Title is required');
        });

        it('does not require a title for MEETUP', async () => {
            const app = buildApplication({
                educationCategory: EducationCategory.MEETUP,
                city: 'Pune',
                title: null,
            });
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
        });
    });

    describe('EDUCATOR — fields kept required', () => {
        it('requires scope of work', async () => {
            const app = buildApplication({ scopeOfWork: null });
            expect(await submitError(app)).toContain(
                'Scope of work is required',
            );
        });

        it('requires graduation year', async () => {
            const app = buildApplication({ graduationYear: null });
            expect(await submitError(app)).toContain(
                'Graduation year is required',
            );
        });

        it('requires domains', async () => {
            const app = buildApplication({ domains: null });
            expect(await submitError(app)).toContain('Domains is required');
        });

        it('requires education interests', async () => {
            const app = buildApplication({ educationInterests: null });
            expect(await submitError(app)).toContain(
                'Education interests is required',
            );
        });

        it('requires location', async () => {
            const app = buildApplication({
                applicant: {
                    id: 'user-1',
                    displayName: 'Alice',
                    location: null,
                    email: 'alice@example.com',
                } as unknown as User,
            });
            expect(await submitError(app)).toContain('Location is required');
        });
    });

    describe('DEVELOPER / DESIGNER — regression (must stay unchanged)', () => {
        it('accepts a fully-populated developer application', async () => {
            const app = buildDeveloper();
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
        });

        it('accepts a designer application without project github link or coding languages', async () => {
            const app = buildDesigner({
                projectGithubLink: null,
                codingLanguages: null,
                github: null,
            });
            await submit(app);
            expect(app.status).toBe(FellowshipApplicationStatus.SUBMITTED);
        });

        it('requires the project github link for developers', async () => {
            const app = buildDeveloper({ projectGithubLink: null });
            expect(await submitError(app)).toContain(
                'Project GitHub link is required',
            );
        });

        it('requires a github username for developers', async () => {
            const app = buildDeveloper({ github: null });
            expect(await submitError(app)).toContain(
                'A GitHub username is required for developer applications',
            );
        });

        it('still requires the title and problem statement for developers', async () => {
            const app = buildDeveloper({ title: null, problemStatement: null });
            const message = await submitError(app);
            expect(message).toContain('Title is required');
            expect(message).toContain('Problem statement is required');
        });

        // Locks the exact, order-sensitive error output for developers so the
        // requiredText restructure can't silently reorder or drop a check.
        it('preserves the exact developer error order when everything is empty', async () => {
            const app = buildApplication({
                type: FellowshipType.DEVELOPER,
                applicant: {
                    id: 'user-1',
                    displayName: 'Alice',
                    location: null,
                    email: 'alice@example.com',
                } as unknown as User,
                title: null,
                problemStatement: null,
                plan: null,
                academicBackground: null,
                professionalExperience: null,
                bitcoinContributions: null,
                bitcoinMotivation: null,
                bitcoinOssGoal: null,
                mentorName: null,
                mentorContact: null,
                mentorTestimonial: null,
                projectName: null,
                projectGithubLink: null,
                graduationYear: null,
                domains: null,
                educationInterests: null,
                codingLanguages: null,
                github: null,
                educationCategory: null,
                city: null,
                scopeOfWork: null,
                educationCategoryOther: null,
                cohortType: null,
            });
            const message = await submitError(app);
            expect(message).toBe(
                'Title is required; ' +
                    'Problem statement is required; ' +
                    'Plan is required; ' +
                    'Academic background is required; ' +
                    'Professional experience is required; ' +
                    'Bitcoin contributions is required; ' +
                    'Bitcoin motivation is required; ' +
                    'Bitcoin OSS goal is required; ' +
                    'Mentor name is required; ' +
                    'Mentor contact is required; ' +
                    'Mentor testimonial is required; ' +
                    'Project name is required; ' +
                    'Project GitHub link is required; ' +
                    'Location is required; ' +
                    'Graduation year is required; ' +
                    'Domains is required; ' +
                    'Education interests is required; ' +
                    'Coding languages is required; ' +
                    'A GitHub username is required for developer applications',
            );
        });
    });
});
