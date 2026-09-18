# Documento de continuidad del proyecto

## Propósito

Este documento permite que otra IA o desarrollador continúe la prueba técnica sin perder el contexto del trabajo realizado. Debe leerse antes de modificar código.

## Instrucción principal del usuario

El desarrollo debe hacerse una historia de usuario a la vez. El usuario autoriza explícitamente cuándo iniciar la siguiente historia. No avanzar automáticamente a HU02 ni implementar funcionalidades futuras sin autorización.

## Proyecto

Prueba técnica para Desarrollador Junior Full Stack: aplicación móvil híbrida tipo e-commerce.

Repositorio remoto configurado por el usuario:

```text
https://github.com/juancapera26/Prueba-Desarrollador-Full-Stack.git
```

Stack objetivo:

- Ionic.
- Angular.
- TypeScript.
- Cordova para Android.
- LocalStorage para persistencia de la prueba.
- JSON/mock para productos.

Entorno Android:

- JDK 17.0.19 instalado en `C:\Program Files\Java\jdk-17.0.19+10`.
- Cordova Android 13 o superior requiere JDK 17.
- Para que una terminal nueva lo detecte, verificar `java -version` y `echo $env:JAVA_HOME`.
- El JDK 11 anterior se conserva instalado, pero no debe usarse para el build Android moderno.

## Documentos de referencia

- `SPEC.md`: especificación corregida y fuente de comportamiento.
- `BACKLOG.md`: Product Backlog priorizado con HU01–HU12.
- `tasks/plan.md`: plan por fases y dependencias.
- `tasks/todo.md`: checklist de implementación.
- Prueba original: `C:\Users\caper\Downloads\Prueba Desarrollador Full Stack 1.pdf`.
- Auditoría Scrum: `C:\Users\caper\Downloads\Auditoria_Scrum_Proyecto_Full_Stack.docx`.

La prueba PDF define los requisitos obligatorios. La auditoría Scrum contiene hallazgos y recomendaciones, no requisitos funcionales adicionales. El plan pegado amplía la organización técnica.

## Estado actual

### HU01 Registro de usuario

HU01 está implementada localmente.

Incluye:

- Modelo `User`.
- `AuthService` con lectura/escritura centralizada en LocalStorage.
- Clave de persistencia `users`.
- Generación de ID con `crypto.randomUUID()`.
- Normalización del correo a minúsculas.
- Rechazo de correo duplicado sin distinguir mayúsculas/minúsculas.
- Manejo seguro de datos JSON corruptos o inexistentes.
- Formulario reactivo tipado.
- Validaciones de nombre, email, contraseña, confirmación y coincidencia de contraseñas.
- Mensajes visibles de error y éxito.
- Diseño responsive de la pantalla de registro.
- Ruta `/register`.
- Favicon SVG.

Archivos principales de HU01:

```text
src/app/models/user.model.ts
src/app/services/auth.service.ts
src/app/services/auth.service.spec.ts
src/app/pages/register/register.page.ts
src/app/pages/register/register.page.html
src/app/pages/register/register.page.scss
src/app/app.routes.ts
src/app/app.component.ts
src/index.html
src/global.scss
src/theme/variables.scss
```

## Problema visual ya resuelto

La pantalla inicialmente aparecía en blanco. El DOM cargaba correctamente y no había errores de consola, pero `ion-content` medía `0px`. Se corrigió en `src/global.scss` definiendo el tamaño de `app-root`, `ion-app`, `ion-router-outlet` e `ion-content`. La pantalla `/register` ya se visualiza correctamente en el navegador.

No eliminar esas reglas de layout sin verificar nuevamente el renderizado.

## Bug crítico encontrado y corregido: componentes Ionic invisibles en build de producción/APK

Al ejecutar la APK en un emulador Android (y también al servir el build de producción `www/` fuera de Cordova), la pantalla `/register` mostraba el título y los textos, pero **los campos del formulario y el botón "Crear cuenta" no se renderizaban** (aparecían como texto plano sin estilo, sin inputs). En `ng serve` (modo desarrollo) todo se veía correctamente, lo que ocultaba el problema.

Causa raíz: `register.page.ts` importaba `IonicModule` desde `'@ionic/angular'` (API basada en NgModule) dentro de un componente standalone. Con el nuevo builder esbuild de Angular 20 (`@angular-devkit/build-angular:application`), la optimización de producción (`optimization: true`, usada por defecto en `ng build`) hace tree-shaking del registro de custom elements que depende de `IonicModule`, y los componentes (`ion-input`, `ion-item`, `ion-button`, `ion-content`, etc.) nunca llegan a registrarse (`customElements.get(...)` devuelve `undefined`). `ion-app` sí se registraba porque `app.component.ts` ya usaba correctamente los componentes standalone de `@ionic/angular/standalone`.

Diagnóstico realizado:

- Se comparó el mismo código en `ng serve` (funciona) vs. `ng build` producción (falla).
- Se aisló con `ng build --optimization=false` (funciona) vs. build de producción por defecto (falla), confirmando que la optimización era la causa.
- Se inspeccionó el WebView de Android vía Chrome DevTools Protocol (`adb forward` + `webview_devtools_remote_*`), confirmando `customElements.get('ion-input')` como `undefined` en producción.

Corrección aplicada en `src/app/pages/register/register.page.ts`: se reemplazó `import { IonicModule } from '@ionic/angular'` por imports individuales de componentes standalone: `import { IonButton, IonContent, IonInput, IonItem, IonNote, IonText } from '@ionic/angular/standalone'`, y se listaron esos componentes en el array `imports` del `@Component` en lugar de `IonicModule`.

Verificación tras la corrección:

- `ng build` (producción) + servido estático: formulario e input visibles, validaciones y registro funcionan.
- APK reinstalada en emulador Android (Pixel_5_API_34): formulario, validaciones, registro y mensaje de duplicado funcionan visualmente de forma idéntica al navegador.
- `npm test` (con `CHROME_BIN` apuntando a Microsoft Edge, ya que Chrome no está instalado en este entorno): 3/3 pruebas exitosas.

**Regla para futuras historias**: nunca importar `IonicModule` desde `'@ionic/angular'` en componentes standalone. Importar siempre los componentes Ionic individuales desde `'@ionic/angular/standalone'` y añadirlos al array `imports` del componente. Verificar cualquier HU nueva con un build de producción real (`ng build` sin `--optimization=false`), no solo con `ng serve`, antes de darla por terminada.

## Verificación realizada

- TypeScript de la aplicación: correcto.
- TypeScript de las pruebas: correcto.
- `git diff --check`: correcto.
- La pantalla `/register` fue verificada visualmente en `http://localhost:4200/register`.
- Se comprobó que la pantalla muestra título, campos y botón.
- Se probó un registro válido en navegador y apareció el mensaje de confirmación.
- Se probó el envío vacío y aparecieron los mensajes de validación esperados.
- La consola del navegador no mostró errores ni advertencias.

El runner completo de Angular/Karma y el build no entregaron una salida final confiable en el entorno de Codex. Antes de cerrar HU01, conviene ejecutar manualmente:

```powershell
npm test
npm run build
```

Si el servidor está levantado:

```powershell
npm start
```

Abrir:

```text
http://localhost:4200/register
```

## Cómo probar HU01 manualmente

1. Abrir `/register`.
2. Enviar el formulario vacío y verificar mensajes.
3. Introducir email inválido.
4. Introducir contraseñas diferentes.
5. Registrar un usuario válido.
6. Verificar mensaje de éxito.
7. Registrar nuevamente el mismo correo con otra combinación de mayúsculas y minúsculas.
8. Verificar rechazo por correo duplicado.
9. Revisar en DevTools que `localStorage.users` contenga el usuario.

Nota: LocalStorage y la contraseña en texto plano son aceptables solo para esta prueba mock; no representan una implementación segura de producción.

## Estado de Git

El remoto `origin` fue agregado por el usuario y apunta al repositorio indicado arriba. Los cambios de HU01 todavía deben revisarse y subirse.

En una sesión donde `.git` tenga permisos de escritura:

```powershell
git status
git switch -c feature/HU01-registro
git add .
git commit -m "feat(auth): implementar registro de usuario"
git push -u origin feature/HU01-registro
```

No usar `git reset --hard` ni eliminar cambios existentes.

## Próxima historia autorizable

La siguiente historia es HU02 — Inicio y cierre de sesión, pero solo debe iniciarse cuando el usuario lo solicite expresamente.

HU02 deberá agregar, como mínimo:

- Pantalla Login.
- Email y contraseña.
- Consulta contra `AuthService` y `users`.
- Persistencia de sesión en `currentUser`.
- `logout()`.
- Redirección posterior al login.
- Pruebas para credenciales correctas, incorrectas, usuario inexistente, campos vacíos, logout y recarga.

No implementar catálogo, carrito, checkout, pedidos ni puntos durante HU02.

## Reglas de negocio de puntos pendientes

No implementar HU09/HU10 sin revisar `SPEC.md`. La interpretación propuesta para volumen es:

```text
0–999 unidades       = 0 puntos
1.000–2.999 unidades = 50 puntos
3.000–3.999 unidades = 100 puntos
4.000 o más          = 150 puntos
```

Esta corrección elimina los solapamientos y el texto ambiguo del PDF, pero debe confirmarse antes de convertirla en lógica definitiva.

## Reglas de trabajo para la siguiente IA

- Leer `HANDOFF.md`, `SPEC.md`, `BACKLOG.md` y `tasks/todo.md` antes de actuar.
- Trabajar una HU por turno y respetar la autorización del usuario.
- Mantener servicios separados de páginas y componentes.
- Centralizar LocalStorage en servicios.
- Escribir pruebas para la lógica nueva.
- Ejecutar TypeScript, pruebas y build cuando sea posible.
- No inventar reglas de negocio.
- No tocar historias futuras fuera de la HU autorizada.
- Explicar claramente qué se cambió, qué no se tocó y qué verificación se realizó.
