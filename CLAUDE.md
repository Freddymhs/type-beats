# type-beats — reglas locales del proyecto

> **Convenciones globales**: ver `~/.claude/CLAUDE.md` (reglas del usuario aplican).
> **Concepto**: ver `docs/_CONCEPTO.md` (spec completo, source of truth).

## Stack (decidido en concepto)

- Vite + React 19 + TypeScript strict
- Tone.js (audio engine) — instancias viven FUERA de Redux, en singleton
- Redux Toolkit con code-splitting slices (`songs`, `audio`, `settings`, `layout`, `progress`)
- React Router v6
- Dexie.js (IndexedDB persistence)
- vite-plugin-pwa (PWA install + offline)
- CSS Modules (NO Tailwind — quitado del template)
- Radix UI primitives (headless)
- Vitest + React Testing Library + Playwright E2E

## Disciplina de implementación (crítico)

1. **Tone.js NO en Redux store** — vive en `ToneManager` singleton. Redux solo guarda `selectedTimbreId: string`.
2. **Single source of timing = `Tone.Transport.currentTime`** — CSS animations derivan de esto, no de `Date.now()` ni `setInterval`.
3. **Hydration Dexie → RTK**: `createListenerMiddleware` con predicate que escribe a Dexie después de cada action que muta persistence.
4. **Vitest + Tone.js**: testear solo lógica pura (note parsing, layout mapping). Mockear Tone.js para integration. No testear audio synthesis (oído = test).
5. **vite-plugin-pwa devOptions.enabled = false** — SW solo en build, no interfiere HMR.
6. **CSS Modules + global resets**: único `src/index.css` con `@import`. Resto scoped vía `.module.css`.

## Convenciones de código

- TypeScript strict mode (no `any` sin justificación).
- `const` siempre. Sin variables mutables sin justificación.
- Sin `catch (e) {}` vacío.
- Destructuring sobre acceso repetido por `obj.prop`.
- Componentes pequeños, single responsibility.
- Al adaptar un template, eliminar referencias al template en metadata, código, estilos, documentación, tests y URLs antes de stagear.
- Después de cambiar dependencias, regenerar lockfile y validar instalación limpia con `npm ci`.
- Antes de cerrar cambios, ejecutar `format:check` junto con type-check, lint y tests.

## Comandos

```bash
npm install          # instalar deps
npm run dev          # dev server (Vite)
npm run build        # producción
npm run type-check   # tsc -b
npm run lint         # eslint .
npm run test         # vitest watch
npm run test:run     # vitest run (CI mode)
npm run test:e2e     # playwright test
```

## PWA

- `manifest.name = type-beats`
- `theme_color = background_color = #0a0e1a` (dark mode único)
- SW solo en build, no en dev

## Estado del proyecto

- **Fase actual**: FASE_0_BASE (por arrancar)
- **Backlog**: `docs/backlog/`
- **Concepto**: `docs/_CONCEPTO.md`
- **Progreso**: `.claude/backlog-progress.json`

## No hacer

- ❌ NO agregar Tailwind (CSS Modules per concept)
- ❌ NO agregar backend/servidor en F1 (local-first only)
- ❌ NO vender NUNCA el producto
- ❌ NO agregar UI tradicional (botones, menús, modals) — concept es keyboard-first flow state
- ❌ NO commitear credenciales ni secrets
- ❌ NO usar `Date.now()` ni `Math.random()` en handlers (React 19 purity rule)

## Skills activas del proyecto

Ver `.claude/skills-lock.json` — invocar esas skills proactivamente cuando el contexto aplique.
