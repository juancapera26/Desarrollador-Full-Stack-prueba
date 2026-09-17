# Especificación corregida de la prueba Full Stack

## 1. Objetivo

Construir una aplicación móvil híbrida de comercio electrónico básico para que un usuario pueda registrarse, iniciar sesión, consultar tres productos, gestionar un carrito, simular una compra y consultar los puntos obtenidos por ventas y por unidades.

La especificación toma como fuente normativa la prueba técnica original. El plan pegado amplía la organización técnica y la auditoría Scrum aporta hallazgos; ninguno de los dos agrega entregables obligatorios que contradigan la prueba.

## 2. Alcance

### Incluido

- Registro, login, logout y sesión persistente.
- Catálogo de exactamente tres productos iniciales cargados desde JSON/mock.
- Carrito con cantidades, subtotales, total, validación de stock y persistencia.
- Checkout protegido: usuario no autenticado vuelve a Login sin perder el carrito.
- Confirmación de compra y almacenamiento local del pedido.
- Módulo de puntos por cumplimiento monetario y por volumen.
- Interfaz Ionic clara y consistente.
- Código fuente en Git y APK funcional.

### Fuera de alcance

- Backend obligatorio, base de datos remota, pagos reales y autenticación avanzada.
- Seguridad de producción para contraseñas; LocalStorage es aceptable para la prueba, pero no para producción.
- Microservicios, Docker, Kubernetes, NgRx u otra complejidad no necesaria.

## 3. Stack y comandos previstos

- Ionic + Angular + TypeScript + SCSS.
- Cordova para empaquetado Android.
- LocalStorage para usuarios, sesión, carrito y pedidos.
- JSON local/mock para productos.

Comandos, sujetos a la versión real del proyecto:

```text
npm install
ionic serve
ng test
ionic build
ionic cordova platform add android
ionic cordova build android
```

## 4. Arquitectura y estructura

Las páginas presentan el estado y reciben acciones del usuario. Los servicios concentran persistencia y reglas de negocio. Los modelos definen contratos TypeScript.

```text
src/app/
├── pages/{login,register,products,cart,checkout,points}/
├── components/{product-card,cart-item,points-summary}/
├── services/{auth,product,cart,order,points}.service.ts
├── models/{user,product,cart-item,order,points}.model.ts
├── guards/auth.guard.ts
└── app.routes.ts
src/assets/data/products.json
```

Claves de persistencia: `users`, `currentUser`, `cart`, `orders`.

## 5. Contratos principales

```typescript
interface User { id: string; name: string; email: string; password: string; }
interface Product { id: number; name: string; description: string; price: number; stock: number; image: string; }
interface CartItem { product: Product; quantity: number; }
interface Order { id: string; userId: string; items: CartItem[]; total: number; createdAt: string; status: 'CONFIRMED'; }
```

Servicios mínimos:

- `AuthService`: `register`, `login`, `logout`, `isAuthenticated`, `getCurrentUser`.
- `ProductService`: `getProducts`, `getProductById`.
- `CartService`: `addToCart`, `removeFromCart`, `updateQuantity`, `getCart`, `clearCart`, `getTotal`.
- `OrderService`: `createOrder`, `getOrdersByUser`.
- `PointsService`: `calculateSalesPoints`, `calculateVolumePoints`, `getSummary`.

## 6. Reglas de negocio corregidas

### Compra

- El correo identifica de forma única al usuario.
- Registro exige nombre, correo válido, contraseña y confirmación coincidente.
- El carrito no permite cantidad menor que 1 ni mayor que el stock.
- Agregar un producto existente incrementa su línea; no crea una línea duplicada.
- No se puede confirmar un carrito vacío.
- Una compra válida crea un pedido, lo guarda y limpia el carrito.

### Puntos por ventas en pesos

Cuota trimestral: `$11.000.000 COP`. El porcentaje es `ventasEjecutadas / 11.000.000 * 100`.

| Cumplimiento | Puntos |
|---|---:|
| 0%–9% | 0 |
| 10%–29% | 20 |
| 30%–49% | 40 |
| 50%–79% | 70 |
| 80% o más | 100 |

Se interpreta `-10%` del PDF como `0%–9%`, y el cumplimiento superior al 100% conserva 100 puntos. La frase “un punto equivale a $1.500” se documenta como valor monetario referencial por punto; no altera la asignación de puntos mientras la prueba no solicite calcular un pago.

### Puntos por volumen

Cuota trimestral: `6.000 unidades`. Para eliminar los solapamientos y el texto imposible `-999 productos = 100`, se adopta esta interpretación monotónica:

| Unidades vendidas | Puntos |
|---|---:|
| 0–999 | 0 |
| 1.000–2.999 | 50 |
| 3.000–3.999 | 100 |
| 4.000 o más | 150 |

Esta decisión es una corrección propuesta de la ambigüedad del documento de auditoría y debe ser confirmada por el responsable del negocio antes de cerrar HU09/HU10. No se deben implementar rangos alternativos silenciosamente.

## 7. Validaciones y estados

Debe existir mensaje visible para: campos inválidos, correo duplicado, credenciales incorrectas, producto sin stock, imagen inexistente, carrito vacío, error de carga y ausencia de pedidos/puntos.

## 8. Estrategia de pruebas

- Unitarias: validaciones, autenticación, carrito, totales, persistencia y límites de puntos.
- Integración: registro → login → catálogo → carrito → checkout → pedido → resumen.
- Manual móvil: flujo completo, recarga, cierre/reapertura, navegación y recursos.
- Límites de puntos: 0, 9/10/29/30/49/50/79/80%, 999/1000/2999/3000/3999/4000 unidades.

## 9. Definition of Done

- Código organizado por responsabilidad y sin errores de compilación.
- Historias implementadas y verificadas con criterios de aceptación.
- Pruebas ejecutadas y flujo principal validado.
- Persistencia funciona tras recargar la aplicación.
- No hay botones sin función, pantallas vacías ni errores críticos de consola.
- README documenta instalación, versiones y ejecución.
- APK generada y probada en Android.
- No se incluyen `node_modules`, secretos ni datos sensibles.

## 10. Límites de trabajo

- Siempre: validar entradas, centralizar LocalStorage en servicios, probar cada historia y mantener commits trazables.
- Consultar antes: cambiar reglas de puntos, añadir backend/dependencias, modificar el alcance o introducir autenticación real.
- Nunca: inventar reglas de negocio, eliminar pruebas para obtener una compilación verde ni almacenar secretos.

## 11. Pregunta abierta bloqueante

Confirmar con negocio que la corrección propuesta para volumen es `0–999 = 0`, `1.000–2.999 = 50`, `3.000–3.999 = 100`, `4.000+ = 150`. La implementación puede avanzar en autenticación, catálogo, carrito y compra mientras se confirma.
