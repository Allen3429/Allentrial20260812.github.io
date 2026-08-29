# ScamShield — submission copy

## One-liner

**AI is making scams more convincing. ScamShield uses an AI avatar to make people harder to scam.**

## Problem

Most anti-fraud education teaches people what scam red flags *look like* on a slide. Real scams happen under social pressure: an apparently credible person is looking at you, talking fast, invoking authority, creating urgency and asking you to act before you verify.

## Solution

ScamShield is a browser game where a Perxona avatar plays a **clearly labeled simulated scammer**. Players practice interrupting manipulation and choosing safe actions in a simulated video call. The game scores both knowledge and the ability to break the scammer's conversational control.

## Why Perxona

The avatar itself is a game mechanic:

- Speech + lip sync create person-like pressure.
- Motion communicates escalating pressure and reaction.
- `interruptPresentation()` lets the player literally interrupt the scammer using **BREAK THE SPELL**.
- The avatar reacts after safe / unsafe decisions.
- The game will not start until a real Perxona Connect avatar / scene / voice target is initialized.

**If you remove the avatar, the core training experience disappears and becomes a normal quiz.**

## Safety by design

**We simulate manipulation without operationalizing it.**

The deployed product has no user-generated scam script, no victim targeting, no outbound phone/message/email capability, no payment links, and no real OTP/banking fields. Perxona can only speak pre-reviewed defensive-simulation lines from a local allowlist.

For production, the same allowlist and audit controls would move server-side. Because this Hackathon version is open-source client JavaScript, we do not pretend a malicious fork is technically impossible; what we guarantee is that the deployed ScamShield product itself does not expose an offensive workflow.

## 5-minute live demo

**0:00–0:30 — Hook**

"Everyone knows you should not give scammers your OTP. But knowing that in a classroom and remembering it while a convincing person is pressuring you are two different skills."

**0:30–0:45 — Prove Perxona**

Point to the green **Perxona ready** badge.

"This is not an avatar mockup. The game is locked until Perxona Connect Kit resolves a real avatar, scene and voice."

**0:45–2:30 — Play**

Run Case 01. Let the avatar speak. Interrupt on the urgency line using **BREAK THE SPELL**. Choose the official-channel verification option and show the avatar's reaction. Continue to OTP and safe-account rounds.

**2:30–3:10 — Result**

Show the Scam Immunity Score and captured red flags.

**3:10–4:05 — Why Perxona**

"We did not put an avatar next to a quiz. The avatar is the pressure source, and interrupting the avatar is gameplay. Remove Perxona and the product loses the behavior we are training."

**4:05–4:35 — Safety**

"The obvious risk is that a scam simulator could become a scam tool. So ScamShield is simulation-only by design: no free prompt, no victim targeting, no outbound messages, and only reviewed training dialogue may reach the avatar."

**4:35–5:00 — Product path**

Daily 2-minute scam drills: student scams, family-emergency impersonation, investment fraud and enterprise social engineering. Schools, banks and employers can deploy reviewed scenario packs to populations they need to protect.

## Likely judge Q&A

### Q: Couldn't this be used to teach people how to scam?

**Answer:**
"That is exactly why we separated *simulation* from *operational capability*. ScamShield exposes no free-form scam generation, no victim targeting, no external communication, and no real payment or credential flow. The avatar only performs pre-reviewed defensive scenarios. In production we would enforce those scenario permissions server-side with audit logs and abuse monitoring."

### Q: Why not just use ChatGPT or a quiz?

**Answer:**
"Because the failure mode we train is not lack of knowledge. It is losing judgment under interpersonal pressure. Perxona gives us an embodied pressure source, visible reactions, speech and an interruptible person-like agent. BREAK THE SPELL literally calls the presenter interruption API, so embodiment is part of the game mechanic."

### Q: What happens if Perxona is removed?

**Answer:**
"Then ScamShield becomes a multiple-choice worksheet. The core rehearsal — staying calm while a person-like agent is pressuring you and actively interrupting that agent — disappears."

## Judging map

- **Product value (30%)**: fraud prevention, clear users, repeatable scenario packs, institutional distribution.
- **Why Perxona (60%)**: embodiment creates pressure; motion is feedback; interrupting presenter is gameplay; removing avatar breaks the core experience.
- **Demo/story (10%)**: understandable in seconds, interactive live moment, visible before/after behavior, and a clear safety answer.
