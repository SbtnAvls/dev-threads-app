# Revision Fase 5 - QA Threads Backend (Frontend: Conectar paginas a API real)

## 1. Resumen de lo que se hizo
- Se conectaron todas las paginas del frontend a la API real del backend, eliminando completamente mockData.js
- Se creo LoginPage.jsx con flujo JWT y ProtectedRoute.jsx como guard de rutas
- Se refactorizaron 14 componentes para usar snake_case fields, hooks de API y helpers (fullName, parseDate)
- Se creo helpers.js con utilidades compartidas para parseo de datos del backend
- Build verificado exitoso (vite build, 464KB JS)

## 2. Riesgos detectados

### CRITICO - Datos faltantes en la API list vs lo que el frontend consume

**R1: `description` no esta incluida en QaIssueListSerializer pero se usa en la UI de listas.**
- `Dashboard.jsx` linea 216: `{qa.description}` se muestra en la lista de QAs recientes
- `QACard.jsx` linea 69-71: `{qa.description}` se muestra en la tarjeta
- `QaIssueListSerializer` (serializers.py linea 167) define: `['id', 'title', 'status', 'priority', 'tags', 'assigned_to', 'created_by', 'due_date', 'created_at', 'updated_at', 'timeline_count']`
- `description` NO esta en esa lista. El frontend mostrara undefined/nada donde deberia haber descripcion.
- **Impacto:** Todas las paginas con listas de QAs mostraran tarjetas sin descripcion.

### CRITICO - Desajuste de datos entre QaDevStatsView y DevDetailPage

**R2: DevDetailPage espera `stats.issues`, `stats.total`, `stats.open`, etc. pero QaDevStatsView devuelve `assigned_total`, `assigned_by_status`, `created_total`.**
- `DevDetailPage.jsx` linea 61: `const allQAs = stats?.issues || []` -- el backend NO devuelve un array `issues`.
- `DevDetailPage.jsx` linea 66-68: `getStatValue('total')`, `getStatValue('open')`, `getStatValue('in_review')` -- el backend devuelve `assigned_total` y `assigned_by_status.open`, no `total` ni `open` como claves directas.
- **Impacto:** La pagina de detalle de desarrollador mostrara 0 en todos los contadores y una lista vacia de QAs.

### ALTO - Desajuste de datos entre QaGlobalStatsView y Dashboard/QAsPage

**R3: El frontend espera stats.in_review, stats.approved, stats.rejected como claves directas, pero el backend devuelve `by_status` como objeto anidado.**
- `QaGlobalStatsView` devuelve: `{ total, by_status: { open, in_review, rejected, approved, tech_debt }, by_priority: {...}, created_this_month, resolved_this_month }`
- `Dashboard.jsx` linea 49: `stats.in_review` -- sera undefined
- `Dashboard.jsx` linea 55: `stats.approved` -- sera undefined
- `Dashboard.jsx` linea 61: `stats.rejected` -- sera undefined
- `QAsPage.jsx` linea 50: `stats[filterValue]` donde filterValue es 'in_review', 'open', etc. -- sera undefined
- **Impacto:** Dashboard mostrara 0 o undefined en las stat cards. Los contadores de QAsPage seran 0.

### ALTO - Metadata del backend usa camelCase pero el frontend espera snake_case

**R4: El auto-generado de status_change en el backend serializers.py linea 253-254 usa `previousStatus` y `newStatus` (camelCase), pero StatusNode.jsx linea 208 consume `entry.metadata.previous_status` y `entry.metadata.new_status` (snake_case).**
- `QaIssueUpdateSerializer.update()` y `QaTimelineListCreateView.perform_create()` guardan `metadata={'previousStatus': ..., 'newStatus': ...}`
- `StatusNode.jsx` linea 208-209: busca `entry.metadata.previous_status` y `entry.metadata.new_status`
- **Impacto:** Las transiciones de status en el timeline se mostraran vacias/sin datos de estado anterior/nuevo.

### MEDIO - Race condition en refresco de token

**R5: En `apiClient.js`, si el refresh token falla y `refreshPromise` se setea a null en el catch, pero multiples peticiones concurrentes que esperaban el refresh pueden recibir la excepcion pero el estado de la app no se limpia de forma coordinada.**
- Linea 88: `refreshPromise = null` en el catch, pero no se redirige al login
- El usuario queda con una app rota sin feedback claro
- **Impacto:** Tras expiracion del refresh token, la app puede quedar en un estado inconsistente donde algunas peticiones fallan y otras no, sin redirigir al login.

### MEDIO - No hay debounce en la busqueda de QAsPage

**R6: El searchQuery se conecta directamente a apiFilters via useMemo, lo que dispara una nueva peticion API por cada keystroke.**
- `QAsPage.jsx` linea 32: `if (searchQuery.trim()) filters.search = searchQuery.trim()`
- Cada caracter escrito genera un nuevo fetch
- **Impacto:** Exceso de peticiones al backend, potencialmente degrada la experiencia.

### MEDIO - useQAs usa JSON.stringify(filters) como dependencia de useCallback

**R7: `JSON.stringify(filters)` como dependencia de useCallback es un anti-patron.**
- `useQAs.js` linea 21: `[JSON.stringify(filters)]`
- Aunque funciona, no es idempotente si el orden de claves cambia. Ademas, React no compara strings sino identidad referencial -- por lo que crea un nuevo callback en cada render si filters es un nuevo objeto, lo cual es casi siempre.
- Lo mismo aplica a `useDevelopers.js` linea 20.
- **Impacto:** Potencialmente genera re-fetches innecesarios si no se memoizan los filtros en el componente padre.

### MEDIO - Botones de accion sin funcionalidad real (Editar, Compartir, Eliminar)

**R8: En QADetailPage.jsx lineas 146-157, los botones de Editar, Compartir y Eliminar no tienen onClick handlers implementados.**
- Son botones visuales sin ningun efecto
- El boton "Nuevo Desarrollador" en DevelopersPage.jsx linea 38 tampoco tiene handler
- El boton "Editar Perfil" en DevDetailPage.jsx linea 109 tampoco
- **Impacto:** UX confusa -- el usuario ve acciones que no hacen nada.

### BAJO - Permisos no controlados en la UI

**R9: El criterio de completado de la fase 5 dice "Permisos reflejados en la UI" pero hasPermission() del AuthContext nunca se usa en ningun componente de pagina.**
- El boton "Nuevo QA" en QAsPage.jsx se muestra siempre, aunque el usuario no tenga permiso `create_qa`
- Las acciones de Aprobar/Rechazar/Tech Debt en AddTimelineEntry.jsx si filtran por `currentStatus` pero no por permisos del usuario
- Un developer sin `create_qa` vera el boton, intentara crear, y recibira un 403 del backend
- **Impacto:** Experiencia de usuario suboptima; permisos solo se aplican en backend.

### BAJO - URL de commit hardcoded

**R10: En AddTimelineEntry.jsx linea 81, la URL del commit se genera como `https://github.com/company/app/commit/${commitHash}`.**
- Es una URL completamente inventada, no configurable, y no tiene relacion con ningun repositorio real.
- **Impacto:** Los links a commits en el timeline apuntaran a una pagina 404 de GitHub.

### BAJO - Gradient CSS roto en Dashboard stat cards

**R11: En Dashboard.jsx linea 113, la interpolacion del gradiente no funciona:**
```
style={{ background: `linear-gradient(90deg, transparent, ${stat.color.replace('text-', 'var(--color-')})` }}
```
- `stat.color` es algo como `text-accent-blue`, y el replace produce `var(--color-accent-blue)` sin cerrar el parentesis de var().
- Deberia ser `var(--color-accent-blue))`
- **Impacto:** El gradiente decorativo no se renderiza.

## 3. Preguntas dificiles

**P1:** Los tres bugs criticos de shape mismatch (R1, R2, R3) indican que no se hizo una verificacion end-to-end real con el backend corriendo. Se hizo `vite build` pero eso solo comprueba que no hay errores de compilacion, no que los datos fluyan correctamente. Se probo la app contra la API real?

**P2:** El backend serializers.py genera metadata con claves camelCase (`previousStatus`, `newStatus`) pero el frontend las busca en snake_case (`previous_status`, `new_status`). No hay un contrato documentado sobre las claves de metadata. Cual es la convencion decidida para metadata JSONB? Hay riesgo de que datos ya persistidos en la base de datos no sean migrables?

**P3:** La fase dice "Permisos reflejados en la UI" como criterio de completado, pero `hasPermission()` no se invoca en ningun componente de pagina (solo existe en AuthContext). Se decidio deliberadamente postergar esto a la fase 6 o fue un olvido?

**P4:** `useDevelopers()` llama a `userService.getUsers()` que consulta `/users/` -- esta API devuelve TODOS los usuarios (incluyendo admins, leads, etc.), no solo developers. Cuando se usa en NewQAModal para asignar un QA, aparecen todos los usuarios como opciones. Es correcto que puedas asignar un QA a un admin o product_manager?

**P5:** El Sidebar tiene quick filters que usan URLs con query string (`/qas?status=in_review`) pero QAsPage.jsx no lee los query params de la URL -- usa estado local `statusFilter`. Esos links del sidebar en realidad no filtran nada. Se verifico este flujo?

## 4. Sugerencias de cambios

**S1 (CRITICO):** Agregar `description` al QaIssueListSerializer en `serializers.py` linea 167. Cambiar el array `fields` para incluirlo:
```python
fields = ['id', 'title', 'description', 'status', 'priority', 'tags', 'assigned_to', 'created_by', 'due_date', 'created_at', 'updated_at', 'timeline_count']
```

**S2 (CRITICO):** Refactorizar DevDetailPage.jsx para leer correctamente la respuesta de QaDevStatsView. Necesita:
- Usar `stats?.assigned_total` en lugar de `stats.total`
- Usar `stats?.assigned_by_status?.open` en lugar de `stats.open`
- Hacer una peticion separada a `/issues/?assigned_to=<id>` para obtener la lista real de issues, ya que el endpoint de stats NO devuelve issues individuales.

**S3 (CRITICO):** Refactorizar Dashboard.jsx y QAsPage.jsx para leer stats desde el nivel correcto:
- `stats.by_status.in_review` en lugar de `stats.in_review`
- `stats.by_status.approved` en lugar de `stats.approved`
- `stats.by_status[filterValue]` en lugar de `stats[filterValue]`

**S4 (ALTO):** Unificar la convencion de metadata a snake_case en todo el sistema:
- Backend serializers.py: cambiar `previousStatus`/`newStatus` a `previous_status`/`new_status`
- Backend views.py perform_create: igual
- O bien cambiar el frontend StatusNode.jsx para leer `previousStatus`/`newStatus`
- Preferencia: cambiar backend a snake_case ya que es la convencion del resto de la API

**S5 (MEDIO):** Agregar debounce al search en QAsPage.jsx. Opciones:
- Usar un hook `useDebounce(searchQuery, 300)` antes de pasarlo a apiFilters
- O usar `useDeferredValue` de React 19

**S6 (MEDIO):** Leer query params de la URL en QAsPage.jsx para que los quick filters del Sidebar funcionen:
```js
const [searchParams] = useSearchParams()
const initialStatus = searchParams.get('status') || 'all'
```

**S7 (BAJO):** Envolver los botones sin funcionalidad (Editar, Compartir, Eliminar, Nuevo Desarrollador, Editar Perfil) con `disabled` y un tooltip de "Proximamente" o eliminarlos hasta la fase 6.

**S8 (BAJO):** Usar hasPermission en los componentes de pagina para ocultar botones que el usuario no puede usar (Nuevo QA, Aprobar, Rechazar, etc.).

**S9 (BAJO):** Corregir el CSS del gradiente en Dashboard.jsx:
```js
${stat.color.replace('text-', 'var(--color-')})`
// Deberia ser:
${stat.color.replace('text-', 'var(--color-')})`  // <- falta cierre de parentesis de var()
```

## 5. Verificaciones recomendadas

- [ ] **E2E manual CRITICO:** Levantar backend + frontend y navegar a Dashboard, QAsPage, QADetailPage, DevelopersPage, DevDetailPage. Verificar que los datos se renderizan correctamente (no undefined, no 0 cuando deberia haber datos).
- [ ] **Verificar shape de stats:** Hacer `curl` a `/api/qa/stats/` y a `/api/qa/stats/developer/<id>/` y comparar JSON con lo que el frontend espera.
- [ ] **Verificar metadata de timeline:** Crear un issue, cambiar su status, y verificar que la metadata guardada en DB tiene las claves que el frontend lee.
- [ ] **Verificar Sidebar quick filters:** Click en "En Revision" del sidebar y verificar que QAsPage se filtra correctamente.
- [ ] **Probar login con credenciales invalidas:** Verificar que el error se muestra en la UI.
- [ ] **Probar expiracion de token:** Esperar a que el access token expire, hacer una accion, y verificar que el refresh funciona o redirige al login.
- [ ] **Probar creacion de QA como developer (sin permiso create_qa):** Verificar que el 403 se maneja correctamente en la UI.
- [ ] **Test de busqueda rapida:** Escribir rapido en el buscador de QAsPage y verificar que no hay exceso de peticiones al backend (o agregar debounce).
