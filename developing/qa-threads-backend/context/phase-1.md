# Fase 1 - Backend: App Django + Modelos + Migraciones

## Objetivo
Crear la app Django `qa_threads` con los 4 modelos del esquema aprobado, generar migraciones, registrar en admin y sembrar los roles iniciales.

## Archivos a modificar
- `C:\development\back\cashblock-backend\apps\qa_threads\__init__.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\apps.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\models.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\admin.py` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\migrations\` (nuevo)
- `C:\development\back\cashblock-backend\apps\qa_threads\management\commands\seed_qa_roles.py` (nuevo)
- `C:\development\back\cashblock-backend\toolit\settings.py` (agregar app a INSTALLED_APPS)

## Pasos
1. Crear directorio `apps/qa_threads/` con estructura Django estandar
2. Crear `apps.py` con label `qa_threads`
3. Crear modelos en `models.py`:
   - **QaRole**: name (unique), permissions (JSONField), description, created_at
   - **QaUser**: email (unique), password_hash, first_name, last_name, role (FK a QaRole), avatar_url, is_active, created_at, updated_at
   - **QaIssue**: title, description, status (choices: open/in_progress/resolved/closed/reopened), priority (choices: critical/high/medium/low), tags (ArrayField TEXT), assigned_to (FK QaUser nullable), created_by (FK QaUser), due_date (nullable), created_at, updated_at
   - **QaTimelineEntry**: issue (FK QaIssue), type (choices: comment/status_change/assignment/commit/review/tag_change), author (FK QaUser), content (text), metadata (JSONField), created_at
4. Todas las tablas con `db_table` explicito: `qa_roles`, `qa_users`, `qa_issues`, `qa_timeline_entries`
5. Registrar modelos en `admin.py`
6. Agregar `apps.qa_threads` a INSTALLED_APPS en settings.py
7. Generar migraciones: `python manage.py makemigrations qa_threads`
8. Aplicar migraciones: `python manage.py migrate qa_threads`
9. Crear management command `seed_qa_roles` con los 5 roles y sus permisos
10. Ejecutar seed: `python manage.py seed_qa_roles`

## Permisos por rol (para el seed)
```json
{
  "admin": ["*"],
  "lead": ["create_qa", "assign_qa", "close_qa", "reject_qa", "approve_qa", "comment", "manage_users", "mark_tech_debt", "view_all"],
  "product_manager": ["create_qa", "assign_qa", "close_qa", "approve_qa", "reject_qa", "comment", "view_all"],
  "qa": ["create_qa", "assign_qa", "approve_qa", "reject_qa", "comment", "view_all"],
  "developer": ["comment", "change_status", "add_commit", "view_assigned"]
}
```

## Verificacion
- `python manage.py showmigrations qa_threads` muestra migraciones aplicadas
- `python manage.py shell -c "from apps.qa_threads.models import QaRole; print(QaRole.objects.count())"` devuelve 5
- `python manage.py shell -c "from apps.qa_threads.models import QaUser, QaIssue, QaTimelineEntry; print('OK')"` no da error
- Tablas `qa_roles`, `qa_users`, `qa_issues`, `qa_timeline_entries` existen en PostgreSQL

## Criterio de completado
- Los 4 modelos estan definidos y las migraciones aplicadas sin errores
- Los 5 roles estan sembrados en la tabla `qa_roles`
- Los modelos aparecen en Django Admin
- No se rompe nada del backend existente
