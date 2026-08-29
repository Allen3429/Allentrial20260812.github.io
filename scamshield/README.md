# ScamShield — Trust Under Attack

> **Scams don't just fake facts anymore. They fake people.**
>
> **Trust the channel, not the face.**

ScamShield is an open-source web game built for the **Perxona Taipei Hackathon 2026**. It trains people to resist identity impersonation and social-engineering pressure using live synthetic AI avatars.

**Live demo:** https://allen3429.github.io/Allentrial20260812.github.io/scamshield/

**Final judging brief:** [docs/JUDGING_BRIEF.md](./docs/JUDGING_BRIEF.md)

## What it does

Instead of asking users to memorize scam red flags, ScamShield places them inside a controlled high-pressure simulation. A Perxona avatar claims to be a school administrator, family member, IT helpdesk agent, executive, vendor, lawyer, or incident commander and tries to push the player toward a risky decision.

The player must interrupt manipulation, independently verify identity, refuse unsafe actions, and recover correctly if a mistake has already happened.

### Campaign Mode — 3 stages / 12 rounds

**Stage 1 — Trust Basics**
- authority + urgency
- family-member / AI impersonation
- OTP theft
- “safe account” + secrecy

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

The campaign includes Trust Shield, combo streak, red-flag collection, checkpoints, one-to-three-star stage ratings, Recovery Checks, a final Trust Resilience Score, and locally saved best score.

A **Quick Mode** preserves the original four-round flow for short demos.

## Why Perxona

The avatar is not decoration. **The avatar is the trust attack.**

ScamShield uses the Perxona Connect Kit for:

- `<sv-presenter>` — live synthetic 3D caller
- `present()` — speech + lip sync
- `playMotion()` — visible reactions and body language
- `interruptPresentation()` — powers **BREAK THE SPELL**, letting the player literally interrupt the simulated manipulator
- avatar / scene / voice / motion catalogs through a publishable Connect key
- participant-selectable caller appearance, voice, and pressure profile

Remove the avatar and the experience collapses into a normal fraud quiz. With it, the learner practices resisting a convincing person-like identity claim under social and time pressure.

## Who it is for

The initial buyer is an **enterprise CISO / Security Awareness / Human Risk team**.

High-risk users include:

- Finance / Accounts Payable
- Procurement
- Executive Assistants
- HR
- IT Helpdesk
- managers with approval authority

The product path is: enterprise pilot → annual per-seat access → organization-specific scenario packs → later LMS / SSO / SCORM integration.

ScamShield is designed to complement, not replace, existing security-awareness platforms. Its wedge is **real-time embodied impersonation rehearsal**.

## Core design principle

ScamShield does **not** teach users to visually detect deepfakes.

If a face and voice are already convincing, appearance is not a reliable authentication factor. The safer rule is:

> **Do not authenticate identity from appearance. Verify through a channel you control.**

## Recovery matters too

Some unsafe choices trigger short containment challenges instead of ending the run:

- OTP disclosed → revoke sessions and reset credentials
- suspicious transfer initiated → freeze payment and contact the bank
- unknown MFA approved → revoke access and report through official IT
- sensitive account changed → restore data and preserve an audit trail
- security controls disabled → restore visibility and return to the formal incident chain

The lesson is that prevention matters, but rapid containment after a mistake still has value.

## Running the project

This folder is intentionally zero-build and can run directly on GitHub Pages.

1. Open the live site or serve this folder statically.
2. Open the gear icon.
3. Paste a **Perxona Connect Publishable Key** — never a secret key.
4. Add your site hostname to the key's allowed domains.
5. Let the app load available avatar, scene, voice, and motion catalogs.
6. Select an avatar, voice, and pressure profile.
7. Choose Campaign Mode or Quick Mode.

Perxona endpoints used by the prototype:

- API: `https://console.perxona.ai/asia`
- Presenter SDK: `https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js`

## Project structure

```text
scamshield/
├── index.html                 # app shell
├── app.js                     # original 4-round flow + Perxona integration
├── campaign.js                # 12-round campaign engine
├── campaign-data.js           # reviewed defensive scenarios
├── campaign.css               # campaign UI
├── ux-upgrade.js/.css         # high-pressure call UX
├── ux-v2.js/.css              # casting, pacing, equipment props
├── voice-fix.js               # voice ranking
├── voice-match.js             # avatar → voice matching
├── compat.js                  # older Chrome compatibility
├── docs/JUDGING_BRIEF.md      # final judging / demo brief
├── SECURITY.md                # anti-abuse model
└── LICENSE                    # MIT for ScamShield original code
```

## Safety / anti-abuse

The deployed prototype is defensive by construction:

- reviewed fixed simulation lines only
- no free-text scam-script generator
- no real-person face upload or voice cloning
- no phone / SMS / email / LINE outbound capability
- no real OTP, bank credentials, QR codes, or live payment destination
- persistent **SIMULATION ONLY · SYNTHETIC AVATAR** labeling
- every scenario teaches independent verification or incident containment

The design goal is:

> **Simulate manipulation without operationalizing it.**

See [SECURITY.md](./SECURITY.md) for the threat-model limitation of a client-side open-source prototype.

## Measuring behavior

ScamShield does not claim that a hackathon prototype has already proven real-world fraud reduction. It is designed to measure behaviors such as:

- unsafe-action rate
- independent-verification rate
- time-to-interrupt / time-to-break-the-spell
- credential / OTP disclosure rate
- payment-policy bypass rate
- recovery decision quality
- improvement across repeated sessions

## Open source

ScamShield's original project code is released under the [MIT License](./LICENSE).

Perxona / XRSPACE SDKs, services, trademarks, avatar assets, and other third-party materials remain subject to their own terms and are **not** relicensed by this repository.

Contributions are welcome, especially around defensive scenario design, accessibility, measurement methodology, LMS integration, and server-side anti-abuse controls.

## Hackathon closing line

> **Phishing simulation trained us not to trust every email.  
> ScamShield trains us not to trust every face.**

Don't ask: “Does this person look real?”  
Ask: **“Can I verify them through a channel I control?”**

---

Built with [`XRSPACE-Inc/perxona-connect-kit`](https://github.com/XRSPACE-Inc/perxona-connect-kit) for the Perxona Taipei Hackathon 2026.

`#Perxona` `#AIAvatar` `#PerxonaBuilder` `#TaipeiHackathon`
