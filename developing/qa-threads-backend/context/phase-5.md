# Fase 5 - Frontend: Conectar paginas a API real

## Objetivo
Refactorizar todas las paginas para usar los hooks y servicios reales, eliminar mockData.js, agregar pagina de Login y controlar la UI segun permisos del rol.

## Archivos a modificar
- `C:\development\front\cashQas\qa-threads-app\src\App.jsx` (agregar AuthProvider, rutas protegidas, Login)
- `C:\development\front\cashQas\qa-threads-app\src\pages\LoginPage.jsx` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\pages\Dashboard.jsx` (refactorizar)
- `C:\development\front\cashQas\qa-threads-app\src\pages\QAsPage.jsx` (refactorizar)
- `C:\development\front\cashQas\qa-threads-app\src\pages\QADetailPage.jsx` (refactorizar)
- `C:\development\front\cashQas\qa-threads-app\src\pages\DevelopersPage.jsx` (refactorizar)
- `C:\development\front\cashQas\qa-threads-app\src\pages\DevDetailPage.jsx` (refactorizar)
- `C:\development\front\cashQas\qa-threads-app\src\data\mockData.js` (eliminar)
- `C:\development\front\cashQas\qa-threads-app\src\components\ProtectedRoute.jsx` (nuevo)

## Pasos
1. Crear `LoginPage.jsx` con formulario de email/password
2. Crear `ProtectedRoute.jsx` que redirige a login si no hay sesion
3. Modificar `App.jsx`:
   - Envolver con AuthProvider
   - Agregar ruta /login
   - Proteger rutas existentes con ProtectedRoute
4. Refactorizar `Dashboard.jsx`:
   - Reemplazar mock data por useQAs() y useDevelopers()
   - Agregar loading/error states
5. Refactorizar `QAsPage.jsx`:
   - Usar useQAs(filters) con filtros reales
   - Conectar creacion de issues al API
6. Refactorizar `QADetailPage.jsx`:
   - Cargar issue por ID desde API
   - Cargar timeline desde API
   - Conectar formulario de comentarios al API
   - Mostrar/ocultar acciones segun permisos del rol
7. Refactorizar `DevelopersPage.jsx`:
   - Usar useDevelopers() para listar developers reales
8. Refactorizar `DevDetailPage.jsx`:
   - Cargar stats del developer desde API
   - Cargar issues asignados desde API
9. Eliminar `src/data/mockData.js`
10. Controlar visibilidad de botones/acciones segun hasPermission()

## Verificacion
- Login redirige al dashboard tras autenticacion exitosa
- Dashboard muestra datos reales del backend
- QAsPage lista, filtra y crea issues reales
- QADetailPage muestra detalle y timeline reales
- DevelopersPage y DevDetailPage muestran datos reales
- Rutas protegidas redirigen a /login sin sesion
- Acciones en UI respetan permisos del rol
- No quedan imports de mockData.js

## Criterio de completado
- Todas las paginas consumen API real
- mockData.js eliminado
- Login funcional con JWT
- Permisos reflejados en la UI
- Loading y error states en todas las paginas
- Navegacion fluida sin errores de consola
