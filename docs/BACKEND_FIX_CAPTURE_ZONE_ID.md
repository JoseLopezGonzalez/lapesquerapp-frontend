# Fix: Campo `capture_zone_id` no se incluye en creación de producciones

## Problema

Al crear una producción desde el frontend, el campo `capture_zone_id` se envía correctamente en el request, pero Laravel no lo incluye en el SQL INSERT, causando el error:

```
SQLSTATE[HY000]: General error: 1364 Field 'capture_zone_id' doesn't have a default value
```

## Evidencia

**Request enviado desde frontend:**
```json
{
  "lot": "2111250CC01003",
  "notes": "Rizar",
  "species_id": 1,
  "capture_zone_id": 1
}
```

**SQL INSERT ejecutado (incorrecto):**
```sql
insert into `productions` (`lot`, `species_id`, `notes`, `updated_at`, `created_at`) 
values (2111250CC01003, 1, Rizar, 2025-12-04 20:38:35, 2025-12-04 20:38:35)
```

**Nota:** `capture_zone_id` está ausente del INSERT a pesar de estar en el request.

## Solución

Agregar `capture_zone_id` al array `$fillable` del modelo `Production`:

```php
protected $fillable = [
    'lot',
    'species_id',
    'capture_zone_id',  // ← Agregar esta línea
    'notes',
    // ... otros campos existentes
];
```

## Endpoint afectado

- `POST /api/v2/productions`

## Verificación

Después del fix, el SQL INSERT debería incluir `capture_zone_id`:

```sql
insert into `productions` (`lot`, `species_id`, `capture_zone_id`, `notes`, `updated_at`, `created_at`) 
values (2111250CC01003, 1, 1, Rizar, 2025-12-04 20:38:35, 2025-12-04 20:38:35)
```

