# Research: Subscription Renewal Reminder

**Date**: 2026-07-29

## 1. WeChat Notification Capability

**Decision**: Use verified WeChat Service Account template messages as the reference production provider, behind a `NotificationProvider` interface. Require evidence that the target account category and template are approved for this exact use case before production release.

**Rationale**: Service Account template messages can be sent by a backend at a scheduled time and return a message ID plus asynchronous delivery events. They do not require the user to reopen the app for every renewal. However, the official rules restrict templates to expected, important service notifications, disallow marketing and excessive expiration reminders, and may reject a reminder concerning services not provided by the account owner. The user's third-party subscriptions therefore create a real policy approval risk.

**Alternatives considered**:

- Mini Program one-time subscription messages: rejected as the primary channel because each future send depends on consumable user authorization.
- Mini Program long-term subscription messages: retained as a future capability probe; availability depends on platform-assigned categories/templates and cannot be assumed.
- WeChat Service Account subscription notifications: not selected because general availability remains account-dependent/limited.
- WeCom application/customer messages: rejected because their identity and relationship model targets organization members or managed customers.
- Personal-account bots or reverse-engineered protocols: rejected for account-ban, privacy, and compliance risk.
- Third-party push services: not selected for MVP because they add user setup, data-transfer, and provider-continuity risks.

**Official references**:

- [Mini Program subscription messages](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html)
- [Mini Program subscription authorization](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/subscribe-message/wx.requestSubscribeMessage.html)
- [Service Account template messages](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Template_Message_Interface.html)
- [Template-message operational rules](https://developers.weixin.qq.com/doc/service/guide/product/template_message/Template_Message_Operation_Specifications.html)
- [Template-message send API](https://developers.weixin.qq.com/doc/service/api/notify/template/api_sendtemplatemessage)

## 2. WeChat Identity and Binding

**Decision**: Deliver with the Service Account-scoped OpenID. Bind it to the authenticated application user through a signed, short-lived state/nonce flow using Service Account OAuth or follow events. Never accept an OpenID as trusted client input.

**Rationale**: OpenID is scoped to a user and AppID pair. UnionID can correlate accounts only when applications share an Open Platform account, but it cannot replace the Service Account OpenID required by the send API. A server-created binding session prevents one user from attaching another person's notification identity.

**Alternatives considered**:

- Reuse a Mini Program OpenID: rejected because it belongs to a different AppID scope.
- Use UnionID directly as the recipient: rejected because the send API requires the channel OpenID.
- Let the client submit OpenID: rejected because it permits binding theft and spoofing.

## 3. Backend Packaging and Service Space

**Decision**: Package database schemas, cloud objects, scheduled functions, and shared domain modules under `uni_modules/subscription-reminder/uniCloud/`. Keep business logic provider-neutral and deploy to one uniCloud service space for MVP.

**Rationale**: The repository currently has no root service-space directory; its existing cloud assets are owned by `uni_modules`. A feature module follows that convention and avoids duplicate Aliyun/Tencent source trees. Provider differences remain in deployment configuration, trigger definitions, quotas, and networking.

**Alternatives considered**:

- Create only `uniCloud-aliyun/`: rejected because it binds all source layout to a provider before account constraints are known.
- Maintain Aliyun and Tencent trees: rejected because it duplicates schemas and functions without an MVP requirement for multi-cloud deployment.

## 4. Authentication and Authorization

**Decision**: Upgrade to the current Vue 3-compatible uni-id-pages/uni-id-co/uni-id-common stack before business implementation. Cloud objects validate the token and derive `uid`; client payloads never contain an authoritative owner ID.

**Rationale**: The checked-in `uni-id` 3.3.33 module is only a legacy common cloud library. There are no login pages, current auth cloud object, user schemas, or project configuration. FR-018 requires server-enforced ownership for every query and state transition.

**Alternatives considered**:

- Extend legacy uni-id: rejected due to incomplete project setup and migration risk.
- Rely on clientDB rules alone: rejected because schedule regeneration and delivery state transitions require trusted orchestration.
- Build custom authentication: rejected as unnecessary security-sensitive scope.

## 5. Calendar, Recurrence, and Timezones

**Decision**: Use `@js-temporal/polyfill` in the shared cloud domain module. Store the renewal local date, reminder local time, and IANA timezone as business inputs, plus computed UTC epoch values for queries. Preserve recurrence anchors rather than advancing from a clamped date.

**Rationale**: A January 31 monthly subscription must produce February 28/29 and then return to March 31. A February 29 annual subscription must return to February 29 in the next leap year. Temporal distinguishes plain dates, zoned date-times, and instants and avoids host-timezone leakage.

**Rules resolved**:

- Subtract lead days as calendar days in the user's timezone, then combine the local reminder clock.
- Clamp missing month days to the target month's final day without changing the original anchor.
- For a nonexistent DST local time, move forward to the first valid instant.
- For a repeated DST local time, choose the earlier occurrence.
- Skip expired cycles to the first future occurrence; do not backfill reminders whose value window has passed.
- Recalculate only unsent work when timezone or schedule inputs change.

**Alternatives considered**:

- JavaScript `Date` plus manual arithmetic: rejected because month, DST, and host-timezone behavior is error-prone.
- Luxon: viable, but Temporal maps the required date/zone/instant distinctions more directly.

## 6. Durable Scheduling and Idempotency

**Decision**: Treat `ReminderDelivery` as a durable job/outbox. A scheduled cloud function runs at most every five minutes, scans due records, claims bounded batches with conditional updates and leases, and rechecks the subscription, schedule version, and binding before sending.

**Rationale**: Cloud triggers are at-least-once and may overlap; clients exit and cannot guarantee timers. A database queue makes retries, status, cancellation, and audit history durable.

**Idempotency rule**: Create a unique key from subscription ID, target renewal local date, reminder local date/time, timezone, and rule slot. Do not include retry count or schedule version. Provider attempts reuse the delivery's stable client request ID.

**Alternatives considered**:

- One platform timer per subscription: rejected because edits, deletes, quotas, and recovery become fragile.
- Client local notifications: rejected because application lifecycle and permissions cannot satisfy server-side delivery guarantees.
- Scan every active subscription on each run: rejected because it scales poorly and obscures per-delivery state.

## 7. Retry and Unknown Outcomes

**Decision**: Automatically retry only outcomes known not to have been accepted. Use bounded exponential backoff with jitter for throttling, server-busy, and explicit retryable failures. Mark ambiguous post-request timeout/disconnect outcomes as `outcome_unknown` and do not automatically resend.

**Rationale**: Local database idempotency cannot mathematically prevent duplication if WeChat accepts a message and the function loses the response before saving it. The Service Account `client_msg_id` only provides a short deduplication window, so blind retries would conflict with FR-009.

**Retry policy**: Respect `Retry-After` where available; otherwise use approximately 1, 5, 15, and 60 minutes, up to five attempts and never after the reminder's useful deadline. Refresh an expired access token once under a single-flight lock. Treat invalid recipient, rejected/unfollowed user, invalid template/fields, restricted template, and policy-blocked content as terminal.

**Alternatives considered**:

- Retry every non-success: rejected due to duplicate-message risk.
- Never retry: rejected because explicit throttling and temporary platform failures are safely recoverable.

## 8. Testing Strategy

**Decision**: Keep recurrence, scheduling, state transitions, and error classification in pure modules with injected clock, repository, and provider interfaces. Add separate Jest unit/contract/integration configurations; use uni-automator only for user journeys.

**Rationale**: The existing test script intentionally fails and the current Jest configuration only scans page tests. Time reliability and concurrent worker behavior require deterministic Node tests and a real test-space integration suite.

**Required coverage**:

- January 31 monthly, April 30 anchor, February 29 annual, cross-year, and multi-cycle skip behavior.
- Asia/Shanghai plus DST gap/overlap cases in America/New_York.
- Identical results under different host `TZ` values.
- Duplicate scans, two-worker claim races, lease recovery, unique-index conflicts, edit/disable/unbind races.
- Retryable, terminal, token-expired, callback rejection, and unknown provider outcomes.
- Subscription create/edit/disable, binding state, and delivery-status client flows.

## Resolved Unknowns

All technical unknowns identified during planning have a documented decision. The remaining WeChat account/template approval is an external production-readiness gate with an explicit fake-provider development path, not an unresolved implementation choice.
