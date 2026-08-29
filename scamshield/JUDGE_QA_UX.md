# ScamShield — UX rationale for strict judges

## Why isn't the scammer designed as an obviously evil villain?

Because a visibly evil character would make the exercise easier but less realistic. Impersonation fraud works because the caller appears credible, familiar, professional or helpful.

The design target is therefore:

- **not cute or childish** — prefer a realistic adult / professional Perxona avatar;
- **not a cartoon villain** — the player must resist a person who still looks plausible;
- **threatening through behavior** — urgency, secrecy, authority, interruption and time pressure create the danger.

Pitch answer:

> We do not teach people to avoid scary-looking strangers. We train them to verify credible-looking people under pressure.

## How does the experience create pressure?

The high-pressure layer adds:

1. shorter, more abrupt reviewed dialogue;
2. an unverified-caller HUD;
3. a visible countdown tied to each manipulation tactic;
4. call tones and escalating ticks;
5. a red pressure vignette and restrained screen movement;
6. the ability to interrupt the avatar mid-speech;
7. immediate safe / risky decision feedback.

The fear should come from losing control of the interaction, not from horror styling.

## Why is the avatar still central?

The player is not only selecting an answer. They must act while a person-like agent is talking, moving, claiming an identity and imposing a deadline. `interruptPresentation()` turns the social boundary — ending the caller's control — into an observable game action.

Remove the avatar and these mechanics collapse into a timed multiple-choice quiz.

## Speech-speed limitation

The public Connect Kit sample exposes target selection, `present()`, motions and interruption, but does not document a speaking-rate parameter. The prototype therefore does not pretend to offer a native speed slider. It improves urgency by:

- selecting a more serious Mandarin / adult voice when the catalog metadata allows it;
- replacing long polite scripts with shorter approved pressure lines;
- combining speech with visual and audio time pressure.

This is a deliberate, supportable implementation rather than claiming an SDK capability that was not demonstrated.

## Demo line

> The avatar should not look evil. It should look believable. The interface tells you the identity is unverified, while the avatar tries to make you forget that fact.
