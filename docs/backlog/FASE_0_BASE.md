# FASE 0: BASE

**Status**: ✅ COMPLETADA
**Prioridad**: Alta
**Dependencias**: ninguna (primera fase)

## Propósito

Setup base del proyecto: instalar deps, audio engine singleton, types compartidos, store skeleton de Redux Toolkit, layout engine. Esta fase deja la fundación técnica lista para F1.

## Orden de ejecución

1. Tarea 0.A — `npm install` (deps ya en package.json, falta instalar)
2. Tarea 0.B — types base (`Note`, `Song`, `Timbre`, `Layout`) — crea los tipos que 0.C importa
3. Tarea 0.C — ToneManager singleton (audio engine wrapper) — depende de 0.B
4. Tarea 0.D — Redux Toolkit store + slices skeleton — depende de 0.B
5. Tarea 0.E — Dexie schema + wrapper — depende de 0.B
6. Tarea 0.F — LayoutEngine (preset Synthesia Classic) — depende de 0.B

## Tareas

### Tarea 1: Instalar dependencias

- Archivo: `package.json` (ya configurado, falta `npm install`)
- Qué hacer: ejecutar `npm install` en `/home/fmarcosdev/Development/type-beats/`
- Validar: `node_modules/` existe, `package-lock.json` se mantiene sync

### Tarea 2: Types base compartidos

- Archivo: `src/types/music.ts` (crear)
- Qué hacer:
  - `Note`: `{ pitch: MIDI number 0-127, startTime: seconds, duration: seconds, velocity?: 0-127 }`
  - `Song`: `{ id, name, source: 'PD' | 'curated' | 'imported', notes: Note[], tempoBPM, metadata }`
  - `Timbre`: `{ id, name, synthConfig: object }`
  - `KeyMapping`: `{ note, octave }`
  - `Layout`: `{ id, name, mappings: Record<string, KeyMapping>, modifiers: Record<string, string> }`
- Referencia: ver `docs/_CONCEPTO.md` sección "Modelo de dominio"

### Tarea 3: ToneManager singleton

- Archivo: `src/audio/ToneManager.ts` (crear)
- Qué hacer:
  - Clase singleton que owns AudioContext + Map<TimbreId, Tone.Synth>
  - Método `swapSynth(timbreId)` — crea/cambia instancia activa
  - Método `playNote(pitch, velocity, duration)` — usa synth activa
  - Método `start()` — wrapper de `Tone.start()` para user gesture
  - Método `panic()` — release all active notes
- **CRÍTICO**: este manager NO vive en Redux. Es instancia única global accesible vía Context API.

### Tarea 4: Redux Toolkit store skeleton

- Archivo: `src/store/index.ts` (crear)
- Qué hacer:
  - `configureStore` con slices: `audioSlice` (selectedTimbreId), `songsSlice` (placeholder), `settingsSlice` (defaultOctave), `layoutSlice` (activeLayoutId), `progressSlice` (placeholder)
  - `audioSlice` initial state: `{ selectedTimbreId: 'square', masterVolume: 0.8 }`
  - `settingsSlice` initial state: `{ defaultOctave: 4, velocityCurve: 'log', theme: 'dark' }`
  - Export `RootState`, `AppDispatch` types
- Referencia: discipline point #3 en `CLAUDE.md` para hydration con Dexie (Fase 1)

### Tarea 5: Dexie schema + wrapper

- Archivo: `src/db/index.ts` (crear)
- Qué hacer:
  - Subclass de Dexie con schema version 1: `songs`, `layouts`, `progress`, `settings`
  - Type-safe row types
  - Métodos helper: `getActiveSong()`, `saveSong()`, `getLayoutById()`
- Patrón: hidratar RTK desde Dexie en mount via `createListenerMiddleware`

### Tarea 6: LayoutEngine + preset Synthesia Classic

- Archivo: `src/layout/LayoutEngine.ts` (crear)
- Qué hacer:
  - Clase que compila `Layout` JSON a lookup tables `keyToNote`, `noteToKey`, `modifiers`
  - Preset por default "Synthesia Classic" con mapping del concepto (3 octavas)
  - Métodos: `getNote(key)`, `isModifier(key)`, `getModifier(key)`
- Default mapping: ver `docs/_CONCEPTO.md` sección "QWERTY mapping"

## Criterios de aceptación

- [ ] `npm run dev` levanta Vite sin errores
- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run build` produce bundle exitoso
- [ ] `ToneManager.start()` se puede llamar desde un click handler sin errores
- [ ] Redux store compila con tipos correctos
- [ ] Dexie schema abre DB sin errores
- [ ] LayoutEngine mapea `a` → `C4` correctamente
