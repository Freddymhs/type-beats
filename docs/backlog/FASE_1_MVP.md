# FASE 1: MVP (F1 shippable)

**Status**: ⏸️ PENDIENTE
**Prioridad**: Alta
**Dependencias**: FASE_0_BASE (requiere ToneManager, types, store, layout engine)

## Propósito

App shippable para uso personal: QWERTY toca notas, 5 timbres, falling notes practice/memory mode, 5 canciones PD starter, PWA instalable, desktop-first responsive. Sin servidor, sin auth, sin multiplayer.

## Orden de ejecución

1. Tarea 1.A — Componente `<App>` con router + rutas
2. Tarea 1.B — Página `/play` con QWERTY listener + ToneManager integration
3. Tarea 1.C — Componente `<VisualPiano>` (display only, highlight on press)
4. Tarea 1.D — Componente `<FallingNotes>` (DOM + CSS animations)
5. Tarea 1.E — 5 canciones PD starter (Tetris, Ode to Joy, etc) en `src/songs/pd/`
6. Tarea 1.F — Componente `<SongSelector>` + `<TransportControls>` (play/pause/tempo)
7. Tarea 1.G — Multi-timbre via `Alt+1..5` (Alt+N handler)
8. Tarea 1.H — Modifiers globales (`Space`, `Tab`, `F`, `Esc`, `←/→`)
9. Tarea 1.I — Status line (texto bottom con fade out)
10. Tarea 1.J — PWA installable verification
11. Tarea 1.K — Responsive desktop + mobile landscape basic

## Tareas

### Tarea 1: Componente App con router

- Archivo: `src/App.tsx` (reemplazar template)
- Qué hacer:
  - `<BrowserRouter>` (de `react-router-dom`)
  - Rutas: `/` (redirect a `/play`), `/play`, `/settings` (placeholder F1)
  - `<Layout>` wrapper con `<Outlet />`
- Referencia: `react-router-dom@6` API

### Tarea 2: Página /play con QWERTY listener

- Archivo: `src/pages/Play.tsx` (crear)
- Qué hacer:
  - `useEffect` con `window.addEventListener('keydown', ...)` y `keyup`
  - Para cada key: check `layoutEngine.isModifier(key)` o `getNote(key)`
  - Si es nota: `toneManager.playNote(pitch)` + dispatch `audioSlice.activeNotes`
  - Si es modifier: ejecutar acción (sustain, panic, cycle timbre, etc.)
  - Cleanup en unmount

### Tarea 3: Componente VisualPiano (display only)

- Archivo: `src/components/VisualPiano/VisualPiano.tsx` (crear)
- Archivo: `src/components/VisualPiano/VisualPiano.module.css`
- Qué hacer:
  - Render 14 white keys + 10 black keys (1 octava visible, scrollable)
  - Outline 40% opacity por default
  - Highlight white on `keydown` (lee de Redux activeNotes)
  - NO mouse input
- CSS: usar tokens `--piano-outline`, `--piano-pressed`, `--bg-deep`

### Tarea 4: Componente FallingNotes (DOM + CSS)

- Archivo: `src/components/FallingNotes/FallingNotes.tsx` (crear)
- Archivo: `src/components/FallingNotes/FallingNotes.module.css`
- Qué hacer:
  - Lee `currentSong.notes` de Redux
  - Schedule basado en `Tone.Transport.currentTime` (single source of truth)
  - Render `<div>` por nota con color por pitch (C=red, D=orange, etc)
  - CSS `transform: translateY()` animado por duración
  - Hit line: `<div>` blanco con glow a Y fijo (calculado desde viewport)
  - Toggle visibilidad con Redux `settingsSlice.showFallingNotes`
- **CRÍTICO**: timing derivado de `Transport.currentTime`, NO `Date.now()`

### Tarea 5: Canciones PD starter

- Archivo: `src/songs/pd/tetris.ts`, `ode-to-joy.ts`, `twinkle.ts`, `greensleeves.ts`, `scarborough-fair.ts`
- Qué hacer:
  - Hardcodear array de `Note` con `pitch` (MIDI number), `startTime`, `duration`
  - Tempo BPM realista (Tetris ~140, Ode to Joy ~120, etc)
  - Export desde cada archivo: `export const tetris: Song = { ... }`
  - Index: `src/songs/index.ts` con array de songs

### Tarea 6: SongSelector + TransportControls

- Archivo: `src/components/SongSelector/SongSelector.tsx`
- Archivo: `src/components/TransportControls/TransportControls.tsx`
- Qué hacer:
  - Selector cycle via `Space` (next) / `Shift+Space` (prev)
  - Play/pause via `Enter`
  - Tempo `←/→` ±10% (clamp 0.5x a 2.0x)
  - Stop via `Esc`
- Visibility: SOLO status text bottom, no chrome permanente

### Tarea 7: Multi-timbre Alt+1..5

- Archivo: `src/audio/timbreRegistry.ts` (crear)
- Archivo: `src/audio/toneManager.ts` (update)
- Qué hacer:
  - Registry con 5 timbres:
    - `square`: `Tone.Synth({ oscillator: { type: 'square' } })`
    - `triangle`: `Tone.Synth({ oscillator: { type: 'triangle' } })`
    - `sineFlute`: `Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.05 } })`
    - `saw`: `Tone.Synth({ oscillator: { type: 'sawtooth' } })`
    - `ocarina`: custom con vibrato + filter (sine + LFO + lowpass)
  - `Alt+1..5` handler → `toneManager.swapSynth(timbreId)` + dispatch `audioSlice.selectedTimbreId`

### Tarea 8: Modifiers globales

- Archivo: `src/keyboard/modifiers.ts` (crear)
- Qué hacer:
  - `Space`: sustain toggle (nota held hasta release)
  - `Tab`: cycle timbre (siguiente)
  - `Shift+Tab`: cycle timbre (prev)
  - `F`: toggle `settingsSlice.showFallingNotes`
  - `Esc`: panic (all notes off) + stop transport
  - `Shift+Z` / `Shift+X`: octave -1/+1

### Tarea 9: Status line

- Archivo: `src/components/StatusLine/StatusLine.tsx`
- Qué hacer:
  - Texto bottom: `"${song.name} · ${timbre.name} · ♩= ${bpm}"`
  - CSS Module con `text: 12px, color: var(--status-text)`
  - Fade in/out 300ms (CSS transition con class toggle)
  - Visible 3s después de cambio, luego fade out

### Tarea 10: PWA verification

- Archivo: `vite.config.ts` (ya configurado)
- Qué hacer:
  - Verificar `npm run build` produce `dist/manifest.webmanifest`
  - Verificar `dist/sw.js` existe
  - Lighthouse PWA audit ≥ 90

### Tarea 11: Responsive

- Archivo: `src/styles/global.css` (update)
- Qué hacer:
  - Desktop (>1024px): full layout (piano 88 keys visible, falling notes full screen)
  - Mobile landscape (<1024px): 2 octavas visibles, falling notes reducidos
  - Mobile portrait: aviso "use landscape" (no F1 scope, solo mensaje)

## Criterios de aceptación

- [ ] Abrís `/play`, presionás `Alt+1` y suena square wave
- [ ] `Alt+5` cambia a ocarina (audio distinto, mismo input)
- [ ] `Space` + `Enter` empieza Tetris theme
- [ ] Falling notes caen y hit line se ilumina al key press correcto
- [ ] `F` toggle hides falling notes (memory mode)
- [ ] `←/→` ajusta tempo visible en status line
- [ ] `npm run build && npm run preview` levanta app funcional
- [ ] Chrome DevTools → Application → PWA instalable
- [ ] Lighthouse PWA audit ≥ 90
