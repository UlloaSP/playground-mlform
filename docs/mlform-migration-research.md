# Investigación histórica: migración a MLForm 0.1.21

> Documento histórico de la migración realizada el 2026-08-23. Para el contrato vigente y su verificación, consulta [`mlform-0.1.24-interface-analysis.md`](./mlform-0.1.24-interface-analysis.md).

Fecha de comprobación: 2026-08-23.

## Estado que manda

Este proyecto no instala MLForm desde npm. [`package.json`](../package.json) apunta a `file:..\\mlform` y [`pnpm-lock.yaml`](../pnpm-lock.yaml) lo resuelve como `link:../mlform`. La referencia para esta migración es, por tanto, el repositorio local `C:\software\mlform`.

El `HEAD` local de MLForm es `9a979ca` y su [manifest](../../mlform/package.json) declara `0.1.21`. El repositorio está limpio y `dist` fue reconstruido después de los cambios de fuente. La dependencia enlazada expone también `0.1.21`. No hace falta consultar npm o GitHub para decidir qué contrato ejecuta este proyecto. Además, [la tarea de release local](../../mlform/tasks/todo.md) dice expresamente que `0.1.21` se preparó sin publicar.

## Cronología desde 66e49fe

El commit `66e49fe` de `prueba-mlform`, creado a las 16:14, migró los resultados de report a envelopes con `backend`, `mappedTo`, `status` y `payload`. Después se cerraron dos commits en MLForm:

- `f0152af`, tag `v0.1.20`, a las 16:35. Formalizó el contrato estricto de reports, añadió validación de schema y publicó helpers como `createFanoutTransport`. Es el estado que la migración de `66e49fe` ya anticipaba.
- `9a979ca`, `0.1.21`, a las 17:47. Eliminó los aliases transitorios de valores y dejó solo `inputs`, `displayValues` y `modelValues` en requests, resultados, hooks y report fetches. Este es el cambio nuevo que afecta al consumidor.

La comparación reproducible es:

```text
git -C C:\software\mlform diff v0.1.20..HEAD
git -C C:\software\prueba-mlform show 66e49fe
```

## Cambio que requiere migración

Los contratos públicos [`SubmitRequest`](../../mlform/src/transport/types.ts), [`SubmitResult`](../../mlform/src/schema/types/submit.ts) y [los hooks de submit](../../mlform/src/runtime/types/transport.ts) ya no contienen estas propiedades:

```text
values
fieldValues
serializedValues
serializedFieldValues
```

Los únicos registros públicos de valores completos son:

- `inputs`, una lista por campo con `fieldId`, `value`, `serializedValue`, `mappedTo` y los `modelValues` de ese campo;
- `displayValues`, datos de revisión o exportación keyed por `displayKey`;
- `modelValues`, datos para el modelo keyed por `mappedTo`.

MLForm aplicó la misma limpieza a los contextos de behaviors, los requests de report fetch y los adaptadores de primitives. Fuentes: [behavior](../../mlform/src/runtime/types/behavior.ts), [report fetch](../../mlform/src/schema/report-fetch-request.ts) y [contratos de primitives](../../mlform/src/primitives/controller-types.ts). El [ledger de deuda](../../mlform/DEBT.md) y [la tarea 0.1.21](../../mlform/tasks/todo.md) confirman que no es una deprecación: los aliases se retiraron.

En el commit `66e49fe`, el producto ya consumía `request.modelValues`; por eso no hay que modificar los transports. Las incompatibilidades estaban limitadas a las comprobaciones de test:

- `scripts/smoke-mlform-api.mjs` leía `request.fieldValues` tres veces.
- `tests/e2e/mlform-new-api.spec.js` leía `lastResult.fieldValues` una vez.

Esas comprobaciones deben buscar el campo por `fieldId` dentro de `inputs` y verificar `input.value`. No deben reconstruir un mapa alternativo, porque eso reintroduciría el alias que MLForm acaba de eliminar.

## Lo que sigue siendo válido

La migración de reports de `66e49fe` no necesita una segunda reescritura:

- [`src/formulation-demo/transport.js`](../src/formulation-demo/transport.js) devuelve `prediction` como `ready` bajo `backend: "default"`.
- [`src/playground/transport.js`](../src/playground/transport.js) devuelve un envelope por par exacto de backend y output.
- [`src/playground/schema.js`](../src/playground/schema.js) separa el backend de `mappedTo`.
- [`resolveMappedReportPayload`](../../mlform/src/schema/mapped-to.ts) sigue resolviendo únicamente por rutas explícitas `(backend, mappedTo)`.

El envelope vigente continúa siendo:

```ts
{ backend, mappedTo, status: "ready", payload, context? }
{ backend, mappedTo, status: "pending", context? }
{ backend, mappedTo, status: "skipped", reason?, context? }
```

`ready` requiere `payload`; `pending` y `skipped` no lo admiten. [`ReportResult`](../../mlform/src/schema/types/submit.ts) es la fuente del tipo.

## Otros cambios públicos, sin migración obligatoria aquí

Los subpaths de paquete no cambiaron. El [manifest](../../mlform/package.json) sigue exportando `kit`, `runtime`, `schema`, `builtins`, `transport`, `primitives` y `design`, y todos los imports actuales del proyecto usan esos entrypoints.

MLForm 0.1.21 añade o endurece APIs que este playground no consume:

- [`resolveMappedRoutes`](../../mlform/src/schema/mapped-to.ts) conserva el backend aunque dos backends usen el mismo target. Los resolvers actuales ya delegan en `resolveMappedReportPayload`.
- [`validateSchema`, `findUnknownKinds` y `toSchemaJsonSchema`](../../mlform/src/schema/validation.ts) ya eran públicas en 0.1.20. En 0.1.21 mejoran los paths para errores de `series`; este proyecto define schemas estáticos válidos y no necesita adoptarlas.
- [`SchemaNormalizationError`](../../mlform/src/schema/normalize.ts) aporta paths exactos, incluidos subcampos de `series`. Los schemas actuales normalizan sin error.
- `inputs`, `displayValues`, `modelValues` y `reportContexts` pasan de opcionales a obligatorios en varios contratos internos de primitives y report fetch. El runtime los construye; los transports de este proyecto no fabrican `SubmitResult` ni `ReportFetchRequest`.

La eliminación de submission streaming tampoco exige trabajo. Ocurrió en `1569268`, antes de `66e49fe`, y no hay usos de `stream`, progress events ni partial-update policies en `src`, `scripts` o `tests` del consumidor.

Hay documentación heredada en MLForm que todavía menciona `serializedValues`. Para esta migración mandan los tipos de `src`, sus declaraciones en `dist`, el diff `v0.1.20..HEAD`, [`DEBT.md`](../../mlform/DEBT.md) y [`tasks/todo.md`](../../mlform/tasks/todo.md).

## Plan de actualización

1. Sustituir las lecturas de `fieldValues` en el smoke test por búsquedas en `request.inputs` usando `fieldId` y, cuando importe, `value`.
2. Sustituir la aserción E2E de `lastResult.fieldValues["risk-tier"]` por la entrada equivalente de `lastResult.inputs`.
3. No tocar los transports, el schema ni los report definitions: ya cumplen el contrato de `0.1.21`.
4. Ejecutar una búsqueda de los cuatro aliases retirados en `src`, `scripts` y `tests` para impedir que quede otro consumidor oculto.
5. Verificar contra el `dist` actual de MLForm con `pnpm test:mlform-api`, `pnpm build` y `pnpm test:e2e`.

## Criterios de aceptación

- `rg "fieldValues|serializedValues|serializedFieldValues" src scripts tests` no encuentra usos. `values` no se prohíbe de forma global porque `snapshot.form.values` es estado legítimo del formulario, no un alias de submit.
- El smoke comprueba valores de runtime por `inputs`, datos de modelo por `modelValues` y datos de presentación por `displayValues`.
- E2E comprueba el valor de `risk-tier` mediante `lastResult.inputs`.
- Los transports continúan devolviendo nueve rutas únicas en el playground y una ruta `default/prediction` en formulación, todas con estado `ready` y payload.
- `pnpm test:mlform-api`, `pnpm build` y `pnpm test:e2e` pasan con la dependencia enlazada a MLForm `0.1.21`.
- El cambio no añade un mapa de compatibilidad para `fieldValues` ni modifica código de producto que ya cumple el contrato.
