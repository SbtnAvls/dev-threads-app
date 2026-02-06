# Fase 2 - Backend: Auth API (registro, login, JWT)

## Objetivo
Implementar autenticacion independiente para QA Threads usando JWT. Endpoints de registro, login, refresh token y perfil. Sistema de permisos basado en rol.

## Archivos a modificar
- `C:\development\back\cashblock-backend\apps\qa_threads\serializers.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\views.py` (nuevo o ampliar)
- `C:\development\back\cashblock-backend\apps\qa_threads\urls.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\permissions.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\authentication.py` (nuevo)
- `C:\development\back\cashblock-backend\toolit\urls.py` (incluir urls de qa_threads)

## Pasos
1. Crear `authentication.py` con backend de auth propio para QaUser
   - QaUser NO hereda de AbstractUser de Django; usa password_hash propio
   - Generar JWT con `rest_framework_simplejwt` pero con claims custom (qa_user_id, role, permissions)
2. Crear `serializers.py`:
   - QaUserRegisterSerializer (email, password, first_name, last_name, role)
   - QaUserLoginSerializer (email, password)
   - QaUserProfileSerializer (lectura del perfil con rol y permisos)
   - TokenRefreshSerializer
3. Crear `views.py`:
   - RegisterView (POST /api/qa/auth/register/)
   - LoginView (POST /api/qa/auth/login/) -> retorna access + refresh tokens
   - TokenRefreshView (POST /api/qa/auth/token/refresh/)
   - ProfileView (GET /api/qa/auth/me/) -> requiere auth
4. Crear `permissions.py`:
   - QaIsAuthenticated: verifica JWT propio de QA
   - QaHasPermission(permission_name): verifica permisos del rol
5. Crear `urls.py` con prefijo `api/qa/auth/`
6. Incluir en `toolit/urls.py`: `path('', include('apps.qa_threads.urls'))`

## Verificacion
- POST `/api/qa/auth/register/` crea usuario y retorna tokens
- POST `/api/qa/auth/login/` con credenciales validas retorna tokens
- POST `/api/qa/auth/login/` con credenciales invalidas retorna 401
- POST `/api/qa/auth/token/refresh/` con refresh token valido retorna nuevo access token
- GET `/api/qa/auth/me/` con token valido retorna perfil del usuario
- GET `/api/qa/auth/me/` sin token retorna 401
- Los tokens contienen claims: qa_user_id, role, permissions

## Criterio de completado
- Flujo completo de registro -> login -> acceso a perfil funciona
- JWT independiente del auth principal del backend
- Permisos por rol verificables via middleware/decorator
- No se afecta la auth existente del backend principal
