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

The identity-hijacking round is specifically designed around embodiment: a person-like caller claims to be someone the player trusts. The correct defense is to leave that channel and verify through a previously known contact path.

Remove the avatar and the experience collapses into a normal fraud quiz. With it, the player practices resisting a convincing person-like identity claim.

## Training rounds

1. **Authority + urgency** — fake institutional identity.
2. **Identity hijacking / AI impersonation** — a synthetic caller claims to be a trusted person and requests urgent help.
3. **OTP request** — authentication-code theft.
4. **"Safe account" + secrecy** — payment redirection and isolation.

No round uses a real person's likeness, voice clone, contact details, account numbers or live payment destination.

## Run

This folder is zero-build so it can run directly on GitHub Pages.

1. Open the deployed page.
2. Open the gear icon.
3. Paste a **Perxona Connect Publishable Key** (never a secret key).
4. The game validates the key, loads the first available avatar, scene, voice and motion catalog, and initializes `<sv-presenter>`.
5. The game cannot start until Perxona reports ready.

Perxona endpoints used:

- API: `https://console.perxona.ai/asia`
- Presenter SDK: `https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js`

Add the GitHub Pages origin to the publishable key's allowed domains.

## Anti-abuse design

The deployed prototype is defensive by construction:

- Avatar speech is limited to `APPROVED_SIMULATION_LINES`, generated from the reviewed training rounds.
- There is **no free-text scam-script generator**.
- There is no real-person face upload, voice cloning or impersonation workflow.
- There is no telephone, LINE, SMS, email or other outbound-contact capability.
- There is no payment, bank-account, QR-code or real OTP input path.
- Every scenario ends by teaching independent verification, not better persuasion.
- The page is visibly labeled **SIMULATION ONLY · SYNTHETIC AVATAR**.

### Threat-model limitation

This is an open-source static hackathon prototype. Client-side guardrails protect the deployed product flow, but they cannot stop somebody from forking the source and deliberately deleting those guardrails. A production version should enforce scenario allowlists, authorization, audit logging, rate limits and abuse detection server-side.

## 60-second judging explanation

**Problem:** Traditional anti-fraud education teaches red flags as information, while real scams exploit trust under pressure and increasingly impersonate trusted identities.

**Why Perxona:** We do not put an avatar next to a quiz. The avatar is the claimed identity and the social pressure. Players can literally interrupt it, observe its reaction, and practice switching to an independent verification channel.

**Safety:** We simulate identity manipulation without providing identity-cloning or outbound-attack capabilities.

Built from the integration patterns in `XRSPACE-Inc/perxona-connect-kit`.