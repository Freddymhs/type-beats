# FASE 3: FUTURE

**Status**: ❌ DESCARTADA — fuera de alcance por concepto
**Prioridad**: N/A
**Dependencias**: N/A

**Razón de descarte**: docs/_CONCEPTO.md define el proyecto como single-user, local-first, sin backend, sin AI, nunca producto de venta. Todos los ítems de esta fase (Magenta.js AI, audio→MIDI, Supabase sync, RLS, MIDI/WAV export, advanced scoring) violan esos invariantes. Quedan como referencia conceptual pero no se implementan.

## Propósito

Features avanzadas: AI assistance, audio→MIDI, MIDI export, sync cloud, RLS policies, advanced practice scoring. Solo si FASE_1 + FASE_2 están estables y querés seguir.

## Tareas

### Tarea 1: Magenta.js AI auto-complete

- Archivo: `package.json` (agregar `@magenta/music`)
- Archivo: `src/ai/magentaAutocomplete.ts`
- Qué hacer:
  - Sketch 4-8 notas → Magenta continúa melodic pattern
  - Multiple styles (Bach, jazz, chiptune)
  - Suggestions en UI sutil (no chrome)

### Tarea 2: Audio → MIDI (Spotify Basic Pitch)

- Archivo: `src/importers/audio.ts`
- Qué hacer:
  - Drag-drop MP3/WAV
  - Basic Pitch transcribe → notes
  - Save similar a MusicXML/MIDI import

### Tarea 3: MIDI export

- Archivo: `src/exporters/midi.ts`
- Qué hacer:
  - Export current Song como MIDI file
  - Download via blob URL

### Tarea 4: Supabase sync

- Archivo: `supabase/schema.sql`
- Archivo: `src/sync/supabaseClient.ts`
- Qué hacer:
  - Tables: `user_songs`, `user_progress`, `user_layouts`
  - Auth via Supabase (single-user, email magic link)
  - Background sync on save
  - Conflict resolution: last-write-wins con timestamp

### Tarea 5: Row Level Security

- Archivo: `supabase/migrations/rls_policies.sql`
- Qué hacer:
  - Policy: user solo ve/edita sus propios records
  - Policy via `auth.uid() = user_id`
  - Test con múltiples users

### Tarea 6: Practice scoring avanzado

- Archivo: `src/scoring/timingAnalyzer.ts`
- Archivo: `src/db/progressActions.ts` (update)
- Qué hacer:
  - Track timing accuracy per note (ms off from perfect)
  - Aggregate per song: avg accuracy, perfect notes %
  - Display: solo si user asks (no chrome)

## Criterios de aceptación

- [ ] Magenta autocompleta sketch coherente
- [ ] Audio MP3 → MIDI import funciona
- [ ] MIDI export descarga archivo válido (.mid)
- [ ] Sync entre 2 devices sin conflicts
- [ ] RLS policies enforced (user A no ve data de user B)
- [ ] Practice scoring tracking real
