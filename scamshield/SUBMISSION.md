# ScamShield — submission copy

## One-liner

**Scams do not just fake facts anymore. They fake people. ScamShield trains high-risk employees to verify identity under pressure using a live Perxona AI avatar.**

## Primary buyer

**Enterprise CISO / Head of Information Security / Security Awareness Lead.**

Initial users are employees who can release money, credentials, or sensitive data:
- finance / accounts payable
- procurement
- executive assistants
- HR
- IT helpdesk
- managers with approval authority

This is deliberately **not** positioned first as a direct-to-consumer app. Enterprises already have recurring security-awareness budgets, measurable risk owners, and a reason to run training repeatedly.

## Problem

Traditional security-awareness programs are strong at teaching policies and simulating phishing. But impersonation fraud increasingly happens in real time: an apparently credible person appears on a call, invokes authority, creates urgency, and asks the employee to transfer money, reveal credentials, or bypass normal verification.

The failure is behavioral, not merely informational: employees may know the rule but fail to follow it while a convincing person is pressuring them.

## Solution

ScamShield is an embodied social-engineering rehearsal game built with Perxona Connect Kit.

A Perxona avatar claims an identity and applies controlled pressure. The learner must interrupt manipulation, leave the attacker's communication channel, independently verify identity, and refuse unsafe actions. The system records decisions and produces a Scam Immunity Score.

**We do not teach users to detect whether a face is fake. We teach them not to use appearance as authentication.**

## Why Perxona — 60%

The avatar itself is a game mechanic:

- `sv-presenter` makes the adversary person-like rather than a text prompt.
- `present()` adds speech and lip sync, creating time pressure and social presence.
- `playMotion()` turns body language into feedback when the player resists or complies.
- `interruptPresentation()` powers **BREAK THE SPELL**, where the player literally interrupts the simulated scammer.
- The player practices the exact skill at risk: maintaining verification discipline while another human-like agent is actively persuading them.

**Remove the avatar and the experience collapses into a knowledge quiz.**

## Why someone pays

The buyer is paying to reduce **human risk** around payment fraud, account takeover, social engineering, and executive impersonation.

The existing security-awareness software market already uses recurring per-employee SaaS pricing. ScamShield does not need to replace an incumbent awareness suite; the wedge is a **high-risk-role simulation module** for live impersonation scenarios that can sit beside existing phishing simulation and LMS programs.

Commercial model:
1. paid enterprise pilot for a high-risk cohort (for example finance + executive assistants),
2. annual per-seat subscription for scenario access and analytics,
3. premium organization-specific scenario packs based on the customer's approval workflows,
4. later LMS / SSO / SCORM integrations for enterprise rollout.

## Measurable ROI / proof

Do not promise that one training session prevents fraud. Measure behavior directly:

- unsafe-action rate before vs. after training
- percentage who independently verify through a trusted channel
- time-to-interrupt / time-to-break-the-spell
- OTP / credential disclosure rate in simulations
- payment-policy bypass rate
- repeat-session improvement
- completion and retention by role / team

For a pilot, success means reducing risky simulated behavior in the highest-risk roles.

## Competition

Do **not** claim existing platforms only send fake phishing emails. Modern security-awareness vendors already offer phishing simulation, training, analytics, and some callback-phishing capabilities.

ScamShield's differentiation is narrower and more defensible:

> **real-time embodied impersonation rehearsal, where the avatar's presence and interruption are part of the training behavior.**

We complement existing human-risk platforms rather than pretending the category does not exist.

## Secondary buyers / channels

1. **Banks and financial institutions** — customer-protection or employee-fraud training; attractive but slower procurement and harder consumer engagement, so not the first wedge.
2. **Cyber insurers / brokers** — potential channel partner to reduce social-engineering claim risk and encourage stronger verification controls.
3. **Universities** — useful pilot and research environment, but not the primary revenue engine.
4. **Government / anti-fraud programs** — meaningful public impact, but slow procurement; later distribution channel.
5. **Telecoms** — possible consumer-safety campaign partner, but not the initial buyer.

## Safety / anti-abuse

The deployed prototype is simulation-only:

- no real-person face or voice cloning
- no free-text scam-script generator
- no outbound phone / SMS / email / LINE capability
- no real OTP, bank credential, or payment-data collection
- avatar speech is restricted to reviewed educational scenario lines
- persistent simulation labeling

A static open-source prototype cannot prevent someone from forking and removing client-side guardrails. A production version moves scenario authorization, logging, rate limits, and abuse controls server-side.

## 5-minute live demo

**0:00–0:30 — Hook**

"Everyone knows they should verify an unusual payment request. But scams no longer just fake emails — they can fake people. The question is not whether you know the rule. It is whether you still follow it while a convincing person is pressuring you."

**0:30–2:20 — Play**

Run the simulation. Let the Perxona avatar claim an identity and create urgency. Use **BREAK THE SPELL** to interrupt it. Choose independent verification rather than trusting appearance, voice, or private information.

**2:20–3:00 — Result**

Show the Scam Immunity Score, captured red flags, and verification behavior.

**3:00–4:00 — Why Perxona**

"We did not put an avatar next to a quiz. The avatar is the pressure source, and interrupting the avatar is gameplay. Remove Perxona and the behavior we are training disappears."

**4:00–5:00 — Buyer / product path**

"Our first buyer is the enterprise security team. We start with finance, executive assistants, procurement and IT helpdesk — the people whose mistakes can release money, credentials or data. Existing awareness platforms prove there is already a recurring budget; we add embodied impersonation drills for the threat those tools do not fully rehearse."

## Tough-judge answers

### Who pays?
The CISO / security-awareness owner, from the existing employee security-training or human-risk budget.

### Why not consumers?
Consumers have the need but no clean recurring payer. Enterprises have a risk owner, budget, required participation, and measurable outcomes.

### Why not just use ChatGPT voice mode?
A generic voice assistant can role-play, but ScamShield maps avatar embodiment, visible reaction, interruption, scoring, safety-bounded scenarios, and enterprise measurement into one training product. The important distinction is the designed behavior loop, not simply generating dialogue.

### Why not just use KnowBe4 / another SAT platform?
We would integrate or coexist rather than replace it. The wedge is embodied real-time impersonation rehearsal for high-risk roles.

### Can you prove this prevents fraud?
Not from a hackathon prototype. We can prove whether training changes simulated verification behavior. A pilot would compare baseline and post-training unsafe-action rates and independent-verification rates.

### Can the avatar itself be abused for scams?
The deployed product does not expose free-form impersonation or outbound communication. It uses synthetic avatars and reviewed defensive scenarios. Production controls would be enforced server-side.

### Why now?
AI makes convincing impersonation cheaper while the defensive rule remains stable: never authenticate identity from appearance alone; independently verify through a trusted channel.

## Closing line

**Don't ask: “Does this person look real?” Ask: “Can I verify them through a channel I control?”**
