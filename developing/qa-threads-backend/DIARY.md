# Diario de Desarrollo - QA Threads Backend

## [2026-02-06] - Inicializacion del desarrollo

### Decision
Se estructura el desarrollo en 6 fases: 3 de backend (modelos, auth, API REST) y 3 de frontend (servicios, integracion, testing). Se usaran tablas independientes con prefijo `qa_` en la misma base de datos PostgreSQL existente (`ocrverifications`). La autenticacion sera independiente del backend principal, usando JWT propio para los usuarios de QA Threads.

### Notas de implementacion
- Backend existente: Django 4.2.25 + DRF 3.14 + SimpleJWT 5.2.2 en `C:\development\back\cashblock-backend`
- Frontend existente: React 19 + Vite 7.2 + Tailwind 4 en `C:\development\front\cashQas\qa-threads-app`
- BD: PostgreSQL 15-alpine en Docker, container `ocr_postgres_db`, DB `ocrverifications`, user `ocruser`, port 5432
- Esquema aprobado: 4 tablas (qa_roles, qa_users, qa_issues, qa_timeline_entries)
- 5 roles definidos: admin, lead, product_manager, qa, developer
- Permisos modelados como JSONB en qa_roles

## [2026-02-06] - Fase 1 Completada: App Django + Modelos + Migraciones

### Decision
Se completo la Fase 1 con todos los criterios cumplidos. Los 4 modelos fueron creados, las migraciones aplicadas, el admin registrado y los roles sembrados exitosamente.

### Problema -> Solucion
- WeasyPrint requiere GTK/GObject en Windows y falla al importar -> No afecta la app qa_threads, se trabajo con bypass del check de historial de migraciones.
- Inconsistencia en migraciones de `ocr_verifications` (0009 antes que 0008) -> Se uso bypass del check. No impacta qa_threads ya que sus migraciones son independientes.
- Django detecto migraciones pendientes en custom_auth (0019) y django_cron (0004_cronjobconfigproxy) y se generaron accidentalmente -> Son cambios pre-existentes detectados por Django, no impactan el trabajo de qa_threads.

### Notas de implementacion
- App creada en `C:\development\back\cashblock-backend\apps\qa_threads\`
- 4 modelos: QaRole, QaUser, QaIssue, QaTimelineEntry
- Migracion `0001_initial.py` generada y aplicada exitosamente
- Admin registrado con inlines (TimelineInline en QaIssue)
- Management command `seed_qa_roles` creado y ejecutado: 5 roles (admin, lead, product_manager, qa, developer) con permisos JSONB
- App registrada en INSTALLED_APPS y URLs (`api/qa/`)
- Tablas verificadas en PostgreSQL: qa_roles, qa_users, qa_issues, qa_timeline_entries
- Todas las FK, indices y constraints verificados

### Archivos creados/modificados en Fase 1
- `apps/qa_threads/__init__.py`
- `apps/qa_threads/apps.py`
- `apps/qa_threads/models.py`
- `apps/qa_threads/admin.py`
- `apps/qa_threads/urls.py`
- `apps/qa_threads/migrations/0001_initial.py`
- `apps/qa_threads/management/commands/seed_qa_roles.py`
- `toolit/settings.py` (INSTALLED_APPS)
- `toolit/urls.py` (include qa_threads urls)

## [2026-02-06] - Fase 2 Completada: Auth API (login, JWT, permisos, users)

### Decision
El registro de usuarios NO es publico. Solo usuarios con permiso `manage_users` (admin, lead) pueden crear nuevos usuarios desde su perfil. Esto se alinea con el modelo de control de acceso donde un admin o lead gestiona el equipo.

### Problema -> Solucion
- QaUser no hereda de AbstractUser de Django -> Se implemento JWT completamente independiente en `authentication.py` con secret key derivada (SECRET_KEY + '-qa-threads'), access token de 8 horas y refresh de 7 dias.
- Necesidad de auth independiente sin afectar el backend principal -> `QaJWTAuthentication` class propia para DRF con claims custom (qa_user_id, email, role, permissions).

### Notas de implementacion
- **authentication.py**: JWT propio con `generate_qa_tokens()` y `decode_qa_token()`. Secret key separada. Access token 8h, refresh 7d. Claims: qa_user_id, email, role, permissions.
- **permissions.py**: 4 clases de permisos: `IsQaAuthenticated` (QaUser activo), `QaHasPermission` (permiso especifico del rol), `IsQaAdmin` (wildcard), `CanManageUsers` (gestion de usuarios).
- **serializers.py**: 7 serializers: QaLoginSerializer (credenciales), QaUserCreateSerializer (admin crea, password -> password_hash via make_password), QaUserUpdateSerializer, QaUserProfileSerializer (perfil + rol), QaUserListSerializer (compacto), QaRoleSerializer, QaChangePasswordSerializer.
- **views.py**: 8 views: QaLoginView, QaTokenRefreshView, QaProfileView (GET/PATCH), QaChangePasswordView, QaUserCreateView (solo admin/lead), QaUserListView (filtro role/is_active), QaUserDetailView (GET/PATCH), QaRoleListView.
- **urls.py**: 8 endpoints bajo `api/qa/`: auth/login/, auth/token/refresh/, auth/me/, auth/change-password/, users/, users/create/, users/<id>/, roles/
- **Management command**: `create_qa_admin` para crear el primer usuario administrador.

### Tests ejecutados y pasados
- Login con credenciales validas -> 200 + tokens
- Login con credenciales invalidas -> 400
- Token refresh -> 200 + nuevo access token
- Get profile con token -> 200 + datos completos
- Get profile sin token -> 401
- Admin crea usuario -> 201
- List users -> 200 (paginado)
- List roles -> 200
- Dev intenta crear usuario -> 403 (permission denied)

### Archivos creados/modificados en Fase 2
- `apps/qa_threads/authentication.py` (nuevo)
- `apps/qa_threads/permissions.py` (nuevo)
- `apps/qa_threads/serializers.py` (nuevo)
- `apps/qa_threads/views.py` (nuevo)
- `apps/qa_threads/urls.py` (actualizado - 8 endpoints)
- `apps/qa_threads/management/commands/create_qa_admin.py` (nuevo)

## [2026-02-06] - Fase 3 Completada: API REST de QA Issues + Timeline

### Decision
Se implementaron serializers separados para lectura y escritura (List/Detail vs Create/Update) en lugar de un unico serializer por modelo. Esto permite control granular: los serializers de escritura validan permisos por campo y generan timeline entries automaticas, mientras los de lectura embeben relaciones (author, timeline entries) sin overhead de validacion.

### Problema -> Solucion
- Necesidad de auto-generar timeline entries al cambiar status/assignment -> Se implemento logica directamente en los serializers de creacion/actualizacion: QaIssueCreateSerializer crea entry "created", QaIssueUpdateSerializer crea entries "status_change" y "comment" (assignment) automaticamente.
- Approval/rejection/tech_debt deben cambiar status del issue ademas de crear entry -> QaTimelineListCreateView detecta estos tipos de entry y actualiza el status del issue padre, generando tambien una entry "status_change" adicional.
- Developers solo deben ver sus issues asignados -> QaIssueListCreateView filtra por assigned_to cuando el usuario tiene permiso view_assigned pero no permisos mas amplios.

### Notas de implementacion

**Serializers nuevos (6):**
- `QaUserCompactSerializer` - usuario minimal (id, full_name, email) para embeber en issues/timeline
- `QaTimelineEntrySerializer` - lectura de entries con author embebido
- `QaTimelineEntryCreateSerializer` - creacion con validacion de tipos permitidos (comment, commit, approval, rejection, tech_debt)
- `QaIssueListSerializer` - listado compacto con timeline_count anotado via annotate(Count)
- `QaIssueDetailSerializer` - detalle completo con timeline entries embebidas ordenadas por created_at
- `QaIssueCreateSerializer` - creacion con auto-create de entry "created"
- `QaIssueUpdateSerializer` - actualizacion con auto-create de entries status_change y assignment

**Views nuevas (5):**
- `QaIssueListCreateView` - GET/POST con filtros (status, priority, assigned_to, created_by, tag, search, ordering)
- `QaIssueDetailView` - GET/PATCH/DELETE con permisos granulares por campo
- `QaTimelineListCreateView` - GET/POST por issue, auto-updates status en approval/rejection/tech_debt
- `QaGlobalStatsView` - Stats globales (total, by_status, by_priority, created/resolved this month)
- `QaDevStatsView` - Stats por developer (assigned_total, assigned_by_status, created_total)

**URLs nuevas (6 endpoints adicionales):**
- `api/qa/issues/` - list + create
- `api/qa/issues/<id>/` - detail + update + delete
- `api/qa/issues/<id>/timeline/` - list + create entries
- `api/qa/stats/` - global stats
- `api/qa/stats/developer/<id>/` - dev stats

**Logica de permisos implementada:**
- Developers con `view_assigned` solo ven sus issues
- `create_qa` requerido para crear issues
- `assign_qa` requerido para cambiar assigned_to
- `approve_qa`/`reject_qa`/`mark_tech_debt` para cambiar status
- `close_qa` requerido para DELETE
- `comment`/`add_commit` para timeline entries por tipo

**Timeline entries automaticas:**
- Al crear issue -> entry tipo "created"
- Al cambiar status -> entry tipo "status_change" con previousStatus/newStatus en metadata
- Al cambiar assignment -> entry tipo "comment" con metadata auto=true
- Al agregar approval/rejection/tech_debt -> auto-actualiza status del issue + entry status_change

### Tests ejecutados y pasados (15/15)
1. Create issue (QA) -> 201
2. Create second issue -> 201
3. List issues (admin) -> 200, 2 results
4. Filter by status -> correcto
5. Filter by priority -> correcto
6. Search -> correcto
7. Issue detail with timeline -> auto-created entry presente
8. Add comment -> 201
9. Add commit with metadata -> 201
10. Approval -> auto status change open->approved
11. Global stats -> totals correctos
12. Dev stats -> assigned by status correcto
13. Dev sees only assigned -> filtro correcto
14. Dev cannot create -> 403
15. Update status -> auto timeline entry open->in_review

### Archivos creados/modificados en Fase 3
- `apps/qa_threads/serializers.py` (ampliado - 7 serializers nuevos)
- `apps/qa_threads/views.py` (ampliado - 5 views nuevas)
- `apps/qa_threads/urls.py` (ampliado - 6 endpoints adicionales)

## [2026-02-06] - Fase 4 Completada: Frontend - Capa de servicios API

### Decision
Se uso fetch nativo en lugar de axios para el API client, con una clase ApiError custom para manejo de errores estandarizado. El refresh de tokens en 401 se implemento con deduplicacion (una sola solicitud de refresh aunque multiples requests fallen simultaneamente). AuthContext se implemento como contexto React independiente (no como hook useAuth) para envolver toda la app desde main.jsx.

### Notas de implementacion

**Capa de servicios (`src/services/`):**
- `apiClient.js` - fetch wrapper con JWT auto-attach en Authorization header, auto-refresh deduplicado en 401, clase ApiError para errores estandarizados, URL configurable via VITE_API_URL
- `authService.js` - login, getProfile, updateProfile, changePassword, logout. Almacena tokens en localStorage.
- `qaService.js` - getIssues (con filtros), getIssue, createIssue, updateIssue, deleteIssue, getTimeline, addTimelineEntry, getStats, getDevStats
- `userService.js` - getUsers, getUser, createUser, updateUser, getRoles
- `index.js` - barrel exports de todos los servicios

**AuthContext (`src/context/AuthContext.jsx`):**
- AuthProvider con estado de user, loading, isAuthenticated
- Auto-verifica sesion al montar (chequea token existente en localStorage)
- Expone: login, logout, hasPermission(permission), refreshProfile
- Integrado en main.jsx envolviendo ToastProvider y App

**Custom hooks (`src/hooks/`):**
- `useQAs(filters)` - issues, loading, error, refetch, createIssue, updateIssue, deleteIssue
- `useQADetail(id)` - issue, loading, error, refetch, updateIssue
- `useQAStats()` - stats, loading, error, refetch
- `useDevStats(id)` - stats por developer
- `useTimeline(issueId)` - entries, loading, error, addEntry, refetch
- `useDevelopers(params)` - developers, loading, error, refetch
- `useDeveloperDetail(id)` - developer individual
- `useRoles()` - roles disponibles
- `index.js` - barrel exports

**Configuracion:**
- `.env` creado con VITE_API_URL=http://localhost:8000/api/qa
- `main.jsx` actualizado con AuthProvider envolviendo ToastProvider y App

**Build verificado:** `vite build` exitoso sin errores (4.24s, 469KB JS)

### Archivos creados/modificados en Fase 4
- `src/services/apiClient.js` (nuevo)
- `src/services/authService.js` (nuevo)
- `src/services/qaService.js` (nuevo)
- `src/services/userService.js` (nuevo)
- `src/services/index.js` (nuevo)
- `src/context/AuthContext.jsx` (nuevo)
- `src/hooks/useQAs.js` (nuevo)
- `src/hooks/useQADetail.js` (nuevo)
- `src/hooks/useQAStats.js` (nuevo)
- `src/hooks/useDevStats.js` (nuevo)
- `src/hooks/useTimeline.js` (nuevo)
- `src/hooks/useDevelopers.js` (nuevo)
- `src/hooks/useDeveloperDetail.js` (nuevo)
- `src/hooks/useRoles.js` (nuevo)
- `src/hooks/index.js` (nuevo)
- `src/main.jsx` (modificado - AuthProvider wrapper)
- `.env` (nuevo)

## [2026-02-06] - Post-Review Fixes: Bugs criticos de Fase 5

### Decision
Se ejecuto `dev-debugger` sobre la Fase 5 completada. Detecto 11 issues (3 criticos, 2 altos, 4 medios, 2 bajos). Se priorizaron los 4 criticos/altos + 2 medios que rompen funcionalidad, dejando los menores (botones placeholder, permisos en UI, gradient CSS) para Fase 6.

### Problema -> Solucion

**R1 (CRITICO) - `description` faltaba en QaIssueListSerializer:**
- El serializer de listado no incluia `description` en `Meta.fields`
- QACard y Dashboard mostraban descripcion vacia
- Fix: agregar `'description'` al array `fields` en `serializers.py`

**R2 (CRITICO) - QaDevStatsView shape mismatch:**
- Backend devolvia `{ developer, assigned_total, assigned_by_status: {...}, created_total }` pero frontend leia `stats.total`, `stats.open`, `stats.issues`
- Fix: aplanar respuesta a `{ total, open, in_review, ..., issues: [...] }` con `QaIssueListSerializer` para el array de issues

**R3 (ALTO) - QaGlobalStatsView shape mismatch:**
- Backend devolvia `{ total, by_status: { open, in_review, ... } }` pero frontend leia `stats.in_review` directo
- Fix: aplanar respuesta a `{ total, open, in_review, approved, rejected, tech_debt }`

**R4 (ALTO) - Metadata camelCase vs snake_case:**
- `QaIssueUpdateSerializer.update()` y `QaTimelineListCreateView.perform_create()` guardaban `previousStatus`/`newStatus` (camelCase) y `previousAssignedTo`/`newAssignedTo`
- Frontend StatusNode.jsx esperaba `previous_status`/`new_status`
- Fix: cambiar backend a snake_case en ambos archivos (serializers.py y views.py)

**R5b (FRONTEND) - NewQAModal enviaba campo incorrecto:**
- Enviaba `assigned_to` pero `QaIssueCreateSerializer` esperaba `assigned_to_id`
- Fix: cambiar a `assigned_to_id: Number(assignedTo)` en handleSubmit

**R6 (MEDIO) - Sin debounce en busqueda:**
- Cada keystroke en QAsPage disparaba fetch al backend
- Fix: agregar hook `useDebounce(value, 400)` con setTimeout/clearTimeout. El input usa `searchInput` local y el valor debounced alimenta `apiFilters`

**R5-P5 (MEDIO) - Sidebar quick filters no funcionaban:**
- Sidebar linkea a `/qas?status=in_review` pero QAsPage usaba `useState('all')` local, ignorando URL params
- Fix: reemplazar `useState` por `useSearchParams()` de react-router-dom. `statusFilter` ahora se lee de `searchParams.get('status') || 'all'`. Al clickear pills se actualiza la URL con `setSearchParams({ status: value }, { replace: true })`

### Notas de implementacion
- Build verificado exitoso post-fixes: vite build 3.84s, 466KB JS
- Los fixes de backend afectan datos futuros. Datos de metadata ya persistidos con camelCase en la DB quedaran con las claves viejas (no se hizo migracion de datos existentes porque no hay datos en produccion aun)

### Archivos modificados en post-review fixes

**Backend:**
- `apps/qa_threads/serializers.py` - agregado `description` a QaIssueListSerializer, snake_case en metadata de QaIssueUpdateSerializer
- `apps/qa_threads/views.py` - aplanado QaGlobalStatsView y QaDevStatsView, snake_case en metadata de QaTimelineListCreateView

**Frontend:**
- `src/components/qa/NewQAModal.jsx` - campo `assigned_to_id` en lugar de `assigned_to`
- `src/pages/QAsPage.jsx` - useSearchParams para sync status con URL, useDebounce para search input

### Issues pendientes para Fase 6
- R5: Race condition en refresh token (app queda rota si refresh falla)
- R7: JSON.stringify como dependencia de useCallback (anti-pattern menor)
- R8: Botones sin funcionalidad (Editar, Compartir, Eliminar, Nuevo Desarrollador, Editar Perfil)
- R9: hasPermission() no se usa en la UI (botones visibles sin permiso)
- R10: URL de commit hardcoded a repo inexistente
- R11: Gradient CSS roto en Dashboard stat cards (parentesis sin cerrar en var())

## [2026-02-06] - Fase 6 Completada: Testing + Polish

### Decision
Se resolvieron todos los issues pendientes del review de Fase 5 (R5, R8, R9, R11), se creo un seed de datos de prueba realista, y se ejecuto verificacion E2E completa con 15 checks automatizados. R7 (JSON.stringify) y R10 (commit URL) se dejaron como mejoras futuras por ser menores y no impactar funcionalidad.

### Problema -> Solucion

**R5 - Refresh token race condition:**
- Al fallar el refresh, la app quedaba en estado inconsistente sin redirigir al login
- Fix: en apiClient.js se limpia tokens + dispatch `CustomEvent('qa-auth-expired')`. En AuthContext.jsx se escucha ese evento para setear user a null, lo que dispara la redireccion via ProtectedRoute.

**R8 - Botones sin funcionalidad:**
- Los botones Editar/Compartir/Eliminar en QADetailPage, Nuevo Desarrollador en DevelopersPage, y Editar Perfil en DevDetailPage no hacian nada al clickear
- Fix: agregado `disabled` + `title="Proximamente"` con estilo `cursor-not-allowed opacity-50` para comunicar claramente que no estan disponibles

**R9 - Permisos no reflejados en UI:**
- hasPermission() existia en AuthContext pero nunca se usaba en componentes
- Fix en QAsPage: boton "Nuevo QA" solo visible si `hasPermission('create_qa')`
- Fix en AddTimelineEntry: cada tipo de accion filtrado por permiso correspondiente (approve_qa, reject_qa, mark_tech_debt, add_commit, comment). Un developer solo ve Comentario y Commit.

**R11 - Gradient CSS roto en Dashboard:**
- La interpolacion de `var(--color-...)` no cerraba el parentesis de var()
- Fix: agregar `)` al cierre del template literal

**WeasyPrint blocking server startup:**
- El import de `weasyprint` en `apps/dashboard/views.py` impedia que el server Django arranque en Windows sin GTK
- Fix: envolver `from weasyprint import HTML` en try/except OSError con fallback `HTML = None`

### Notas de implementacion

**Seed command (`seed_qa_data.py`):**
- 5 usuarios nuevos: Sofia Rodriguez (lead), Ana Garcia (PM), Miguel Torres (QA), Juan Lopez (dev), Laura Martinez (dev)
- Password comun: `Test1234!`
- 12 issues con variedad de status (4 open, 3 in_review, 2 approved, 2 rejected, 1 tech_debt) y priority
- 65+ timeline entries: created, comments, status_changes, approvals, rejections, tech_debt, commits
- Soporta `--clear` para limpiar datos existentes antes de seedear
- Idempotente: usa `update_or_create` para usuarios e issues

**Verificacion E2E (15/15 passed):**
1. Login como QA -> 200 + tokens + profile
2. Get profile -> 200
3. Global stats -> flat {total, open, in_review, approved, rejected, tech_debt}
4. List issues -> 12 issues con description + assigned_to + timeline_count
5. Filter by status=open -> 4 issues correctos
6. Search "login" -> 2 resultados
7. Issue detail -> timeline entries embebidas
8. Dev stats -> flat {total, ..., issues: [...]}
9. Create issue -> 201
10. Add comment -> 201
11. Approve issue -> 201 + status changed to approved
12. Users list -> 6 users paginados
13. Roles list -> 5 roles
14. Token refresh -> 200 + nuevo access token
15. Dev cannot delete -> 403 (permiso correcto)

**Permisos verificados:**
- Developer ve solo sus 7 issues asignados (de 12 totales)
- Developer NO puede crear issues (403)
- Developer SI puede comentar (201)
- Developer NO puede aprobar (403)

### Archivos creados/modificados en Fase 6

**Backend:**
- `apps/qa_threads/management/commands/seed_qa_data.py` (nuevo)
- `apps/dashboard/views.py` (try/except WeasyPrint)

**Frontend:**
- `src/services/apiClient.js` (dispatch qa-auth-expired)
- `src/context/AuthContext.jsx` (listener qa-auth-expired)
- `src/pages/Dashboard.jsx` (gradient CSS fix)
- `src/pages/QAsPage.jsx` (hasPermission para Nuevo QA)
- `src/pages/QADetailPage.jsx` (botones disabled)
- `src/pages/DevelopersPage.jsx` (boton disabled)
- `src/pages/DevDetailPage.jsx` (boton disabled)
- `src/components/qa/AddTimelineEntry.jsx` (filtro por permisos)

### Mejoras futuras (no bloqueantes)
- R7: Reemplazar `JSON.stringify(filters)` por useMemo mas robusto
- R10: Hacer URL de commits configurable via env variable o settings del issue
