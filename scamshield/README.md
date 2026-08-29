# ScamShield — Trust Under Attack

Perxona Taipei Hackathon web game. ScamShield trains people to resist **trust hijacking**: scams that borrow the identity of a school, bank, colleague, friend or family member to create social pressure.

> **Scams don't just fake facts anymore. They fake people.**

The product does not ask players to decide whether a face or voice "looks real." It teaches a safer rule: **trust the verification channel, not the appearance.**

## Why Perxona

The avatar is not decoration. It is the trust attack and feedback surface:

- `<sv-presenter>` renders the live synthetic 3D character.
- `present()` delivers fixed defensive-simulation dialogue with speech + lip sync.
- `playMotion()` maps the caller's reactions into visible body language.
- `interruptPresentation()` powers **BREAK THE SPELL**, where the player literally interrupts manipulation.
- Avatar / scene / voice / motion catalogs load through the Perxona Connect API using a **publishable** Connect key.
- The participant can select the caller's avatar, voice and pressure-speed profile before playing.

Remove the avatar and the experience collapses into a normal fraud quiz. With it, the player practices resisting a convincing person-like identity claim while under time and social pressure.

## Game modes

### Campaign Mode — 3 stages / 12 main rounds

**Stage 1 · Trust Basics**

1. Authority + urgency
2. Family-member / AI impersonation
3. OTP theft
4. “Safe account” + secrecy

**Stage 2 · Enterprise Defense**

5. Vendor bank-account change
6. IT helpdesk + MFA push fatigue
7. CEO urgent-payment fraud
8. Payroll account modification

**Stage 3 · Trust-Chain Boss Rush**

9. Legal-secrecy trap
10. Multi-channel consistency illusion
11. Stolen shared secret
12. Fake incident commander asking the employee to disable monitoring and disclose backup codes

Each stage has a checkpoint, one-to-three-star performance rating, Trust Shield recovery and a stage map. The campaign tracks safe decisions, risky decisions, interruption timing, combo streak, recovery behavior and final Trust Resilience Score. Best score and run count persist locally.

### Recovery branches

A high-risk wrong decision can open a short containment challenge rather than immediately ending the run. Examples include:

- OTP disclosed → revoke sessions and reset credentials
- suspicious transfer initiated → freeze payment and contact the bank
- unknown MFA approved → revoke access and report through the official IT channel
- sensitive account changed → restore data and preserve an audit trail
- security controls disabled → restore visibility and re-enter the formal incident chain

These branches teach that a mistake is not the end: rapid containment still matters.

### Quick Mode

The original four-round experience remains available for a short live demonstration.

No scenario uses a real person's likeness, voice clone, contact details, account numbers or live payment destination.

## Run

This folder is zero-build so it can run directly on GitHub Pages.

1. Open the deployed page.
2. Open the gear icon.
3. Paste a **Perxona Connect Publishable Key** (never a secret key).
4. The game validates the key, loads the available avatar, scene, voice and motion catalogs, and initializes `<sv-presenter>`.
5. Select an avatar, voice and pressure-speed profile.
6. Choose Campaign Mode or Quick Mode.
7. The game cannot start until Perxona reports ready.

Perxona endpoints used:

- API: `https://console.perxona.ai/asia`
- Presenter SDK: `https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js`

Add the GitHub Pages origin to the publishable key's allowed domains.

## Anti-abuse design

The deployed prototype is defensive by construction:

- Avatar speech is limited to reviewed fixed simulation lines.
- There is **no free-text scam-script generator**.
- There is no real-person face upload, voice cloning or impersonation workflow.
- There is no telephone, LINE, SMS, email or other outbound-contact capability.
- There is no payment, bank-account, QR-code or real OTP input path.
- Every scenario ends by teaching independent verification or incident containment, not better persuasion.
- The page is visibly labeled **SIMULATION ONLY · SYNTHETIC AVATAR**.

### Threat-model limitation

This is an open-source static hackathon prototype. Client-side guardrails protect the deployed product flow, but they cannot stop somebody from forking the source and deliberately deleting those guardrails. A production version should enforce scenario allowlists, authorization, audit logging, rate limits and abuse detection server-side.

## 60-second judging explanation

**Problem:** Traditional anti-fraud education teaches red flags as information, while real scams exploit trust under pressure and increasingly impersonate trusted identities.

**Why Perxona:** We do not put an avatar next to a quiz. The avatar is the claimed identity and the social pressure. Players can literally interrupt it, observe its reaction, progress through increasingly difficult identity attacks, and practice switching to an independent verification channel.

**Product depth:** Campaign Mode turns a one-off quiz into repeatable training: 12 scenarios, three difficulty stages, checkpoints, recovery branches and measurable behavior.

**Safety:** We simulate identity manipulation without providing identity-cloning or outbound-attack capabilities.

Built from the integration patterns in `XRSPACE-Inc/perxona-connect-kit`.
