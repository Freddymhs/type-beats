# type-beats — backlog

Backlog estructurado para el proyecto type-beats. Generado desde `docs/_CONCEPTO.md`.

## Fases

| Fase                                    | Status        | Prioridad | Descripción                                                           |
| --------------------------------------- | ------------- | --------- | --------------------------------------------------------------------- |
| [FASE_0_BASE](./FASE_0_BASE.md)         | ✅ completada | Alta      | Setup base, audio engine, types, store skeleton                       |
| [FASE_1_MVP](./FASE_1_MVP.md)           | ✅ completada | Alta      | QWERTY input, 5 timbres, falling notes, 5 songs PD, PWA               |
| [FASE_2_LEARNING](./FASE_2_LEARNING.md) | ✅ completada | Media     | Notation + game catalog + loop + save progress (narrowed scope)       |
| [FASE_3_FUTURE](./FASE_3_FUTURE.md)     | ❌ descartada | N/A       | Descartada: viola concepto local-first. Items quedan como referencia. |

## Diagrama de referencia

| Archivo                                                                        | Tipo       | Contenido             |
| ------------------------------------------------------------------------------ | ---------- | --------------------- |
| [`../diagrams/DIAGRAMAS_COMPONENTES.md`](../diagrams/DIAGRAMAS_COMPONENTES.md) | Flowcharts | Topología del sistema |

Este diagrama es referencia estructural estable. Las fases lo referencian pero no lo repiten. Actualizar solo ante cambios de topología.

## Decisiones técnicas

Carpeta `../decisions/` — documentar aquí decisiones arquitectónicas cuando surjan durante el desarrollo.
Formato: `DECISION_[TEMA].md` — explica el POR QUÉ, no el QUÉ.

## Validación de flujos

type-beats NO es una app típica (no tiene auth, CRUD, payments). FVD no aplica. QA manual + Playwright E2E cubren la validación.

## Próximo paso

`/work:backlog:next` → tomar la primera tarea de FASE_0 o FASE_1.
