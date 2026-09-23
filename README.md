# prueba-mlform

Playground Vite para probar la superficie pública actual de `mlform`, enlazada desde `../mlform`.

## Demos

- `M3DISEEN`: demo custom de formulacion.
- `Stacked`: layout stacked con secciones collapsables.
- `Split`: layout split con scroll interno.
- `Wizard`: layout wizard con reports finales.
- `Tabs`: layout tabs.

## Scripts

```bash
pnpm install
pnpm dev
pnpm test:mlform-api
pnpm test:e2e
pnpm build
```

Los reports propios se integran mediante `defineMLFormPlugin` de `mlform/view` y la opción pública `plugins` de `mountForm`/`createFormView`. `mountForm` se importa desde `mlform/kit` y `createFormView` desde `mlform/view`.
