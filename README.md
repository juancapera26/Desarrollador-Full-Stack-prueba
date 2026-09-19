# Comercio - prueba Full Stack

Aplicacion movil hibrida de comercio electronico construida con Ionic, Angular, TypeScript y Cordova. Permite registrar usuarios, iniciar sesion, consultar un catalogo, gestionar un carrito, confirmar pedidos y consultar puntos por ventas y volumen.

## Inicio rapido

Requisitos:

- Node.js 22 o compatible con Angular 20.
- JDK 17 para compilar Android con Cordova.
- Android SDK y un emulador configurado para generar/probar la APK.

Instalacion:

```powershell
npm install
```

Servidor web de desarrollo:

```powershell
npm start
```

La aplicacion se abre normalmente en `http://localhost:4200`.

## Comandos principales

| Comando | Uso |
| --- | --- |
| `npm start` | Inicia Angular en modo desarrollo. |
| `npm run build` | Genera el build de produccion en `dist/`. |
| `npm run seed:products` | Crea los productos iniciales que no existan en Firestore. |
| `npm run android:build` | Compila la APK Android sin instalarla. |
| `npm run android:run` | Compila, sincroniza e instala la APK en un emulador conectado. |

Para Android, Cordova/Gradle usa JDK 17:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17.0.19+10'
npm run android:run
```

## Arquitectura

La aplicacion es una SPA Ionic Angular empaquetada como APK mediante Cordova.

- `src/app/pages/`: componentes standalone de las pantallas de registro, login, catalogo, carrito, checkout y puntos.
- `src/app/services/`: servicios de autenticacion, productos, carrito, pedidos y puntos. Los componentes delegan en estos servicios las operaciones de datos.
- `src/app/models/`: interfaces TypeScript para usuarios, productos, carrito, pedidos y resumen de puntos.
- `src/app/guards/`: proteccion de rutas que requieren una sesion activa.
- `src/app/app.routes.ts`: rutas lazy-loaded y guardas.
- `src/assets/data/products.json`: catalogo local de respaldo con tres productos.
- `src/app/firebase.config.ts`: configuracion publica del SDK web de Firebase.
- `firestore.rules`: reglas de Firestore usadas por esta prueba tecnica.
- `config.xml`: configuracion de Cordova y el identificador Android `com.prueba.desarrollador.fullstack`.

Firestore almacena usuarios, carritos, productos y pedidos. La sesion activa del dispositivo se mantiene en LocalStorage. Los pedidos confirmados alimentan el resumen de puntos del usuario actual.

## Flujo funcional

1. El usuario se registra o inicia sesion.
2. Consulta el catalogo y agrega productos al carrito.
3. El carrito valida cantidades contra el stock y persiste los cambios.
4. Checkout exige autenticacion, valida stock y crea un pedido `CONFIRMED`.
5. La compra descuenta el inventario y vacia el carrito solo despues del exito.
6. En `Mis puntos` se suman los pedidos del usuario y se calculan puntos por ventas y volumen.

Reglas de puntos:

- Ventas: cuota de `$11.000.000 COP`; los rangos entregan 0, 20, 40, 70 o 100 puntos.
- Volumen: 0-999 unidades = 0; 1.000-2.999 = 50; 3.000-3.999 = 100; 4.000 o mas = 150.

## Firebase y datos de prueba

El proyecto Firebase configurado es `catalogo-productos-77ab`. Para desplegar reglas se necesita tener Firebase CLI autenticado y permisos sobre el proyecto:

```powershell
npx firebase login
npx firebase deploy --only firestore:rules --project catalogo-productos-77ab
```

Luego se pueden crear los tres productos iniciales:

```powershell
npm run seed:products
```

El script no sobrescribe productos que ya existen. Las reglas actuales y el almacenamiento de contrasenas son decisiones aceptables solo para esta prueba tecnica; no representan una configuracion de produccion segura.

## APK

La APK de debug generada queda en:

```text
platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

`www/`, `dist/` y `platforms/` son salidas generadas y estan ignoradas por Git. Para una entrega reproducible se deben generar con los comandos anteriores.

## Estado de la entrega

HU01 a HU11 y los checkpoints 1 a 4 estan implementados. HU12 incluye esta documentacion, el build de produccion y la APK Android. El checkpoint final queda para la revision final de Definition of Done.

## Limitaciones conocidas

- Es una prueba tecnica: no incluye pagos reales ni autenticacion Firebase Authentication.
- Las reglas de Firestore son deliberadamente permisivas para el mock.
- Las contrasenas se almacenan en texto plano; esto debe cambiarse antes de cualquier uso real.
- El stock inicial es pequeno, por lo que los umbrales altos de puntos por volumen se validan con datos de demostracion.
