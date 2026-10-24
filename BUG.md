# BUG — bugs discovered outside the original phase scope

> Single file for every bug surfaced **after** the phase it was meant to be
> in. Each entry has: **description** (symptom), **cause** (root),
> **effect** (user/system impact). Listed in reverse-chronological order
> (most recent first).
>
> **UV-NNN series**: heuristic-evaluation findings from FASE_1.5. Severity on
> Nielsen 0–4 scale (0 cosmetic → 4 catastrophic). Heuristics cited are
> Nielsen's 10 + Don Norman principles (M = mapping, A = affordance,
> S = signifier, F = feedback). Heuristic eval ≈ 60 % of user cold-test
> bugs — not a substitute.

---

## UV-007 — Tab cycle is silent (no feedback) — Severity 1, Heuristic H1 (visibility) + Norman F

**Description**: Pressing Tab (or Shift+Tab) cycles songs + timbres but
the UI shows no toast, status text, or counter. The user cannot tell
that anything happened. Only the next keypress would surface a changed
song because the note labels shift.

**Cause**: `Play.tsx:87` (`case 'Tab'`) calls `transport.cycleNext()` +
`transport.timbreCycleNext()` without dispatching a UI notification.
StatusLine only fires on hit/miss, not on song change.

**Effect**: Cold user thinks "is this app even responsive?" — no feedback
that the input was registered. Disorienting for keyboard-first flow.

**Fix**: Emit a `statusLineSlice` toast (`"Song: <title> · <timbre>"`) on
every cycle. Cheapest: dispatch a one-shot `setStatusText` action with the
same fade-out timer as practice messages. File: `Play.tsx:87-98` +
`StatusLine.tsx`.

---

## UV-006 — Counter overlaps first piano key at narrow widths — Severity 2, Heuristic H8 (aesthetic)

**Description**: At 1024×600 the `.counters` element (fixed
`bottom: 0.6rem; left: 0.75rem`) overlaps the bottom-left piano key label
(Z), making both hard to read.

**Cause**: `StatusLine.module.css:36-48` positions counters absolutely at
the same anchor as the piano's first column. No responsive stacking.

**Effect**: Stats overlap musical UI → cognitive conflict, user has to
guess what the overlapping glyph is.

**Fix**: In `@media (max-width: 1024px)` either (a) hide counters in
practice mode (they're transient anyway) or (b) shift them above the
piano row via `bottom: calc(3 * 3rem + 0.4rem)` (piano height + gap).

---

## UV-005 — `F` key handled as piano but routed through switch fall-through — Severity 1, Heuristic H4 (consistency)

**Description**: `F` / `f` is documented as F#4 piano key (modifier `\`)
but the keypress handler reaches `noteOn(event.key)` only by `break`-ing
out of the transport switch. The code path is non-obvious.

**Cause**: `Play.tsx:119-125` comments say "F is the F#4 black-row piano
key" then `break`. Future maintainers will think `F` was supposed to do
something and add a transport shortcut, duplicating the BUG-045 class
of bug.

**Effect**: Risk of regression (L-key style hijack) — low impact today,
high maintainability cost tomorrow.

**Fix**: Move the `F` / `N` cases into a typed "non-transport, piano-only"
constant set (`NON_TRANSPORT_PIANO_KEYS = new Set(['f', 'F', 'n', 'N'])`)
and short-circuit via membership check before the switch. File:
`Play.tsx:65-184`.

---

## UV-004 — Portrait notice active at landscape 800×600 — Severity 3, Heuristic H2 (match system ↔ real world)

**Description**: At 800×600 (clearly landscape, width > height), the
"rotate device" overlay is visible. Tested via Playwright `viewport`.

**Cause**: `Play.module.css:65-69` `@media (orientation: portrait)` rule
and `Play.tsx:216` `window.matchMedia('(orientation: portrait)')` query.
matchMedia's portrait query in some browsers (incl. Chromium headless
pre-2024) is true when both width AND height are below 600 px,
treating square-ish viewports as portrait. The 800×600 viewport triggers
this false positive (likely because internal `device-width` meta is
missing → matchMedia defaults).

**Effect**: User on landscape laptop is told to rotate → blocks all
interaction. Critical P0.

**Fix**: Combine orientation with explicit width check:
`window.matchMedia('(orientation: portrait) and (max-width: 1024px)')`.
File: `Play.tsx:216`. Also remove the unconditional
`@media (orientation: portrait)` in `Play.module.css:65-69` — replace
with `(orientation: portrait) and (max-width: 1024px)`.

---

## UV-003 — Bottom piano row clipped at 1280×720 — Severity 3, Heuristic H8 (aesthetic) + Norman M (mapping)

**Description**: At 1280×720 the Z-M bottom row of the keyboard is
partially below the viewport. Users cannot see the key labels they need.

**Cause**: 3 rows × 3.5rem = 10.5rem + gap (3 × 0.4rem = 1.2rem) +
padding (0.5+0.75 = 1.25rem) = ~13rem ≈ 208 px. 720 − chrome (status
bar, fixed counters/tempo, notation lane, falling-notes lane) leaves
≈ 200 px → bottom row lives in the overflow.

**Effect**: Z-M keys invisible → user can't tell which key they're about
to play → defeats practice loop.

**Fix**: Cap row count at 2 (octaves 4 + 5) or shrink to 2.5rem globally
and 2rem under 1024 px. Cheapest: change `.row { height: 2.5rem }` as
default, keep 3.5rem at ≥ 1440 px. File: `VisualPiano.module.css:12-35`.

---

## UV-002 — LoopIndicator shows wall-clock elapsed (309.6 s) instead of 0 s — Severity 4, Heuristic H1 (visibility) + H9 (recover from errors)

**Description**: LoopIndicator displays `309.6` (5 minutes since dev
server start) instead of the song-relative position. After pressing
`[` (LoopIn) then `]` (LoopOut) the indicator reads nonsense numbers.

**Cause**: `SongTransport.ts:107-114` (`getCurrentPositionSeconds`)
returns `transport.seconds` which is the wall-clock seconds since
`Tone.Transport.start()` was first called, NOT the song position. When
the transport has been started (and possibly stopped/started multiple
times) the value keeps accumulating. LoopIndicator
(`LoopIndicator.tsx`) consumes this and shows the wrong number.

**Effect**: User marks LoopIn at the start of the song → reads "309 s" →
no way to know which point in the song that is → loop region is
useless.

**Fix**: Compute position from the song-relative cursor: store
`startedAtSeconds` at each `play()`, then return
`transport.seconds - startedAtSeconds`. Reset on `stop()` /
`jumpTo(0)`. File: `SongTransport.ts:107-114`. Alternatively, use
`transport.position` (string "bars:beats:sixteenths") and convert via
`Tone.Time(transport.position).toSeconds()`.

---

## UV-001 — Falling notes never render — BUG-013 regression — Severity 4, Heuristic H1 (visibility) + H3 (user control)

**Description**: After unlock + Enter, the falling-notes lane stays empty
("Press Enter to start playback." copy never goes away; even after
multiple Enter presses, the canvas has 0 note children). Audio plays
correctly when keys are pressed.

**Cause**: `useTransportClock.ts:40-53` (`readCurrentTime`) returns
`null` unless `transport.state === 'started'`. Tone.js `Transport.state`
flips back to `'stopped'` after the song completes one full pass.
`FallingNotes.tsx:268-276` short-circuits when `currentTime === null`
and shows the empty-state copy. The original BUG-013 fix was correct but
its rAF loop can race with Tone.js state transitions: when transport
goes `'started' → 'stopped'` (auto at song end) or
`'started' → 'paused'` (on Escape), `isRunning()` returns false and
`currentTime` becomes null. Once null, `noteOn` still fires audio but
the canvas never recovers until the user reloads the page.

**Effect**: Core feature broken — no falling notes, no pre-roll
countdown, no loop feedback. P0.

**Fix**: Track position via an offset captured at the rAF tick when
`isRunning()` last returned true; when stopped/paused, freeze at the
last value (don't null it). Concretely, replace the `null` branch in
`useTransportClock.ts:43` with a sticky last-known value:

```ts
let lastKnown = 0
if (transport.state !== 'started') return lastKnown // don't null
lastKnown = secondsLike.seconds ?? transport.currentTime ?? lastKnown
return lastKnown
```

File: `useTransportClock.ts:40-53`. Also relax
`FallingNotes.tsx:268` to only show empty-state when `running === false`
AND we have never observed a `currentTime`.

---

## BUG-046 — Split each row 4+3 with a visual gap; Y/H/B in the gap (user's plan)

**Description**: User reported: "en la mano izq tengo 3 ultimas columnas, pero la mano derecha tiene qe irse 1 espacio a la izquierda" then clarified "W-T y luego U-O". The final plan: each row split into LEFT (4 keys, lower octave half) + RIGHT (3 keys, upper octave half) with the middle key (Y, H, B) sitting in the gap and not mapped.

**Cause**: User wants to play 4 columns with the left hand and 3 with the right. The natural octave split (C D E F | G A B) lets the left hand cover the lower half and the right hand the upper half.

**Effect**: Each row plays exactly one octave (C..B) with a clear visual hand separation. Y, H, B are no longer mapped — they live in the visual gap between the two halves.

**Fix** (1 file):

- `rowKeys.ts`: each row is now 4 left + 3 right with the middle key omitted.
  - Top row: LEFT `['w','e','r','t']` → C5,D5,E5,F5 | RIGHT `['u','i','o']` → G5,A5,B5
  - Home row: LEFT `['s','d','f','g']` → C4,D4,E4,F4 | RIGHT `['j','k','l']` → G4,A4,B4
  - Bottom row: LEFT `['z','x','c','v']` → C3,D3,E3,F3 | RIGHT `['n','m',',']` → G3,A3,B3

**Visual rendering**: per user request, NO visual changes were made to the keyboard layout — keys are still rendered flush left to right. The user opted to keep the visual presentation flat and rely on mental mapping for the gap.

---

## BUG-045 — L key triggered transport action instead of playing a note

**Description**: After BUG-044 shifted the home row to D-L, user reported: "algo esta mal no funciona la L". Pressing L toggled the loop instead of triggering a B4 note.

**Cause**: `Play.tsx` had a `case 'l': case 'L':` that called `transport.toggleLoop()` and `preventDefault()`. After the layout shift, L became a piano key (B4 in home row), so it was being consumed by the loop shortcut before reaching the note handler.

**Fix** (1 file):

- `Play.tsx`: removed the `case 'l': case 'L':` block. L now falls through to `noteOn` and plays B4.

Loop toggle no longer has a keyboard shortcut. Can be re-bound to a non-piano key if needed in a future iteration.

---

## BUG-044 — Layout shifted another step to the right (one more from BUG-043)

**Description**: User: "movamosle uno mas a la derecha". Top row shifted from W-I to E-O. Home row shifted from S-K to D-L. Bottom row shifted from Z-M to X-comma.

**Cause**: Continuation of BUG-043's rightward shift. The user keeps moving the layout right to find their preferred hand positioning.

**Fix** (1 file):

- `rowKeys.ts`: arrays updated.
  - Top row: `['e','r','t','y','u','i','o']` → C5..B5
  - Home row: `['d','f','g','h','j','k','l']` → C4..B4
  - Bottom row: `['x','c','v','b','n','m',',']` → C3..B3

Tests updated across `LayoutEngine.test.ts`, `VisualPiano.test.tsx`, `FallingNotes.test.ts`, `useQwertyInput.test.tsx`.

---

## BUG-043 — Layout shifted one step to the right (Q→W on top, A→S on home)

**Description**: User: "vamos un paso a la derecha el layout ok? en ves de partir con la Q que sea con la W y la segunda envesde A qe sea S". Wanted the layout to start one QWERTY position to the right.

**Fix** (1 file):

- `rowKeys.ts`: arrays updated.
  - Top row: `['w','e','r','t','y','u','i']` → C5..B5
  - Home row: `['s','d','f','g','h','j','k']` → C4..B4
  - Bottom row: `['z','x','c','v','b','n','m']` → C3..B3 (unchanged)

Tests updated across `LayoutEngine.test.ts`, `VisualPiano.test.tsx`, `FallingNotes.test.ts`, `useQwertyInput.test.tsx`.

Also introduced `src/layout/rowKeys.ts` as the single source of truth (per CLAUDE.md §2 SSOT) for all 3 rows, eliminating the duplicate key arrays in `SynthesiaClassicLayout.ts` and `VisualPiano.tsx`.

---

## BUG-042 — "Mejor 5 segundos minimo" — pre-roll bumped to 5s

**Description**: After BUG-041 set pre-roll to 3s, user said: "mejor 5 segundos minimo". 3 seconds wasn't enough.

**Fix** (3 files):

- `FallingNotes.constants.ts`: `FALLING_NOTES_PRE_ROLL_SECONDS = 5` (was 3). `LOOK_AHEAD_SECONDS = 4` (was 3.5).
- `SongTransport.ts`: `PRE_ROLL_SECONDS = 5` to match visual offset.
- Tests updated in `SongTransport.test.ts` for the new pre-roll offset.

User now sees: countdown 5 → 4 → 3 → 2 → 1 → GO over 5 seconds, with notes streaming in from the middle of the canvas.

---

## BUG-041 — User wants 3-second preparation; notes still "appear all at once" at top of canvas

**Description**: After BUG-039's opacity gradient (notes dim at top, bright at hit line) and BUG-040's bigger notes, user reported: "no veo qe de arriba bjan apareciendo las notas sino qe aparecieron x cantidad aca y simplmenete me debo prearar en 3 segundos". Even with the gradient, notes in the top half of the canvas were still rendered with low opacity (0.25) — visible enough to confuse the user. User wanted notes to appear only in the bottom half of the canvas and have exactly 3 seconds of countdown.

**Cause**: BUG-039's fade-in went from 0.25 at top to 1.0 at hit line — notes at the top were still visible (just dim). With LOOK_AHEAD=4, the top half of the canvas held 2 seconds of song worth of notes all rendered.

**Fix** (3 files):

- `FallingNotes.constants.ts`: PRE_ROLL_SECONDS 2 → 3 (gives the countdown 3, 2, 1, GO). LOOK_AHEAD_SECONDS 4 → 3.5 (slightly tighter window).
- `SongTransport.ts`: PRE_ROLL_SECONDS 2 → 3 to match visual offset.
- `FallingNotes.tsx`: opacity gradient made aggressive — `Math.max(0, Math.min(1, (LOOK_AHEAD_SECONDS - delta) / (LOOK_AHEAD_SECONDS / 2)))`. Notes in the top half (delta > LOOK_AHEAD/2) are completely invisible. Only notes in the bottom half have any opacity. Notes fade in at the canvas middle, not the top.

User now sees: countdown 3 → 2 → 1 → GO over 3 seconds, with notes only streaming in from the middle of the canvas (not stacked at the top). The visible window is still LOOK_AHEAD_SECONDS wide; the user just doesn't see notes until they've crossed halfway down.

Tests updated: `SongTransport.test.ts` expectations bumped by +1 for the new PRE_ROLL_SECONDS=3.

---

## BUG-040 — Notes too small to read; letter labels cramped

**Description**: User reported: "las notas deberian ser mas grandes o no?" Notes were 4% width × 0.85rem height with 0.6rem font labels — too small to see clearly or read the letter inside. Each piano key is ~14% wide, so notes were less than 1/3 the width of the key they target.

**Fix** (2 files):

- `FallingNotes.module.css`: `.note` width `4%` → `8%`, height `0.85rem` → `1.4rem`, border-radius `0.3rem` → `0.4rem`. `.label` font `0.6rem` → `0.85rem`.
- `FallingNotes.tsx`: removed the inline `width: '4%'` style (CSS module now owns sizing).

Notes are now roughly half a key wide and 1.4rem tall — clearly visible from a normal viewing distance, with readable letter labels.

---

## BUG-039 — Notes don't visually "stream in" from above; they all appear at once at full opacity

**Description**: After BUG-038's countdown overlay, user still complained: "no aparecen desde arriba osea spawnearn varian al mismo tiempo no hay algo como qe aparescan de a poco". Even with the countdown, all notes within the look-ahead window were visible at full opacity as soon as Enter was pressed. User wanted notes to visibly spawn from above one at a time.

**Cause**: All notes within the `LOOK_AHEAD_SECONDS` window were rendered at full opacity immediately. Notes that just entered the window (delta ≈ LOOK_AHEAD, at the top of canvas) had the same opacity as notes near the hit line. No visual cue distinguished "newly spawned" from "almost ready to play".

**Effect**: User can't visually track when each note enters the lane. The whole upcoming stream feels like it materializes at once.

**Fix** (1 file):

- `FallingNotes.tsx`: per-note opacity gradient based on delta. A note at delta = LOOK_AHEAD_SECONDS (just spawning at the top) starts at opacity 0.25; full opacity (1.0) by the time it reaches the hit line. Formula: `opacity = 0.25 + (1 - delta / LOOK_AHEAD_SECONDS) * 0.75` for in-range notes; out-of-range keeps the existing 0.45 from BUG-034.

Now new notes spawn dimly at the top, brighten as they fall, and hit the line at full opacity — a clear "streaming in from above" visual.

---

## BUG-038 — Pressing Enter shows all upcoming notes "at once"; user can't prepare

**Description**: After BUG-035's pre-roll + BUG-035b's dynamic scaling, user reported: "apenas presione el boton de entender aparecer asi, es imposible preparme porqe no aparecen de 1 sino qe aprecen de golpe muchas vez". Pressing Enter immediately shows ~8-10 falling notes at different heights in the canvas. The user wanted notes to appear ONE BY ONE as the music progresses, not all stacked at once.

**Cause**: The pre-roll window (2s) + look-ahead window (4s) together mean 4 seconds of song are visible at any time. For a song at 140 BPM with notes every ~0.5s, that's ~8 notes rendered immediately. The user perceives them as "appearing all at once" because they were already on screen before they had time to read them.

**Effect**: The pre-roll fails its goal — user wanted time to prepare, but the visual is already crowded at Enter-press.

**Fix** (2 files):

- `FallingNotes.module.css`: added `.countdown` + `.countdownNumber` with a 1s pop animation. Big 8rem centered number with white glow.
- `FallingNotes.tsx`: when `currentTime < PRE_ROLL_SECONDS`, render a centered countdown overlay ("3", "2", "1", then "GO" in the last second). Notes still fall behind the overlay so the user can see them streaming in, but the big number anchors their attention and signals "music hasn't started yet". Once pre-roll ends, the overlay vanishes and only the notes remain.

The countdown is keyed by its label so React re-mounts it each second, replaying the pop animation. `aria-live="polite"` so screen readers announce each countdown step.

---

## BUG-037 — "No tengo capacidad de saber la nota que cae a cual de los 3 items corresponde" (3-row piano ambiguity)

**Description**: After BUG-036 expanded the piano to 3 rows (Q-U top, A-J home, Z-M bottom), user reported: "no tiene sentido no tengo capacidad de saber la nota qe cae a cual de los 3 items corresponde". Falling notes at the same horizontal column from different octaves looked identical — user couldn't tell whether a note at column 5 was T (top), G (home), or B (bottom).

**Cause**: The 3-octave layout shares horizontal positions across octaves. C3 lands at 0%, C4 lands at 0%, C5 lands at 0% — all visually on top of each other until they reach the keyboard. The user only sees one falling note per column and has no way to know which of the 3 rows it belongs to.

**Effect**: Core gameplay broken — user can't map a falling note to a specific QWERTY key before it hits the line.

**Fix** (2 files):

- `FallingNotes.tsx`: each note now renders the QWERTY key letter inside it (e.g., "Q", "A", "Z"). User sees the letter and knows which key to press.
- `FallingNotes.tsx`: vertical offset per octave — octave 5 notes sit 24px above their computed Y, octave 3 sits 24px below, octave 4 stays centered. Notes for different rows no longer visually merge at the same column.
- `FallingNotes.module.css`: `.note` now uses `display: flex` to center a small label inside; width bumped 3% → 4% to fit text.

All 3 octaves still converge at the same hit line — the offset is purely visual during the fall so the user can distinguish rows.

---

## BUG-036 — Upgrade VisualPiano to 3 rows (Q-U + A-J + Z-M)

**Description**: User reversed the BUG-027 cap: "subamosle 1 row quiero qe la priema linea sea qwerty y no asdfgh". Wanted a third row above the current home row mapping QWERTY letter row.

**Cause**: 2 octaves wasn't enough to cover Mega Man 1, Zelda, FF Prelude, and other catalog songs. The 2-row cap forced BUG-029 / BUG-034 to keep octave-5+ notes visually suppressed with dashed borders. User now accepts the cognitive cost of a 3rd row in exchange for octave 5 playability.

**Effect**: Playable range expanded from C3-B4 (24 semitones) to C3-B5 (36 semitones). Mega Man 1, Greensleeves, FF Prelude playable. Songs needing octave 6+ still deferred.

**Fix** (4 files):

- `SynthesiaClassicLayout.ts`: added `topRow = ['q', 'w', 'e', 'r', 't', 'y', 'u']` mapping octave 5 (C5-B5). Removed black-key row because W/E/T/Y/U were the previous octave-4 black-overlay positions and are now octave-5 whites.
- `VisualPiano.tsx`: 3 rows (top, home, bottom). 21 white keys total. No black-key overlay.
- `FallingNotes.tsx`: WHITE_OFFSETS extended with octave-5 entries (72, 74, 76, 77, 79, 81, 83). `isPitchInRange` raised to `pitch >= 48 && pitch <= 83`.
- Tests updated: `LayoutEngine.test.ts` (Q→C5, etc.), `VisualPiano.test.tsx` (3 rows, 21 labels), `FallingNotes.test.ts` (range 48..83).

**Trade-off accepted**: Lose octave-4 black keys. Octave 3 still has no black keys. Future option: add number-row black keys (2/3/5/6/7 → C#/D#/F#/G#/A#).

---

## BUG-035 — Pressing Enter starts music within ~1s, no time to prepare; lane only uses ~1/3 of vertical space

**Description**: User reported after the Mega Man 1 default: "cuando presiono enter pasa 1 seg como maximo y comienza la musica no me deja ver realmente como cae las notas no me deja prepararme y ademas no usa todo el alto disponible". Two distinct complaints:

1. Audio starts almost immediately after pressing Enter — user has no time to see how notes fall or to get their hands ready.
2. The FallingNotes lane only occupies the bottom ~1/3 of the viewport. The top 2/3 is empty space. Notes are clustered close to the hit line; the user can't see notes far in advance.

**Cause**:

1. `SongTransport.scheduleNotes` scheduled notes at `startOffset + note.startTime / safeMultiplier` with no pre-roll. Audio fires immediately when transport starts.
2. Two CSS/layout issues compounded:
   - `Play.module.css` `.play { justify-content: flex-end }` — flex children stick to the bottom of the column.
   - `FallingNotes.module.css` `.canvas { min-height: 18rem }` — minimum height but no `height: 100%` to claim remaining space.

**Effect**: User can't prepare for fast songs, and the visualization wastes screen real estate.

**Fix** (4 files):

- `FallingNotes.constants.ts`: added `FALLING_NOTES_PRE_ROLL_SECONDS = 2`. Increased `LOOK_AHEAD_SECONDS` from 2.5 to 4 (matches the new pre-roll window).
- `SongTransport.ts`: added `PRE_ROLL_SECONDS = 2` constant. `scheduleNotes` now computes `scaledStart = startOffset + PRE_ROLL_SECONDS + note.startTime / safeMultiplier`. Audio fires 2s after transport.start(), giving the user time to see notes falling.
- `FallingNotes.tsx`: `computeTransformY` adds `PRE_ROLL_SECONDS` to `wallStart` so visual and audio stay synchronized — note fires when visual reaches hit line, not before.
- `Play.module.css`: `.play { justify-content: flex-end }` → `justify-content: flex-start`. Children fill from top.
- `FallingNotes.module.css`: `.canvas { height: 100%; min-height: 24rem }` (was 18rem). Lane claims full available height.

**Fix v2 (BUG-035b)**: First fix only changed the canvas CSS to claim full height. But on short viewports, the canvas stayed at the 24rem floor (~384px). With `LOOK_AHEAD=4 × PIXELS_PER_SECOND=140 = 560px` of required travel, notes scheduled at delta close to 4s were positioned above the canvas top and clipped. User reported: "ahora no llegan hasta abajo — no estás comprendiendo realmente el problema" — they saw notes clustered at the top with empty space below, because the canvas was too small for the fixed pixel-per-second scale.

- New hook `useElementHeight.ts` observes the canvas via `ResizeObserver` and emits its current height.
- `pixelsPerSecond` is now computed as `(canvasHeight - hitLineOffset) / LOOK_AHEAD_SECONDS` in `FallingNotes.tsx`. Notes always fill the available vertical space regardless of viewport size — on a 600px canvas, ~140px/s; on a 1000px canvas, ~244px/s; on the 384px floor, ~90px/s.

**Why 2s and 4s look-ahead?** 2s pre-roll + 4s look-ahead means notes appear 6s before they hit the line for slow songs. Long enough to read the next 4-5 notes coming. Shorter (1s/2s) felt rushed in testing; longer (3s/5s) hides upcoming melodic structure.

Tests: `SongTransport.test.ts` updated to account for the +2s offset; added `applies PRE_ROLL_SECONDS offset to every scheduled note (BUG-035)` test.

---

## BUG-034 — "Not all notes are tracked": audio plays notes the user can't see

**Description**: User reported after BUG-033 fix: "escucho sonidos aun cuando no veo qe alguna nota qe caiga toque el teclado simplmenete es como qe algunas cosas si se muestran y otras no. osea no todas las notas se traeckean creo". User hears audio for notes that don't appear as falling notes in the lane. They suspect notes are being dropped from tracking.

**Cause**: Trade-off from BUG-029 (`noteOutOfRange` filter inside `FallingNotes`). The 2-row piano (BUG-027) only plays C3-B4 (24 semitones). Songs with octave-5+ notes (Greensleeves, Zelda, FF Prelude, Tetris's high register) still play those notes in audio (`SongTransport.scheduleNotes` schedules every note regardless of range) — but `FallingNotes` was filtering them out visually. User hears audio → searches lane → finds nothing → concludes "tracking is broken".

**Effect**: Confusion. The visual lane no longer represents what the user hears, breaking the core feedback loop of a falling-notes app. User trusts neither visual nor audio.

**Fix** (reversal of BUG-029 visual filter):

- `FallingNotes.tsx`: removed the `isPitchInRange` filter from the render map. Every note whose delta is within `LOOK_AHEAD_SECONDS` is rendered.
- `FallingNotes.tsx`: every rendered note now gets a `noteOutOfRange` CSS class when `!isPitchInRange(note.pitch)`.
- `FallingNotes.module.css`: added `.noteOutOfRange { border: 1px dashed rgba(255,255,255,0.45); opacity: 0.45; }` — visible but visually distinct from playable notes.

Now the user sees every note that plays in audio. Out-of-range notes appear at their computed horizontal position (last fallback = 0.5) with a dashed border + low opacity, signaling "this plays, but you can't hit it with the 2-row keyboard". The visual matches the audio. Trade-off is still here (can't play octave 5+), but at least the user knows it exists.

**Why not filter audio instead?** Without audio for octave 5+ notes, songs sound incomplete (Tetris loses its recognizable hook). Visual-only filtering was worse than audio-only filtering.

---

## BUG-032 — Enter doesn't replay song after it finishes

**Description**: User reported: "yo presiono 1 pres enter pero al temrina la cancion no puedo repetirlo". Press Enter → song plays → song ends → press Enter again → nothing happens (no audio).

**Cause**: When the song finishes naturally, Tone.Transport keeps running (state `started`) but no notes are scheduled. The `togglePlay` action saw state `started` → called `pause()` on Enter. On the next Enter, it called `play()` — but `SongTransport.play()` only calls `transport.start()` without re-scheduling notes (the schedule was cancelled by `cancelScheduled` when transport passed the end of the song). Result: silent playback.

**Effect**: User could only replay by stopping (Escape) then playing again, which is non-obvious. Replay-after-end is a basic UX expectation for a music app.

**Fix v1 (BUG-032)**: `togglePlay` detected song-ended and reset transport to position 0. Visual worked (FallingNotes resync with currentTime=0), but audio didn't.

**Fix v2 (BUG-033)**: After `transport.stop()` cancels all scheduled events, calling `play()` alone doesn't re-schedule. The fix is to call `loadSong(song, tempoMultiplier)` after `stop()` to re-create every audio event at its correct offset, then `play()`. Now both visual and audio restart together.

---

## BUG-031 — FallingNotes misalignment with piano keys (BUG-027 design conflict)

**Description**: After BUG-027's 2-row QWERTY piano, user reported: "las notas que bajan en comparacion con las columnas y teclas estan chueco". FallingNotes put each note at the wrong horizontal column — notes didn't land on their QWERTY keys.

**Cause**: BUG-025 introduced linear pitch mapping in FallingNotes (`(pitch - 48) / 23`) which puts C4 at 52% horizontal. But the BUG-027 piano renders each QWERTY key at `index / 7` — A (C4) at 0%, J (B4) at ~86%. The two systems disagreed: a C4 note in FallingNotes appeared at 52% horizontal, but the A key (which is C4) was at the leftmost 0% position.

**Effect**: Notes fell into the gaps between piano keys. User couldn't predict which key to press because the visual mapping was broken.

**Fix** (`src/components/FallingNotes/FallingNotes.tsx`): Replaced linear pitch formula with QWERTY-position mapping. Each pitch → `(keyIndex / 7)` where keyIndex matches the QWERTY layout:

- Z=0, X=1, C=2, V=3, B=4, N=5, M=6 (octave 3 bottom row)
- A=0, S=1, D=2, F=3, G=4, H=5, J=6 (octave 4 home row — same offsets)
- Black keys: T=3.5 (between F-G), Y=4.5, U=5.5; W=0.65, E=1.65

Octave 3 and octave 4 share the same horizontal range (they're vertically stacked on the piano). Notes now land exactly on their QWERTY keys.

Tests in `FallingNotes.test.ts` updated to assert QWERTY alignment (`noteOffsetFraction(48) === noteOffsetFraction(60) === 0`).

---

## BUG-027 — User mandated: 2 rows max (Z-M + A-J), drop octave 5

**Description**: After multiple redesigns (3 rows → piano bar → various hybrids), user reported continued confusion with multi-row piano visualizations. Final decision: hard cap of 2 rows for VisualPiano, mapping Z-M (octave 3) + A-J (octave 4). Octave 5 mappings removed entirely.

**Cause**: The QWERTY keyboard is not a piano. Every visual redesign tried to bridge this gap (3 stacked rows, single horizontal piano bar, hand-zone splits) but none felt usable. User explicitly stated the 2-row QWERTY shape is what their fingers already know.

**Effect**: Songs requiring notes above B4 (Greensleeves D5, Zelda OoT F5, FF Prelude D5, Metroid/MegaMan A5, Scarborough Fair A5) cannot be played. Catalog limited to songs within C3-B4 (24 semitones). F1 shippable songs: Tetris, Twinkle Twinkle, possibly Ode to Joy. F2 catalog (game music) deferred until a better approach exists.

**Fix** (5 files):

- `SynthesiaClassicLayout.ts`: removed octave 5 mappings (`6`/`7`/`8`/`q`/`r`/`p`/`;` + `i`/`o`/`-`/`=`/`.`). Layout now 2 octaves (3-4).
- `VisualPiano.tsx`: 2 rows. Row 1 = home row (A-J + W/E/T/Y/U black overlay). Row 2 = bottom row (Z-M). No octave 5 keys rendered.
- `VisualPiano.module.css`: row height 3.5rem (was 7rem). Each row ~3.5rem tall, total ~7.5rem.
- `FallingNotes.noteOffsetFraction`: PIANO_MAX_PITCH = 71 (was 83). Linear mapping from C3 (48) to B4 (71).
- `LayoutEngine.test.ts`: replaced octave 5 tests with "does NOT map octave 5" assertion.

Trade-off accepted: lose ~70% of catalog. Gain: visual matches user's actual keyboard. No more cognitive translation.

---

**Description**: After BUG-024 added q/r/p/; to the octave-5 row, the piano became 3 stacked rows of 7 wide keys each. Total height ~22rem (≈50% of screen). Each key ~270px wide × 96px tall — aspect ratio 2.8:1 (real piano keys are tall:narrow, ~1:6). User: "se ve horrible, imaginas un humano con la capacidad de hacer esto?"

**Cause**: The 3-row layout was chosen to match QWERTY keyboard shape (z-row / a-row / 6-row stacked), but it never matched piano aesthetic. Stacking 3 rows × 6rem height ate the screen. `flex: 1 1 0` on white keys stretched them to fill horizontal space, inverting the real-piano proportion.

**Effect**: Piano dominated ~50% of screen real estate. Keys looked like UI buttons, not piano keys. Z and M keys were clipped off-screen on smaller laptops. Practice workflow felt cramped.

**Fix**: Replaced 3-row layout with single horizontal piano bar (Synthesia / MuseScore convention):

- 21 white keys (C3..B5) side-by-side, each ~4.76% of width.
- 15 black keys overlaid at ~62% height, ~2.86% wide.
- QWERTY label on each key (Z, X, C, V, B, N, M, A, S, D, F, G, H, J, 6, 7, 8, Q, R, P, ; for whites; W, E, T, Y, U, I, O, -, =, . for blacks).
- `positionPercent = (pitch - 48) / 35 * 100` — linear pitch mapping used by both piano and FallingNotes, so falling notes align exactly with keys.
- Total piano height: 7rem (desktop), 5rem (≤1024px), 3rem (portrait). Down from ~22rem.

FallingNotes `noteOffsetFraction` simplified from 4 segment-tables to one linear formula. `VisualPiano.module.css` rewritten: single `.row` with absolutely-positioned white keys + overlaid black keys.

---

**Description**: VisualPiano showed only `6 7 8` on the octave-5 row (3 huge keys taking full width). User reported confusion: "no entiendo me confunde demasiado esa interfaz". FallingNotes was already showing notes for F5/G5/A5/B5 falling at 70-100% horizontal — but there was no visible key in the piano to press.

**Cause**: BUG-021 extended the layout to map `q`/`r`/`p`/`;` → F5/G5/A5/B5 and `i`/`o`/`-`/`=`/`.` → F#5/G#5/A#5 + C#5/D#5. FallingNotes was updated to position those notes correctly. But `VisualPiano.tsx` still had `OCT5_WHITE_KEYS = ['6', '7', '8']` and no octave-5 black keys array. The piano renderer and the layout had drifted: the layout knew about 7 white keys + 5 black keys in octave 5, but the renderer only knew about 3 white keys.

**Effect**: User couldn't see which QWERTY keys to press for F5–B5. FallingNotes would show notes falling for those pitches but no piano key existed at that horizontal position to land above. Practice mode for songs like Greensleeves / Zelda / FF Prelude was unusable because the high melody notes had no visual anchor.

**Fix** (`src/components/VisualPiano/VisualPiano.tsx`):

- `OCT5_WHITE_KEYS = ['6', '7', '8', 'q', 'r', 'p', ';']` (7 white keys, same shape as home/bottom rows).
- New `OCT5_BLACK_KEYS` array for `i`/`o` (C#5/D#5) and `-`/`=`/`.` (F#5/G#5/A#5) — same offset semantics as `BLACK_KEYS` but indexed into the octave-5 row.
- Split black-key rendering: `homeBlackKeys` render above the home row, `oct5BlackKeys` render above the octave-5 row. Each row's blackRow uses its own row's key count for percentage math.

---

## BUG-029 — User reported "todo está roto" — full audit pass

**Description**: After several BUGs in rapid succession (BUG-021 through BUG-028), user reported: "yo creo qe la musica y todo en general ESTA ROTO". General frustration; not one specific bug.

**Cause**: BUG-028's pitch filter (`if (note.pitch < 48 || note.pitch > 71) continue`) was too aggressive. Songs like Tetris (E5/C5/D5/B4) lost their melody because most notes were in octave 5. Tetris became unrecognizable. The user heard broken songs and concluded everything was broken.

**Effect**: User lost trust in the audio. Songs that previously sounded right (Tetris, Zelda OoT, FF Prelude, Scarborough Fair, etc.) now played partial melodies that didn't match the song.

**Fix** (2 files):

- Reverted BUG-028's audio filter. `SongTransport.scheduleNotes` now schedules ALL notes regardless of pitch.
- FallingNotes visual filter: notes outside C3..B4 are NOT rendered. Audio plays them (so song sounds complete); visual only shows what user can play (C3..B4).
- Added `SongTransport.test.ts` with 8 tests covering tempo scaling (BUG-023), pitch-filter removal (BUG-029), bpm updates, song reloading, and `tempoMultiplier = 0` safety.

Trade-off: octave 5+ notes play audibly but don't appear visually. User hears complete song; sees only playable notes. Better than silence-incomplete-melody.

---

## BUG-028 — Audio plays notes that aren't shown falling (audio/visual desync)

**Description**: After BUG-027 clamped FallingNotes to C3-B4 range, user reported: "suena a veces cosas que no me indica que estan bajando o bajaron, pero algunas si bajan raro". Audio plays notes that the falling-notes lane never indicates.

**Cause**: `SongTransport.scheduleNotes` scheduled every note in `song.notes`, regardless of pitch range. After BUG-027's 2-row cap, FallingNotes clamped its visual position to C3-B4 (24 semitones) but SongTransport didn't filter — octave-5 notes still got scheduled and played. Catalog songs with octave-5 notes (Tetris C5/D5, Greensleeves D5, Scarborough Fair C5/D5, FF Prelude A5, Zelda OoT F5, etc.) were the source.

**Effect**: User hears a note, looks for it in the falling-notes lane, doesn't see it. The "where did that come from?" confusion breaks trust in the visual feedback loop.

**Fix** (`src/songs/SongTransport.ts`): `scheduleNotes` now filters notes by pitch — `if (note.pitch < 48 || note.pitch > 71) continue`. Out-of-range notes are silently dropped from the schedule. Songs still play, but only notes the user can see and play along with.

Trade-off: songs with octave-5 melodies lose those notes audibly (Greensleeves loses its high descant). User explicitly chose 2-row cap, so partial coverage > confusing desync.

---

## BUG-023 — Tempo indicator changes but audio playback does NOT slow down

**Description**: User presses `←` repeatedly until TempoIndicator shows `♩= 14 · 10%`. Audio still plays at full speed. FallingNotes still fall at the same rate. Practice mode unaffected by tempo.

**Cause**: `Tone.Transport.schedule(cb, time)` interprets `time` differently depending on type:

- `time` is a **number** → AudioContext time, NOT affected by BPM changes.
- `time` is a **string** (bars:beats:sixteenths) → relative to transport, IS affected by BPM.

`SongTransport.scheduleNotes` was passing `startOffset + note.startTime` (a number), so `transport.bpm.value = song.tempoBPM * tempoMultiplier` updated the visual indicator but had no effect on already-scheduled events. Audio events fired at their original AudioContext times regardless of BPM.

`FallingNotes`/`Notation`/`HintLane`/`TransportBridge` loop wrap had the inverse problem: `note.startTime` is song seconds (independent of BPM), but `transport.currentTime`/`seconds` is wall-clock elapsed since transport.start(). At `tempoMultiplier=0.1`, those units diverge 10× — the look-behind filter, hint look-ahead, and loop wrap all compared mismatched units.

**Effect**: Slow-tempo practice was completely broken. User could see the indicator change but the song played at original speed. The entire practice workflow (`←` until you can keep up) was non-functional.

**Fix** (5 files):

- `SongTransport.scheduleNotes`: schedule at `origin + note.startTime / tempoMultiplier`. Notes fire later in wall-clock time when tempo is slower.
- `FallingNotes.computeTransformY` + look-behind filter: scale `note.startTime / tempoMultiplier` to match wall-clock `currentTime`.
- `Notation.isChordActive`: same scaling.
- `HintLane` look-ahead window: convert wall-clock window to song seconds via `* tempoMultiplier`.
- `TransportBridge` loop wrap + song-end check: convert wall-clock `position` to song seconds (`* tempoMultiplier`) before comparing with `loopStart`/`loopEnd`. `jumpTo(loopStart / tempoMultiplier)` converts back for the AudioContext offset.
- `useTransportActions.markLoopIn/Out`: capture loop boundaries in **song seconds** (`getCurrentPositionSeconds() * tempoMultiplier`) so the region doesn't shift when tempo changes after marking.

Now `←` actually slows playback audibly and FallingNotes fall proportionally slower.

---

## UX-022 — Tempo floor too high (0.5 = 50%) for slow study

**Description**: User pressed `←` repeatedly to slow a song for practice; tempo indicator stopped at 50% and refused to go lower. User reported "no me deja bajar hasta el 25" (won't let me go down to 25) — they wanted even slower for phrase-by-phrase study.

**Cause**: `MIN_TEMPO_MULTIPLIER = 0.5` in `src/store/songsSlice.ts` was a guess for "recognizable music" but is too aggressive for users practicing unfamiliar passages. 50% of a 140 BPM song is still 70 BPM — too fast to read notation between notes.

**Effect**: Users learning fast songs couldn't slow them enough to map notes to keyboard keys. Practice mode was unusable for high-BPM catalog.

**Fix**: Dropped `MIN_TEMPO_MULTIPLIER` from 0.5 to 0.1. `←` can now take any song to 10% BPM. `SONGS_TEMPO_MIN` export updated automatically. `useTransportActions.clampTempo` reads from same constant — no consumer changes needed.

---

## UX-018 — VisualPiano missing octave-5 row (C5/D5/E5 on `6`/`7`/`8`)

**Description**: After extending the layout to map `6`/`7`/`8` to C5/D5/E5 (BUG-016), FallingNotes started falling at horizontal positions 70-100%. But VisualPiano only rendered home row (A-J), bottom row (Z-M), and black row (W-U). Notes had no visible key to land above — they floated in air without an anchor.

**Cause**: `VisualPiano.tsx` `buildKeyDescriptors` only iterated `HOME_WHITE_KEYS` and `BOTTOM_WHITE_KEYS`; the new `OCT5_WHITE_KEYS` (`6`, `7`, `8`) was added to the layout but the piano renderer wasn't updated.

**Effect**: Notes above `6`/`7`/`8` had no visual key — user couldn't tell which QWERTY key to press for high melody notes.

**Fix**: Add `OCT5_WHITE_KEYS = ['6', '7', '8']` to the VisualPiano renderer. Render them as a row above the home row (because octave 5 is "above" octave 4 visually). Final layout: `[6 7 8]` (octave 5) on top, `[W E T Y U]` black keys, `[A S D F G H J]` (octave 4), `[Z X C V B N M]` (octave 3) below.

---

## UX-019 — FallingNotes lane too short, no reaction time

**Description**: Lane height was 12rem (~192px) and `LOOK_AHEAD_SECONDS` was 4. With `PIXELS_PER_SECOND = 100`, notes travelled 400px in 4 seconds — but the lane only showed 192px, so notes were clipped before reaching the hit line. Effective reaction time was under 1 second.

**Cause**: `FALLING_NOTES_PIXELS_PER_SECOND = 100` and `min-height: 12rem` were tuned for a quick demo, not real practice. Rhythm games typically use 3-4 seconds travel time.

**Effect**: User had ~1 second to see and react to each note. Practice was nearly impossible at song tempo.

**Fix**: Bumped to `PIXELS_PER_SECOND = 140` and `LOOK_AHEAD_SECONDS = 2.5`. Lane min-height bumped to `22rem` (~352px). Reaction window now ~2.5s.

---

## UX-020 — Hit/Miss feedback invisible to the user

**Description**: Practice feedback (`✓ Hit` / `✗ Miss`) was 18px font positioned at `bottom: 36px`, far from the action. The hits/misses counter was embedded in the StatusLine that fades after 3 seconds — so the user had no persistent score indicator.

**Cause**: `StatusLine.module.css` styled the flash small and tucked at the bottom edge. The counter shared the StatusLine signature so it disappeared when the line faded.

**Effect**: User couldn't tell if they were doing well. Practice felt disconnected — flash happened "somewhere down there" and the score vanished.

**Fix**:

- Flash: 96px font, centered vertically + horizontally in the viewport, with text-shadow glow matching hit/miss color. Animation: scale-in 80ms.
- Counter: separate persistent `<div aria-label="Practice score">` at bottom-left, never fades. Shows `✓ {hits}` (green), `✗ {misses}` (red), and `{accuracyPct}%` (white).

---

## BUG-017 — Loop UX invisible to the user

**Description**: After marking a loop region with `[`/`]` and toggling it on with `L`, the user gets no visible feedback. The LoopIndicator component renders but it's positioned at the bottom-right with 0.75rem font — easy to miss. Worse, FallingNotes continues to display notes OUTSIDE the loop region, so the user sees notes that will never play.

**Cause**:

1. `LoopIndicator.module.css` was a tiny muted pill at `bottom: 1rem; right: 1rem` with `font-size: 0.75rem`. Likely hidden behind other UI or too small to notice.
2. `FallingNotes` had no concept of the loop region — it always showed every note in the song regardless of `state.songs.loopEnabled`.
3. `TransportBridge` rAF loop called `Date.now()` directly (CLAUDE.md §0 violation — no Date.now in handlers).

**Effect**: User had no way to confirm their `[` `]` `L` keystrokes did anything useful. If they marked a region and started practicing, they'd see notes falling that the audio would never play — practice mode became incoherent.

**Fix**:

1. Move LoopIndicator to top-right with larger font, green border, pulsing animation when loop is on.
2. FallingNotes filters notes by `startTime ∈ [loopStart, loopEnd)` when `loopEnabled`.
3. Capture `BRIDGE_START_MS = Date.now()` at module load; use `nowMs() = BRIDGE_START_MS + performance.now()` per tick.

---

## BUG-016 — Tetris notes rendered at the same horizontal position (octave 5 unmapped)

**Description**: After BUG-015 fix, the FallingNotes got SOME separation but Tetris's C5/D5/E5 notes still fell at almost the same x position because they were unmapped in the SynthesiaClassicLayout — only octaves 3 and 4 were mapped. The fallback (`pitch-fraction`) put them between home row positions, visually overlapping A4/B4.

**Cause**: The original SynthesiaClassicLayout only mapped QWERTY keys to octaves 3 (Z-M) and 4 (A-J, W-U). Songs in the catalog use octaves up to 5. With no octave-5 mapping, `layoutEngine.getKey(pitch)` returned `undefined` for C5/D5/E5, forcing FallingNotes into the pitch-fraction fallback.

**Effect**: Visual misalignment: the user couldn't tell which key to press for the highest melody notes; they fell in the same column as octave-4 notes one semitone below.

**Fix**: Extend SynthesiaClassicLayout to map top-number-row `6`→C5, `7`→D5, `8`→E5 (white keys) and right-side `i`→C#5, `o`→D#5 (black keys). FallingNotes maps these to a separate right-side band (70%..100% horizontal) so they don't overlap visually with the home row.

---

## BUG-015 — FallingNotes stacked in a column instead of aligning with piano keys

**Description**: Even after BUG-014 was fixed (notes visible and falling), every note in a song landed within ~10% horizontal range near the center of the canvas. Tetris's notes (A4, B4, F#4, D5, E5) all stacked in the same column. The user couldn't tell which key to press because the notes didn't align with the keyboard below.

**Cause**: `noteOffsetFraction(midiPitch)` mapped each pitch to `(pitch - 36) / 60` across the entire C2..C7 range. For a song whose notes span only A4..E5 (pitches 69..76), all `left%` values clustered between 55% and 67%. The horizontal range was global, not per-song or per-octave.

**Effect**: Practice mode unusable — the visual cue ("which key to press when this note hits the line") was missing entirely. The user had to know the melody by ear and guess keys.

**Fix**: Replace global pitch fraction with `layoutEngine.getKey(pitch)` → map QWERTY key to its position in the piano row (home row index 0..6, black row uses the same fractional offsets as `VisualPiano.BLACK_KEYS`, bottom row maps to a second band below). Each note now falls directly above the key the user needs to press.

---

## BUG-014 — FallingNotes rendered above the hit line, never visible

**Description**: Falling notes appeared (canvas was 290px tall, visible, opacity 1) but `noteCount === 0` from the user's perspective — no notes ever showed up in the lane during playback. Verified via Playwright probe: empty-state message "Press Enter to start playback." persisted even after `Enter` was pressed and the miss-counter incremented.

**Cause**: `computeTransformY` anchored notes at `top: 0` of the canvas with formula `yPx = -delta * PIXELS_PER_SECOND`. When `delta === 0` (note plays now), `yPx === 0` → note sits at the **top** of the canvas. The hit line is at the **bottom** (1.5rem from `bottom: 0`). Notes went from `yPx = -400` (4s future, off-canvas above) to `yPx = 0` (top) to `yPx = +50` (50px from top, never reaching the hit line). The canvas `overflow: hidden` clipped them when off-canvas above, so the user saw an empty lane.

**Effect**: Practice mode was unusable — the user couldn't see what notes were coming or when to press them. This was the core blocker for the "play along" value proposition.

---

## BUG-013 — `useTransportClock` returned null even when transport was started

**Description**: FallingNotes showed the empty-state message ("Press Enter to start playback") while the hit-detection middleware was correctly scoring hits/misses (which requires `transport.state === 'started'`).

**Cause**: `useTransportClock.readCurrentTime()` read `transport.currentTime` only. When Tone.Transport.start() runs without an active AudioContext (headless Chromium without user gesture, or any suspended context), `currentTime` can be `undefined`. The middleware used `transport.seconds ?? transport.currentTime ?? 0`, which fell through to `0` — a valid number. Asymmetry between the two readers meant one saw "playing" and the other saw "stopped".

**Effect**: UI components depending on `useTransportClock` (FallingNotes, Notation highlight, HintLane) failed to render notes even when transport was running. Combined with BUG-014 this made FallingNotes appear completely broken.

---

## BUG-012 — Bottom row octave duplication caused polyphony leak

**Description**: Pressing `V` triggered not just F3 but also F4 (the home-row F). Same for `B`/`G`, `N`/`A`, `M`/`B`. Both octaves sounded simultaneously.

**Cause**: Bottom row mapping was `index < 3 ? 3 : 4` — first three keys (Z, X, C) at octave 3, last four (V, B, N, M) at octave 4. Octave 4 collided with home-row pitches (F, G, A, B).

**Effect**: Any keypress on V/B/N/M produced two-tone polyphony instead of the intended single note. Also broke hit-detection (one keypress consumed two notes' worth of claim).

---

## BUG-011 — `Shift+F` / `Shift+N` collided with QWERTY piano keys

**Description**: `Shift+F` (modifier: toggle falling notes) and bare `F` (F#4 piano key) both fired when the user pressed Shift+F — the modifier consumed the event but a phantom noteOn still triggered on keyup. Same for `Shift+N` / bare `N` (A3).

**Cause**: The Switch statement in `Play.tsx` returned early on Shift+F, but the LayoutEngine still considered `F` a piano key with no modifier attached. The user's OS or desktop environment may also bind Shift+F (some window managers do), making the modifier unusable.

**Effect**: Hitting Shift+F to toggle falling notes would also sound F#4 — confusing and broken. The modifier key itself was unreliable on some systems.

**Fix**: Bind modifiers to `\` (backslash) and `'` (apostrophe) — single keys, no Shift required, no piano-key collision.

---

## BUG-010 — FallingNotes blocked UnlockGate pointer events

**Description**: After page reload, the "Click to enable audio" button was visible but unclickable — clicking it did nothing.

**Cause**: The UnlockGate had no z-index; FallingNotes (also `position: absolute` with default z-index) intercepted the click first. `pointer-events: none` was missing on FallingNotes when the canvas was empty.

**Effect**: First-time users couldn't unlock audio. The app appeared completely broken.

---

## BUG-009 — `Tone.Vibrato.amount = 3` crashed the Ocarina synth

**Description**: Selecting timbre 5 (Ocarina) threw `TypeError: expected number ≤ 1` from Tone.js. Locked the app on that timbre.

**Cause**: `OCARINA_VIBRATO_AMOUNT = 3`. Tone.Vibrato expects `amount ∈ [0, 1]`.

**Effect**: Switching to the Ocarina timbre crashed the synth chain. The app would freeze or fail to produce sound for any subsequent timbre until reload.

---

## BUG-008 — `Transport.position` is a string, broke `LoopIndicator.toFixed`

**Description**: Marking loop in/out points threw `e.toFixed is not a function` whenever the indicator tried to display seconds.

**Cause**: `Tone.Transport.position` returns a string like `"0:0:0"` (bars:beats:sixteenths), not a number. `SongTransport.getCurrentPositionSeconds()` was reading `position` directly.

**Effect**: Loop indicator crash; the user couldn't see or use the loop feature.

---

## BUG-007 — `CURATED_SONGS` never hydrated into Redux

**Description**: After implementing curated tracks (StarCraft, Zelda, MegaMan, Metroid, Final Fantasy, Mario), Tab-cycling never reached them. Only `PD_STARTER_SONGS` appeared.

**Cause**: `TransportBridge` only dispatched `upsertSong(PD_STARTER_SONGS)`. `CURATED_SONGS` was defined but never imported into the hydration loop.

**Effect**: The F2 catalog feature was invisible to anyone testing the app.

---

## BUG-006 — Shift+F collapsed the page layout

**Description**: Pressing Shift+F (toggle falling notes) made the entire page jump down ~290px. The Notation above moved with it.

**Cause**: The hidden state used `display: none` on the FallingNotes container. CSS `display: none` removes the element from layout flow, collapsing the flex slot and pushing everything below up.

**Effect**: Toggling falling notes caused a visual jump that disoriented the user and shifted the Notation away from its expected position.

**Fix**: Use `visibility: hidden; opacity: 0; pointer-events: none` — keeps the slot reserved without affecting layout.

---

## BUG-005 — Notation overflowed single stave

**Description**: For songs longer than ~30 notes, the notation either extended off-screen or compressed unreadably into a single 720px stave.

**Cause**: A single stave was hardcoded for the entire song. VexFlow can't fit more than ~8 chords at a reasonable width.

**Effect**: Notation was unreadable for anything beyond a short loop.

**Fix**: Chunk chords into groups of 8 (`NOTATION_CHORDS_PER_STAVE`) and stack staves vertically with a gap.

---

## BUG-004 — `await nonPromise` in `__resetDBForTests` after removing inner async

**Description**: Linter flagged `@typescript-eslint/await-thenable` after removing an inner `await` left `await db.delete()` on a non-Promise return value.

**Cause**: A no-op `await` left over from a refactor. Per CLAUDE.md §0: removing a no-op `await` also requires dropping `async` on the enclosing function.

**Effect**: Lint failure; test setup potentially broken.

---

## BUG-003 — Playwright tests in headless mode failed AudioContext autoplay

**Description**: Several e2e tests failed in headless Chromium with "The AudioContext was not allowed to start" warnings, even after clicking the unlock button.

**Cause**: Headless Chromium blocks AudioContext by default. Tests need `--autoplay-policy=no-user-gesture-required` to disable this.

**Effect**: Tests flaky or environment-dependent.

---

## BUG-002 — Notation highlight lag behind transport position

**Description**: When the user pressed keys, the Notation highlight was ~300ms behind the actual song position.

**Cause**: `Notation.tsx` ran `findIndex` over all chords on every render. With ~120 chords and a 60Hz rAF tick, the findIndex dominated render time.

**Effect**: Visual lag made practice feel unresponsive.

**Fix**: Cache `activeChordIndex` via `useMemo` keyed on `chords` + `currentTime`.

---

## BUG-001 — `LayoutEngine.isModifier` matched single-char F when modifier was Shift+F

**Description**: Some early tests checked `engine.isModifier('f')` returning true, but the actual binding was `'Shift+f'`. After the rename the test broke.

**Cause**: Test was written against the original modifier definition (`'f'`), but the rename to `'Shift+f'` (per BUG-011 above) wasn't propagated to the test.

**Effect**: Test failures; also served as a smell that the F-as-modifier pattern conflicted with F-as-piano-key (BUG-011 root).
