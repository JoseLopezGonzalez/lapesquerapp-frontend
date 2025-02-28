
export const formatInteger = (number) => {
    return Intl.NumberFormat('es-ES', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    }).format(number);
  }
  
  export const formatIntegerCurrency = (number) => {
    return `${formatInteger(number)} €`;
  }
  
  export const formatIntegerWeight = (number) => {
    return `${formatInteger(number)} Kg`;
  }

  export const formatDecimal = (number) => {
    return Intl.NumberFormat('es-ES', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(number);
  }
  
  export const formatDecimalCurrency = (number) => {
    return `${formatDecimal(number)} €`;
  }
  
  export const formatDecimalWeight = (number) => {
    return `${formatDecimal(number)} kg`;
  }
  
  