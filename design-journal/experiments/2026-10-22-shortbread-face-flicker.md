---
id: experiment-2026-10-22-shortbread-face-flicker
type: experiment
date: 2026-10-22
summary: Two attempts to stop Shortbread's face flickering, why the first missed, and why the fix could not be seen in testing.
tags: [pet, webgl, z-fighting, testing]
status: inconclusive
related: [decision-004-white-geist-pet, logbook-2026-10-21, logbook-2026-10-22]
---

# Stopping Shortbread's face from flickering

Work done on 21 October 2026.

## Hypothesis

Jason: "shortbread is glitching, his face is glitching". The eyes, cheeks, nose and pale snout sit almost exactly on the surface of the head. On a real graphics card the computer cannot tell which surface is in front, so they flicker as the head moves. This is called z-fighting. Pushing the head back slightly in depth should stop it.

## Approach

1. In `src/features/shortbread-pet.js`, drew the head and the snout a little further back (WebGL polygon offset 1.5, 4). Narrowed the camera's depth range from 0.1–40 to 4–12, which makes depth five times more precise. Saved the old file as `artefacts/2026-10-21-shortbread-pet-before.js`.
2. Jason's screenshot, taken after step 1, still showed flicker on the upper cheek below the eye. The head and snout had been pushed back by the same amount, so they still fought each other. Pushed the head back twice as far as the snout (3, 8 against 1.5, 4).

## Result

Not confirmed. Claude's test browser draws graphics in software, and the face looked steady there even before any fix. Jason did not report back after the second change. Sanctum has the same pet file and was not changed.

## Conclusion

- Give each layer of overlapping surfaces its own depth offset. One shared offset for two surfaces fixes nothing between them.
- A software-rendered test browser cannot reproduce z-fighting. Only a screenshot from a real screen confirms the fix.
