# Diagramas de Componentes (Flowcharts)

Propósito: mapa estable del sistema. Actualizar solo si cambia topología.

## Contexto (alto nivel)

F1 es frontend-only, local-first. F2 agrega sync opcional. F3 expande con AI.

```mermaid
flowchart LR
    User((User))
    Browser[Browser PWA]
    Dexie[(IndexedDB<br/>local)]

    User -->|QWERTY input| Browser
    Browser -->|Tone.js audio| User
    Browser <-->|songs/layouts/progress| Dexie

    F2_Sync[F2: Supabase Realtime]
    F2_Sync -.->|opcional| Browser
```

## Componentes principales (F1)

```mermaid
flowchart TB
    subgraph Client[Browser]
        subgraph Audio[Audio Layer]
            ToneManager[ToneManager singleton<br/>AudioContext + Synths]
            TimbreRegistry[Timbre Registry<br/>5 timbres]
        end

        subgraph State[State Layer - Redux Toolkit]
            AudioSlice[audioSlice]
            SongsSlice[songsSlice]
            SettingsSlice[settingsSlice]
            LayoutSlice[layoutSlice]
            ProgressSlice[progressSlice]
        end

        subgraph UI[UI Layer - React]
            PlayPage[Play Page]
            SettingsPage[Settings Page]
            VisualPiano[VisualPiano]
            FallingNotes[FallingNotes]
            StatusLine[StatusLine]
            Notation[Notation - F2 only]
        end

        subgraph Persistence[Persistence Layer - Dexie.js]
            DexieSchema[(Dexie Schema<br/>songs, layouts, progress, settings)]
            Hydration[createListenerMiddleware<br/>RTK ↔ Dexie]
        end

        subgraph Keyboard[Input Layer]
            LayoutEngine[LayoutEngine<br/>preset Synthesia Classic]
            Modifiers[Modifiers Handler]
        end

        PlayPage --> VisualPiano
        PlayPage --> FallingNotes
        PlayPage --> StatusLine
        PlayPage --> Notation

        PlayPage --> LayoutEngine
        PlayPage --> Modifiers
        LayoutEngine --> AudioSlice

        PlayPage --> ToneManager
        ToneManager --> TimbreRegistry
        ToneManager --> AudioSlice

        AudioSlice <--> Hydration
        SongsSlice <--> Hydration
        SettingsSlice <--> Hydration
        LayoutSlice <--> Hydration
        ProgressSlice <--> Hydration

        Hydration <--> DexieSchema
    end

    User((User)) -->|QWERTY| Keyboard
    Keyboard --> LayoutEngine
    Keyboard --> Modifiers
```

## Flujo crítico: tocar una nota

```mermaid
sequenceDiagram
    participant U as User
    participant K as Keyboard
    participant L as LayoutEngine
    participant M as Modifiers
    participant T as ToneManager
    participant V as VisualPiano
    participant F as FallingNotes

    U->>K: press 'a'
    K->>L: getNote('a')
    L-->>K: { note: 'C', octave: 4 }
    K->>T: playNote(60, velocity)
    T->>U: audio output (square wave C4)
    K->>V: dispatch activeNotes
    V->>U: visual highlight
    Note over F: on next frame, sync with Transport.currentTime<br/>schedule note to disappear at hit
```

## Disciplina clave (ver CLAUDE.md)

1. **ToneManager NO en Redux** — singleton fuera del store
2. **Timing = `Tone.Transport.currentTime`** — single source of truth
3. **Hydration RTK ↔ Dexie** — via `createListenerMiddleware`
