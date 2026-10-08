# prueba-mlform

Vite playground for the public `mlform` API, linked from `../mlform`. Build the sibling library before starting the playground.

## Demos

- `M3DISEEN`: custom formulation interface.
- `Field combos`: built-in field combinations.
- `Series`: split view with editable series of 1, 2, 3 and 4 columns, schema and 35 calculated outputs. Expand the clinical example to see all 114 inputs for `Mejor Toda Bioquimica PA`.
- `Stacked`: stacked layout with collapsible sections.
- `Split`: split layout with internal scrolling.
- `Wizard`: wizard layout with final reports.
- `Tabs`: tabbed layout.

The Series examples keep aggregate summaries hidden in the form and expose help through field descriptions. Standard deviations use `ddof: 1`; quartiles use linear interpolation. The clinical classifier response is simulated.

## Commands

```bash
pnpm install
pnpm dev
pnpm test:mlform-api
pnpm test:unit
pnpm test:e2e
pnpm build
```

`pnpm dev` serves the playground at `http://localhost:10001`; browser tests use port `10002`.

Custom reports use `defineMLFormPlugin` from `mlform/view` and the public `plugins` option of `mountForm`/`createFormView`. Import `mountForm` from `mlform/kit` and `createFormView` from `mlform/view`.

M3DISEEN uses `createPrimitiveAdapter` from `mlform/kit` to keep fields and its report in stable interface slots. Its `custom` layout node declares the fields managed by the materials panel.
