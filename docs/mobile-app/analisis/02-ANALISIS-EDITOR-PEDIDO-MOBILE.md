# Análisis del Editor de Pedido – Versión Mobile / PWA

Este documento recoge el análisis de la **pantalla del editor de pedido** (vista detalle/overview del pedido) en su versión mobile. Es la pantalla a la que se llega al tocar un pedido desde la lista: muestra contexto del pedido y acceso a secciones (Información, Producción, Palets, etc.).

**Relación con otros documentos:**  
- Lista de pedidos y overview general del gestor → `01-ANALISIS-GESTOR-PEDIDOS-MOBILE.md`.  
- Estándares y tipologías → `../estandares-ui/`.

---

## 🔍 Lo que funciona bien

- **Información clave muy clara:** Cliente, Estado del pedido, Fecha de carga, Temperatura, Palets, Importe.  
- **Jerarquía correcta:** primero contexto → luego acciones.  
- **Estética limpia, moderna y coherente** con el resto de la app.  
- **CTA “Editar” abajo** claro y fácil de alcanzar (zona pulgar 👍).

---

## ⚠️ Problemas detectados

- **Demasiadas acciones al mismo nivel:** Información, Previsión, Detalle productos, Producción, Palets, Etiquetas → todas compiten visualmente aunque no se usan con la misma frecuencia.  
- **Carga cognitiva innecesaria:** El usuario entra para revisar estado, continuar producción o ver productos, pero se le presentan opciones secundarias desde el primer segundo.  
- **Pantalla poco “escaneable”:** El ojo no tiene claro qué es lo principal y qué es accesorio; en mobile esto penaliza bastante.

---

## 🔧 Cambios propuestos

### 1. Menú de tres puntos (⋮) en el header

- **Ubicación:** Arriba a la derecha, junto al título / nº de pedido.  
- **Función:** Agrupar acciones secundarias y mantener la pantalla enfocada en el pedido.

### 2. Acciones que pasan al menú ⋮

- Información  
- Previsión  
- Etiquetas  
- Editar pedido  
- Otras acciones puntuales (descargar, duplicar, cancelar…)

→ Acciones **consultivas o poco frecuentes**.

### 3. Acciones que se mantienen visibles

- **Detalle de productos**  
- **Producción**  
- **Palets**  

**Motivo:** Son acciones **operativas**, de **uso frecuente** y parte del **flujo diario**; deben estar accesibles en 1 tap.

### 4. Impacto en la experiencia

- Pantalla más **limpia y respirable**.  
- **Jerarquía clara:** datos → trabajo → opciones.  
- Menos **fricción cognitiva**.  
- Comportamiento alineado con apps modernas (Notion, Linear, ERP mobile-first).

---

## 🧠 Principio UX aplicado

- **Overflow menu (⋮)** = acciones secundarias.  
- **Pantalla principal** = trabajo real.
