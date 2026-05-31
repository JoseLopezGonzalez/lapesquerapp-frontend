# Reglas de Testing — La PesquerApp

## Stack de tests

- **Vitest** 4.0.18 — test runner
- **@testing-library/react** 16.3.2 — tests de componentes (cuando aplique)
- **@testing-library/react-hooks** 8.0.1 — tests de hooks
- **happy-dom** / **jsdom** — entorno DOM simulado

```bash
npm run test       # Vitest en modo watch (desarrollo)
npm run test:run   # Vitest ejecución única (CI)
```

---

## Qué testar — prioridades del proyecto

### ✅ Alta prioridad (lo que ya cubre el proyecto)

```
hooks/         → useOrder, useStores, useCustomerHistory…
services/      → customerService, supplierService, userService…
utils/         → loginUtils, helpers de formato
validators/    → funciones de validación puras
helpers/       → receptionCalculations, receptionTransformations
exportHelpers/ → lógica de exportación xlsx
```

### ⚠️ Deuda técnica — no añadir tests aquí todavía

```
components/    → tests de UI React (pendiente para fase posterior)
              → no añadir complejidad hasta tener test infrastructure consolidada
```

---

## Estructura de un test — patrón real del proyecto

```typescript
// src/__tests__/hooks/useCustomersList.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react-hooks';

describe('useCustomersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve lista vacía por defecto', () => {
    // Arrange
    const { result } = renderHook(() => useCustomersList({ enabled: false }));

    // Assert
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('devuelve datos del servicio cuando se llama', async () => {
    // Arrange
    vi.mocked(customerService.list).mockResolvedValue({
      data: [{ id: 1, name: 'Cliente Test' }],
      meta: { current_page: 1, last_page: 1, per_page: 12, total: 1 },
    });

    const { result } = renderHook(() => useCustomersList());

    // Act + Assert
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('Cliente Test');
  });
});
```

---

## Estructura de un test de service

```typescript
// src/__tests__/services/customerService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerService } from '@/services/domain/customers/customerService';

vi.mock('@/lib/auth/getAuthToken', () => ({
  getAuthToken: vi.fn().mockResolvedValue('mock-token'),
}));

vi.mock('@/services/generic/entityService', () => ({
  fetchEntitiesGeneric: vi.fn(),
  deleteEntityGeneric: vi.fn(),
}));

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('construye la URL con los filtros correctamente', async () => {
      const mockData = { data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } };
      vi.mocked(fetchEntitiesGeneric).mockResolvedValue(mockData);

      await customerService.list({ search: 'brisamar' }, { page: 2 });

      expect(fetchEntitiesGeneric).toHaveBeenCalledWith(
        expect.stringContaining('search=brisamar'),
        'mock-token'
      );
      expect(fetchEntitiesGeneric).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        'mock-token'
      );
    });
  });

  describe('getOptions', () => {
    it('llama al endpoint /options', async () => {
      vi.mocked(fetchEntitiesGeneric).mockResolvedValue([]);
      await customerService.getOptions();
      expect(fetchEntitiesGeneric).toHaveBeenCalledWith(
        expect.stringContaining('/options'),
        'mock-token'
      );
    });
  });
});
```

---

## Mocking de fetchWithTenant en tests

```typescript
// Nunca mockear fetchWithTenant directamente — mockear los helpers genéricos
// o los services completos según lo que necesites testar

// ✅ Para tests de service — mockear los helpers genéricos
vi.mock('@/services/generic/entityService', () => ({
  fetchEntitiesGeneric: vi.fn().mockResolvedValue({ data: [], meta: {} }),
  deleteEntityGeneric: vi.fn().mockResolvedValue({}),
}));

// ✅ Para tests de hook — mockear el service completo
vi.mock('@/services/domain/customers/customerService', () => ({
  customerService: {
    list: vi.fn().mockResolvedValue({ data: [], meta: {} }),
    getOptions: vi.fn().mockResolvedValue([]),
  },
}));

// ✅ Para tests de utilidades — no necesitas mockear nada de HTTP
import { validateLabelName } from '@/hooks/labelEditorValidation';
expect(validateLabelName('')).toBeTruthy();
```

---

## Ubicación de los tests

```
src/__tests__/
├── hooks/             → tests de hooks TanStack Query
├── services/          → tests de services de dominio
├── utils/             → tests de utilidades puras
├── validators/        → tests de funciones de validación
├── helpers/           → tests de helpers (cálculos, transformaciones)
├── exportHelpers/     → tests de lógica de exportación
└── configs/           → tests de configuraciones
```

**Convención de nombres:** `[nombreDelArchivo].test.ts` en el directorio correspondiente de `__tests__/`.

---

## Estructura interna de un test

```typescript
describe('[Nombre del módulo]', () => {
  // Setup común
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('[Método o función específica]', () => {
    it('[debería hacer X cuando Y]', () => {
      // Arrange — preparar datos
      // Act — ejecutar la función
      // Assert — verificar resultado
    });

    it('[debería lanzar error cuando Z]', () => {
      // ...
    });
  });
});
```

---

## Tests de funciones puras — el caso más simple

```typescript
// Ejemplo real del proyecto: labelEditorValidation.test.js
import { describe, it, expect } from 'vitest';
import { validateLabelName, hasDuplicateFieldKeys } from './labelEditorValidation';

describe('labelEditorValidation', () => {
  it('validateLabelName devuelve error para nombre vacío', () => {
    expect(validateLabelName('')).toBeTruthy();
  });

  it('validateLabelName devuelve null para nombre válido', () => {
    expect(validateLabelName('Mi Etiqueta')).toBeNull();
  });

  it('hasDuplicateFieldKeys es false para array vacío', () => {
    expect(hasDuplicateFieldKeys([])).toBe(false);
  });

  it('hasDuplicateFieldKeys es true cuando hay duplicados', () => {
    expect(hasDuplicateFieldKeys([
      { type: 'manualField', key: 'A' },
      { type: 'manualField', key: 'A' },
    ])).toBe(true);
  });
});
```

---

## Lo que NO hacer todavía

- No añadir snapshot tests (alta fragilidad, bajo valor)
- No añadir tests E2E con Playwright/Cypress (no están instalados)
- No añadir tests de componentes React hasta que se decida el enfoque
- No añadir coverage gates en CI hasta tener cobertura base establecida
