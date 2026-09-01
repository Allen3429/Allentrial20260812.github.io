# ScamShield 2.0 — Customer-Ready Connect Release

**Released:** 2026-09-01  
**Deployment:** GitHub Pages  
**Product URL:** https://allen3429.github.io/Allentrial20260812.github.io/scamshield/

ScamShield 2.0 replaces the hackathon-era redirect, reviewer page, local-key dependency, and compatibility renderer with one customer-facing product at the originally submitted URL.

## Major changes

### One public product URL

- The submitted `/scamshield/` URL is now the application itself.
- No reviewer-only route, URL fragment, setup modal, or manual key entry is required.
- The live Perxona avatar is visible on the landing page.
- The same initialized Presenter instance moves into the training interface, avoiding a second 3D session startup.

### Direct Perxona Connect Kit integration

- Uses `<sv-presenter>` from the official Presenter SDK.
- Loads Avatar, Scene, Voice, Voice Detail, and Motion catalogs.
- Calls `initializeWithConnectKey()` with an explicit target.
- Unlocks the product only on `PRESENTER_STATUS: Ready`.
- Uses `present()` for reviewed scenario speech and lip sync.
- Uses motion cues and `playMotion()` for reactions.
- Uses `interruptPresentation()` for BREAK THE SPELL.
- Uses only a browser-scoped Publishable Connect Key restricted to `allen3429.github.io`; no Secret Connect Key is shipped.

### Reliability

- Parallel catalog loading with timeouts.
- Professional adult/business avatar ranking.
- Office-like scene ranking.
- Mandarin/Taiwan formal and lower-pitch voice ranking using voice detail metadata when available.
- Automatic retry with an alternate avatar/scene/voice target.
- Real error state on initialization failure; no false “ready” indicator or countdown behind a missing avatar.
- Compatibility polyfills retained for older Chrome versions.

### Product experience

- Full Campaign: 3 stages / 12 rounds.
- Quick Mode: 4 rounds.
- Trust Shield, score, combo, interruptions, captured red flags, checkpoints, star ratings, and final score.
- Recovery Checks after selected unsafe actions.
- Avatar, scene, and voice settings with deliberate session rebuild.
- Responsive desktop and mobile interface.

### Safety

- Fixed reviewed defensive scenarios only.
- No free-text scam-script generation.
- No real-person face or voice cloning.
- No outbound messaging or calling capability.
- No real OTP, bank credential, QR code, or payment destination input.
- Expanded credential and production-hardening documentation in `SECURITY.md`.

## Repository structure

The active product path is now:

```text
index.html
product-config.js
product.js
product.css
product-host.js
product-host.css
campaign-data.js
compat.js
```

Earlier hackathon files remain in the repository as project history but are not loaded by the product entry point.

## Known production roadmap

The public release is a single-tenant static deployment. A commercial multi-tenant edition should add authenticated organizations, server-side scenario governance, privacy-preserving analytics, audit logs, role-based administration, LMS/SSO integration, monitoring, rate limits, and controlled key rotation.
