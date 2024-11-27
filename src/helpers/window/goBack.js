

/*Función que permite regresar a la página anterior en la historia del navegador.*/


export const goBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };