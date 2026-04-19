# Legacy Chain Proposal

## Executive summary

Legacy Chain is a new Autograph Exchange feature that turns one-off autograph messages into long-term, milestone-based encouragement journeys.

A user creates a chain around a life arc such as career growth, healing, or a personal challenge. Trusted people contribute short autograph messages that are unlocked immediately or at a future date/milestone. Over time, the chain becomes a meaningful timeline of support, reflection, and momentum.

This feature is designed to improve retention, deepen emotional value, and create premium-worthy output artifacts (share cards, timeline exports, and keepsakes).

## Product goals

1. Increase repeat usage by creating intentional return moments through scheduled unlocks.
2. Increase user value by making support contextual and time-aware.
3. Increase network effects by encouraging multi-person participation per chain.
4. Strengthen long-term archive value by converting messages into narrative timelines.

## User problems solved

1. Current autograph interactions can feel complete after one exchange.
2. Users need encouragement at key moments, not just at request time.
3. Important messages are hard to revisit as a coherent life narrative.
4. Users need a compelling reason to invite meaningful people into the product.

## Core concept

A Legacy Chain has:

1. A theme and purpose.
2. A set of milestones.
3. Contributors invited by the creator.
4. Entries authored by contributors.
5. Unlock rules for each entry.
6. Reflection prompts for the creator after each unlock.

Unlock rule types:

1. Immediate: visible as soon as submitted.
2. Date-based: visible at a specific date/time.
3. Milestone-based: visible when the creator marks a milestone complete.
4. Hybrid: whichever comes first, date or milestone completion.

## Experience design

### Creator flow

1. Start chain: choose title, theme, privacy mode, and optional cover image.
2. Define milestones: add 3-12 milestones with dates or sequence order.
3. Invite contributors: select from existing profiles or invite by email.
4. Configure contribution guidance: tone and prompt examples.
5. Publish chain: share invite links and begin collecting entries.

### Contributor flow

1. Open invitation link.
2. View chain context and target milestone.
3. Write a short autograph entry and optional signature style.
4. Choose unlock mode if permitted by creator policy.
5. Submit and receive confirmation.

### Consumer flow (creator revisits)

1. See upcoming unlock queue.
2. Open newly unlocked entries with a reveal animation.
3. Add private reflection notes.
4. View timeline progression and momentum insights.
5. Export share assets (static cards and keepsake bundles).

## Feature scope

### MVP scope (phase 1)

1. Chain creation with title, description, privacy, and milestones.
2. Contributor invites via link token.
3. Entry submission with message and optional signature text.
4. Immediate and date-based unlocks.
5. Timeline view with unlocked and pending states.
6. Reflection notes for chain owner.
7. Basic analytics events.

### Phase 2 scope

1. Milestone-based unlock conditions.
2. Smart reminders for upcoming unlocks.
3. Rich timeline themes and branded templates.
4. Group chain templates for cohorts (class/team/fellowship).
5. Premium export bundles and media reel generation.

### Phase 3 scope

1. AI-assisted reflection summaries.
2. Adaptive prompt suggestions by chain stage.
3. Anniversary resurfacing and year-in-review chain recap.

## Information architecture and UI additions

Primary navigation addition:

1. New top-level section: Legacy Chains.

Screens to add:

1. Chain list page.
2. Chain detail timeline page.
3. Chain builder wizard.
4. Contributor submission page.
5. Reflection notes panel.
6. Export/share panel.

Component additions in `@aartisr/autograph-feature`:

1. `LegacyChainList`
2. `LegacyChainBuilder`
3. `LegacyChainTimeline`
4. `LegacyEntryComposer`
5. `LegacyReflectionPanel`

## Data model proposal

### New entities

1. `legacy_chains`
2. `legacy_chain_milestones`
3. `legacy_chain_members`
4. `legacy_chain_entries`
5. `legacy_chain_unlocks`
6. `legacy_chain_reflections`
7. `legacy_chain_invites`

### High-level schema draft

`legacy_chains`

- id (uuid, pk)
- owner_user_id (uuid)
- title (text)
- description (text)
- theme (text)
- visibility (enum: private, invited, public-read)
- status (enum: draft, active, archived)
- created_at (timestamp)
- updated_at (timestamp)

`legacy_chain_milestones`

- id (uuid, pk)
- chain_id (uuid, fk)
- ordinal (int)
- title (text)
- target_date (timestamp nullable)
- completed_at (timestamp nullable)
- created_at (timestamp)

`legacy_chain_entries`

- id (uuid, pk)
- chain_id (uuid, fk)
- milestone_id (uuid nullable, fk)
- author_user_id (uuid nullable)
- invite_id (uuid nullable, fk)
- message (text)
- signature_text (text nullable)
- unlock_type (enum: immediate, date, milestone, hybrid)
- unlock_at (timestamp nullable)
- reveal_status (enum: pending, unlocked, viewed)
- created_at (timestamp)

`legacy_chain_reflections`

- id (uuid, pk)
- chain_id (uuid, fk)
- entry_id (uuid nullable, fk)
- author_user_id (uuid)
- note (text)
- created_at (timestamp)

## API proposal

New endpoint group under `/api/autographs/legacy`:

1. `POST /chains`
2. `GET /chains`
3. `GET /chains/:id`
4. `PATCH /chains/:id`
5. `POST /chains/:id/milestones`
6. `POST /chains/:id/invites`
7. `POST /chains/:id/entries`
8. `GET /chains/:id/timeline`
9. `POST /chains/:id/reflections`
10. `POST /chains/:id/unlocks/recompute`

Auth and ownership:

1. Only owner can edit chain metadata and milestones.
2. Invited members can submit entries.
3. Timeline access follows chain visibility policy.

## Event and telemetry plan

New event names:

1. `legacy_chain_created`
2. `legacy_chain_invite_sent`
3. `legacy_entry_submitted`
4. `legacy_entry_unlocked`
5. `legacy_reflection_saved`
6. `legacy_export_generated`
7. `legacy_chain_completed`

Core KPI mapping:

1. Activation: users who create first chain within 7 days.
2. Retention: D30 users with at least one unlock view.
3. Collaboration depth: average contributors per chain.
4. Value depth: average reflections per unlocked entry.
5. Output utility: export rate per active chain.

## Notification strategy

1. Owner reminder 24h before scheduled unlock.
2. Owner alert when a new entry is submitted.
3. Contributor nudges for pending milestones.
4. Re-engagement digest for dormant chains.

## Safety, privacy, and trust

1. Invite links must be scoped, expiring, and revocable.
2. Private-by-default chain visibility.
3. Reflection notes visible only to chain owner.
4. Clear deletion and export controls.
5. Abuse reporting for submitted entries.

## Delivery plan

### Sprint 1

1. Data schema and migration.
2. Basic chain CRUD.
3. Milestone model.
4. Invite token flow.

### Sprint 2

1. Entry submission and unlock engine (immediate/date).
2. Timeline UI and pending/unlocked states.
3. Reflection notes.
4. Telemetry wiring.

### Sprint 3

1. Polish, accessibility, and responsive QA.
2. Export panel and timeline snapshots.
3. End-to-end tests and performance checks.
4. Soft launch behind feature flag.

## Testing strategy

1. Unit tests for unlock rule evaluator and visibility policy.
2. Integration tests for chain lifecycle and permissions.
3. E2E coverage for creator, contributor, and reveal journeys.
4. Mobile viewport checks for timeline readability and reveal actions.
5. Accessibility checks with axe for all new pages.

## Risks and mitigations

1. Risk: users may not return if unlock cadence is too sparse.
   Mitigation: intelligent reminder defaults and suggested cadence templates.
2. Risk: contributor drop-off.
   Mitigation: lightweight submission flow and message guidance prompts.
3. Risk: complexity creep in milestone logic.
   Mitigation: MVP with immediate/date unlock only, then expand.
4. Risk: emotional content sensitivity.
   Mitigation: privacy controls, moderation pipeline, and clear ownership.

## Success criteria for launch

1. At least 20% of active users create one Legacy Chain in first 30 days.
2. At least 45% of chain creators return for an unlock within 30 days.
3. Average of 3 or more contributors per active chain.
4. At least 30% of active chains include one reflection note.
5. No high-severity accessibility or privacy defects at GA.

## Recommendation

Ship Legacy Chain as the next flagship feature with a phased rollout.

The feature directly aligns with Autograph Exchange strengths:

1. emotionally meaningful communication
2. reusable keepsake artifacts
3. long-term relationship value

It adds a compelling reason to return, invite others, and preserve moments over time, making the app more valuable than a one-time exchange tool.
