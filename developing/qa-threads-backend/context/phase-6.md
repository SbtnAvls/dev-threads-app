# Fase 6 - Testing + Polish

## Objetivo
Probar el flujo completo end-to-end, crear seed de datos de prueba y realizar ajustes finales de UX.

## Archivos a modificar
- `C:\development\back\cashblock-backend\apps\qa_threads\management\commands\seed_qa_data.py` (nuevo)
- Posibles ajustes en cualquier archivo de frontend o backend segun hallazgos

## Pasos
1. Crear management command `seed_qa_data` que genere:
   - 1 usuario por cada rol (admin, lead, pm, qa, developer)
   - 10-15 issues de ejemplo con variedad de status y priority
   - Timeline entries variadas (comentarios, cambios de status, commits)
2. Ejecutar seed y verificar que el frontend muestra todo correctamente
3. Probar flujo completo:
   - Registro de usuario nuevo
   - Login
   - Crear issue
   - Asignar issue a developer
   - Developer comenta y cambia status
   - Lead aprueba/cierra issue
   - Verificar timeline completa
4. Probar permisos:
   - Developer NO puede crear issues (si no tiene permiso)
   - Developer solo ve sus issues asignados
   - Admin puede hacer todo
5. Probar edge cases:
   - Token expirado -> refresh automatico
   - Usuario sin permisos intenta accion prohibida
   - Campos requeridos vacios
   - Issues sin asignar
6. Ajustes finales de UX:
   - Mensajes de error amigables
   - Feedback visual en acciones (toasts, spinners)
   - Responsive check

## Verificacion
- Flujo completo funciona sin errores
- Todos los roles operan con sus permisos correctos
- No hay errores en consola del navegador
- No hay errores en logs del backend
- Datos de seed se visualizan correctamente

## Criterio de completado
- Flujo E2E probado y documentado
- Seed de datos funcional
- Sin errores de consola ni de backend
- UX pulido con feedback visual adecuado
- Permisos funcionan correctamente para cada rol
