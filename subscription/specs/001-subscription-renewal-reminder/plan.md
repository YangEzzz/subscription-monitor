# Implementation Plan: Subscription Renewal Reminder

**Branch**: `001-subscription-renewal-reminder` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-subscription-renewal-reminder/spec.md`

## Summary

Build a personal subscription manager in the existing Vue 3 uni-app project. Users create and maintain subscription records, while a uniCloud backend calculates future renewal occurrences, materializes durable reminder deliveries, and dispatches due notifications through a provider adapter. The reference notification provider is a verified WeChat Service Account template message, gated by account-category and template approval. Scheduling uses calendar-aware Temporal calculations, UTC query timestamps, database-backed leases, bounded retries, and stable idempotency keys.

## Technical Context

**Language/Version**: JavaScript ES2020; Vue 3; uni-app runtime declared as `^4.03`; Node.js 18 target for uniCloud functions

**Primary Dependencies**: uni-app, Vue 3, Vuex, current uni-id-pages/uni-id-co/uni-id-common stack, uniCloud cloud objects and scheduled functions, uni-config-center, `@js-temporal/polyfill`, WeChat notification provider adapter

**Storage**: uniCloud document database with schema validation, compound query indexes, and a unique reminder idempotency index; uni-config-center for channel secrets

**Testing**: Jest for pure domain and provider-contract tests; uniCloud test space for database/worker integration; uni-automator and WeChat Developer Tools for client journeys

**Target Platform**: WeChat Mini Program as the primary client; uni-app keeps H5/App compatibility where business pages use portable components; one uniCloud service space for the first deployment

**Project Type**: Mobile application plus managed backend

**Performance Goals**: Subscription list/detail operations complete within 1 second at p95 under normal load; at least 99% of eligible reminders are accepted by the channel within 10 minutes of their scheduled time; scheduler scans complete inside one trigger interval

**Constraints**: Server-enforced user isolation; no client-supplied owner IDs; no secrets in client bundles; no host-default timezone calculations; no duplicate accepted notification for the same renewal reminder; provider policies and quotas apply; ambiguous send outcomes are not blindly retried

**Scale/Scope**: MVP target of 10,000 users, up to 50 active subscriptions per user, 50,000 active subscriptions overall, and peak batches of 1,000 due reminders per five-minute window; five business pages and one settings flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

The project constitution is still an unratified placeholder and contains no enforceable principles or gates. This plan therefore applies the repository conventions and the feature's own requirements as its quality gates:

- **PASS - User isolation**: All business mutations and reads pass through authenticated cloud objects; the server derives `uid` from a verified token.
- **PASS - Deterministic scheduling**: Calendar and timezone behavior lives in pure functions with an injected clock and explicit DST/month-end rules.
- **PASS - Reliable delivery**: Durable delivery records, unique idempotency keys, conditional claims, and bounded retries cover at-least-once scheduler execution.
- **PASS - Secret management**: WeChat credentials and callback secrets are stored only in uni-config-center or the deployment secret facility.
- **PASS - Testability**: The design separates domain logic, persistence, orchestration, and provider integration so each can be verified independently.
- **EXTERNAL READINESS GATE**: Production WeChat delivery cannot launch until the target verified Service Account has an approved, policy-compliant template for this use case. Development proceeds with a fake provider; failure to obtain approval blocks the WeChat release, not the core subscription manager.

### Post-Design Re-check

Phase 1 preserves all gates. The data model enforces ownership and immutable delivery history; contracts reject client owner fields; the provider contract separates accepted, delivered, rejected, retryable, terminal, and unknown outcomes; the quickstart includes concurrency, timezone, policy, and end-to-end checks. No constitution violation or unresolved technical clarification remains.

## Project Structure

### Documentation (this feature)

```text
specs/001-subscription-renewal-reminder/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── cloud-objects.md
│   └── wechat-notification-provider.md
└── tasks.md                       # Created by /speckit-tasks, not this phase
```

### Source Code (repository root)

```text
pages/
├── subscriptions/
│   ├── index.vue
│   ├── edit.vue
│   └── detail.vue
└── settings/
    ├── index.vue
    └── wechat-notifications.vue

components/subscription/
├── subscription-form.vue
├── subscription-list-item.vue
└── reminder-status.vue

common/subscription/
├── api.js
├── constants.js
└── presentation.js

store/modules/
└── subscriptions.js

uni_modules/subscription-reminder/
└── uniCloud/
    ├── database/
    │   ├── sr-user-profiles.schema.json
    │   ├── sr-subscriptions.schema.json
    │   ├── sr-reminder-settings.schema.json
    │   ├── sr-notification-bindings.schema.json
    │   ├── sr-reminder-deliveries.schema.json
    │   ├── sr-delivery-attempts.schema.json
    │   └── *.index.json
    └── cloudfunctions/
        ├── subscription-service/index.obj.js
        ├── wechat-binding-callback/index.js
        ├── wechat-delivery-callback/index.js
        ├── process-renewal-reminders/index.js
        └── common/subscription-core/
            ├── recurrence.js
            ├── scheduling.js
            ├── delivery-state.js
            ├── repositories.js
            └── providers/
                ├── notification-provider.js
                ├── wechat-service-account.js
                └── fake-provider.js

uni_modules/uni-config-center/uniCloud/cloudfunctions/common/
└── uni-config-center/subscription-reminder/config.json

tests/
├── unit/
│   ├── recurrence.test.js
│   ├── scheduling.test.js
│   └── delivery-state.test.js
├── contract/
│   ├── subscription-service.test.js
│   └── notification-provider.test.js
└── integration/
    ├── reminder-worker.test.js
    ├── ownership.test.js
    └── wechat-callback.test.js
```

**Structure Decision**: Keep the existing uni-app client layout and add focused business pages/components. Package backend assets as a feature-owned `uni_module`, matching the repository's existing uniCloud module convention and avoiding duplicated Aliyun/Tencent source trees. Deploy the same module to one selected service space for MVP; only trigger and environment configuration may be provider-specific.

## Delivery Phases

### Phase 0 - External Readiness and Foundations

1. Verify the target Service Account is certified, the intended template is permitted for the account category, and the third-party subscription reminder use case passes platform review.
2. Select one uniCloud service space after confirming scheduled-trigger cadence, unique-index/conditional-update behavior, outbound networking, quotas, and WeChat IP restrictions.
3. Upgrade the incomplete legacy uni-id installation to the current Vue 3-compatible uni-id-pages/uni-id-co/uni-id-common stack.
4. Establish runnable unit, contract, integration, and client test commands.

### Phase 1 - Domain and Persistence

1. Implement Temporal-based recurrence and reminder calculations as pure functions.
2. Add database schemas, ownership rules, compound indexes, and the stable idempotency key.
3. Implement authenticated subscription CRUD and schedule regeneration in the cloud object.
4. Implement binding sessions without accepting client-provided OpenIDs.

### Phase 2 - Delivery Pipeline

1. Materialize the next reminder delivery on create/update/reactivation.
2. Implement due-work scanning, conditional claiming, lease recovery, retry classification, and schedule-version checks.
3. Implement the fake provider first, then the approved WeChat Service Account adapter and signed callbacks.
4. Add metrics and operational alerts for backlog, failures, restricted templates, and unknown outcomes.

### Phase 3 - Client Journeys and Validation

1. Replace the hello-uniapp entry experience with subscription list, edit, detail, and notification settings flows.
2. Surface binding state, next reminder, delivery state, duplicate warnings, and actionable failure guidance.
3. Execute the quickstart scenarios in a test service space and then in the approved production-like WeChat environment.

## Risks and Controls

| Risk | Control |
|------|---------|
| WeChat rejects the category/template or considers third-party subscription reminders non-compliant | Treat approval evidence as a release gate; retain a provider adapter and fake provider; do not ship misleading promises |
| Existing auth module is legacy and incomplete | Upgrade authentication before business CRUD; all owner IDs come from verified tokens |
| Month-end, leap-year, DST, or timezone changes shift reminders | Temporal calendar model, recurrence anchors, explicit DST policy, table-driven tests |
| Scheduled functions overlap or repeat | Unique idempotency key, conditional claim, lease, schedule-version recheck |
| Channel accepts a message but response is lost | Mark outcome unknown and do not automatically resend without provider idempotency or reconciliation evidence |
| User edits, disables, deletes, or unbinds during dispatch | Recheck subscription, schedule version, and binding immediately before sending; cancel future work |
| Template or access token becomes invalid | Classify terminal vs retryable errors, invalidate binding/channel where appropriate, and alert operations |
