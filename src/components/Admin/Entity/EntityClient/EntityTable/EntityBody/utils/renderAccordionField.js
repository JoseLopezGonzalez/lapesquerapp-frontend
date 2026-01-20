import { getSafeValue } from "./getSafeValue";
import { renderByType } from "./renderByType";
import React from "react";

/**
 * Renderiza un campo con label y valor formateado para el accordion
 * @param {Object} header - Configuración del header
 * @param {*} value - Valor del campo
 * @param {Object} row - Fila completa (para acceso a datos relacionados)
 * @returns {JSX.Element}
 */
export function renderAccordionField(header, value, row) {
  const safeValue = getSafeValue(value);
  
  // Crear un contexto similar al de la tabla para renderByType
  const cellCtx = {
    row: { original: row },
    getValue: () => value
  };
  
  const formattedValue = renderByType(header, value, safeValue, cellCtx, null, '');
  
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium">
        {header.label}
      </span>
      <span className="text-sm">
        {formattedValue}
      </span>
    </div>
  );
}

/**
 * Renderiza un campo principal para el trigger del accordion en formato vertical
 * @param {Object} header - Configuración del header
 * @param {*} value - Valor del campo
 * @param {Object} row - Fila completa
 * @returns {JSX.Element}
 */
export function renderPrimaryField(header, value, row) {
  const safeValue = getSafeValue(value);
  
  // Para listas, renderizar cada item en una línea separada (antes de renderByType)
  if (header.type === 'list' && Array.isArray(value) && value.length > 0) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <span className="text-xs text-muted-foreground font-medium">
          {header.label}:
        </span>
        <div className="flex flex-col gap-0.5">
          {value.map((item, index) => (
            <span key={index} className="text-sm">
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }
  
  // Crear un contexto similar al de la tabla para renderByType
  const cellCtx = {
    row: { original: row },
    getValue: () => value
  };
  
  const formattedValue = renderByType(header, value, safeValue, cellCtx, null, '');
  
  // Para badges, mostrar con label arriba
  if (header.type === 'badge') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-medium">
          {header.label}:
        </span>
        <div>{formattedValue}</div>
      </div>
    );
  }
  
  // Para otros campos, mostrar label arriba y valor abajo
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium">
        {header.label}:
      </span>
      <span className="text-sm font-medium">
        {formattedValue}
      </span>
    </div>
  );
}

