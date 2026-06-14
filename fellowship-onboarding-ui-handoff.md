# Handoff: Merge Fellowship Onboarding into the Application (UI changes)

This describes a backend change that just landed and the corresponding UI work.
Pass this to the UI agent.

## What changed on the backend (context)

Previously a fellowship had **two** stages:

1. **Application** — the proposal, submitted for review.
2. **Onboarding** — a separate form filled in *after* the application was
   accepted, via `PATCH /fellowships/:id/onboarding`.

These are now **merged**. All onboarding fields are collected **as part of the
application itself**, before submission. The `Fellowship` record is now just a
contract/funding record created on acceptance.

Concretely:

- The onboarding fields moved onto the **fellowship application**.
- Two fields that already exist on the **user profile** — `location` and
  `github` — are **written through to the profile** instead of being stored on
  the application (no duplication). The backend handles this automatically when
  those fields are sent to the create/update application endpoints.
- The onboarding endpoint and the onboarding step are **gone**:
  - ❌ `PATCH /fellowships/:id/onboarding` — **removed**. Delete any UI/calls.
  - The `Fellowship` object no longer carries any onboarding fields (see below).

## Required UI work

### 1. Add a new "Onboarding details" step to the fellowship application page

The application form must gain a **new step/section** that collects the
onboarding fields (listed below) in addition to the existing proposal fields.
This is part of the same draft → submit flow as the rest of the application:

- Drafts auto-save partial values (same as today's proposal fields). Send only
  the fields the user has touched; the backend treats every field as optional
  at draft time.
- Full required-field validation runs **on submit**, not on draft save.

### 2. Group the form into categories

The combined form should be **grouped into logical categories** rather than one
flat list. Suggested grouping (the UI agent can refine labels/ordering):

| Category | Fields |
| --- | --- |
| **Proposal** | `title`, `problemStatement`, `plan`, `links` |
| **Mentor** | `mentorName`, `mentorContact`, `mentorTestimonial` |
| **Project** *(developer track only)* | `projectName`, `projectGithubLink`, `github` |
| **About you** | `location`, `academicBackground`, `graduationYear`, `professionalExperience`, `domains`, `codingLanguages` *(developer track only)*, `educationInterests` |
| **Bitcoin** | `bitcoinContributions`, `bitcoinMotivation`, `bitcoinOssGoal` |
| **Anything else** | `additionalInfo`, `questionsForBitshala` |

> The grouping above is a recommendation — the key requirement is that the new
> onboarding form is broken into clear categories, not presented as one long
> list. Adjust grouping/labels to match the existing design system.

### 3. Remove the standalone onboarding screen

Any post-acceptance onboarding screen and its call to
`PATCH /fellowships/:id/onboarding` must be removed. Onboarding data is now read
from the application proposal (see API below).

## API contract

All endpoints live under `/fellowship-applications` (unchanged paths):

- `POST /fellowship-applications` — create draft. Body: `type` + any proposal/
  onboarding fields.
- `PATCH /fellowship-applications/:id` — update a draft / changes-requested
  application. Send only changed fields.
- `POST /fellowship-applications/:id/submit` — submit for review (runs full
  validation).
- `GET /fellowship-applications/:id/proposal` — returns the full proposal,
  **including all the new onboarding fields** (use this to render/prefill the
  form for an existing application).
- `GET /fellowship-applications/github/:username` — advisory GitHub existence
  check (unchanged).

### Request fields (create + update body)

`type` is required on create and immutable afterward. Everything else is
optional at draft time. Validation bounds:

| Field | Type | Notes / draft-time bound |
| --- | --- | --- |
| `type` | enum | `DEVELOPER` \| `DESIGNER` \| `EDUCATOR` (create only) |
| `title` | string | max 120 |
| `problemStatement` | string | max 3000 |
| `plan` | string | max 3000 |
| `mentorName` | string | max 120 |
| `mentorContact` | string | max 120 |
| `mentorTestimonial` | string | max 3000 |
| `github` | string | bare handle, `@handle`, or `github.com/<handle>` URL — normalized to a bare handle. Also written to the profile as a full URL. |
| `links` | string[] | each a valid http(s) URL, ≤500 chars, ≤20 entries |
| `projectName` | string | max 120 |
| `projectGithubLink` | string | valid URL (with protocol), ≤500 |
| `academicBackground` | string | max 3000 |
| `graduationYear` | integer | 1900–2100 |
| `professionalExperience` | string | max 3000 |
| `domains` | string[] | each ≤100 chars, ≤50 entries |
| `codingLanguages` | string[] | each ≤100 chars, ≤50 entries |
| `educationInterests` | string[] | each ≤100 chars, ≤50 entries |
| `bitcoinContributions` | string | max 3000 |
| `bitcoinMotivation` | string | max 3000 |
| `bitcoinOssGoal` | string | max 3000 |
| `additionalInfo` | string | max 3000 |
| `questionsForBitshala` | string | max 3000 |
| `location` | string | max 255 — **profile field**, written through to the user profile (not stored on the application) |

### Required-on-submit rules

Submit (`POST .../submit`) returns `400` with a combined error message if any
required field is missing.

- **Required for every track:** `title`, `problemStatement`, `plan`,
  `mentorName`, `mentorContact`, `academicBackground`,
  `professionalExperience`, `bitcoinContributions`, `bitcoinMotivation`,
  `bitcoinOssGoal`, `graduationYear`, `domains` (non-empty),
  `educationInterests` (non-empty).
- **Required for the `DEVELOPER` track only:** `github`, `projectName`,
  `projectGithubLink`, `codingLanguages` (non-empty).
- **Always optional:** `mentorTestimonial`, `links`, `additionalInfo`,
  `questionsForBitshala`, `location`.

The UI should branch its required-field markers and validation on the selected
`type` so non-developer applicants aren't blocked on developer-only fields.

### Profile fields (`location`, `github`)

- These are sent to the application create/update endpoints like any other
  field, but the backend writes them to the **user profile** rather than the
  application:
  - `location` → `user.location`
  - `github` → `user.githubProfileUrl` (expanded to `https://github.com/<handle>`)
- `github` is *also* kept on the application as the proposal handle and is
  returned by the proposal endpoint. `location` is **not** on the proposal
  response — read/prefill it from the user profile (`GET /users/me`).
- If you already have a profile edit screen using `PATCH /users/me`, no change
  is needed there; this is purely additive so the application form can update
  the profile in a single submit.

### Response shape changes

- **`GET /fellowship-applications/:id/proposal`** now also returns:
  `projectName`, `projectGithubLink`, `academicBackground`, `graduationYear`,
  `professionalExperience`, `domains`, `codingLanguages`, `educationInterests`,
  `bitcoinContributions`, `bitcoinMotivation`, `bitcoinOssGoal`,
  `additionalInfo`, `questionsForBitshala` (plus the existing proposal fields).
- **The `Fellowship` response keeps the same shape as before** (it still
  exposes `mentorContact`, `projectName`, `projectGithubLink`, `githubProfile`,
  `location`, `academicBackground`, `graduationYear`, `professionalExperience`,
  `domains`, `codingLanguages`, `educationInterests`, `bitcoinContributions`,
  `bitcoinMotivation`, `bitcoinOssGoal`, `additionalInfo`, `questionsForBitshala`
  alongside the contract fields). The difference is purely internal: these
  values are now read from the linked **application** (and `location` from the
  fellow's profile, `githubProfile` from the application's GitHub handle), so
  existing UI that reads onboarding data off the fellowship continues to work
  without changes.
