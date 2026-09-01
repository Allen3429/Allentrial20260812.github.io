# ScamShield — Trust Under Attack

> **Scams do not only fake facts anymore. They fake people.**  
> **Trust the channel, not the face.**

ScamShield is an open-source, browser-based human-risk training product built with the official [XRSPACE Perxona Connect Kit](https://github.com/XRSPACE-Inc/perxona-connect-kit). It puts learners inside short, high-pressure identity-impersonation simulations and trains the behavior that matters when a caller looks and sounds credible: stop, interrupt, and verify through a channel the learner controls.

## Live product

**https://allen3429.github.io/Allentrial20260812.github.io/scamshield/**

The submitted URL is the product itself. A visitor does not need to sign in, paste a key, open a settings screen, or follow a reviewer-only flow. The page initializes the Perxona avatar on first load and unlocks training only after the Presenter SDK emits `PRESENTER_STATUS: Ready`.

## Product experience

1. A live synthetic Perxona avatar is visible on the landing page.
2. The learner chooses a full campaign or a short exercise.
3. The avatar claims a trusted identity and applies authority, urgency, secrecy, familiarity, or process pressure.
4. The learner can use **BREAK THE SPELL** to call `interruptPresentation()` while the avatar is speaking.
5. The learner chooses an action and receives immediate behavioral feedback.
6. Unsafe decisions can open a **Recovery Check**, teaching rapid containment instead of treating one mistake as the end.
7. The session tracks Trust Shield, safe and risky decisions, interruption behavior, combo streak, captured red flags, checkpoint ratings, and a final Trust Resilience Score.

### Full campaign — 3 stages / 12 rounds

**Stage 1 — Trust Basics**

- authority and urgency
- family-member / AI impersonation
- OTP theft
- “safe account” and secrecy

**Stage 2 — Enterprise Defense**

- vendor bank-account change
- MFA push fatigue
- CEO urgent-payment fraud
- payroll-account modification

**Stage 3 — Trust-Chain Boss Rush**

- legal-secrecy trap
- multi-channel consistency illusion
- stolen shared secret
- fake incident commander

A four-round Quick Mode is also available for shorter training.

## Why Perxona is essential

The avatar is not decoration. **The avatar is the trust attack and the feedback surface.**

ScamShield integrates the Perxona Connect Kit through:

- `<sv-presenter>` for the live synthetic 3D caller
- `initializeWithConnectKey()` for the selected avatar, scene, and voice
- Avatar / Scene / Voice / Motion catalog endpoints
- `present()` for speech, lip sync, and reviewed pressure dialogue
- `[MOTION ...]` cues and `playMotion()` for visible reactions
- `interruptPresentation()` for the BREAK THE SPELL mechanic
- `PRESENTER_STATUS: Ready` as the only condition that unlocks the product

Remove the avatar and the experience collapses into a multiple-choice knowledge quiz. With it, the learner rehearses the harder task: following verification policy while a convincing person-like identity is actively pressuring them.

## Customer and business model

The initial buyer is an enterprise **CISO, Security Awareness owner, or Human Risk Management team**.

Priority learners include:

- Finance / Accounts Payable
- Procurement
- Executive Assistants
- HR
- IT Helpdesk
- managers with payment, account, or data authority

Commercial path:

1. paid enterprise pilot for a high-risk department
2. annual per-seat access
3. organization-specific scenario packs and policies
4. later LMS, SSO, SCORM, analytics, and admin-console integration

ScamShield complements existing security-awareness platforms. Its wedge is **real-time embodied impersonation rehearsal**.

## What problem it solves

Traditional awareness material can teach “never share an OTP” or “require dual approval,” but knowing a rule is not the same as carrying it out while a credible-looking person is watching, rushing, flattering, threatening, or invoking authority.

ScamShield turns policy knowledge into repeatable behavior:

- interrupt the manipulator
- leave the attacker-controlled channel
- verify through a known official route
- refuse credential and payment-policy bypasses
- contain damage quickly after an error

The product does not depend on visually detecting deepfakes. If a face or voice is already convincing, appearance is not a reliable authentication factor.

## Production architecture

The public product is intentionally small and zero-build:

```text
scamshield/
├── index.html              # customer-facing product shell
├── product-config.js       # browser configuration; publishable key only
├── product.js              # Connect Kit integration and training engine
├── product.css             # responsive product UI
├── product-host.js/.css    # keeps one Presenter session across views
├── campaign-data.js        # reviewed defensive scenarios and recovery paths
├── compat.js               # compatibility polyfills for older Chrome
├── SECURITY.md             # credential and anti-abuse model
├── docs/                   # judging brief and community material
└── legacy prototype files  # retained for project history; not loaded by index.html
```

### Connect authentication model

The browser uses one **Perxona Publishable Connect Key**, restricted in Perxona Console to the hostname `allen3429.github.io`. A publishable key is expected to be delivered to the browser; it is not a secret key and cannot perform Console-management operations.

No Perxona Secret Connect Key is present in the repository, HTML, JavaScript bundle, or browser. Any future server-side management or organization-administration feature must keep its secret key in a protected server environment.

The browser configuration is separated from application logic in `product-config.js` so the publishable key can be rotated without editing the training engine.

## Reliability behavior

- Catalog calls are parallelized and have request timeouts.
- Professional adult avatars, office-like scenes, and Mandarin/Taiwan formal lower-pitch voices are ranked ahead of cute or casual assets.
- The preferred business avatar is attempted first.
- If the initial target fails, the product retries once with an alternate avatar/scene/voice combination.
- Training remains locked until the SDK emits the documented `Ready` event.
- A failed avatar does not produce a fake green status or start the countdown.
- The same initialized Presenter instance is moved from the landing page into the training view, avoiding a second 3D initialization.
- Users can change the avatar, scene, and voice; doing so deliberately rebuilds the Perxona session.

## Safety and anti-abuse

The deployed product is defensive by construction:

- reviewed fixed training scenarios only
- no free-text scam-script generator
- no real-person face upload or voice cloning
- no outbound phone, SMS, email, LINE, or messaging capability
- no real OTP, bank credentials, QR code, or live payment destination input
- every scenario teaches independent verification or incident containment
- persistent simulation labeling in the avatar interface

The design principle is:

> **Simulate manipulation without operationalizing it.**

See [SECURITY.md](./SECURITY.md) for credential handling, key rotation, threat-model limitations, and production hardening.

## Measurement

ScamShield is designed to measure behavioral outcomes rather than merely course completion:

- unsafe-action rate
- independent-verification rate
- time-to-interrupt
- credential / OTP disclosure rate
- payment-policy bypass rate
- recovery quality
- improvement and retention across repeated sessions

The current browser prototype stores only the learner’s local best score. A commercial deployment should add consented organization analytics, role-based administration, retention controls, and privacy-preserving exports.

## Local development

The product can be served by any static server:

```bash
python -m http.server 8080
```

Then open `/scamshield/`. The configured publishable key must allow the development hostname. Never put a Secret Connect Key into browser code.

## Open source

ScamShield’s original code is released under the [MIT License](./LICENSE). Perxona / XRSPACE SDKs, services, avatars, voices, trademarks, and other third-party materials retain their own terms and are not relicensed by this repository.

Contributions are welcome around defensive scenario design, accessibility, behavioral measurement, localization, LMS integration, organization controls, and server-side anti-abuse enforcement.

---

Built with the official [`XRSPACE-Inc/perxona-connect-kit`](https://github.com/XRSPACE-Inc/perxona-connect-kit).

`#Perxona` `#AIAvatar` `#PerxonaBuilder` `#TaipeiHackathon`
