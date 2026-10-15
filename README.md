# prueba-mlform

Vite playground for the public `mlform` API, linked from `../mlform`. Build the sibling library before starting the playground.

## Demos

- `M3DISEEN`: custom formulation interface connected to the five public A2022 models, with real source examples and explicit partial errors when an upstream model is unavailable.
- `Lab2pressure/lite` (`/#lab2pressure-lite`): M3DISEEN-style interface for the real `Best BP Minimal` model. Four laboratory series and paired blood-pressure readings produce its exact 16 named inputs. Inference runs locally in the browser.
- `DoseTailor` (`/#dosetailor`): [Tacrolimus DoseTailor](https://dosetailor.com/tacrolimusv1) inputs and predictions, starting at Load Example with its original examples, field options, level prediction, optimal-dose recommendation and dose-level curve. Uses MLForm field primitives and the real public API.
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

M3DISEEN calls `/api/m3diseen/a2022/*`, proxied to `https://api.m3diseen.com/a2022/*` in development and preview. The combined custom report aggregates filament characteristics, extrusion temperature, printability, printing temperature and dissolution. It displays available outputs and names each failed model; it never fills missing results with simulated predictions. All-model failures are shown as submission errors. The dissolution model returns times to 20%, 50% and 80% release, in that order, with exact values available below the chart. Calls have a 30-second timeout and are cancelled on input edits or unmount. Editing inputs also hides previous results until resubmission.

Its three examples reproduce the public `/experiments` records 245, 422 and 838 and their `/concentrations`, with percentages summing to 100. The local material catalog retains a small subset with exact upstream material/supplier identifiers. Supplier labels and equipment values match the public records. On 2026-10-15, four models returned predictions for example 422; `/a2022/printing_temp` returned HTTP 500 and is displayed as unavailable. Production hosting must provide the same `/api/m3diseen/*` proxy route.

## Clinical demos

Both clinical demos use `mountForm` with native MLForm `section` and `group` layout nodes and built-in field primitives. Lab2pressure uses series fields; DoseTailor uses number and category fields and registers its combined prediction table and curve as a custom MLForm report plugin. The sections are collapsible, with no application-rendered section headings. Editing inputs hides the previous prediction until resubmission.

The BP schema is copied unchanged from `../models/new-ones/mlbundles_0.1.0a2/best_BP_Minimal.json`. It accepts one observation per series, uses population blood-pressure standard deviations (`ddof: 0`) and linear quartiles. No extra scaling or imputation is applied. `public/models/` contains the numeric symmetric-tree model exported from the matching bundle; it is fetched only when predicting. Native CatBoost reference fixtures cover 72 cases, including float32 split boundaries, with probability tolerance `1e-12`.

To regenerate the model, schema and reference fixtures in this workspace:

```powershell
../mlbundle/.venv/Scripts/python.exe scripts/export-bp-model.py
```

DoseTailor uses `/api/dosetailor/*`, proxied to `https://api.dosetailor.com/*` by both the Vite development and preview servers because the upstream API restricts browser origins. A production host serving `dist/` must provide the same proxy route; a static-only host cannot execute DoseTailor predictions. The API is called only on Predict, with a 30-second timeout, cancellation on input edits or unmount, and visible failure messages. The Labs model is selected when all optional clinical-setting, laboratory and concomitant-drug fields are complete; otherwise the No Labs model is used. Numeric category codes and the original age groups are preserved.

DoseTailor retains the original public sample values and options. It uses the playground's shared theme and existing violet background, without the original site's navigation, introductory explanation, logos, footer or extra page background.
