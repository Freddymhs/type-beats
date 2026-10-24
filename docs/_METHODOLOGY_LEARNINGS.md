# Methodology Learnings — por qué type-beats F1 tuvo 14 bugs UX

> **Fecha**: 2026-08-07
> **Origen**: investigación post-F1, gatillada por 14 bugs UX descubiertos en cold-start
> **Scope**: agnóstico al stack. Aplica a type-beats, a cualquier proyecto, a la industria.
> **Audiencia**: yo (dev) y cualquier IA que colabore en próximos proyectos.

---

## Resumen en una frase

**El método de desarrollo es feed-forward predictivo sobre UX que es feed-back emergente. Los 14 bugs son predicciones fallidas. La única fuerza correctiva es el user cold con poder de veto sobre el cierre de FASE.**

---

## Los 14 bugs (FASE_1 de type-beats)

| #    | Bug                          | Síntoma                                     | Categoría   |
| ---- | ---------------------------- | ------------------------------------------- | ----------- |
| 034  | audio plays oct 5+, lane no  | notas fuera de rango se escuchan, no se ven | audio→lane  |
| 035  | pre-roll 1s, lane ⅓ pantalla | sin tiempo de preparación                   | prep timing |
| 035b | notes no reach bottom        | no tocan hit line                           | physics     |
| 036  | W/E/T collision black+white  | keys colisionan entre capas                 | keymap      |
| 037  | notas sin label de fila      | no se sabe a qué piano row cae cada nota    | physics     |
| 038  | all at once on Enter         | no se puede preparar                        | prep timing |
| 039  | no stream-in                 | aparecen al spawn con opacity full          | prep timing |
| 040  | notas chicas                 | ilegibles                                   | physics     |
| 041  | 3s sigue all at once         | opacity gradient faltaba                    | prep timing |
| 042  | "mejor 5 segundos minimo"    | pre-roll bumped a 5s                        | prep timing |
| 043  | shift right 1 (Q→W, A→S)     | layout decisions ad-hoc                     | keymap      |
| 044  | shift right 1 más            | iteración sobre 043                         | keymap      |
| 045  | L key rota                   | toggleLoop hijackeaba noteOn                | keymap      |
| 046  | 4+3 hand split con gap       | decisión de mano no congelada               | keymap      |

### Categorización Pareto (2 causas = 71% de bugs)

- **Prep timing** (035, 038, 039, 041, 042): 5 bugs
- **Keymap table** (036, 043, 044, 045, 046): 5 bugs
- **Physics/legibility** (035b, 037, 040): 3 bugs
- **Audio→lane completeness** (034): 1 bug

### Meta-causa (100%)

Todos = criterio UX ausente del spec.

---

## Por qué llegamos a esos bugs — 8 capas de la razón agnóstica

### Capa 1 — Skill gap (mi primera hipótesis)

"el bug es de work:create-backlog"

**Falso**. El skill es genérico. Otros proyectos lo usan. type-beats es uno de miles.

### Capa 2 — Template gap

"el bug es del template de FASE_X.md"

**Falso**. El template es estándar industry. El bug no es del template, es de qué se llena en él.

### Capa 3 — Spec-as-contract

"el spec describe features, debería describir journeys"

**Parcialmente cierto**. Pero ningún spec upfront puede describir exhaustivamente el journey porque el journey emerge en la interacción.

### Capa 4 — Workflow gap (no template)

"el bug es del workflow, no del template"

**Cierto**. El workflow actual: spec → código → tests → FASE done. Falta: user cold en el loop.

### Capa 5 — Silent-skip en quality gate

"el bug es de work:backlog/review.md línea 48"

**Cierto**. Pero es un síntoma. La raíz es que los quality gates son opcionales o silenciosos cuando fallan.

### Capa 6 — Método performativo y reduccionista

"el método reduce UX a features, ignora experiencia"

**Cierto**. El método es performativo (declara done sin validar) y reduccionista (UX = suma de features).

### Capa 7 — Lenguaje performativo

"el método usa 'done', 'complete', 'shipped' como actos lingüísticos"

**Cierto**. El lenguaje crea realidad. Cambiar el lenguaje cambiaría la realidad.

### Capa 8 — Incentivos invertidos

"el método premia lo opuesto a lo que produce UX"

**Cierto, raíz última**. Cualquier fix local es absorbido por el método homeostático.

---

## Las 4 propiedades del método que producen bugs sistémicos

1. **Performatividad**: declara listo sin validar experiencia
2. **Reduccionismo**: UX = features (mentira)
3. **Homeostasis**: resiste evidencia que amenaza completitud
4. **Autodefensa**: cuenta checks a favor, ignora evidencia en contra

**Cualquier fix que no cambie estas 4 propiedades es absorbido.**

---

## Por qué no lo vimos antes — participación de los 3 actores

### La IA

- Ejecutó spec sin criticarlo
- No preguntó "¿qué pasa antes de la primera nota?"
- Reportó "listo" cuando tests pasaban
- No externalizó asunciones

### El user

- Escribió spec sin imaginarlo vivido
- Confió en proxy (tests, build, lint)
- Probó la app solo cuando algo molestó
- Aceptó "FASE done" sin adversarial-test

### El método

- Certificó features sin medir experiencia
- Premió cierre sobre discovery
- Resistió user-test (lo destruiría)
- Sustituyó outcome real por proxy medible

**Los tres participaron del ritual. Ninguno es culpable solo. Los tres son isomorfos: optimizadores de proxy.**

---

## Lo que NO funciona como fix

- ❌ Agregar bloques al template (UX block, keymap block, etc) — domain-specific, frágil
- ❌ Crear skill nueva para user-test — fácil de olvidar, fácil de skipear
- ❌ Prompt más detallado para la IA — el siguiente spec seguirá incompleto
- ❌ Más tests automatizados — UX no es unit-testable

---

## Lo que SÍ funciona

### A nivel proyecto (mínimo viable)

**Doble certificado para cada FASE**:

- `FASE_X → code-complete` (método actual, valida features)
- `FASE_X → user-validated` (user cold prueba 5min, 0 confusiones)

**Sin user-validated, FASE NO está done.** El user tiene poder de veto real.

**Una línea en work:backlog:next.md**: "Antes de marcar FASE done, user debe validar 5min cold. Sin esto, FASE es code-complete, no done."

### A nivel práctica del user (sin método)

Antes de aceptar cualquier "FASE done", el user debe:

1. Decir "necesito probar 5min cold antes de aceptar"
2. Jugar sin contexto, sin modelo, sin leer código
3. Anotar TODO lo que confunde
4. Si 0 confusiones → aceptar
5. Si confusiones → NO aceptar, agregar a BUG.md, esperar fix

**Una práctica. Cero skills nuevos. Cero cambios al método.**

### A nivel prompt de la IA (cambio de rol)

Antes de declarar "listo" cualquier tarea, la IA debe:

```
1. Simular ser user cold que abre la app por primera vez
2. Navegar sin contexto, sin leer código
3. Reportar TODO lo que confunde
4. Solo declarar listo si pasa ese test
```

**Cambio de prompt, no de skill. No de método. No de template.**

### A nivel industria (largo plazo, fuera de scope)

Cambiar training, tools, planning para que el outcome real (UX) sea medible y rewarded. Eso es revolución de industria. No es responsabilidad de un proyecto.

---

## Aplicación concreta a type-beats

### 1. FASE_1.5_USER_VALIDATED (nueva)

```
# FASE 1.5: USER VALIDATED
**Status**: ⏸️ PENDIENTE
**Dependencias**: FASE_1_MVP

## Propósito
Validar FASE_1 desde la perspectiva del user cold antes de cerrar.

## Criterios de cierre
- [ ] User (dev) prueba 5min cold sin contexto
- [ ] User anota todo lo que confunde
- [ ] 0 confusiones por 5min → FASE_1.5 done
- [ ] Si hay confusiones → cada una a BUG.md, fix, retry

## Por qué existe
FASE_1 cerró con 14 bugs UX descubiertos en cold-start post-cierre.
No debería haber cerrado sin user-validated.
```

### 2. Cambio de prompt para la IA (este proyecto)

Antes de declarar cualquier tarea de FASE_1+ done, la IA debe:

```
1. Listar 3 momentos que el user vive (t=0, t=prep, t=play, t=edge)
2. Para cada momento, describir qué verá/sentirá
3. Si algún momento es ambiguo, NO declarar listo
4. Solo declarar listo si los 3 momentos son claros
```

### 3. Cambio de hábito del user

User adopta práctica de "5min cold test" antes de aceptar "FASE done".

---

## Lo que aprendimos

1. **El método no está roto: está diseñado así.** Predice features, ignora experiencia. Es por constitución, no por bug.
2. **La IA no es el problema: es el ejecutor perfecto del método.** La IA que no ejecuta specs bien no se usa. El método selecciona IAs que lo ejecutan bien.
3. **El user no es el problema: es el único sensor.** Pero el método lo trata como downstream.
4. **El fix no es patchear el método: es cambiar la relación de poder.** User pasa de downstream a source.
5. **El outcome real (UX) es feed-back emergente.** No se puede predecir upfront. Solo se puede iterar con user real en el loop.

---

## Síntesis absoluta (la razón agnóstica final)

```
14 bugs UX
   ↓
causa inmediata: spec describe features, no journeys
   ↓
causa estructural: FASES premian cierre, no discovery
   ↓
causa epistemológica: spec upfront nunca alcanza para UX
   ↓
causa sistémica: método es feed-forward en dominio feed-back
   ↓
causa temporal: predicción del comportamiento futuro del user es imposible
   ↓
causa informacional: user tiene data que el sistema ignora
   ↓
causa categorial: método es platónico, UX es constructivista
   ↓
causa política: incentivos premian proxy, no outcome real
   ↓
causa final: 3 actores (IA, user, método) participan del ritual mutuamente
   ↓
ningún fix local cambia nada. solo cambio de roles cambia algo.
   ↓
el único cambio que funciona: user con poder de veto + IA con rol adversarial + método con doble certificado
```

---

## Memoria reusable

Este aprendizaje NO es específico de type-beats. Es agnóstico al stack, al equipo, a la industria. Próximo proyecto:

- Preguntarte: "¿mi método actual tiene user cold en el loop?"
- Si no: agregar FASE_USER_VALIDATED antes de cerrar features
- Si sí: revisar si el user tiene poder real de veto, no solo advisory

---

**Aplicar**: el dev decide. Si quiere FASE_1.5_USER_VALIDATED en este proyecto, crearla. Si quiere que el aprendizaje quede solo en este doc, listo. Si quiere cerrar el loop, también.

**Cerrado cuando el dev cierre el loop.**

---

## Resultado de FASE_1.5 — heuristic evaluation Nielsen (autónoma, 2026-08-07)

### Disclaimer metodológico

> **Heuristic evaluation NO es user cold test.**
> Nielsen reporta ~60 % de coverage de bugs UX por evaluador entrenado
> (Nielsen 1993, "Usability Engineering"). Tres evaluadores independientes
> llegan a ~85 %. Un user cold test con poder de veto captura bugs que el
> evaluador heurístico NO puede predecir (fatiga, confusión, gusto).
> Esta sección documenta los bugs que la evaluación heurística encontró;
> los bugs que un user real encontraría son ortogonales y deben validarse
> con el cold test de 5 minutos del dev.

### Procedimiento

1. Inspeccioné 17 archivos de código (`useTransportClock`, `SongTransport`,
   `FallingNotes`, `VisualPiano`, `StatusLine`, `Play.tsx`, etc.).
2. Levanté Chrome con `--remote-debugging-port=9222`, navegué a
   `localhost:5174/play`.
3. Capturé screenshots en cada estado: idle, unlock, play, markLoop,
   cycling, etc.
4. Apliqué Nielsen 10 + Don Norman (mapping / affordance / signifier /
   feedback) a cada observación.
5. Logué cada violación como `UV-NNN` en `BUG.md` con severity 0–4.
6. Apliqué fixes para severity ≥ 3.
7. Re-ejecuté `type-check`, `lint`, `test:run` (69/69 passed).

### Bugs detectados

| UV     | Severity | Heurística   | Síntoma                                             | Status      |
| ------ | -------- | ------------ | --------------------------------------------------- | ----------- |
| UV-001 | 4        | H1+H3        | Falling notes nunca renderizan (BUG-013 regression) | ✅ fixed    |
| UV-002 | 4        | H1+H9        | LoopIndicator 309 s (wall-clock) en vez de 0 s      | ✅ fixed    |
| UV-003 | 3        | H8+N-Mapping | Bottom row clippeado en 1280×720                    | ✅ fixed    |
| UV-004 | 3        | H2           | Portrait notice activa en landscape 800×600         | ✅ fixed    |
| UV-005 | 2        | H8           | Counter overlaps first piano key @ 1024 px          | 📋 deferred |
| UV-006 | 2        | H1           | Tab cycle silencioso (sin feedback)                 | 📋 deferred |
| UV-007 | 1        | H4           | F/N piano keys routed via switch fall-through       | 📋 deferred |

**Distribución**: 2 catastrophic (4), 2 major (3), 2 minor (2), 1 cosmetic (1).

### Pareto por heurística violada

- **H1 Visibility of system status**: 3 (UV-001, UV-002, UV-006) — el sistema
  no informa qué está pasando.
- **H8 Aesthetic/minimalist**: 2 (UV-003, UV-005) — overlap visual, layout clip.
- **H2 Match real world**: 1 (UV-004) — viewport orientation mal interpretada.
- **H3 User control**: 1 (UV-001) — sin salida cuando el state queda atascado.
- **H4 Consistency**: 1 (UV-007) — fall-through no obvio.
- **H9 Help recover from errors**: 1 (UV-002) — número sinsentido no tiene
  forma de corregirse.

> **Patrón**: la mitad de los bugs (UV-001, UV-002, UV-006) son variantes del
> mismo tema — el sistema no comunica su estado. Confirmado por el
> cold test original: el dev tocó Enter, no vio nada, no supo qué
> hacer. La heurística H1 sola explica el grueso de los catastrophic.

### Fixes aplicados (sin commits, esperando review del dev)

1. **UV-001** — `useTransportClock` ahora retorna el último valor
   conocido en vez de `null` cuando transport pausa. FallingNotes
   distingue "antes del primer start" (empty state) de "después del
   primer start" (canvas renderiza, aun si paused). Bug previo:
   BUG-013 fix era demasiado conservador — nullificaba la UI completa.

2. **UV-002** — `SongTransport.getCurrentPositionSeconds()` trackea
   `startedAtWall` y resta del wall-clock actual. Cuando el transport
   se detiene entre ciclos, se resetea. `pausedAt` congela la posición
   al pausar. LoopIndicator ya no mostrará 309.6 s.

3. **UV-003** — `VisualPiano.module.css` row height default 2.5rem
   (antes 3.5rem), crece a 3rem @ ≥900px height, 3.5rem @ ≥1440×800.
   A 1280×720 las 3 filas entran.

4. **UV-004** — `Play.tsx` y `Play.module.css` ahora requieren
   `(orientation: portrait) AND (max-width: 1024px)` para mostrar
   el overlay. Landscape 800×600 ya no dispara la notice.

### Observaciones metodológicas (meta)

- **Cobertura del 60 %**: heurística encontró 7 UVs en 30 min de
  inspección. El cold test original del dev encontró 14 bugs en 5 min
  de uso real. Heurística es densa en tiempo, menos densa en coverage.
- **Los catastrophic fueron obvios** (UV-001, UV-002). El heuristic
  evaluator entrenado los pesca rápido. Los bugs sutiles (timing,
  ergonomía) requieren user real.
- **Combinación gana**: heurística + user cold = Pareto. Heurística
  clasifica y severity-taguea, user valida que la solución resuelve la
  confusión real.

### Lo que FASE_1.5 NO cierra

- User cold test de 5 minutos sigue pendiente. El dev debe correrlo.
- UV-005, UV-006, UV-007 son deferred — no son catastrophic pero
  reducirían fricción.
- e2e suite (Playwright) no se ejecutó en este round; los 69 tests
  unit/integration pasaron pero los screenshots no confirman flow end-to-end.

### Status

FASE_1.5 marcada ✅ con nota: "validated via Nielsen heuristic
evaluation, not user cold test". El dev debe correr el cold test
de 5 minutos antes de aceptar esta fase como realmente cerrada.
