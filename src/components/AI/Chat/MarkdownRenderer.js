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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * Componentes personalizados para renderizar elementos Markdown
 * usando componentes ShadCN UI
 */
const markdownComponents = {
  // Títulos
  h1: ({ node, ...props }) => (
    <h1 className="text-foreground mt-6 mb-4 text-2xl font-bold" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-foreground mt-5 mb-3 text-xl font-semibold" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-foreground mt-4 mb-2 text-lg font-medium" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-foreground mt-3 mb-2 text-base font-medium" {...props} />
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
      <p
        className={cn(
          'text-foreground text-sm leading-relaxed whitespace-normal',
          isInsideList
            ? 'mr-1 mb-0 inline [&>*]:inline [&>code]:inline [&>em]:inline [&>strong]:inline'
            : 'mb-2 last:mb-0 [&>code]:inline [&>em]:inline [&>strong]:inline'
        )}
        {...props}
      />
    );
  },

  // Listas
  ul: ({ node, ...props }) => (
    <ul className="text-foreground mb-3 ml-4 list-outside list-disc space-y-2 text-sm" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="text-foreground mb-3 ml-4 list-outside list-decimal space-y-2 text-sm"
      {...props}
    />
  ),
  li: ({ node, ...props }) => {
    // ✅ Asegurar que el contenido del li se renderice inline sin saltos
    // React-markdown puede crear párrafos dentro de li, necesitamos forzar inline
    // Usar flexbox o inline-block para mantener todo en una línea
    return (
      <li
        className="text-foreground pl-2 text-sm leading-relaxed [&>*]:inline [&>code]:inline [&>em]:inline [&>p]:mr-1 [&>p]:mb-0 [&>p]:inline [&>p:last-child]:mb-0 [&>strong]:inline"
        {...props}
      />
    );
  },

  // Tablas (usando componente Table de ShadCN UI)
  table: ({ node, ...props }) => (
    <div className="my-4 overflow-hidden rounded-md border">
      <Table {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <TableHeader {...props} />,
  tbody: ({ node, ...props }) => <TableBody {...props} />,
  tr: ({ node, ...props }) => <TableRow {...props} />,
  th: ({ node, ...props }) => <TableHead className="font-semibold" {...props} />,
  td: ({ node, ...props }) => (
    <TableCell
      className="whitespace-normal [&>*]:inline [&>code]:inline [&>em]:inline [&>strong]:inline"
      {...props}
    />
  ),

  // Código inline
  code: ({ node, inline, ...props }) => {
    if (inline) {
      // ✅ Código inline: asegurar que no cause saltos de línea
      return (
        <code
          className="bg-muted text-foreground relative inline rounded px-[0.3rem] py-[0.2rem] font-mono text-xs whitespace-normal"
          {...props}
        />
      );
    }
    return (
      <code
        className="bg-muted text-foreground relative my-3 block overflow-x-auto rounded p-3 px-[0.3rem] py-[0.2rem] font-mono text-xs"
        {...props}
      />
    );
  },

  // Bloques de código
  pre: ({ node, ...props }) => (
    <pre className="bg-muted my-3 overflow-x-auto rounded-md p-3 text-xs" {...props} />
  ),

  // Enlaces
  a: ({ node, ...props }) => (
    <a
      className="text-primary hover:text-primary/80 underline underline-offset-4"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),

  // Negrita y cursiva
  strong: ({ node, ...props }) => <strong className="text-foreground font-semibold" {...props} />,
  em: ({ node, ...props }) => <em className="text-foreground italic" {...props} />,

  // Líneas horizontales
  hr: ({ node, ...props }) => <hr className="border-border my-4" {...props} />,

  // Blockquotes
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-primary/20 text-muted-foreground mt-3 border-l-4 pl-4 italic"
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
        return (
          text.match(/^[\*\-\s]+\s/) || // Lista con bullet
          text.match(/^\d+\.\s/) || // Lista numerada
          text.match(/^#{1,6}\s/) || // Título (múltiples # seguidos de espacio)
          text.match(/^\|.*\|$/) || // Tabla
          text.match(/^```/) || // Bloque de código
          text.match(/^>/)
        ); // Blockquote
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
    return (
      normalized
        .join('\n')
        // Normalizar saltos de línea múltiples
        .replace(/\n{3,}/g, '\n\n')
    );
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
