'use client';

/**
 * Componente para renderizar Markdown con componentes ShadCN UI
 * 
 * Renderiza Markdown estructurado usando componentes visuales coherentes
 * con el design system de ShadCN UI, manteniendo compatibilidad con streaming.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Componentes personalizados para renderizar elementos Markdown
 * usando componentes ShadCN UI
 */
const markdownComponents = {
  // Títulos
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-medium mt-4 mb-2 text-foreground" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-base font-medium mt-3 mb-2 text-foreground" {...props} />
  ),

  // Párrafos
  p: ({ node, ...props }) => {
    // Eliminar el último párrafo si está vacío para evitar espacios extra
    const children = props.children;
    const isEmpty = typeof children === 'string' && children.trim() === '';
    if (isEmpty) return null;
    
    // ✅ Asegurar que los párrafos no tengan saltos de línea inesperados
    // Forzar que el contenido se renderice inline cuando está dentro de listas
    // Verificar si el párrafo está dentro de un li
    const isInsideList = node?.parent?.type === 'listItem';
    
    return (
      <p className={cn(
        "text-sm leading-relaxed text-foreground whitespace-normal",
        isInsideList ? "mb-0 inline mr-1 [&>code]:inline [&>strong]:inline [&>em]:inline [&>*]:inline" : "mb-2 last:mb-0 [&>code]:inline [&>strong]:inline [&>em]:inline"
      )} {...props} />
    );
  },

  // Listas
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-outside mb-3 space-y-2 text-sm text-foreground ml-4" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-outside mb-3 space-y-2 text-sm text-foreground ml-4" {...props} />
  ),
  li: ({ node, ...props }) => {
    // ✅ Asegurar que el contenido del li se renderice inline sin saltos
    // React-markdown puede crear párrafos dentro de li, necesitamos forzar inline
    // Usar flexbox o inline-block para mantener todo en una línea
    return (
      <li className="pl-2 text-sm text-foreground leading-relaxed [&>p]:mb-0 [&>p:last-child]:mb-0 [&>p]:inline [&>p]:mr-1 [&>code]:inline [&>strong]:inline [&>em]:inline [&>*]:inline" {...props} />
    );
  },

  // Tablas (usando componente Table de ShadCN UI)
  table: ({ node, ...props }) => (
    <div className="my-4 rounded-md border overflow-hidden">
      <Table {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <TableHeader {...props} />,
  tbody: ({ node, ...props }) => <TableBody {...props} />,
  tr: ({ node, ...props }) => <TableRow {...props} />,
  th: ({ node, ...props }) => <TableHead className="font-semibold" {...props} />,
  td: ({ node, ...props }) => (
    <TableCell className="whitespace-normal [&>code]:inline [&>strong]:inline [&>em]:inline [&>*]:inline" {...props} />
  ),

  // Código inline
  code: ({ node, inline, ...props }) => {
    if (inline) {
      // ✅ Código inline: asegurar que no cause saltos de línea
      return (
        <code
          className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs text-foreground whitespace-normal inline"
          {...props}
        />
      );
    }
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs text-foreground block p-3 my-3 overflow-x-auto"
        {...props}
      />
    );
  },

  // Bloques de código
  pre: ({ node, ...props }) => (
    <pre
      className="overflow-x-auto rounded-md bg-muted p-3 my-3 text-xs"
      {...props}
    />
  ),

  // Enlaces
  a: ({ node, ...props }) => (
    <a
      className="text-primary underline underline-offset-4 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),

  // Negrita y cursiva
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="italic text-foreground" {...props} />
  ),

  // Líneas horizontales
  hr: ({ node, ...props }) => (
    <hr className="my-4 border-border" {...props} />
  ),

  // Blockquotes
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="mt-3 border-l-4 border-primary/20 pl-4 italic text-muted-foreground"
      {...props}
    />
  ),
};

/**
 * Componente principal para renderizar Markdown
 * 
 * @param {string} content - Contenido Markdown a renderizar
 * @param {string} className - Clases CSS adicionales
 */
export function MarkdownRenderer({ content, className }) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // ✅ DEBUG: Log del contenido crudo antes de normalizar
  console.log('[MarkdownRenderer] 📥 Contenido crudo recibido:', {
    length: content.length,
    preview: content.substring(0, 200),
    fullContent: content,
    lines: content.split('\n'),
    linesCount: content.split('\n').length,
  });

  // Normalizar el contenido: eliminar saltos de línea inesperados dentro de párrafos
  // pero preservar la estructura de Markdown
  const normalizeMarkdownContent = (text) => {
    // Dividir en líneas
    const lines = text.trim().split('\n');
    const normalized = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trimEnd();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trimStart() : '';
      
      // Si la línea actual termina con un carácter que sugiere continuación (letra, número, coma, etc.)
      // y la siguiente línea no empieza con caracteres de estructura Markdown, unirlas
      // Nota: # seguido de número es probablemente un ID, no un título Markdown
      const isMarkdownStructure = (text) => {
        // Detectar estructuras Markdown: listas, títulos reales, tablas, código
        return text.match(/^[\*\-\s]+\s/) || // Lista con bullet
               text.match(/^\d+\.\s/) || // Lista numerada
               text.match(/^#{1,6}\s/) || // Título (múltiples # seguidos de espacio)
               text.match(/^\|.*\|$/) || // Tabla
               text.match(/^```/) || // Bloque de código
               text.match(/^>/); // Blockquote
      };
      
      const shouldJoin = 
        line.length > 0 && 
        nextLine.length > 0 &&
        !isMarkdownStructure(line) &&
        !isMarkdownStructure(nextLine) &&
        !line.match(/[:\.!\?\)\]\}]$/) && // No termina con carácter de fin natural
        !nextLine.match(/^[\(\[\{]/); // No empieza con carácter de inicio especial
      
      if (shouldJoin && i + 1 < lines.length) {
        // Unir las líneas con un espacio
        normalized.push(line + ' ' + nextLine);
        i += 2; // Saltar la siguiente línea ya que la unimos
      } else {
        normalized.push(line);
        i++;
      }
    }
    
    // Unir todas las líneas normalizadas
    return normalized.join('\n')
      // Normalizar saltos de línea múltiples
      .replace(/\n{3,}/g, '\n\n');
  };

  const normalizedContent = normalizeMarkdownContent(content);
  
  // ✅ DEBUG: Log del contenido normalizado
  console.log('[MarkdownRenderer] 🔄 Contenido normalizado:', {
    length: normalizedContent.length,
    preview: normalizedContent.substring(0, 200),
    fullContent: normalizedContent,
    lines: normalizedContent.split('\n'),
    linesCount: normalizedContent.split('\n').length,
  });

  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // Soporte para tablas, strikethrough, etc.
        components={markdownComponents}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

