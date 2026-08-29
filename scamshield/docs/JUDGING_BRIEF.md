# ScamShield — Judging Brief

> **Scams don't just fake facts anymore. They fake people.**
>
> **Trust the channel, not the face.**

ScamShield is an embodied social-engineering defense web game built with the Perxona Connect Kit. It trains users to resist trust hijacking under pressure: a synthetic AI avatar claims a familiar or authoritative identity, applies urgency and social pressure, and asks the user to perform a risky action. The player must interrupt the manipulation, switch to an independently trusted verification channel, and follow the correct security process.

## What we built

ScamShield is not a fraud knowledge quiz. It is a behavioral rehearsal system.

### Campaign Mode — 3 stages / 12 main rounds

**Stage 1 — Trust Basics**
1. Authority + urgency
2. Family-member / AI impersonation
3. OTP theft
4. “Safe account” + secrecy

**Stage 2 — Enterprise Defense**
5. Vendor bank-account change
6. IT helpdesk + MFA push fatigue
7. CEO urgent-payment fraud
8. Payroll account modification

**Stage 3 — Trust-Chain Boss Rush**
9. Legal-secrecy trap
10. Multi-channel consistency illusion
11. Stolen shared secret
12. Fake incident commander asking the employee to disable monitoring and disclose backup codes

The campaign includes Trust Shield, combo streak, red-flag collection, stage checkpoints, one-to-three-star ratings, local best score, and optional Recovery Checks after high-risk mistakes.

### Recovery branches

A mistake is not treated as the end of the exercise. Examples:

- OTP disclosed → revoke sessions and reset credentials
- suspicious transfer initiated → freeze payment and contact the bank
- unknown MFA approved → revoke access and report through official IT
- sensitive account changed → restore data and preserve an audit trail
- security controls disabled → restore visibility and re-enter the formal incident chain

This teaches both prevention and containment.

## Who uses it, and who pays?

**Primary buyer:** enterprise CISO / Head of Information Security / Security Awareness or Human Risk owner.

**Initial users:** employees who can release money, credentials, or sensitive data:

- Finance / Accounts Payable
- Procurement
- Executive Assistants
- HR
- IT Helpdesk
- Managers with approval authority

The commercial path is an enterprise pilot, followed by annual per-seat access, organization-specific scenario packs, and later LMS / SSO / SCORM integrations.

ScamShield is not positioned as a replacement for an entire security-awareness suite. Its wedge is **real-time embodied impersonation rehearsal** for high-risk roles.

## What problem does it solve?

The problem is often not that an employee does not know the rule. The problem is that they know the rule but fail to follow it while a convincing person is pressuring them.

Traditional awareness material can say “never share an OTP” or “always use dual approval.” It is much harder for a slide deck or static quiz to recreate authority, urgency, familiarity, time pressure, and the social discomfort of refusing someone who appears credible.

ScamShield turns security knowledge into repeatable behavior practice.

We deliberately do **not** teach users to visually identify deepfakes. If the face and voice are already convincing, appearance is not a reliable authentication factor. The safer behavioral rule is:

> **Do not authenticate identity from appearance. Verify through a channel you control.**

## Why Perxona?

The avatar is not decoration. **The avatar is the trust attack.**

- `<sv-presenter>` creates a person-like synthetic caller.
- `present()` provides speech and lip sync under time pressure.
- `playMotion()` lets the caller react visibly to resistance and questioning.
- `interruptPresentation()` powers **BREAK THE SPELL**, where the player literally interrupts the simulated manipulator.
- Avatar / voice selection lets participants choose a caller profile that may lower their guard.

Remove the avatar and the experience collapses into a knowledge quiz. With it, the user must perform the right security behavior while a person-like identity claim is actively pressuring them.

## What is unique?

### Not a deepfake detector
We do not bet on users being able to visually spot a fake. We train independent verification.

### Not a generic chatbot
The avatar's social presence, visible reactions, interruption mechanic, stage progression, scoring, and recovery loop are part of the designed experience.

### Not a one-off quiz
Campaign Mode provides 12 scenarios across increasing difficulty, recovery branches, checkpoints, and measurable behavior.

## Safety / anti-abuse

The deployed hackathon build is simulation-only:

- no real-person face or voice cloning
- no free-text scam-script generator
- no outbound phone / SMS / email / LINE capability
- no real OTP, bank credentials, account numbers, QR codes, or live payment destination
- avatar speech restricted to reviewed defensive scenarios
- persistent **SIMULATION ONLY · SYNTHETIC AVATAR** labeling

The design principle is:

> **Simulate manipulation without operationalizing it.**

Because this is an open-source static prototype, client-side guardrails cannot stop a malicious person from forking and deleting them. A production deployment should enforce scenario allowlists, authorization, audit logging, rate limits, and abuse detection server-side.

## What can be measured?

The hackathon prototype does not claim to have proven real-world fraud reduction. It can measure behavioral outcomes such as:

- unsafe-action rate
- independent-verification rate
- time-to-interrupt / time-to-break-the-spell
- credential / OTP disclosure rate
- payment-policy bypass rate
- recovery decision quality
- improvement across repeated sessions

## Recommended final demo

1. Choose an adult avatar, voice, and high-pressure profile.
2. Enter Campaign Mode and show the 3-stage / 12-round progression.
3. Let the avatar create urgency, then use **BREAK THE SPELL** mid-sentence.
4. Choose independent verification and show immediate feedback.
5. Deliberately make one risky OTP choice to trigger a Recovery Check, then contain the incident.
6. Show the checkpoint, stars, Trust Shield, captured red flags, and later Enterprise / Boss Rush scenarios.

## Tough-judge answers

**Who pays?**  
The enterprise security-awareness / human-risk owner, from an existing employee security-training budget.

**Why not ChatGPT voice mode?**  
A generic voice assistant can role-play. ScamShield turns embodiment, visible reactions, interruption, stage progression, scoring, safety-bounded scenarios, and behavioral measurement into a repeatable training loop.

**Why not an existing security-awareness platform?**  
ScamShield can coexist with or integrate into one. Its wedge is embodied, real-time impersonation rehearsal for high-risk roles.

**Can you prove this prevents fraud?**  
Not from a hackathon prototype. We can first test whether verification behavior improves and whether that improvement persists.

**Can the avatar itself be abused for scams?**  
The deployed product exposes no real-person cloning, free-form scam generation, or outbound communication capability.

## Closing

> **Phishing simulation trained us not to trust every email.  
> ScamShield trains us not to trust every face.**

Don't ask: “Does this person look real?”  
Ask: **“Can I verify them through a channel I control?”**
