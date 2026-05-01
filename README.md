# prueba-mlform

Playground en Vite para probar `mlform` localmente contra el paquete enlazado en `../mlform`.

## Que cubre

- una unica demo montada con la API de `kit`
- uso de `transport` + `createFanoutTransport(...)` del kit para multibackend
- uso de middleware publicos del kit con `pipe(...)`, `withTimeout(...)` y `withRetry(...)`
- tres backends reales en Node, cada uno con medio distinto:
  - `baseline`
  - `optimistic`
  - `conservative`
- `baseline`: REST JSON
- `optimistic`: GraphQL
- `conservative`: JSON-RPC
- un transport agregado que consulta los tres backends y aplana sus reports
- codigo del playground modularizado en `src/playground/*`
- reports built-in por backend:
  - classifier de recomendacion
  - regressor de latencia
- un report custom `backend-compare` que usa el payload agregado de varios backends
- render directo sobre `document.body` con `containerStrategy: "replace"`
- `layout: split` y `reportPane: "always"`

## Como usarlo

```bash
npm install
npm run dev
```

`npm run dev` arranca:

- tres servidores Node:
  - `http://127.0.0.1:4301/predict`
  - `http://127.0.0.1:4302/graphql`
  - `http://127.0.0.1:4303/rpc`
- Vite para frontend

El submit del playground usa un `transport` compuesto con `createFanoutTransport(...)`, y cada backend pasa por `pipe(createJsonTransport(...), withTimeout(...), withRetry(...))`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
