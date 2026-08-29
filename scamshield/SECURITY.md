# Security and Anti-Abuse

ScamShield is a defensive social-engineering training prototype. The public demo intentionally limits what the avatar can do.

## Deployed prototype guardrails

- Reviewed fixed training scenarios only.
- No real-person face upload or voice cloning.
- No free-text scam-script generator.
- No outbound phone, SMS, email, LINE, or messaging integration.
- No real OTP, bank credential, account number, QR code, or payment destination input.
- Persistent simulation labeling.
- Training outcomes point users toward independent verification and incident containment.

## Open-source limitation

Client-side restrictions cannot prevent a malicious fork from removing guardrails. A production system should enforce the scenario allowlist and abuse controls on a server, with authentication, audit logging, rate limits, monitoring, and organization-level scenario approval.

## Reporting

If you discover a security issue in this prototype, avoid publishing exploit details that would materially enable abuse. Open a minimal GitHub issue describing the affected component and request a private follow-up channel if sensitive details are necessary.

## Third-party platform

ScamShield integrates the Perxona Connect Kit. Perxona SDKs, APIs, avatar assets, services, and trademarks remain subject to Perxona / XRSPACE terms and are not covered by ScamShield's MIT license.
