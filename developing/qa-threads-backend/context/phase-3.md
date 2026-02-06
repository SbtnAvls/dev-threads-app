# Fase 3 - Backend: API REST de QA Issues + Timeline

## Objetivo
Implementar CRUD completo de QA Issues y Timeline Entries con filtros, paginacion, ordenamiento y endpoints de estadisticas.

## Archivos a modificar
- `C:\development\back\cashblock-backend\apps\qa_threads\serializers.py` (ampliar)
- `C:\development\back\cashblock-backend\apps\qa_threads\views.py` (ampliar)
- `C:\development\back\cashblock-backend\apps\qa_threads\urls.py` (ampliar)
- `C:\development\back\cashblock-backend\apps\qa_threads\filters.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\pagination.py` (nuevo)

## Pasos
1. Crear serializers:
   - QaIssueListSerializer (resumen para listado)
   - QaIssueDetailSerializer (detalle completo con timeline)
   - QaIssueCreateUpdateSerializer
   - QaTimelineEntrySerializer
   - QaUserListSerializer (para listado de developers)
   - StatsSerializer
2. Crear filtros en `filters.py`:
   - Filtro de issues por: status, priority, assigned_to, created_by, tags, date range
3. Crear views:
   - QaIssueViewSet (CRUD completo con permisos por rol)
   - QaTimelineEntryViewSet (crear, listar por issue)
   - QaUserListView (GET /api/qa/users/ - listado de usuarios)
   - QaStatsView (GET /api/qa/stats/) - estadisticas globales
   - QaDevStatsView (GET /api/qa/stats/developer/<id>/) - stats por developer
4. Configurar paginacion en `pagination.py`
5. Registrar rutas con DefaultRouter:
   - /api/qa/issues/ (list, create)
   - /api/qa/issues/<id>/ (retrieve, update, partial_update, destroy)
   - /api/qa/issues/<id>/timeline/ (list, create timeline entries)
   - /api/qa/users/ (list)
   - /api/qa/stats/ (global stats)
   - /api/qa/stats/developer/<id>/ (developer stats)
6. Implementar logica de permisos:
   - Solo admin/lead/pm pueden asignar issues
   - Solo admin puede eliminar issues
   - developer solo ve issues asignados a el (view_assigned)
   - Crear timeline entry automatica al cambiar status/assignment

## Estadisticas a exponer
- Total issues, por status, por priority
- Issues creados este mes, resueltos este mes
- Por developer: asignados, resueltos, tiempo promedio de resolucion

## Verificacion
- CRUD completo de issues funciona con auth
- Filtros por status, priority, assigned_to, tags operan correctamente
- Timeline entries se crean manual y automaticamente
- Stats globales y por developer retornan datos correctos
- Paginacion funciona (page, page_size)
- Permisos por rol se aplican correctamente

## Criterio de completado
- Todos los endpoints responden correctamente con auth
- Filtros, paginacion y ordenamiento funcionan
- Stats devuelven datos correctos
- Permisos verificados para cada rol
- Timeline entries automaticas al cambiar status/assignment
