# ScamShield — AI Scam Immunity Lab

Perxona Taipei Hackathon web game. ScamShield turns a Perxona AI Avatar into a simulated social-engineering opponent so players can practice staying safe **under interpersonal pressure**, not just memorize scam facts.

## Why Perxona

The avatar is not decoration. It is the pressure source and feedback surface:

- `sv-presenter` renders the live 3D character.
- `present()` delivers scam-pressure dialogue with speech + lip sync.
- `playMotion()` maps the scammer's reaction into visible body language.
- `interruptPresentation()` powers **BREAK THE SPELL**, a gameplay mechanic where the player interrupts the scammer the moment they detect manipulation.
- Avatar / scene / voice / motion catalogs are loaded from the Perxona Connect API using a **publishable** Connect key.

Remove the avatar and ScamShield collapses into a multiple-choice quiz; with the avatar it becomes rehearsal for resisting pressure from a person-like agent.

## Run

This folder is intentionally zero-build so it can run directly on GitHub Pages.

1. Open `index.html` through an HTTP server / GitHub Pages.
2. Open the gear icon.
3. Paste a **Publishable Connect Key** (never a secret key).
4. The game loads the first available avatar, scene, voice and that avatar's motion catalog.

The page also attempts to reuse a public Perxona key already embedded in the parent site's `../index.html`; if that key is not a Connect publishable key, the setup dialog remains available.

### Perxona configuration

- API: `https://console.perxona.ai/asia`
- Presenter SDK: `https://cdn.perxona.ai/asia/prod/latest/widget/entry/presenter.js`
- Add the GitHub Pages origin to the publishable key's allowed domains.

## Safety design

All scam content is defensive simulation. The game never asks the player to enter real OTPs, bank details, passwords, or personal data. The safe actions emphasize independent verification, never sharing authentication codes, and refusing transfers to so-called "safe accounts".

## Hackathon demo flow

1. Start Case 01.
2. Let the avatar create urgency.
3. Hit **BREAK THE SPELL** mid-sentence to interrupt the avatar.
4. Choose a response and watch the avatar react.
5. Finish three rounds and show the Scam Immunity Score.
6. Open "為什麼一定要 Avatar？" for the 60% WHY PERXONA judging criterion.

Built from the integration patterns documented in `XRSPACE-Inc/perxona-connect-kit`.
