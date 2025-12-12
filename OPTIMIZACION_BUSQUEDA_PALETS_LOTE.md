# Optimización: Búsqueda de Palets por Lote

## Problema Actual

Cuando se busca por lote, el frontend:
1. Obtiene TODOS los palets registrados (`GET /api/v2/pallets/registered`)
2. Filtra en el frontend los que tienen el lote
3. Hace múltiples llamadas individuales (`GET /api/v2/pallets/{id}`) para cada palet encontrado

**Problemas:**
- ❌ Trae datos innecesarios (todos los palets cuando solo necesitamos algunos)
- ❌ Filtrado en el frontend (debería ser en el backend)
- ❌ Múltiples llamadas HTTP (N+1 problem)
- ❌ Lento con muchos palets registrados
- ❌ Mayor uso de ancho de banda

## Solución Recomendada

### Endpoint Nuevo Propuesto

```
GET /api/v2/pallets/search-by-lot?lot={lote}
```

**Parámetros:**
- `lot` (query string, requerido): El lote a buscar

**Respuesta:**
```json
{
  "data": {
    "pallets": [
      {
        "id": 123,
        "boxes": [
          {
            "id": 456,
            "lot": "LOTE-2024-001",
            "netWeight": 10.5,
            "product": { ... },
            "isAvailable": true,
            ...
          }
        ],
        ...
      }
    ],
    "total": 5,
    "totalBoxes": 23
  }
}
```

**Características:**
- ✅ Busca directamente en la base de datos por lote
- ✅ Retorna solo los palets que tienen cajas con ese lote
- ✅ Incluye solo cajas disponibles (isAvailable = true)
- ✅ Una sola llamada HTTP
- ✅ Mucho más rápido
- ✅ Menor uso de ancho de banda

### Query SQL Sugerida (ejemplo)

```sql
SELECT DISTINCT p.*
FROM pallets p
INNER JOIN boxes b ON b.pallet_id = p.id
WHERE b.lot = :lot
  AND b.is_available = true
  AND p.state_id = 1  -- registered
ORDER BY p.id
```

Luego cargar las relaciones (boxes, products, etc.) según tu ORM.

## Implementación en el Backend

### Laravel (ejemplo)

```php
// routes/api.php
Route::get('/pallets/search-by-lot', [PalletController::class, 'searchByLot']);

// PalletController.php
public function searchByLot(Request $request)
{
    $lot = $request->query('lot');
    
    if (!$lot) {
        return response()->json(['message' => 'El parámetro lot es requerido'], 400);
    }
    
    $pallets = Pallet::whereHas('boxes', function ($query) use ($lot) {
        $query->where('lot', $lot)
              ->where('is_available', true);
    })
    ->where('state_id', 1) // registered
    ->with(['boxes' => function ($query) use ($lot) {
        $query->where('lot', $lot)
              ->where('is_available', true)
              ->with('product');
    }])
    ->get();
    
    return response()->json([
        'data' => [
            'pallets' => PalletResource::collection($pallets),
            'total' => $pallets->count(),
            'totalBoxes' => $pallets->sum(fn($p) => $p->boxes->count())
        ]
    ]);
}
```

## Cambios en el Frontend

Una vez implementado el endpoint, el código quedaría así:

```javascript
// Búsqueda por lote optimizada
const handleSearchByLot = async (lot) => {
    try {
        setLoadingPallet(true)
        const token = session.user.accessToken
        
        // Una sola llamada al nuevo endpoint
        const response = await fetchWithTenant(
            `${API_URL_V2}pallets/search-by-lot?lot=${encodeURIComponent(lot)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        )
        
        if (!response.ok) {
            throw new Error('Error al buscar palets por lote')
        }
        
        const data = await response.json()
        const pallets = data.data?.pallets || []
        
        if (pallets.length === 0) {
            alert(`No se encontraron palets con el lote "${lot}"`)
            return
        }
        
        // Los palets ya vienen con todos los datos necesarios
        setLoadedPallets(prev => {
            const newPallets = pallets.filter(p => 
                !prev.some(loaded => loaded.id === p.id)
            )
            if (newPallets.length === 0) {
                alert('Todos los palets con este lote ya están cargados')
                return prev
            }
            const updated = [...prev, ...newPallets]
            if (prev.length === 0 && updated.length > 0) {
                setSelectedPalletId(updated[0].id)
            }
            return updated
        })
        
        // Seleccionar automáticamente las cajas con el lote
        const boxesToSelect = []
        pallets.forEach(pallet => {
            pallet.boxes?.forEach(box => {
                if (
                    box.lot?.toString().toLowerCase() === lot.toLowerCase() &&
                    box.isAvailable &&
                    !isBoxSelected(box.id, pallet.id)
                ) {
                    boxesToSelect.push({
                        boxId: box.id,
                        palletId: pallet.id
                    })
                }
            })
        })
        
        if (boxesToSelect.length > 0) {
            setSelectedBoxes(prev => {
                const newBoxes = [...prev]
                boxesToSelect.forEach(box => {
                    if (!newBoxes.some(b => b.boxId === box.boxId && b.palletId === box.palletId)) {
                        newBoxes.push(box)
                    }
                })
                return newBoxes
            })
        }
    } catch (err) {
        console.error('Error searching by lot:', err)
        alert(err.message || 'Error al buscar palets por lote')
    } finally {
        setLoadingPallet(false)
    }
}
```

## Beneficios

1. **Performance**: De N+1 llamadas a 1 sola llamada
2. **Escalabilidad**: Funciona bien aunque haya miles de palets
3. **Ancho de banda**: Solo se transfieren los datos necesarios
4. **Mantenibilidad**: Lógica de búsqueda centralizada en el backend
5. **Consistencia**: Mismo formato de respuesta que otros endpoints

## Alternativa: Endpoint más genérico

Si quieres más flexibilidad, podrías crear un endpoint de búsqueda más genérico:

```
GET /api/v2/pallets/search?lot={lote}&product_id={id}&store_id={id}&state={state}
```

Esto permitiría búsquedas más complejas en el futuro.

