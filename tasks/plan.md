# Plan de implementación de la prueba Full Stack

## Enfoque

Implementar por cortes verticales, manteniendo la aplicación ejecutable después de cada checkpoint. `SPEC.md` es la fuente de comportamiento y `BACKLOG.md` la fuente de historias y prioridades.

## Fases

### Fase 1 — Fundamentos y autenticación

- HU01: modelos, persistencia y pantalla de registro.
- HU02: login, logout, sesión y navegación.
- Verificar formularios, duplicados, credenciales y recarga.

### Fase 2 — Catálogo y carrito

- HU03: JSON, servicio, tarjeta y catálogo.
- HU04: agregar, agrupar líneas y validar stock.
- HU05: editar cantidades, eliminar, vaciar y total.
- Verificar catálogo → carrito con persistencia.

### Fase 3 — Compra y persistencia

- HU06: guard/validación de checkout.
- HU07: pedido, confirmación y limpieza del carrito.
- HU08: centralizar LocalStorage y manejar datos ausentes.
- Verificar flujo completo por usuario.

### Fase 4 — Puntos

- HU09: puntos monetarios.
- HU10: puntos por volumen tras confirmar la tabla.
- HU11: resumen y estados vacíos.
- Verificar límites y pedidos aislados por usuario.

### Fase 5 — Entrega

- HU12: pruebas, README, build Android y APK.

## Dependencias y paralelización

La cadena principal es secuencial por dependencia. Mientras se implementa una fase, se pueden preparar pruebas y documentación de la siguiente, pero no se deben integrar reglas de puntos ambiguas sin decisión registrada.

## Verificaciones de salida

- Cada checkpoint debe compilar y dejar el flujo anterior funcionando.
- Antes de Android: pruebas unitarias, flujo manual y revisión de errores de consola.
- Antes de entregar: instalación limpia, APK ejecutable y README actualizado.

## Decisión pendiente

Confirmar la interpretación de la banda de volumen documentada en `SPEC.md` antes de cerrar HU10.
