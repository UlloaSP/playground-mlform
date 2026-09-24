# Análisis de compatibilidad e interfaz con MLForm 0.1.24 y HEAD

Fecha de verificación: 2026-09-23.

## Resultado

El proyecto consume la dependencia local MLForm 0.1.24 en `60186fb`. El contrato separa `mlform/view` de `mlform/kit`: `createFormView` y `defineMLFormPlugin` se importan desde `view`; `mountForm`, `createPrimitiveAdapter` y los valores por defecto del kit se importan desde `kit`. El estado del formulario se lee mediante `lifecycle`, `operation` y `submissionStatus`; los `FormViewController` headless se liberan con `dispose()`.

Las secciones de layout requieren un título no vacío. M3DISEEN usa un `group` exterior y un nodo `custom` que declara los campos gestionados por su panel de materiales. `createPrimitiveAdapter` monta campos y reports en slots estables y sincroniza sus descriptors sin reconstruir el host. La migración conserva schemas, transportes, rutas por hash, labels y componentes de report.

## Lectura de la interfaz

La aplicación es un laboratorio técnico con 6 vistas. Su prioridad es permitir inspeccionar campos, layouts y reports, no funcionar como landing comercial. La dirección visual adecuada es por tanto una interfaz de herramienta, con densidad media, movimiento bajo y una jerarquía centrada en estado, validación y resultado.

### Lo que funciona bien

- Los layouts stacked, split, wizard y tabs muestran diferencias reales del kit sin cambiar el modelo de datos.
- El estado del formulario y de los reports permanece visible durante el recorrido.
- La demo M3DISEEN ofrece un flujo completo: carga de ejemplo, composición, validación y predicción.
- Los estados vacíos, de error y de éxito están presentes y son legibles.
- La composición se adapta a móvil sin desbordamiento horizontal en los 6 demos.

### Problemas corregidos

- El botón flotante del selector se superponía al primer encabezado. Ahora existe una franja superior reservada.
- El menú cerrado seguía disponible para tecnologías de asistencia. Ahora usa `hidden`, semántica de menú y navegación con flechas, Home, End y Escape.
- Los controles personalizados de materiales carecían de nombres suficientemente descriptivos. Ahora los selects, rangos, inputs numéricos y acciones de borrado tienen nombre accesible.
- Los estados y errores propios no se anunciaban. Ahora usan `aria-live` y `role="alert"`.
- La demo M3DISEEN todavía leía `form.status`, retirado de la API. Ahora separa operación, resultado de submit y ciclo de vida, y deshabilita acciones cuando el controlador no está activo.
- La demo de combinaciones incluía rangos imposibles para probar errores. Como esos errores ahora pertenecen a la normalización del schema, usa configuraciones válidas con valores iniciales inválidos para seguir probando la validación interactiva.
- `createFormView` y `defineMLFormPlugin` dejaron de exportarse desde `mlform/kit`. Los consumidores headless y los plugins se importan desde `mlform/view`.
- M3DISEEN usaba una `section` sin título como contenedor exterior. Ahora usa `group` y conserva los encabezados visibles de Materials, Other parameters y Prediction.
- El panel de materiales ya no simula un campo visible por cada material en el layout: un nodo `custom` declara sus campos y el host los dibuja.
- Los frames de campos y reports ya no se recrean en cada snapshot. `createPrimitiveAdapter` los mantiene en los mismos slots; la aplicación solo actualiza el panel propio, los errores y las acciones.
- El presenter del report de predicción devuelve un descriptor también antes del submit, para conservar el estado visual «Awaiting submission» con el nuevo adaptador.
- El montaje headless de M3DISEEN no liberaba el controlador al cambiar de ejemplo o desmontar. Ahora llama a `dispose()` en ambos recorridos.
- Los controles propios no compartían un foco visible consistente. Se añadió un anillo de foco de alto contraste.
- La única transición propia no respetaba movimiento reducido. Ahora se desactiva con `prefers-reduced-motion`.
- Faltaban metadatos de color de navegador y la petición del favicon producía un 404.

### Riesgos que conviene vigilar

1. El bundle principal queda en 528.83 kB minificado y Vite emite una advertencia. No bloquea el playground, pero si se convierte en producto conviene cargar cada demo de forma diferida.
2. M3DISEEN mezcla una capa propia con primitives de MLForm. La consistencia visual depende de mantener alineados los tokens `--mlf-*` y los estilos locales.
3. El modo del playground está fijado a `light`. Es coherente para este laboratorio, pero no demuestra el modo oscuro del design system.
4. Los botones de ayuda pertenecen a MLForm y aparecen deshabilitados cuando un campo no aporta ayuda. Resultan visualmente repetitivos; cualquier cambio debe realizarse en el contrato o theme de MLForm, no ocultarse desde el consumidor.
5. El layout split prioriza densidad y comparación simultánea. En pantallas pequeñas sigue siendo funcional, aunque stacked o wizard ofrecen mejor lectura lineal.

## Verificación realizada

- `pnpm test:mlform-api`: contrato de requests, inputs, valores de modelo, valores de presentación, 1 report de formulación, 7 controladores del playground y 9 envelopes de backend.
- `pnpm build`: build de producción correcto.
- `pnpm test:e2e`: 22 pruebas correctas en Chromium de escritorio y Pixel 7 emulado.
- Recorridos cubiertos: los 6 demos, submit de formulación, fanout multi-backend, report custom, validación inválida, navegación de menú por teclado y persistencia del foco y de los frames al editar materiales.
- Comprobación visual manual: M3DISEEN en espera en escritorio y con resultado en escritorio y móvil; stacked y tabs en escritorio; split y wizard en móvil.
- Consola del navegador: 0 errores. Permanece únicamente el aviso de Lit en modo desarrollo.

Las capturas de comprobación se guardan en `output/playwright/` y no forman parte del producto.
