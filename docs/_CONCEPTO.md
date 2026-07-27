# type-beats — concepto

> Origen: /home/fmarcosdev/Volumes/Extended/github/DEVELOPMENT/concept-type-beats.md (ideación)

## Propósito

App personal QWERTY-only para relajarte mientras estudiás (90% del día). Input por teclado del notebook (ThinkPad E14 friendly), multi-timbre nostálgico (chiptune/ocarina/flute/saw/whistle), falling notes para práctica, catálogo curado de música de juegos (StarCraft, Zelda, MegaMan, Metroid). Single-user, nunca se vende, vibecoding-friendly.

## Qué es / qué NO es

**Es:**

- QWERTY-only (no MIDI controller, no on-screen piano input)
- 5 timbres default con swap instantáneo (`Alt+1`..`Alt+5`)
- Falling notes practice/memory mode (toggle `[F]`)
- Game music catalog curado (Zelda, StarCraft, MegaMan, Metroid, Final Fantasy)
- Local-first PWA (instalable, offline)
- Cooperative Fase 2 (vos + novio, WebSocket)
- Vibecoding-friendly (Fase 1 shippeable solo)

**NO es:**

- Piano tradicional con MIDI
- Producto de venta
- Mobile-first (desktop priority)
- Learning app formal (tipo Simply Piano)
- Multi-user con cuentas
- Marketplace de canciones

## Modelo de dominio

```
User (single, hardcoded en Fase 1)
  ├── Settings (defaultOctave, defaultTimbreId, velocityCurve, theme)
  └── Sessions[]
       ├── currentSongId
       ├── currentTimbreId
       ├── mode (practice | memory)
       ├── tempo (BPM multiplier 0.5–2.0)
       ├── octave (3..5)
       └── position (currentTime in song)

Song
  ├── id, name, source (PD | curated | imported)
  ├── originalTimbre (timbre hint)
  ├── tempoBPM
  ├── notes[] (pitch, startTime, duration, velocity)
  └── metadata (game, composer, license)

Note
  ├── pitch (MIDI number 0-127)
  ├── startTime (seconds from song start)
  ├── duration (seconds)
  └── velocity (0-127, optional)

Timbre
  ├── id (square | triangle | sineFlute | saw | ocarina | ...)
  ├── name
  ├── synthConfig (Tone.js synth params)
  └── envelope (attack, decay, sustain, release)

Layout
  ├── id, name
  ├── mappings[] (QWERTY key → { note, octave })
  ├── modifiers[] (key → action)
  ├── groups[] (visual coloring)
  └── active (boolean, solo uno activo a la vez)

Progress (per Song)
  ├── bestScore (0-100)
  ├── lastPlayedAt (timestamp)
  ├── timesPlayed
  └── sectionsMastered[] (startTime, endTime)
```

## Fases

### F1 — MVP (3-4 semanas dev)

**Scope mínimo shippable:**

- QWERTY toca notas (3 octavas: 3, 4, 5)
- 5 timbres default (square, triangle, sine flute, saw, ocarina)
- Multi-timbre con shortcut `Alt+1`..`Alt+5`
- Visual piano display (highlight de tecla, no mouse input)
- Falling notes toggle (`[F]` ON/OFF)
- 5 canciones PD curated (Tetris/Korobeiniki, Ode to Joy, Twinkle Twinkle, Greensleeves, Scarborough Fair)
- Selector de canción + play/pause + tempo adjust (←/→ ±10%)
- PWA install + offline (vite-plugin-pwa)
- Desktop-first responsive (mobile solo landscape básico)

**Entrega:** podés tocar las 5 canciones con multi-timbre, practicar con falling notes, instalar como PWA, usar offline.

### F2 — Learning + content (post-MVP)

- VexFlow notation display
- Game music catalog curated (StarCraft Terran/Protoss/Zerg, Zelda OoT/MM/ALttP, MegaMan 1/2/3, Metroid, Final Fantasy Prelude/Victory)
- MusicXML import custom (drag-drop)
- MIDI import custom
- Custom layouts editor (visual piano roll + key assignment)
- Cooperative mode (WebSocket para vos + novio)
- Music theory overlay (chord detection, scale highlight)
- Mobile landscape mode (2-3 filas QWERTY)
- Loop section (marcar inicio/fin → loop)
- Save progress per song

### F3 — Future (si seguís)

- Magenta.js AI auto-complete patterns
- Audio → MIDI import (Spotify Basic Pitch)
- MIDI export, WAV export
- Supabase sync (Postgres + Realtime)
- Row Level Security policies
- Practice scoring avanzado
- Notation editor avanzado (MusicXML round-trip)
- Más timbres (whistle, pluck, sitar, etc)

## Stack (con fuente por decisión)

| Layer             | Tech                 | Fuente                                        |
| ----------------- | -------------------- | --------------------------------------------- |
| Build             | Vite                 | `[feature]` SPA + dev rápido                  |
| Language          | TypeScript strict    | `[gap]` TS-tipos-basicos                      |
| UI framework      | React 18+            | `[feature]`                                   |
| Audio engine      | Tone.js              | `[research]` standard browser chiptune        |
| State management  | Redux Toolkit        | `[gap]` Redux-code-splitting-slices           |
| Routing           | React Router v6      | `[feature]` SPA navigation                    |
| Storage local     | Dexie.js             | `[feature]` songs library persistida          |
| PWA               | vite-plugin-pwa      | `[feature]` install + offline                 |
| Styling           | CSS Modules          | `[feature]` + `[research]`                    |
| UI primitives     | Radix UI             | `[feature]` accessibility                     |
| Testing           | Vitest + RTL         | `[gap]` test discipline                       |
| Sync backend (F2) | Supabase             | `[wishlist]` Supabase/Postgres en resume.json |
| Falling notes     | DOM + CSS animations | `[feature]` simple, escala 4-8 voces          |
| Notation (F2)     | VexFlow              | `[feature]` SVG notation                      |

## Practice-wishlist (skills que ESTE concepto practica)

| Skill                                             | Fuente                              | Aplicación concreta                                        |
| ------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Redux Toolkit code-splitting slices               | `[gap]` Redux-code-splitting-slices | Slices separados: songs, audio, settings, layout, progress |
| TypeScript estricto (generics, conditional types) | `[gap]` TS-tipos-basicos            | MIDI types + Dexie schemas + Tone.js wrappers              |
| Event Loop JS aplicado                            | `[gap]` Event-Loop-JS               | Web Audio scheduling + Tone.Transport                      |
| Arquitectura en capas                             | `[gap]` Arquitecturas-genericas     | 4 capas: audio engine / state / UI / persistence           |
| SOLID en React                                    | `[gap]` SOLID-5-principios          | Componentes pequeños, single responsibility                |
| Supabase / Postgres (F2)                          | `[wishlist]` resume.json            | Schema real, queries reales                                |
| Row Level Security (F2)                           | `[wishlist]` resume.json            | Si cooperative multiplayer                                 |

## Fuera de alcance v1

- ❌ MIDI controller support (Fase 2+)
- ❌ Cooperative multiplayer (Fase 2)
- ❌ AI features (Magenta.js, Fase 3)
- ❌ Mobile native wrapper (PWA alcanza)
- ❌ Marketplace de canciones
- ❌ Multi-user / cuentas
- ❌ Achievements / gamificación vacía
- ❌ Custom timbres (solo los 5 default F1)

## Riesgos

### Gold-plating (ALTO)

F1 tentador de meter todo. **Protección:** F1 = solo QWERTY + 5 timbres + falling notes + 5 songs PD. Notation, game music, custom layouts, cooperative = F2. Si no se aguanta F1 chico, no se shippea.

### Falling notes performance (MEDIO)

DOM/CSS animations con >50 notas simultáneas = janky potential. Mitigación: chiptune típico = 4-8 voces, ~30 notas en pantalla. Si pasa, migrar a Canvas 2D.

### QWERTY rollover limitation (BAJO)

Keyboards típicos = 6-key rollover. Chiptune 4 voices = OK. Polyphony mayor (jazz/clásica) = problemático. Mitigación: F1 = chiptune only.

### Velocity proxy ≠ velocity real (BAJO)

QWERTY no tiene velocity sensing. F1 usa timing-based proxy. Para chiptune = irrelevante (square waves son binarios). Para ocarina = aceptable.

### Browser autoplay policy (BAJO)

Web Audio requiere user gesture. Mitigación: `Tone.start()` en click handler antes del primer note.

## Disciplina de implementación (audit findings)

### Tone.js + Redux Toolkit

**Tone.js instances NO van en Redux store** (AudioContext no serializa). Patrón:

```ts
// RTK state: solo IDs y config
state.audio = { selectedTimbreId: 'ocarina', masterVolume: 0.8 }

// ToneManager singleton fuera de Redux
const toneManager = new ToneManager() // owns AudioContext + synth instances

// Bridge en useEffect
useEffect(() => {
  toneManager.swapSynth(state.audio.selectedTimbreId)
}, [state.audio.selectedTimbreId])
```

### Tone.js + Falling notes timing

**Single source of truth = `Tone.Transport.currentTime`**. CSS animation start = `Transport.currentTime * 1000 + leadMs`. No `Date.now()`, no `setInterval` para timing de notas.

### Dexie.js + RTK hidratación

Middleware custom:

```ts
// Mount: dispatch hydrateFromDexie()
// Cada action que muta persistence: writeToDexie(state)
// O usar createListenerMiddleware con predicate
```

### Vitest + Tone.js

Testear solo lógica pura:

- Note parsing (MIDI → notes array)
- Layout mapping (key → note)
- Song data transforms (transpose, scale detect)
- **Mockear Tone.js** para integration tests
- **No testear audio synthesis** (oído humano = test)

### vite-plugin-pwa + HMR

```ts
// vite.config.ts
VitePWA({ devOptions: { enabled: false } }) // SW solo en build
```

### CSS Modules + global resets

Un único archivo `src/styles/global.css` con `@import` en root. Resto scoped via `.module.css`.

### Supabase realtime + audio (F2)

**Supabase Realtime = solo control events** (start/stop/timbre change). Audio regenerado localmente con mismos params. NO stream de audio por realtime.

## Cierre

Concepto durable. Cuando decidas construirlo:

- `/work:resume:new-project type-beats` → toma este concept, aplica template Vite + React + TS, git init, draft en resume.json
- F1 estricto a lo definido arriba
- No saltar a F2 hasta F1 shippeado y usado

Reminder best-effort post-escritura vía SSH a Mac Mini (no bloqueante).
