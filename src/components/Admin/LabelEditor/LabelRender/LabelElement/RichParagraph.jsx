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
  
  if (element.html) {
    const processedHtml = processHtml(element.html);
    return (
      <div
        className="w-full h-full"
        style={{
          textAlign: element.textAlign,
          fontSize: `${fontSize}mm`,
          fontWeight: element.fontWeight,
          color: element.color,
          textTransform: element.textTransform,
          fontStyle: element.fontStyle,
          textDecoration: element.textDecoration,
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    );
  }

  const segments = Array.isArray(element.segments)
    ? element.segments
    : [{ text: element.text || "Texto de ejemplo", style: {} }];

  return (
    <div
      className="w-full h-full"
      style={{
        textAlign: element.textAlign,
        fontSize: `${fontSize}mm`,
        fontWeight: element.fontWeight,
        color: element.color,
        textTransform: element.textTransform,
        fontStyle: element.fontStyle,
        textDecoration: element.textDecoration,
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
  );
}
