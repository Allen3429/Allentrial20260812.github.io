# ScamShield — AI Scam Immunity Lab

Perxona Taipei Hackathon web game. ScamShield turns a **Perxona Connect Kit AI Avatar** into a simulated social-engineering opponent so players can practice staying safe **under interpersonal pressure**, not just memorize scam facts.

## Why Perxona

The avatar is not decoration. It is the pressure source and feedback surface:

- `<sv-presenter>` renders the live 3D character.
- `present()` delivers reviewed scam-pressure dialogue with speech + lip sync.
- `playMotion()` maps the simulated scammer's reaction into visible body language.
- `interruptPresentation()` powers **BREAK THE SPELL**, a gameplay mechanic where the player interrupts the scammer the moment they detect manipulation.
- Avatar / scene / voice / motion catalogs are loaded from the Perxona Connect API using a **publishable Connect key**.

Remove the avatar and ScamShield collapses into a multiple-choice quiz; with the avatar it becomes rehearsal for resisting pressure from a person-like agent.

## Connect Kit requirement

The hackathon build is intentionally **Perxona-required**. The core game stays locked until all of the following succeed:

1. Presenter SDK loads.
2. The supplied key can read the Connect avatar / scene / voice catalogs.
3. A target avatar, scene and voice resolve.
4. `<sv-presenter>` initializes with `initializeWithConnectKey(...)`.

Only then does the Start button unlock and show **Perxona ready**.

### Run

This folder is zero-build so it can run directly on GitHub Pages.

1. Open the deployed page.
2. Open the gear icon if the status is not `Perxona ready`.
3. Paste a **Publishable Connect Key** — never a secret key.
4. The app loads the first available avatar, scene, voice and that avatar's motion catalog.
5. Add the GitHub Pages origin to the publishable key's allowed domains in Perxona Console.

The page also tries the public Perxona key already present on the parent site. If that older key is not a Connect publishable key, it is rejected and the setup panel asks for the Hackathon Connect key instead.

### Perxona endpoints

- API: `https://console.perxona.ai/asia`
- Presenter SDK: `https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js`

## Anti-abuse design

ScamShield is built to **simulate manipulation without operationalizing it**.

The deployed app:

- has **no free-text scam-script generator**;
- only allows Perxona to speak an allowlist of reviewed defensive-training lines;
- has no feature for calling, SMS, LINE, email, social posting, phishing-page generation, QR/payment-link generation, or contacting a third party;
- never asks for or stores a real OTP, password, card number, bank account, identity number, or victim data;
- uses fictional / generic scenarios rather than impersonating a real individual;
- teaches independent verification, refusing OTP disclosure, refusing "safe account" transfers, and breaking secrecy / urgency pressure;
- visibly labels the experience **SIMULATION ONLY**.

`app.js` enforces an `APPROVED_SIMULATION_LINES` allowlist before any gameplay text is sent to `presenter.present()`. A non-whitelisted presentation request trips the local safety boundary instead.

### Important limitation

This is a static open-source Hackathon prototype. Client-side controls prevent misuse **through the deployed ScamShield UI**, but they cannot stop a malicious person from forking the repository and deleting client-side checks. A production version should move scenario authorization, audit logging, rate limits, abuse detection and content signing to a controlled backend. We do not claim that open-source JavaScript can make a malicious fork impossible.

## Hackathon demo flow

1. Confirm the header says **Perxona ready**.
2. Start Case 01.
3. Let the avatar create urgency.
4. Hit **BREAK THE SPELL** mid-sentence to trigger `interruptPresentation()`.
5. Choose the official-channel verification option and watch the avatar react with a motion.
6. Continue through OTP and safe-account rounds.
7. Show the Scam Immunity Score and captured red flags.
8. Open **為什麼一定要 Avatar？** for the 60% WHY PERXONA judging criterion.

Built from the integration patterns in `XRSPACE-Inc/perxona-connect-kit`.
