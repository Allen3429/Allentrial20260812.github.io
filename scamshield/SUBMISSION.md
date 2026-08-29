# ScamShield — submission copy

## One-liner

**Scams do not just fake facts anymore. They fake people. ScamShield trains high-risk employees to verify identity under pressure using a live Perxona AI avatar.**

## Primary buyer

**Enterprise CISO / Head of Information Security / Security Awareness Lead.**

Initial users are employees who can release money, credentials, or sensitive data: finance / accounts payable, procurement, executive assistants, HR, IT helpdesk, and managers with approval authority.

This is deliberately **not** positioned first as a direct-to-consumer app. Enterprises already have recurring security-awareness budgets, measurable risk owners, and a reason to run training repeatedly.

## Problem

Traditional security-awareness programs are strong at teaching policies and simulating phishing. But impersonation fraud increasingly happens in real time: an apparently credible person appears on a call, invokes authority, creates urgency, and asks an employee to transfer money, reveal credentials, or bypass normal verification.

The failure is behavioral, not merely informational: employees may know the rule but fail to follow it while a convincing person is pressuring them.

## Solution

ScamShield is an embodied social-engineering rehearsal game built with Perxona Connect Kit.

A Perxona avatar claims an identity and applies controlled pressure. The learner must interrupt manipulation, leave the attacker's communication channel, independently verify identity, and refuse unsafe actions.

**We do not teach users to detect whether a face is fake. We teach them not to use appearance as authentication.**

## Product experience

### Campaign Mode — 3 stages / 12 rounds

1. **Trust Basics:** authority + urgency, family impersonation, OTP theft, “safe account” fraud.
2. **Enterprise Defense:** vendor bank-account change, MFA push fatigue, CEO urgent payment, payroll modification.
3. **Trust-Chain Boss Rush:** legal-secrecy trap, multi-channel consistency illusion, stolen shared secret, fake incident commander.

The difficulty escalates from obvious red flags to attacks where email, video, documents and internal knowledge all appear consistent.

Campaign mechanics:

- visible 3-stage map and 1/12–12/12 progress
- Trust Shield that persists across rounds
- one-to-three-star stage checkpoints
- combo streak and time-to-interrupt behavior
- fixed scenario-specific equipment / evidence overlays
- final Trust Resilience Score and locally saved best score
- optional **Recovery Checks** after high-risk mistakes, such as revoking sessions after OTP disclosure or freezing a suspicious payment

The original four-round flow remains as Quick Mode for a short demo.

## Why Perxona — 60%

The avatar itself is a game mechanic:

- `sv-presenter` makes the adversary person-like rather than a text prompt.
- `present()` adds speech and lip sync, creating time pressure and social presence.
- `playMotion()` and scenario props make each attack visually legible.
- `interruptPresentation()` powers **BREAK THE SPELL**, where the player literally interrupts the simulated scammer.
- Avatar, voice and pressure-speed selection let the participant choose the type of caller most likely to lower their guard.
- The avatar changes from an institutional caller to a familiar person, executive, supplier, lawyer, and incident commander across the campaign.

**Remove the avatar and the experience collapses into a knowledge quiz.**

## Why someone pays

The buyer is paying to reduce human risk around payment fraud, account takeover, social engineering, and executive impersonation.

ScamShield does not need to replace an incumbent awareness suite. The wedge is a **high-risk-role simulation module** for real-time impersonation scenarios that can sit beside phishing simulation and LMS programs.

Commercial model:

1. paid enterprise pilot for a high-risk cohort,
2. annual per-seat subscription for scenario access and analytics,
3. premium organization-specific scenario packs based on the customer's approval workflows,
4. later LMS / SSO / SCORM integrations.

## Measurable behavior

Do not promise that one training session prevents fraud. Measure:

- unsafe-action rate before vs. after training
- independent-verification rate
- time-to-interrupt / time-to-break-the-spell
- OTP / credential disclosure rate in simulations
- payment-policy bypass rate
- incident-recovery decision quality
- repeat-session improvement by role / team

## Safety / anti-abuse

The deployed prototype is simulation-only:

- no real-person face or voice cloning
- no free-text scam-script generator
- no outbound phone / SMS / email / LINE capability
- no real OTP, bank credential, or payment-data collection
- avatar speech is restricted to reviewed fixed defensive scenarios
- persistent simulation labeling

A production version would enforce scenario authorization, logging, rate limits and abuse controls server-side.

## 5-minute live demo

**0:00–0:25 — Hook**

“Everyone knows they should verify an unusual payment request. But scams no longer just fake emails — they can fake people. The question is not whether you know the rule. It is whether you still follow it while a convincing person is pressuring you.”

**0:25–0:50 — Choose the caller**

Select an adult avatar, voice and high-pressure speaking profile. Show Campaign Mode: 3 stages, 12 rounds.

**0:50–2:15 — Play Stage 1**

Let the avatar create urgency. Use **BREAK THE SPELL** mid-sentence. Choose independent verification. Deliberately choose one risky OTP option to trigger a Recovery Check, then contain the incident.

**2:15–2:45 — Checkpoint**

Show stage stars, Trust Shield, captured red flags and the map unlocking Enterprise Defense and Boss Rush.

**2:45–3:25 — Why Perxona**

“We did not put an avatar next to a quiz. The avatar is the claimed identity and the pressure source. Interrupting the avatar is gameplay. Across the campaign, the same defensive rule must survive different faces, voices, roles and evidence.”

**3:25–4:10 — Product depth**

Show the later rounds: supplier account change, CEO payment bypass, legal secrecy, and the fake incident commander. Explain that the prototype now supports repeatable scenario packs rather than a one-off quiz.

**4:10–5:00 — Buyer / product path**

“Our first buyer is the enterprise security team. We start with finance, executive assistants, procurement and IT helpdesk — the people whose mistakes can release money, credentials or data.”

## Tough-judge answers

### Who pays?
The CISO / security-awareness owner, from the existing employee security-training or human-risk budget.

### Why not consumers?
Consumers have the need but no clean recurring payer. Enterprises have a risk owner, budget, required participation, and measurable outcomes.

### Why not just use ChatGPT voice mode?
A generic voice assistant can role-play. ScamShield turns embodiment, visible reactions, timed interruption, stage progression, scoring, safety-bounded scenarios and enterprise measurement into a designed behavior loop.

### Why not just use another awareness platform?
We would integrate or coexist rather than replace it. The wedge is embodied real-time impersonation rehearsal for high-risk roles.

### Can you prove this prevents fraud?
Not from a hackathon prototype. We can prove whether simulated verification behavior changes and test whether that improvement persists.

### Can the avatar itself be abused for scams?
The deployed product does not expose free-form impersonation or outbound communication. It uses synthetic avatars and reviewed defensive scenarios.

### Why now?
AI makes convincing impersonation cheaper while the defensive rule remains stable: never authenticate identity from appearance alone; independently verify through a trusted channel.

## Closing line

**Don't ask: “Does this person look real?” Ask: “Can I verify them through a channel I control?”**
