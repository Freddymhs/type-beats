# type-beats

PWA personal para tocar melodías con teclado QWERTY durante pausas de estudio.

## Propósito

- Input QWERTY-only; sin MIDI ni piano en pantalla.
- Cinco timbres iniciales: square, triangle, sine flute, saw y ocarina.
- Falling notes para práctica y memoria.
- Funcionamiento local-first, instalable y offline.
- Desktop-first; single-user; nunca producto de venta.

Especificación completa: [`docs/_CONCEPTO.md`](docs/_CONCEPTO.md).

## Estado

Proyecto en `FASE_0_BASE`. Backlog: [`docs/backlog/README.md`](docs/backlog/README.md).

F1 agrega QWERTY, timbres, canciones PD, falling notes, controles de transporte y PWA offline.
F2 queda fuera de alcance hasta completar y usar F1.

## Stack

| Capa          | Tecnología                                  |
| ------------- | ------------------------------------------- |
| Build         | Vite + React 19 + TypeScript strict         |
| Audio         | Tone.js                                     |
| Estado        | Redux Toolkit                               |
| Persistencia  | Dexie.js / IndexedDB                        |
| PWA           | vite-plugin-pwa                             |
| Estilos       | CSS Modules + `src/index.css` global        |
| UI primitives | Radix UI                                    |
| Tests         | Vitest + React Testing Library + Playwright |

Invariantes críticos:

- Instancias Tone.js viven fuera de Redux, en `ToneManager` singleton.
- Redux guarda IDs y configuración serializable.
- Timing usa `Tone.Transport.currentTime`.
- Dexie hidrata RTK mediante listener middleware.
- Service worker desactivado durante desarrollo para proteger HMR.

## Desarrollo

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run type-check
npm run lint
npm run format:check
npm run test:run
npm run build
npm run test:e2e
```

Playwright necesita Chromium instalado localmente:

```bash
npx playwright install chromium
```

## Estructura

```text
src/
  App.tsx              # shell inicial y estado PWA
  App.module.css       # estilos scoped del shell
  index.css            # reset y tokens globales
  lib/                 # dominio del proyecto
  test/setup.ts        # matchers de Vitest
  main.tsx             # entry point

e2e/                   # smoke tests Playwright
docs/                  # concepto, backlog y diagramas
```

## Fuera de alcance F1

- MIDI controller.
- Cuentas, backend o sincronización.
- Multiplayer cooperativo.
- Imports MusicXML/MIDI.
- AI y marketplace.
- Tailwind y UI tradicional con menús o modals.
