# Product Backlog de la prueba Full Stack

## Prioridad y criterios

Prioridad: P0 = imprescindible para el flujo de compra, P1 = imprescindible para completar la prueba de análisis, P2 = entrega y calidad. Las estimaciones son relativas en puntos, no horas.

| ID | Historia | Prioridad | Estimación | Dependencias | Estado |
|---|---|---:|---:|---|---|
| HU01 | Registro de usuario | P0 | 3 | — | Pendiente |
| HU02 | Inicio y cierre de sesión | P0 | 3 | HU01 | Pendiente |
| HU03 | Catálogo de tres productos | P0 | 3 | HU02 | Completada |
| HU04 | Agregar productos al carrito | P0 | 3 | HU03 | Completada |
| HU05 | Gestionar carrito | P0 | 5 | HU04 | Completada |
| HU06 | Proteger checkout con autenticación | P0 | 3 | HU02, HU05 | Completada |
| HU07 | Crear pedido y confirmar compra | P0 | 5 | HU06 | Completada |
| HU08 | Persistir usuarios, sesión, carrito y pedidos | P0 | 3 | HU01, HU04, HU07 | Completada |
| HU09 | Calcular puntos por ventas en pesos | P1 | 3 | HU07, HU08 | Completada |
| HU10 | Calcular puntos por volumen | P1 | 3 | HU07, HU08 | Completada |
| HU11 | Mostrar resumen de puntos | P1 | 3 | HU09, HU10 | Completada |
| HU12 | Preparar entrega, README y APK | P2 | 5 | HU01–HU11 | Pendiente |

## Historias y criterios de aceptación

### HU01 — Registro de usuario

Como usuario nuevo, quiero registrarme con nombre, correo y contraseña para poder comprar.

- Formulario con nombre, email, contraseña y confirmación.
- Valida obligatorios, formato de email y coincidencia de contraseñas.
- Rechaza email duplicado y guarda el usuario en `users`.
- Muestra confirmación y permite ir a Login.

### HU02 — Inicio y cierre de sesión

Como usuario registrado, quiero iniciar y cerrar sesión para controlar mi acceso.

- Credenciales válidas guardan `currentUser` y navegan al catálogo.
- Credenciales inválidas muestran un error sin crear sesión.
- Logout elimina la sesión; una recarga conserva una sesión válida.

### HU03 — Catálogo

Como usuario, quiero consultar productos antes de comprar.

- Carga tres productos desde `src/assets/data/products.json` mediante `ProductService`.
- Cada tarjeta muestra nombre, imagen, descripción, precio y stock.
- Imagen inexistente, error de carga y producto sin stock tienen estado visible.

### HU04 — Agregar al carrito

Como usuario, quiero agregar productos para preparar una compra.

- Agregar una vez crea una línea con cantidad 1.
- Agregar el mismo producto vuelve a usar la línea y aumenta cantidad.
- Nunca supera el stock y confirma visualmente el resultado.

### HU05 — Gestionar carrito

Como usuario, quiero modificar cantidades y revisar el total.

- Muestra producto, cantidad, precio unitario, subtotal y total.
- Permite aumentar, disminuir, eliminar y vaciar.
- Respeta cantidad mínima 1 y máxima igual al stock; recalcula y persiste.

### HU06 — Checkout autenticado

Como sistema, quiero exigir autenticación antes de finalizar una compra.

- Usuario autenticado puede continuar a `/checkout`.
- Usuario no autenticado vuelve a `/login`.
- El carrito permanece intacto durante el login y un carrito vacío no puede finalizar.

### HU07 — Pedido y confirmación

Como usuario autenticado, quiero confirmar mi compra y obtener un número de pedido.

- Valida sesión, carrito no vacío y stock vigente.
- Crea un pedido `CONFIRMED` asociado al usuario y lo guarda en `orders`.
- Muestra confirmación/resumen y limpia el carrito solo tras éxito.

### HU08 — Persistencia

Como usuario, quiero conservar mis datos al recargar o reabrir la app.

- Servicios, no componentes, acceden a Firestore/LocalStorage (ver nota de arquitectura abajo).
- Usuarios, carrito y pedidos sobreviven a recarga porque viven en Firestore; solo el flag de sesión activa (`currentUser`) vive en LocalStorage del dispositivo.
- Falla de red/Firestore produce un estado vacío controlado y no rompe la app.

> **Nota de arquitectura (2026-09-17):** por decisión explícita del usuario, esta app usa **Firestore** como backend real para `users` (implementado en HU01) y, cuando se autoricen HU04–HU08, para carrito y pedidos. Ver `SPEC.md` sección 2 para el detalle completo. Las menciones a "LocalStorage" en historias no implementadas aún deben leerse como "Firestore", salvo la sesión activa del dispositivo (`currentUser`).

### HU09 — Puntos por ventas

Como usuario, quiero saber mis puntos según mis ventas trimestrales.

- Usa cuota `$11.000.000 COP` y las bandas corregidas de `SPEC.md`.
- Aísla la fórmula en `PointsService`.
- Prueba límites 0%, 10%, 30%, 50%, 80% y >100%.

### HU10 — Puntos por volumen

Como usuario, quiero saber mis puntos según unidades vendidas.

- Usa cuota de 6.000 unidades y la tabla corregida de `SPEC.md`.
- Prueba límites 999, 1.000, 2.999, 3.000, 3.999 y 4.000.
- No implementa la regla hasta confirmar la interpretación propuesta si negocio la rechaza.

### HU11 — Resumen de puntos

Como usuario, quiero consultar puntos por ventas, por volumen y el total.

- Muestra las tres cantidades claramente.
- Usa pedidos del usuario actual, no pedidos de otro usuario.
- Muestra estado vacío sin ventas y recalcula tras recargar.

### HU12 — Entrega

Como evaluador, quiero ejecutar y revisar la solución desde cero.

- README incluye versiones, instalación, comandos, arquitectura y credenciales de prueba si existen.
- `npm install`, pruebas y build funcionan en un entorno limpio.
- APK Android generada y flujo móvil validado.
- Repositorio no contiene artefactos sensibles ni `node_modules`.

## Orden de implementación y checkpoints

1. HU01 → HU02. Checkpoint: registro/login, validaciones y sesión.
2. HU03 → HU05. Checkpoint: catálogo y carrito persistente con totales.
3. HU06 → HU08. Checkpoint: compra completa, protección y persistencia.
4. HU09 → HU11. Checkpoint: puntos con casos límite y resumen.
5. HU12. Checkpoint final: pruebas, README y APK.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Rangos de puntos ambiguos | Alto | Mantener decisión explícita y confirmar antes de HU10 |
| LocalStorage no disponible o corrupto | Medio | Adaptador de lectura/escritura con valores por defecto |
| Compatibilidad Ionic/Cordova/Android | Alto | Validar build móvil desde el inicio del proyecto |
| Contraseñas en texto plano | Medio | Aceptarlo solo como mock de prueba y documentar que no es producción |

## Evidencia Scrum mínima recomendada

- Product Backlog: este archivo.
- Sprint Backlog: selección de tareas por checkpoint.
- Sprint Goal: completar cada flujo vertical indicado.
- Review: demo del flujo funcionando.
- Retrospectiva: registrar qué funcionó, impedimentos y una acción de mejora.
- Incremento: código integrado, probado y ejecutable al cierre de cada checkpoint.
