# Investigacion para alinear el playground con mlform

Fecha de comprobacion: 2026-08-23.

## Que version manda en este proyecto

`prueba-mlform` no consume una version publicada. `package.json` apunta a `file:..\\mlform` y el workspace resuelve `mlform` como `link:../mlform`. Por tanto, para desarrollar y probar este repositorio manda el contrato del repositorio oficial adyacente, no el `latest` de npm.

Hay dos estados distintos:

- npm y la ultima release de GitHub publican `0.1.19`. Fuentes: [paquete en npm](https://www.npmjs.com/package/mlform), [release v0.1.19](https://github.com/UlloaSP/mlform/releases/tag/v0.1.19) y [manifest publicado en `main`](https://github.com/UlloaSP/mlform/blob/19e2337d7384791b1ec4be1ddbce4476df87ec70/package.json).
- El arbol de trabajo enlazado prepara `0.1.20` y contiene el nuevo contrato. La version figura en el [manifest local de mlform](../../mlform/package.json), y las reglas estan en los [tipos de submit](../../mlform/src/schema/types/submit.ts), el [normalizador de respuesta](../../mlform/src/runtime/submission/transport-response.ts) y la [documentacion local del transporte](../../mlform/docs/src/content/docs/es/kit/transport.md).

Esta investigacion toma el segundo estado como objetivo, porque es el que ejecutara el proyecto cuando se reconstruya `../mlform`. Conviene no declarar compatibilidad con `0.1.20` en un paquete remoto hasta que exista el tag o la publicacion.

## Cambio que rompe el playground

Cada elemento de `TransportResponse.reports` deja de ser un objeto libre. Ahora debe ser un `ReportResult` explicito y llevar la identidad exacta `(backend, mappedTo)` junto a un estado. El [tipo oficial](../../mlform/src/schema/types/submit.ts) admite solo estas formas:

```ts
{ backend, mappedTo, status: "ready", payload, context? }
{ backend, mappedTo, status: "pending", context? }
{ backend, mappedTo, status: "skipped", reason?, context? }
```

El [normalizador](../../mlform/src/runtime/submission/transport-response.ts) rechaza lo siguiente durante el submit:

- un `reports` que no sea un array;
- un resultado sin `backend` no vacio;
- un resultado sin `mappedTo` string o number;
- un estado distinto de `ready`, `pending` o `skipped`;
- `ready` sin `payload`;
- `pending` o `skipped` con `payload`;
- `context` que no sea objeto o `reason` no string.

Los dos transports del playground devolvian `{ mappedTo, payload }`. Son incompatibles con este contrato aunque funcionen contra un bundle anterior:

- `src/formulation-demo/transport.js` debe usar `backend: "default"` y `status: "ready"` para `prediction`.
- `src/playground/transport.js` debe emitir `backend: backend.id`, `mappedTo: reportKey`, `status: "ready"` y `payload`.

La documentacion oficial tambien avisa de que los objetos legacy que mezclan routing y payload se rechazan. Fuente: [contrato de backend](../../mlform/docs/src/content/docs/es/guides/backend-contract.md).

## Routing de reports

`mappedTo` ya no debe codificar el backend dentro de un string como `"baseline.releaseRecommendation"`. El resolver compara por separado `backend` y `mappedTo`; vease [`resolveMappedReportResult`](../../mlform/src/schema/mapped-to.ts).

Para este proyecto, los reports multi-backend deben declarar:

```js
mappedTo: { [backend.id]: "releaseRecommendation" }
mappedTo: { [backend.id]: "latencyForecast" }
```

y el transport debe responder, por ejemplo:

```js
{
  backend: "baseline",
  mappedTo: "releaseRecommendation",
  status: "ready",
  payload: prediction,
}
```

Un `mappedTo` escalar sigue siendo valido. Cuando el submit no tiene backend explicito, mlform lo asocia a `"default"`; por eso la demo de formulacion puede conservar `mappedTo: "prediction"` si su respuesta usa `backend: "default"`. La guia de reports confirma que `id` identifica el controlador visual, mientras `mappedTo` identifica la salida del backend: [reports](../../mlform/docs/src/content/docs/schema/reports.md).

La normalizacion ya permite que varios controladores consuman el mismo par `(backend, mappedTo)`. El error por targets duplicados en el schema se elimino; la ambiguedad que sigue siendo invalida es devolver dos resultados para el mismo par. Fuentes: [normalizacion del schema](../../mlform/src/schema/normalize.ts) y [resolucion de mappings](../../mlform/src/schema/mapped-to.ts).

## Estados y contexto

`skipped` se suma a los estados visuales de un report. El controlador lo trata como terminal y no ejecuta un fetch posterior. Los primitives ya tienen texto por defecto para ese estado. Fuentes: [tipo `ReportStatus`](../../mlform/src/schema/types/report.ts), [controlador de reports](../../mlform/src/runtime/reports/controller.ts) y [texto de primitives](../../mlform/src/primitives/constants.ts).

Cada resultado puede incluir un `context` propio con `displayValues`, `modelValues`, `meta` y `raw`. mlform usa ese contexto antes que el contexto global al resolver o hacer fetch del report. Esto importa si el playground simula respuestas distintas por backend. Fuente: [creacion de contextos](../../mlform/src/schema/report-context.ts).

No hace falta cambiar ahora `backend-compare`: no tiene `mappedTo` y su `resolvePayload` lee el agregado de `result.raw`. Tampoco hace falta cambiar el resolver custom de formulacion, que ya delega en `resolveMappedReportPayload`; esa funcion ahora extrae `payload` solo de un resultado `ready`.

## Otros cambios publicos observados

- `ReportResult`, `ReportResultContext` y `ReportContext` se reexportan desde `mlform/runtime`; tambien siguen disponibles desde `mlform/schema`. Fuente: [exports de runtime](../../mlform/src/runtime/index.ts).
- `resolveMappedReportResult` es una nueva exportacion de `mlform/schema` a traves de `mapped-to.ts`. Fuente: [indice de schema](../../mlform/src/schema/index.ts).
- `resolve` pasa a ser opcional en `defineReportKind`. Esto permite reports declarativos cuyo valor llega ya resuelto por el transport. No obliga a modificar los `defineReportDefinition` usados por este playground. Fuente: [`defineReportKind`](../../mlform/src/kit/kinds/define-report-kind.ts).
- Los subpaths publicos del paquete no cambian: `kit`, `runtime`, `schema`, `builtins`, `transport`, `primitives` y `design`. Los imports actuales del proyecto siguen siendo validos. Fuente: [manifest de mlform](../../mlform/package.json).

## Plan de migracion recomendado

1. Cambiar ambos transports al envelope discriminado de `ReportResult`.
2. Separar backend y clave de report en el schema y en la respuesta multi-backend.
3. Reforzar el smoke test para comprobar `backend`, `mappedTo`, `status` y `payload`, no solo la cantidad de reports.
4. Mantener una prueba de navegador que confirme que los seis reports built-in y `backend-compare` terminan en `ready`.
5. Reconstruir `../mlform` antes de verificar. La dependencia local ejecuta sus artefactos `dist`, y editar `src` no actualiza esos archivos por si solo.
6. Ejecutar `pnpm run test:mlform-api`, `pnpm run build` y `pnpm run test:e2e` en este repositorio.

## Criterios de aceptacion

- Ninguna respuesta contiene el formato legacy `{ mappedTo, payload }` sin `backend` y `status`.
- Los nueve resultados agregados llevan un par `(backend, mappedTo)` valido y unico.
- Los reports del schema multi-backend usan objetos `mappedTo` keyed por backend.
- La demo de formulacion entrega `prediction` como `ready` bajo `backend: "default"`.
- El smoke test, el build y los tests de navegador pasan contra un `dist` reconstruido desde el arbol de trabajo de mlform.

