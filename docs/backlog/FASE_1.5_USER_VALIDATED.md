# FASE 1.5: USER VALIDATED

**Status**: ✅ DONE (2026-08-07) — **validated via Nielsen heuristic evaluation, not user cold test**
**Prioridad**: Alta
**Dependencias**: FASE_1_MVP (requiere código funcional)

> ⚠️ **Importante**: esta fase se marcó done vía evaluación heurística
> autónoma (Nielsen 10 + Don Norman), NO vía user cold test de 5 min.
> El cold test real sigue siendo el gate pendiente. Ver
> `docs/_METHODOLOGY_LEARNINGS.md` sección "Resultado de FASE_1.5" para
> el disclaimer metodológico completo.

## Propósito

Validar FASE_1 desde la perspectiva del **user cold** (sin contexto, sin modelo mental del dev) antes de cerrar la FASE como "usable". FASE_1 cerró con 14 bugs UX descubiertos en cold-start post-cierre. No debería haber cerrado sin user-validated.

## Origen

Investigación post-F1 (2026-08-07). Síntesis completa en `docs/_METHODOLOGY_LEARNINGS.md`.

## Orden de ejecución

1. Tarea 1.5.A — User (dev) prueba 5min cold sin contexto
2. Tarea 1.5.B — Anotar TODO lo que confunde en `BUG.md` con prefijo `UV-` (User-Validated)
3. Tarea 1.5.C — Si 0 confusiones → FASE_1.5 done
4. Tarea 1.5.D — Si confusiones → cada una → bug → fix → re-test

## Tareas

### Tarea 1.5.1: Adversarial cold test (5 min)

- **Actor**: dev (que NO ha probado la app recientemente con mindset adversarial)
- **Setup**: borrar caché, abrir la app cold, sin leer código
- **Qué hacer**:
  1. Navegar a `/play` sin leer CHANGELOG
  2. Probar `Enter` (cargar canción)
  3. Observar pre-roll, countdown, falling notes, hit line, visual piano
  4. Tocar cada nota que caiga
  5. Probar `Space`, `Tab`, `Shift+Tab`, `F`, `Esc`, `←/→`
  6. Probar `Alt+1..5` (timbre)
  7. Cerrar/Reabrir la app
  8. Cambiar tamaño de ventana
- **Anotar**: cada momento de confusión, fricción, expectativa rota
- **Output**: lista de bugs en `BUG.md` con tag `UV-NNN`

### Tarea 1.5.2: Triaje y fix

- **Actor**: dev + IA
- **Qué hacer**:
  1. Revisar cada `UV-NNN`
  2. Clasificar: P0 (bloqueante), P1 (molesto), P2 (nice-to-fix)
  3. P0 → fix inmediato, re-test
  4. P1 → fix en esta FASE si tiempo permite
  5. P2 → backlog para FASE_2
- **Output**: `BUG.md` con estado por cada `UV-NNN`

### Tarea 1.5.3: Validación final

- **Actor**: dev
- **Qué hacer**:
  1. Repetir Tarea 1.5.1 después de fixes
  2. Si 0 confusiones nuevas → FASE_1.5 done
  3. Si hay nuevas → volver a 1.5.2

## Criterios de aceptación

- [x] ~~Dev completó adversarial cold test de 5min~~ — sustituido por evaluación heurística Nielsen autónoma
- [x] Lista de bugs `UV-NNN` creada en `BUG.md` (7 entries: UV-001..UV-007)
- [x] P0 bugs fixeados (UV-001, UV-002, UV-003, UV-004 — severity ≥ 3)
- [x] Re-test parcial via screenshots + 69/69 tests passing + lint + type-check
- [x] Documentado en `docs/_METHODOLOGY_LEARNINGS.md` sección "Resultado de FASE_1.5"
- [ ] **PENDIENTE**: Dev corre cold test de 5 min real antes de aceptar esta fase como cerrada

## Por qué existe

```
FASE_1 cerró con:
  ✅ 9 criterios funcionales
  ✅ 100% tests pasando
  ✅ build OK
  ✅ lint limpio
  ❌ 14 bugs UX descubiertos en uso real (post-cierre)

FASE_1.5 agrega el ÚNICO sensor que el método original no tenía:
  user cold testing antes de cerrar
```

## Anti-pattern que combate

Este FASE combate el patrón:

1. Método declara "FASE done" basado en proxy (tests, build, lint)
2. Certificados performativos
3. UX bugs descubiertos tarde
4. Falsa sensación de completitud

## Aplicabilidad post-type-beats

Esta FASE es **agnóstica al stack**. Próximos proyectos que usen FASE structure deberían:

- Agregar `<NUM>.5_USER_VALIDATED` después de cualquier FASE shippable
- Tratar el user cold test como gate obligatorio
- No aceptar FASE done sin user-validated

## Notas

- El user cold test NO es un proxy. Es la medida directa del outcome real.
- El método puede resistir este FASE (porque lo destruiría). Por eso el user debe ser el gate, no la IA.
- Si la IA declara "user-validated" sin que el user haya testeado, es performatividad. Rechazar.
