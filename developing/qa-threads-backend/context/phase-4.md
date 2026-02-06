# Fase 4 - Frontend: Capa de servicios API

## Objetivo
Crear la capa de comunicacion con el backend: API client, hooks personalizados, manejo de tokens JWT y estados de carga/error.

## Archivos a modificar
- `C:\development\front\cashQas\qa-threads-app\src\services\apiClient.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\services\authService.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\services\qaService.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\services\userService.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\hooks\useAuth.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\hooks\useQAs.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\hooks\useTimeline.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\hooks\useDevelopers.js` (nuevo)
- `C:\development\front\cashQas\qa-threads-app\src\context\AuthContext.jsx` (nuevo)

## Pasos
1. Crear `apiClient.js`:
   - Base URL configurable via env var (VITE_API_URL)
   - Interceptor para adjuntar access token en Authorization header
   - Interceptor para refresh automatico en respuesta 401
   - Manejo de errores estandarizado
2. Crear `authService.js`:
   - login(email, password)
   - register(data)
   - refreshToken()
   - getProfile()
   - Almacenar tokens en localStorage
3. Crear `AuthContext.jsx`:
   - Provider con estado de usuario, tokens, permisos
   - Funciones: login, logout, register, hasPermission(permission)
   - Persistencia de sesion (verificar token al cargar)
4. Crear `qaService.js`:
   - getIssues(filters, pagination)
   - getIssue(id)
   - createIssue(data)
   - updateIssue(id, data)
   - deleteIssue(id)
   - getTimeline(issueId)
   - addTimelineEntry(issueId, data)
   - getStats()
   - getDevStats(developerId)
5. Crear `userService.js`:
   - getUsers()
   - getUser(id)
6. Crear hooks:
   - useAuth(): { user, login, logout, register, hasPermission, loading }
   - useQAs(filters): { issues, loading, error, refetch, createIssue, updateIssue }
   - useTimeline(issueId): { entries, loading, addEntry }
   - useDevelopers(): { developers, loading, error }

## Verificacion
- apiClient adjunta token y hace refresh automatico
- Login/register/logout funcionan correctamente
- Hooks retornan datos, loading y error states
- Token refresh transparente al usuario
- Configuracion de API URL via variable de entorno funciona

## Criterio de completado
- Todos los servicios cubren los endpoints del backend
- AuthContext maneja sesion completa (login, logout, persistencia, refresh)
- Hooks listos para ser consumidos por las paginas
- Manejo de errores consistente (red, 401, 403, 404, 500)
- No quedan dependencias de mockData en la capa de servicios
