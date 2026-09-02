# Security and Anti-Abuse

ScamShield is a defensive social-engineering training product. This document separates the browser-safe Perxona credential from true server secrets and records the boundaries of the public deployment.

## Perxona credentials

### Publishable Connect key

The public site uses a **Perxona Publishable Connect Key** in browser code because the Perxona Presenter SDK needs that key to:

- read the Avatar / Scene / Voice / Motion catalogs available to the organization;
- initialize `<sv-presenter>` with `initializeWithConnectKey()`;
- request presentation and speech resources for the selected target.

The key is restricted in Perxona Console to the hostname:

```text
allen3429.github.io
```

A publishable key should be treated like a public client identifier with scoped capabilities, not like a password. Encoding or minifying it does not make it secret. Its protections are its restricted scope, allowed-domain policy, monitoring, and ability to be revoked or rotated independently.

### Secret Connect key

No **Secret Connect Key** is present in this repository or delivered to browsers.

A Secret Connect Key can reach privileged organization and management capabilities and must live only in a protected backend environment. If ScamShield later adds chatbot management, organization administration, private scenario publishing, or other server-side Connect operations, those routes must require authentication and authorization before they call Perxona.

## Rotation procedure

If the publishable key is abused, exposed outside its intended context, or no longer needed:

1. create a replacement Publishable Connect Key in Perxona Console;
2. restrict it to the required production hostname;
3. update only `product-config.js`;
4. verify the new key in a clean browser session;
5. revoke the old key.

Never replace it with a Secret key.

## Deployed product guardrails

- Reviewed fixed defensive scenarios only.
- No free-text scam-script generator.
- No real-person face upload or voice cloning.
- No outbound phone, SMS, email, LINE, or messaging integration.
- No real OTP, password, bank credential, account number, QR code, or payment destination input.
- No user-controlled impersonation target.
- Every scenario ends in independent verification, policy compliance, or incident containment.
- The interface labels the interaction as a synthetic simulation.

## Open-source limitation

Client-side restrictions cannot prevent a malicious fork from removing the guardrails. A commercial multi-tenant deployment should enforce the following server-side:

- authenticated organizations and role-based access;
- organization-approved scenario allowlists;
- audit logging and reviewable publishing history;
- rate limits and abuse detection;
- tenant isolation;
- content provenance and versioning;
- privacy controls, retention limits, and deletion workflows;
- monitoring of Perxona errors, usage, and key rotation.

## Availability and failure handling

ScamShield does not treat method availability or an intermediate connection event as proof that the avatar is usable. The customer UI unlocks only after Perxona emits `PRESENTER_STATUS: Ready`. If initialization fails or times out, the page shows a real error state and does not start a training countdown behind a missing avatar.

## Reporting

If you discover a security issue, avoid publishing exploit details that would materially enable abuse. Open a minimal GitHub issue naming the affected component and request a private follow-up channel when sensitive details are necessary.

## Third-party platform

ScamShield integrates the Perxona Connect Kit. Perxona SDKs, APIs, avatar assets, voices, services, and trademarks remain subject to Perxona / XRSPACE terms and are not covered by ScamShield’s MIT license.
