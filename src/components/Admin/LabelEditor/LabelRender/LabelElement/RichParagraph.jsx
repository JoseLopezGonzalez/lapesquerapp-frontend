export default function RichParagraph({ element, style = {} }) {
  const fontSize = element.fontSize || 2.5;
  
  // Función para limpiar fontSize inline del HTML para que el fontSize del contenedor se aplique correctamente
  const processHtml = (html) => {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remover fontSize de todos los elementos y aplicar el fontSize del contenedor
    const removeFontSize = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.style) {
          node.style.removeProperty('font-size');
        }
        Array.from(node.children).forEach(child => removeFontSize(child));
      }
    };
    
    removeFontSize(doc.body);
    return doc.body.innerHTML;
  };
  
  // Mapear horizontalAlign a textAlign para el texto interno
  const getTextAlign = () => {
    if (element.horizontalAlign) {
      return element.horizontalAlign === 'justify' ? 'justify' : element.horizontalAlign;
    }
    // Fallback a textAlign si existe (para compatibilidad)
    return element.textAlign || 'left';
  };

  // Determinar el ancho según horizontalAlign
  // Si horizontalAlign es "justify", el contenido debe ocupar todo el ancho para justificar el texto
  // Si es "left", "center" o "right", el contenido se ajusta al texto y el contenedor padre lo alinea
  const getWidth = () => {
    if (element.horizontalAlign === 'justify') {
      return '100%';
    }
    // Para left, center, right: el contenido se ajusta al texto
    // y el contenedor padre (con justifyContent) lo alinea horizontalmente
    return 'max-content';
  };

  // Determinar la altura según verticalAlign
  // Para "start" y "end": el contenido se ajusta a su altura natural
  // Para "center": el contenido debe ocupar toda la altura para que el padre lo centre
  const getHeight = () => {
    // Si verticalAlign es "start" o "end", ajustar al contenido
    if (element.verticalAlign === 'start' || element.verticalAlign === 'end') {
      return 'auto';
    }
    // Si es "center" o no está definido, ocupar toda la altura para que el centrado funcione
    return '100%';
  };

  // Determinar el display según verticalAlign
  const getDisplay = () => {
    const height = getHeight();
    if (height === 'auto') {
      return 'inline-block';
    }
    // Para center, usar flex para centrar el contenido verticalmente dentro del div
    return 'flex';
  };

  // Obtener estilos adicionales para el contenedor según verticalAlign
  const getContainerStyles = () => {
    const styles = {};
    const height = getHeight();
    
    // Si es center y ocupa toda la altura, centrar el contenido verticalmente
    if (element.verticalAlign === 'center' && height === '100%') {
      styles.alignItems = 'center';
      styles.justifyContent = 'center';
      styles.flexDirection = 'column';
    }
    
    return styles;
  };

  if (element.html) {
    const processedHtml = processHtml(element.html);
    const containerStyles = getContainerStyles();
    const isCenter = element.verticalAlign === 'center';
    
    return (
      <div
        style={{
          width: getWidth(),
          height: getHeight(),
          display: getDisplay(),
          ...containerStyles,
          ...style,
        }}
      >
        <div
          style={{
            textAlign: getTextAlign(),
            fontSize: `${fontSize}mm`,
            fontWeight: element.fontWeight,
            color: element.color,
            textTransform: element.textTransform,
            fontStyle: element.fontStyle,
            textDecoration: element.textDecoration,
            width: isCenter ? '100%' : 'auto',
            ...(isCenter ? { alignSelf: 'center' } : {}),
          }}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      </div>
    );
  }

  const segments = Array.isArray(element.segments)
    ? element.segments
    : [{ text: element.text || "Texto de ejemplo", style: {} }];

  const containerStyles = getContainerStyles();
  const isCenter = element.verticalAlign === 'center';
  
  return (
    <div
      style={{
        width: getWidth(),
        height: getHeight(),
        display: getDisplay(),
        ...containerStyles,
      }}
    >
      <div
        style={{
          textAlign: getTextAlign(),
          fontSize: `${fontSize}mm`,
          fontWeight: element.fontWeight,
          color: element.color,
          textTransform: element.textTransform,
          fontStyle: element.fontStyle,
          textDecoration: element.textDecoration,
          width: isCenter ? '100%' : 'auto',
          ...(isCenter ? { alignSelf: 'center' } : {}),
        }}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            style={{
              fontWeight: seg.style?.fontWeight,
              fontStyle: seg.style?.fontStyle,
              textDecoration: seg.style?.textDecoration,
              color: seg.style?.color,
              ...style,
            }}
          >
            {seg.text}
          </span>
        ))}
      </div>
    </div>
  );
}
