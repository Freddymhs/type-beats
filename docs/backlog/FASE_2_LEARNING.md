# FASE 2: LEARNING + CONTENT

**Status**: ⏸️ PENDIENTE
**Prioridad**: Media
**Dependencias**: FASE_1_MVP (requiere F1 funcionando)

## Propósito

Expandir la app más allá del MVP: notación real, catálogo de música de juegos, import custom, custom layouts, cooperative con novio, music theory overlay. Esta fase convierte el "instrumento" en "herramienta de aprendizaje + composición".

## Orden de ejecución

1. Tarea 2.A — Instalar VexFlow + OpenSheetMusicDisplay
2. Tarea 2.B — Componente `<Notation>` (render VexFlow desde Song JSON)
3. Tarea 2.C — Página `/library` con catálogo curado (Zelda, StarCraft, MegaMan, Metroid)
4. Tarea 2.D — MusicXML import (drag-drop file → parse → save en Dexie)
5. Tarea 2.E — MIDI import (vía @tonejs/midi)
6. Tarea 2.F — Custom layouts editor (visual piano + drag-drop key assignment)
7. Tarea 2.G — Cooperative mode (WebSocket para vos + novio)
8. Tarea 2.H — Music theory overlay (chord detection, scale highlight)
9. Tarea 2.I — Loop section (mark in/out)
10. Tarea 2.J — Save progress per song
11. Tarea 2.K — Mobile landscape mode completo

## Tareas

### Tarea 1: Instalar libs notación + MIDI

- Archivo: `package.json`
- Qué hacer: `npm install vexflow opensheetmusicdisplay @tonejs/midi`

### Tarea 2: Componente Notation (VexFlow)

- Archivo: `src/components/Notation/Notation.tsx`
- Archivo: `src/components/Notation/Notation.module.css`
- Qué hacer:
  - Lee `currentSong.notes` de Redux
  - Renderiza partitura con VexFlow (stave + notes)
  - Highlight de nota activa mientras suena
  - Sync con `Tone.Transport.currentTime`
  - Toggle on/off (no compite con falling notes, complementa)

### Tarea 3: Library page + catálogo curado

- Archivo: `src/pages/Library.tsx`
- Archivo: `src/songs/curated/` con Zelda/MegaMan/Metroid/StarCraft en formato MusicXML/JSON
- Qué hacer:
  - Browse por game/timbre
  - Click → load en `/play`
  - Source attribution (game, composer, year)
  - Search filter (texto)

### Tarea 4: MusicXML import

- Archivo: `src/importers/musicxml.ts`
- Archivo: `src/components/ImportDropzone/ImportDropzone.tsx`
- Qué hacer:
  - Drag-drop file → FileReader → parse con opensheetmusicdisplay → extract notes array
  - Validate: tempo, time signature, key
  - Save en Dexie con source='imported'
  - Auto-load en `/play`

### Tarea 5: MIDI import

- Archivo: `src/importers/midi.ts`
- Qué hacer:
  - Parse con `@tonejs/midi`
  - Extract notes per track (seleccionar track principal)
  - Save similar a MusicXML

### Tarea 6: Custom layouts editor

- Archivo: `src/pages/LayoutEditor.tsx`
- Archivo: `src/components/LayoutEditor/KeyPicker.tsx`, `PianoRoll.tsx`, `ModifierList.tsx`
- Qué hacer:
  - Visual piano roll (click nota → assig key)
  - Key picker (drag from list to keyboard slot)
  - Modifier list (Space/Tab/Esc/Shift+F1..F12)
  - Save layout a Dexie
  - Conflict detection (misma key nota + modifier)
  - Export/Import JSON

### Tarea 7: Cooperative mode

- Archivo: `src/cooperative/socket.ts` (WebSocket client)
- Archivo: `src/pages/Coop.tsx`
- Archivo: `supabase/migrations/coop_rooms.sql` (F2 schema)
- Qué hacer:
  - Crear/unirse a room via URL
  - Sync de: song actual, tempo, position, timbre
  - Audio regenerado localmente (no streaming)
  - Two visual pianos side by side
  - Supabase Realtime para control events

### Tarea 8: Music theory overlay

- Archivo: `src/theory/chordDetector.ts`, `scaleDetector.ts`
- Archivo: `src/components/TheoryOverlay/TheoryOverlay.tsx`
- Qué hacer:
  - Detecta chord activo (Cmaj7, Dmin, etc) cuando ≥3 notas simultáneas
  - Detecta scale (cuando secuencia de notas matchea C major, etc)
  - Highlight en VisualPiano (teclas dentro de scale marcadas)
  - Info panel sutil con chord/scale name

### Tarea 9: Loop section

- Archivo: `src/components/TransportControls/LoopButton.tsx`
- Qué hacer:
  - Mark in (`[` key) → store currentTime as loopStart
  - Mark out (`]` key) → store currentTime as loopEnd
  - Toggle loop on/off (`L` key)
  - Visual: highlight region en progress bar

### Tarea 10: Save progress per song

- Archivo: `src/db/index.ts` (update progress schema)
- Archivo: `src/db/progressActions.ts`
- Qué hacer:
  - Track: bestScore, lastPlayedAt, timesPlayed
  - Auto-save on song end (throttled)
  - Display: NO display en UI (intentionally invisible per concept)

### Tarea 11: Mobile landscape completo

- Archivo: `src/styles/mobile.module.css`
- Qué hacer:
  - 2 octavas visibles (no 7)
  - Falling notes reducidos (50% altura)
  - Status line más compacto
  - Touch-friendly hit areas para falling notes (tap zone)

## Criterios de aceptación

- [ ] `<Notation>` renderiza Tetris correctamente
- [ ] Drag-drop MusicXML de Zelda OoT Main Theme funciona
- [ ] Custom layout saved + reload funciona
- [ ] Cooperative mode conecta 2 browsers (vos + novio)
- [ ] Theory overlay detecta chord Cmaj cuando tocás C+E+G
- [ ] Loop section funciona (`[` y `]`)
- [ ] Mobile landscape usable en iPhone
