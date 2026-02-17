# Prompt: Auditoría y reporte de referencias al nombre de la aplicación "La Pesquerapp"

## Objetivo

**Rastrear y documentar** todas las partes del código (y recursos estáticos) donde aparezca el nombre de la aplicación **"La Pesquerapp"**, **cualquier referencia a ella** (textos, dominios, metadatos) o **identificadores que provengan de su identidad** (slugs, env vars, branding), con el fin de generar un **reporte exhaustivo**. Este reporte servirá para:

- Valorar en el futuro si conviene usar **nombres genéricos** o **nombres por tenant**.
- Poder **ocultar o neutralizar la identidad** de la aplicación hasta que el proyecto esté desarrollado por completo.

**Importante:** Este prompt **no debe implementar ningún cambio** en el código. La única salida esperada es el **reporte** (documento o artefacto) con la localización y el contexto de cada referencia.

---

## Qué rastrear (ámbito ampliado)

No solo el nombre literal **"La Pesquerapp"**. Incluir **todo** lo que haga referencia a la aplicación o provenga de su identidad:

| Categoría | Qué incluir | Ejemplos |
|-----------|-------------|----------|
| **Nombre directo** | El nombre completo y variantes de grafía y mayúsculas. | `La Pesquerapp`, `Pesquerapp`, `LA PESQUERAPP`, `la pesquerapp` |
| **Referencias indirectas** | Textos, enlaces o metadatos que aludan a “esta app”, al producto o al dominio sin citar el nombre. | "nuestra aplicación", "la app", "esta plataforma", URLs con dominio propio (ej. `pesquerapp.com`), `og:site_name`, nombre del tenant o producto en config. |
| **Derivados e identificadores** | Cualquier identificador, slug o marca que provenga del nombre o del proyecto. | `pesquerapp` en slugs, IDs, env vars (`PESQUERAPP_*`, `NEXT_PUBLIC_APP_*` con valor pesquerapp), nombres de paquete/repo, nombres de proyecto en config (Vercel, etc.). |
| **Branding y presencia** | Elementos de marca que identifiquen la aplicación. | Nombre en logos, favicon, manifest, PWA; textos legales o de ayuda que nombren el producto; firmas de email o PDFs; documentación que nombre "La Pesquerapp" o el proyecto asociado. |

En caso de duda, **incluir** la referencia en el reporte y clasificarla; es preferible un falso positivo que omitir algo que luego revele la identidad.

---

## Dónde buscar (alcance del rastreo)

Se debe aplicar la búsqueda anterior en:

1. **Título del documento / pestaña del navegador**
   - Meta `title`, `og:title`, configuración de layout o documento HTML.
   - Cualquier lugar que defina el texto mostrado en la pestaña del navegador.

2. **Metadatos y SEO**
   - Meta tags (`description`, `og:description`, `og:site_name`, etc.).
   - Archivos de configuración de SEO o de generación de meta (Next.js, etc.).

3. **Configuraciones de la aplicación**
   - Variables de entorno, constantes globales, archivos de config (por ejemplo `configs/`, `.env*`, `next.config.*`).
   - Nombre de la app en manifest, PWA, o similares.

4. **Interfaz de usuario (UI)**
   - Textos visibles: cabeceras, footers, títulos de página, mensajes de bienvenida, logos con texto, tooltips, placeholders.
   - Componentes de layout (header, sidebar, brand, etc.).

5. **Recursos estáticos y branding**
   - `favicon`, títulos en HTML estático, imágenes con el nombre (alt text, nombres de archivo si son significativos).
   - Documentos legales o de ayuda (términos, privacidad, about) si existen en el repo.

6. **Código y comentarios**
   - Strings en código (frontend y backend), mensajes de error o éxito, notificaciones.
   - Comentarios que mencionen "La Pesquerapp", el proyecto o la app; identificadores (vars, constantes, keys) que contengan `pesquerapp` o equivalentes.

7. **Otros**
   - Cualquier otro archivo o recurso dentro del repositorio: emails, PDFs, documentación interna, nombres de proyecto en CI/CD o plataformas (si están en el repo), que nombren o aludan a la aplicación o a su identidad.

---

## Formato del reporte esperado

El reporte debe ser un **documento estructurado** (por ejemplo un `.md` en `docs/` o en la carpeta de prompts/salidas) que incluya:

| Campo / Sección | Descripción |
|-----------------|-------------|
| **Ubicación** | Ruta del archivo (y línea si aplica). |
| **Clase** | `nombre directo` \| `referencia indirecta` \| `derivado/identificador` \| `branding` (según la tabla "Qué rastrear"). |
| **Tipo** | Categoría: pestaña del navegador, meta, config, UI, recurso estático, string en código, etc. |
| **Contexto** | Fragmento de código o texto donde aparece la referencia (1–3 líneas). |
| **Visibilidad** | Si es visible al usuario final (sí/no) y dónde (ej. "pestaña del navegador", "cabecera", "footer"). |
| **Notas** | Observaciones (ej. "fácil de parametrizar por tenant", "hardcodeado", "viene de env"). |

Opcionalmente, al final del reporte:

- **Resumen**: número total de referencias por **clase** (directo / indirecto / derivado / branding), por tipo y por visibilidad.
- **Recomendaciones breves**: qué referencias serían prioritarias para hacer genéricas o por tenant (sin implementar, solo indicar).

---

## Restricciones

- **No modificar código ni configuraciones.** Solo buscar, listar y documentar.
- **No implementar** nombres genéricos ni lógica por tenant; solo generar el reporte.
- Incluir **nombre directo**, **referencias indirectas** y **derivados/identificadores** (no solo el texto "La Pesquerapp"). Ante duda, incluir en el reporte.

---

## Entregable

Un único artefacto: **el reporte de auditoría** en formato Markdown (o el formato acordado del proyecto), listo para revisión humana y para tomar decisiones futuras sobre genericidad o multi-tenant del nombre de la aplicación.
